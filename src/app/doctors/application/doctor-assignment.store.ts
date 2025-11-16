/**
 * Doctor Assignment Store
 * FLUJO 4: Orquesta la asignación de doctor a paciente con validación estricta
 * - Valida que el paciente tenga suscripción activa con doctorAccess
 * - Valida que el doctor esté verificado y aceptando pacientes
 */

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, forkJoin } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';

import { PatientEntity } from '../../patients/domain/model/patient.entity';
import { environment } from '../../../environments/environment';
import { DoctorEntity } from '../../doctors/domain/model/doctor.entity';
import { SubscriptionEntity } from '../../subscriptions/domain/model/subscription.entity';
import { SubscriptionPlanEntity } from '../../subscriptions/domain/model/subscription-plan.entity';
import { SubscriptionService } from '../../subscriptions/infrastructure/subscription.service';

export interface DoctorAssignmentRequest {
  patientId: string;
  doctorId: string;
}

export interface DoctorAssignmentResult {
  patient: PatientEntity;
  doctor: DoctorEntity;
  subscription: SubscriptionEntity;
  plan: SubscriptionPlanEntity;
}

@Injectable({
  providedIn: 'root',
})
export class DoctorAssignmentStore {
  private readonly baseUrl = environment.apiBaseUrl;

  // Signals para estado reactivo
  private readonly _isAssigning = signal(false);
  private readonly _assignmentError = signal<string | null>(null);
  private readonly _lastAssignment = signal<DoctorAssignmentResult | null>(null);

  // Computed signals
  readonly isAssigning = computed(() => this._isAssigning());
  readonly assignmentError = computed(() => this._assignmentError());
  readonly lastAssignment = computed(() => this._lastAssignment());

  constructor(
    private http: HttpClient,
    private subscriptionService: SubscriptionService
  ) {}

  /**
   * FLUJO 4: Asignar doctor a paciente con validación completa
   * 
   * VALIDACIONES CRÍTICAS:
   * 1. Paciente debe existir
   * 2. Paciente debe tener suscripción activa (no plan free)
   * 3. Plan de suscripción debe incluir doctorAccess: true
   * 4. Doctor debe existir
   * 5. Doctor debe estar verificado (isVerified: true)
   * 6. Doctor debe estar aceptando pacientes (acceptingPatients: true)
   * 
   * Si alguna validación falla, emite error con mensaje descriptivo
   */
  assignDoctorToPatient(request: DoctorAssignmentRequest): Observable<DoctorAssignmentResult> {
    this._isAssigning.set(true);
    this._assignmentError.set(null);

    // Paso 1: Obtener paciente
    return this.getPatientById(request.patientId).pipe(
      switchMap((patient) => {
        if (!patient) {
          return throwError(() => new Error(`Patient with id ${request.patientId} not found`));
        }

        // Paso 2: Validar que el paciente tenga suscripción activa
        if (!patient.subscriptionId) {
          return throwError(
            () =>
              new Error(
                'Patient does not have an active subscription. Please upgrade to Premium or Family plan to access doctor services.'
              )
          );
        }

        // Paso 3: Obtener la suscripción del paciente
        return this.subscriptionService.getById(patient.subscriptionId).pipe(
          switchMap((subscription) => {
            // Validar que la suscripción esté activa
            if (!subscription.isActive) {
              return throwError(
                () =>
                  new Error(
                    `Patient subscription is not active (status: ${subscription.status}). Please renew or activate subscription.`
                  )
              );
            }

            // Paso 4: Obtener el plan de suscripción
            return this.subscriptionService.getPlanById(subscription.planId).pipe(
              switchMap((plan) => {
                if (!plan) {
                  return throwError(
                    () => new Error(`Subscription plan with id ${subscription.planId} not found`)
                  );
                }

                // Paso 5: VALIDACIÓN CRÍTICA - Verificar que el plan incluya acceso a doctor
                if (!plan.allowsDoctorAccess) {
                  return throwError(
                    () =>
                      new Error(
                        `Patient plan "${plan.name}" does not include doctor access. Please upgrade to Premium or Family plan.`
                      )
                  );
                }

                // Paso 6: Obtener el doctor
                return this.getDoctorById(request.doctorId).pipe(
                  switchMap((doctor) => {
                    if (!doctor) {
                      return throwError(() => new Error(`Doctor with id ${request.doctorId} not found`));
                    }

                    // Paso 7: VALIDACIÓN CRÍTICA - Verificar que el doctor esté verificado
                    if (!doctor.isVerified) {
                      return throwError(
                        () =>
                          new Error(
                            `Dr. ${doctor.fullName} is not verified. Only verified doctors can be assigned to patients.`
                          )
                      );
                    }

                    // Paso 8: VALIDACIÓN CRÍTICA - Verificar que el doctor esté aceptando pacientes
                    if (!doctor.acceptingPatients) {
                      return throwError(
                        () =>
                          new Error(
                            `Dr. ${doctor.fullName} is currently not accepting new patients. Please select another doctor.`
                          )
                      );
                    }

                    // Paso 9: Validación adicional usando método del dominio
                    const assignmentError = doctor.canBeAssignedToPatient();
                    if (assignmentError) {
                      return throwError(() => new Error(assignmentError));
                    }

                    // Paso 10: Actualizar patient.assignedDoctorId
                    const updatePayload = {
                      assignedDoctorId: doctor.id,
                    };

                    return this.http
                      .patch<any>(`${this.baseUrl}/patients/${patient.id}`, updatePayload)
                      .pipe(
                        map((updatedPatient) => {
                          const patientEntity = new PatientEntity(
                            updatedPatient.id,
                            updatedPatient.userId,
                            updatedPatient.assignedDoctorId,
                            updatedPatient.tenantId,
                            updatedPatient.subscriptionId,
                            updatedPatient.firstName,
                            updatedPatient.lastName,
                            updatedPatient.dni,
                            updatedPatient.birthDate,
                            updatedPatient.gender,
                            updatedPatient.phone,
                            updatedPatient.address,
                            updatedPatient.weight,
                            updatedPatient.height,
                            updatedPatient.bmi,
                            updatedPatient.emergencyContact
                          );

                          const result: DoctorAssignmentResult = {
                            patient: patientEntity,
                            doctor,
                            subscription,
                            plan,
                          };

                          this._lastAssignment.set(result);
                          return result;
                        })
                      );
                  })
                );
              })
            );
          })
        );
      }),
      tap({
        next: () => this._isAssigning.set(false),
        error: (error) => {
          this._isAssigning.set(false);
          this._assignmentError.set(error.message || 'Doctor assignment failed');
        },
      }),
      catchError((error) => {
        this._assignmentError.set(error.message || 'Doctor assignment failed');
        return throwError(() => error);
      })
    );
  }

  /**
   * Desasigna un doctor de un paciente
   */
  unassignDoctorFromPatient(patientId: string): Observable<PatientEntity> {
    return this.getPatientById(patientId).pipe(
      switchMap((patient) => {
        if (!patient) {
          return throwError(() => new Error(`Patient with id ${patientId} not found`));
        }

        if (!patient.assignedDoctorId) {
          return throwError(() => new Error('Patient does not have an assigned doctor'));
        }

        const updatePayload = {
          assignedDoctorId: null,
        };

        return this.http.patch<any>(`${this.baseUrl}/patients/${patientId}`, updatePayload).pipe(
          map(
            (updatedPatient) =>
              new PatientEntity(
                updatedPatient.id,
                updatedPatient.userId,
                updatedPatient.assignedDoctorId,
                updatedPatient.tenantId,
                updatedPatient.subscriptionId,
                updatedPatient.firstName,
                updatedPatient.lastName,
                updatedPatient.dni,
                updatedPatient.birthDate,
                updatedPatient.gender,
                updatedPatient.phone,
                updatedPatient.address,
                updatedPatient.weight,
                updatedPatient.height,
                updatedPatient.bmi,
                updatedPatient.emergencyContact
              )
          )
        );
      })
    );
  }

  /**
   * Obtiene un paciente por id
   */
  private getPatientById(patientId: string): Observable<PatientEntity | null> {
    return this.http.get<any>(`${this.baseUrl}/patients/${patientId}`).pipe(
      map((patient) => {
        if (!patient) return null;

        return new PatientEntity(
          patient.id,
          patient.userId,
          patient.assignedDoctorId,
          patient.tenantId,
          patient.subscriptionId,
          patient.firstName,
          patient.lastName,
          patient.dni,
          patient.birthDate,
          patient.gender,
          patient.phone,
          patient.address,
          patient.weight,
          patient.height,
          patient.bmi,
          patient.emergencyContact
        );
      }),
      catchError(() => {
        return throwError(() => new Error(`Patient with id ${patientId} not found`));
      })
    );
  }

  /**
   * Obtiene un doctor por id
   */
  private getDoctorById(doctorId: string): Observable<DoctorEntity | null> {
    return this.http.get<any>(`${this.baseUrl}/doctors/${doctorId}`).pipe(
      map((doctor) => {
        if (!doctor) return null;

        return new DoctorEntity(
          doctor.id,
          doctor.userId,
          doctor.tenantId,
          doctor.isIndependent,
          doctor.firstName,
          doctor.lastName,
          doctor.dni,
          doctor.specialty,
          doctor.licenseNumber,
          doctor.phone,
          doctor.isVerified,
          doctor.acceptingPatients,
          doctor.consultationFee,
          doctor.languages,
          doctor.education,
          doctor.joinedAt
        );
      }),
      catchError(() => {
        return throwError(() => new Error(`Doctor with id ${doctorId} not found`));
      })
    );
  }

  /**
   * Limpia el estado de asignación
   */
  clearAssignmentState(): void {
    this._isAssigning.set(false);
    this._assignmentError.set(null);
  }
}
