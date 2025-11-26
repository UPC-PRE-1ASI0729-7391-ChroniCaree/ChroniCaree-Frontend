/**
 * Patient Registration Store
 * Orquesta el flujo de registro de paciente → creación de user + patient con plan free
 */

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';

import { UserEntity, UserRole } from '../../iam/domain/model/user.entity';
import { PatientEntity, EmergencyContact } from '../../patients/domain/model/patient.entity';
import { environment } from '../../../environments/environment';

export interface PatientRegistrationRequest {
  // User data
  email: string;
  name: string;
  password: string;
  // Patient data
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  address: string;
  weight?: number;
  height?: number;
  emergencyContact?: EmergencyContact;
}

export interface PatientRegistrationResult {
  user: UserEntity;
  patient: PatientEntity;
}

@Injectable({
  providedIn: 'root',
})
export class PatientRegistrationStore {
  private readonly baseUrl = environment.apiBaseUrl;

  // Signals para estado reactivo
  private readonly _isRegistering = signal(false);
  private readonly _registrationError = signal<string | null>(null);
  private readonly _lastRegisteredPatient = signal<PatientRegistrationResult | null>(null);

  // Computed signals
  readonly isRegistering = computed(() => this._isRegistering());
  readonly registrationError = computed(() => this._registrationError());
  readonly lastRegisteredPatient = computed(() => this._lastRegisteredPatient());

  constructor(private http: HttpClient) {}

  /**
   * FLUJO 3: Registro de Paciente
   * 1. Valida que el email no exista
   * 2. Crea el user con role: 'patient'
   * 3. Crea el patient con subscriptionId: null (plan free implícito)
   * 4. Retorna ambos objetos
   * 
   * NOTA: El paciente inicia con plan "free" implícito (sin subscriptionId)
   * Para acceso a doctor, debe suscribirse a premium/family
   */
  registerPatient(request: PatientRegistrationRequest): Observable<PatientRegistrationResult> {
    this._isRegistering.set(true);
    this._registrationError.set(null);

    // Paso 1: Validar que el email no exista
    return this.checkEmailExists(request.email).pipe(
      switchMap((exists) => {
        if (exists) {
          return throwError(() => new Error(`Email ${request.email} is already registered`));
        }

        // Obtener siguiente ID para usuario
        return this.getNextId('users').pipe(
          switchMap(nextUserId => {
            // Paso 2: Crear user con role patient
            const userPayload = {
              id: nextUserId,
              email: request.email,
              name: request.name,
              password: request.password, // En producción debe hashearse
              role: 'patient' as UserRole,
              isVerified: false,
              twoFactorEnabled: false,
              createdAt: new Date().toISOString(),
              tenantId: null, // Pacientes B2C no tienen tenant
            };

            return this.http.post<any>(`${this.baseUrl}/users`, userPayload).pipe(
              switchMap((createdUser) => {
                // Obtener siguiente ID para paciente
                return this.getNextId('patients').pipe(
                  switchMap(nextPatientId => {
                    // Paso 3: Crear patient
                    const bmi = this.calculateBMI(request.weight || 0, request.height || 0);

                    const patientPayload = {
                      id: nextPatientId,
                      userId: createdUser.id,
                      assignedDoctorId: null, // Sin doctor asignado inicialmente
                      tenantId: null, // B2C
                      subscriptionId: null, // Free plan (sin suscripción)
                      firstName: request.firstName,
                      lastName: request.lastName,
                      dni: request.dni,
                      birthDate: request.birthDate,
                      gender: request.gender,
                      phone: request.phone,
                      address: request.address,
                      weight: request.weight || 0,
                      height: request.height || 0,
                      bmi,
                      emergencyContact: request.emergencyContact || {
                        name: '',
                        relationship: '',
                        phone: '',
                      },
                    };

                    return this.http.post<any>(`${this.baseUrl}/patients`, patientPayload).pipe(
                      map((createdPatient) => {
                        const userEntity = new UserEntity(
                          createdUser.id,
                          createdUser.email,
                          createdUser.role,
                          createdUser.name,
                          createdUser.password,
                          createdUser.isVerified,
                          createdUser.twoFactorEnabled,
                          createdUser.createdAt,
                          createdUser.tenantId
                        );

                        const patientEntity = new PatientEntity(
                          createdPatient.id,
                          createdPatient.userId,
                          createdPatient.assignedDoctorId,
                          createdPatient.tenantId,
                          createdPatient.subscriptionId,
                          createdPatient.firstName,
                          createdPatient.lastName,
                          createdPatient.dni,
                          createdPatient.birthDate,
                          createdPatient.gender,
                          createdPatient.phone,
                          createdPatient.address,
                          createdPatient.weight,
                          createdPatient.height,
                          createdPatient.bmi,
                          createdPatient.emergencyContact
                        );

                        const result: PatientRegistrationResult = {
                          user: userEntity,
                          patient: patientEntity,
                        };

                        this._lastRegisteredPatient.set(result);
                        return result;
                      })
                    );
                  })
                );
              }),
              tap({
                next: () => this._isRegistering.set(false),
                error: (error) => {
                  this._isRegistering.set(false);
                  this._registrationError.set(error.message || 'Registration failed');
                },
              }),
              catchError((error) => {
                this._registrationError.set(error.message || 'Registration failed');
                return throwError(() => error);
              })
            );
          })
        );
      })
    );
  }

  /**
   * Obtiene el siguiente ID secuencial para una colección
   */
  private getNextId(collection: string): Observable<number> {
    return this.http.get<any[]>(`${this.baseUrl}/${collection}?_sort=id&_order=desc&_limit=1`).pipe(
      map(items => {
        if (items && items.length > 0) {
          const maxId = Number(items[0].id);
          return Number.isNaN(maxId) ? 1 : maxId + 1;
        }
        return 1;
      }),
      catchError(() => of(1))
    );
  }

  /**
   * Verifica si un email ya está registrado
   */
  private checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<any[]>(`${this.baseUrl}/users?email=${email}`).pipe(
      map((users) => users.length > 0),
      catchError(() => of(false))
    );
  }

  /**
   * Calcula el BMI
   */
  private calculateBMI(weight: number, height: number): number {
    if (height <= 0 || weight <= 0) return 0;
    return Math.round((weight / (height * height)) * 10) / 10;
  }

  /**
   * Limpia el estado de registro
   */
  clearRegistrationState(): void {
    this._isRegistering.set(false);
    this._registrationError.set(null);
  }
}
