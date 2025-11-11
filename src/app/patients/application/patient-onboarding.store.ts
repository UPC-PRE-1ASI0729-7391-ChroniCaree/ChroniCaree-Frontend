import { Injectable, signal, computed } from '@angular/core';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { switchMap, tap, catchError, map } from 'rxjs/operators';
import { UserService } from '../../iam/infrastructure/user.service';
import { PatientService } from '../../patients/infrastructure/patient.service';
import { DiagnosisService, CreateDiagnosisRequest } from '../../clinical/infrastructure/diagnosis.service';
import { SubscriptionService } from '../../subscriptions/infrastructure/subscription.service';
import { PatientEntity } from '../../patients/domain/model/patient.entity';
import { COMMON_CONDITIONS } from '../../clinical/domain/model/diagnosis.entity';

/**
 * Datos personales del paciente
 */
export interface PatientPersonalData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  address: string;
  weight?: number;
  height?: number;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
}

/**
 * Condiciones comunes seleccionadas
 */
export type CommonCondition = 
  | 'diabetes_type_2'
  | 'hypertension'
  | 'hyperlipidemia'
  | 'asthma'
  | 'depression_anxiety';

/**
 * Resultado del registro de paciente
 */
export interface PatientOnboardingResult {
  success: boolean;
  message: string;
  patient?: PatientEntity;
  conditionsRegistered?: number;
}

/**
 * Store para el Registro de Pacientes con Enfermedades
 * Orquesta el registro de paciente + selección de condiciones comunes
 */
@Injectable({
  providedIn: 'root'
})
export class PatientOnboardingStore {
  // Estado reactivo
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _registeredPatient = signal<PatientEntity | null>(null);

  // Getters computados
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly registeredPatient = computed(() => this._registeredPatient());

  // Condiciones comunes disponibles
  readonly availableConditions = [
    { code: COMMON_CONDITIONS.DIABETES_TYPE_2, name: 'Diabetes Tipo 2' },
    { code: COMMON_CONDITIONS.HYPERTENSION, name: 'Hipertensión Arterial' },
    { code: COMMON_CONDITIONS.HYPERLIPIDEMIA, name: 'Hiperlipidemia (Colesterol Alto)' },
    { code: COMMON_CONDITIONS.ASTHMA, name: 'Asma' },
    { code: COMMON_CONDITIONS.DEPRESSION_ANXIETY, name: 'Depresión/Ansiedad' }
  ];

  constructor(
    private userService: UserService,
    private patientService: PatientService,
    private diagnosisService: DiagnosisService,
    private subscriptionService: SubscriptionService
  ) {}

  /**
   * Registra un paciente con condiciones médicas seleccionadas
   */
  registerPatientWithConditions(
    personalData: PatientPersonalData,
    selectedConditions: CommonCondition[]
  ): Observable<PatientOnboardingResult> {
    this._loading.set(true);
    this._error.set(null);

    // Paso 1: Validar que el email no exista
    return this.userService.emailExists(personalData.email).pipe(
      switchMap(exists => {
        if (exists) {
          return throwError(() => new Error('El email ya está registrado'));
        }

        // Paso 2: Crear el usuario
        return this.userService.create({
          email: personalData.email,
          password: personalData.password,
          role: 'patient',
          name: `${personalData.firstName} ${personalData.lastName}`
        });
      }),
      switchMap(user => {
        // Paso 3: Calcular BMI
        let bmi: number | undefined;
        if (personalData.weight && personalData.height) {
          const heightInMeters = personalData.height / 100;
          bmi = personalData.weight / (heightInMeters * heightInMeters);
          bmi = Math.round(bmi * 10) / 10;
        }

        // Paso 4: Crear el paciente (sin suscripción inicialmente)
        return this.patientService.create({
          userId: user.id,
          firstName: personalData.firstName,
          lastName: personalData.lastName,
          dni: personalData.dni,
          birthDate: personalData.birthDate,
          gender: personalData.gender,
          phone: personalData.phone,
          address: personalData.address,
          weight: personalData.weight,
          height: personalData.height,
          bmi,
          emergencyContact: personalData.emergencyContact,
          assignedDoctorId: null,
          tenantId: null,
          subscriptionId: null
        }).pipe(
          map(patient => ({ user, patient }))
        );
      }),
      switchMap(result => {
        // Paso 5: Verificar si el paciente tiene plan de suscripción
        // Si no tiene subscriptionId, se asume plan free
        if (!result.patient.subscriptionId) {
          // Plan free: no puede registrar condiciones médicas
          if (selectedConditions.length > 0) {
            return throwError(() => new Error(
              'Los pacientes con plan gratuito no pueden registrar condiciones médicas. ' +
              'Por favor, actualice a un plan premium o familiar.'
            ));
          }

          // Sin condiciones, registro exitoso
          this._registeredPatient.set(result.patient);
          return of({
            success: true,
            message: 'Paciente registrado exitosamente (Plan gratuito)',
            patient: result.patient,
            conditionsRegistered: 0
          });
        }

        // Paso 6: Verificar el plan de suscripción
        return this.subscriptionService.getById(result.patient.subscriptionId).pipe(
          switchMap(subscription => {
            // Validar que la suscripción esté activa
            if (!subscription.isActive) {
              if (selectedConditions.length > 0) {
                return throwError(() => new Error(
                  'No se pueden registrar condiciones médicas con suscripción inactiva'
                ));
              }
            }

            // Obtener plan para validar tipo
            return this.subscriptionService.getPlanById(subscription.planId).pipe(
              switchMap(plan => {
                if (!plan) {
                  return throwError(() => new Error('Plan de suscripción no encontrado'));
                }

                // Validar que no sea plan free
                if (plan.name.toLowerCase() === 'free' || plan.name.toLowerCase().includes('gratuito')) {
                  if (selectedConditions.length > 0) {
                    return throwError(() => new Error(
                      'El plan gratuito no permite registrar condiciones médicas. ' +
                      'Por favor, actualice a un plan premium o familiar.'
                    ));
                  }
                }

                // Paso 7: Crear diagnósticos para las condiciones seleccionadas
                if (selectedConditions.length === 0) {
                  return of({
                    success: true,
                    message: 'Paciente registrado exitosamente (sin condiciones médicas)',
                    patient: result.patient,
                    conditionsRegistered: 0
                  });
                }

                const diagnosisRequests: CreateDiagnosisRequest[] = selectedConditions.map(condition => ({
                  patientId: result.patient.id,
                  diagnosisName: this.getConditionDisplayName(condition),
                  status: 'pending_confirmation',
                  source: 'patient_reported',
                  diagnosisDate: new Date().toISOString(),
                  notes: 'Auto-reportado durante el registro del paciente'
                }));

                // Crear todos los diagnósticos en paralelo
                const diagnosisObservables = diagnosisRequests.map(req => 
                  this.diagnosisService.create(req)
                );

                return forkJoin(diagnosisObservables).pipe(
                  map(diagnoses => ({
                    success: true,
                    message: `Paciente registrado exitosamente con ${diagnoses.length} condición(es) médica(s) pendiente(s) de confirmación`,
                    patient: result.patient,
                    conditionsRegistered: diagnoses.length
                  }))
                );
              })
            );
          })
        );
      }),
      tap(result => {
        this._loading.set(false);
        if (result.patient) {
          this._registeredPatient.set(result.patient);
        }
      }),
      catchError(error => {
        this._loading.set(false);
        this._error.set(error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene el nombre legible de una condición
   */
  private getConditionDisplayName(condition: CommonCondition): string {
    const found = this.availableConditions.find(c => c.code === condition);
    return found ? found.name : condition;
  }

  /**
   * Limpia el estado
   */
  clear(): void {
    this._loading.set(false);
    this._error.set(null);
    this._registeredPatient.set(null);
  }
}
