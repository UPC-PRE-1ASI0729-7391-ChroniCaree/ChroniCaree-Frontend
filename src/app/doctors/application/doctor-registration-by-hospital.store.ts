/**
 * Doctor Registration by Hospital Store
 * FLUJO 2 (Opción A/B): Registro de doctor por parte del hospital
 * Valida que el tenant no exceda el límite maxDoctors de su plan
 */

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, forkJoin } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';

import { UserEntity, UserRole } from '../../iam/domain/model/user.entity';
import { DoctorEntity, Education } from '../../doctors/domain/model/doctor.entity';
import { TenantEntity } from '../../tenants/domain/model/tenant.entity';
import { SubscriptionPlanEntity } from '../../subscriptions/domain/model/subscription-plan.entity';
import { SubscriptionService } from '../../subscriptions/infrastructure/subscription.service';
import { environment } from '../../../environments/environment';

export interface DoctorRegistrationByHospitalRequest {
  // Tenant info
  tenantId: string;
  // User data
  email: string;
  name: string;
  password: string;
  // Doctor data
  firstName: string;
  lastName: string;
  dni: string;
  specialty: string;
  licenseNumber: string;
  phone: string;
  consultationFee?: number;
  languages?: string[];
  education?: Education[];
}

export interface DoctorRegistrationResult {
  user: UserEntity;
  doctor: DoctorEntity;
  tenant: TenantEntity;
  currentDoctorCount: number;
  maxDoctorsLimit: number;
}

@Injectable({
  providedIn: 'root',
})
export class DoctorRegistrationByHospitalStore {
  private readonly baseUrl = environment.apiBaseUrl;

  // Signals para estado reactivo
  private readonly _isRegistering = signal(false);
  private readonly _registrationError = signal<string | null>(null);
  private readonly _lastRegisteredDoctor = signal<DoctorRegistrationResult | null>(null);

  // Computed signals
  readonly isRegistering = computed(() => this._isRegistering());
  readonly registrationError = computed(() => this._registrationError());
  readonly lastRegisteredDoctor = computed(() => this._lastRegisteredDoctor());

  constructor(
    private http: HttpClient,
    private subscriptionService: SubscriptionService
  ) {}

  /**
   * FLUJO 2: Registro de doctor por hospital con validación de límites
   * 
   * VALIDACIONES CRÍTICAS:
   * 1. Tenant debe existir y estar activo
   * 2. Tenant debe tener suscripción activa
   * 3. Contar doctores actuales del tenant
   * 4. Validar que no se exceda el límite maxDoctors del plan
   * 5. Email no debe estar registrado
   * 6. Crear user con role: 'doctor' y tenantId
   * 7. Crear doctor con isIndependent: false
   */
  registerDoctorForTenant(
    request: DoctorRegistrationByHospitalRequest
  ): Observable<DoctorRegistrationResult> {
    this._isRegistering.set(true);
    this._registrationError.set(null);

    // Paso 1: Obtener el tenant
    return this.getTenantById(request.tenantId).pipe(
      switchMap((tenant) => {
        if (!tenant) {
          return throwError(() => new Error(`Tenant with id ${request.tenantId} not found`));
        }

        // Paso 2: Validar que el tenant esté activo
        if (!tenant.isActive) {
          return throwError(
            () =>
              new Error(
                `Tenant "${tenant.name}" is not active (status: ${tenant.status}). Cannot register doctors for inactive tenants.`
              )
          );
        }

        // Paso 3: Validar que el tenant tenga suscripción
        if (!tenant.subscriptionId) {
          return throwError(
            () =>
              new Error(
                `Tenant "${tenant.name}" does not have an active subscription. Please activate a subscription before adding doctors.`
              )
          );
        }

        // Paso 4: Obtener la suscripción y el plan
        return forkJoin({
          subscription: this.subscriptionService.getById(tenant.subscriptionId),
          currentDoctorCount: this.countDoctorsByTenantId(String(tenant.id)),
        }).pipe(
          switchMap(({ subscription, currentDoctorCount }) => {
            return this.subscriptionService.getPlanById(subscription.planId).pipe(
              switchMap((plan) => {
                if (!plan) {
                  return throwError(
                    () => new Error(`Subscription plan with id ${subscription.planId} not found`)
                  );
                }

                // Paso 5: VALIDACIÓN CRÍTICA - Verificar límite de doctores
                const maxDoctorsLimit = plan.maxDoctors ?? -1; // -1 = unlimited
                const wouldExceedLimit =
                  maxDoctorsLimit !== -1 && currentDoctorCount >= maxDoctorsLimit;

                if (wouldExceedLimit) {
                  return throwError(
                    () =>
                      new Error(
                        `Tenant "${tenant.name}" has reached the maximum doctor limit (${currentDoctorCount}/${maxDoctorsLimit}) for plan "${plan.name}". Please upgrade to a higher plan to add more doctors.`
                      )
                  );
                }

                // Paso 6: Validar que el email no exista
                return this.checkEmailExists(request.email).pipe(
                  switchMap((exists) => {
                    if (exists) {
                      return throwError(
                        () => new Error(`Email ${request.email} is already registered`)
                      );
                    }

                    // Paso 7: Crear user con role: 'doctor'
                    const userPayload = {
                      email: request.email,
                      name: request.name,
                      password: request.password, // En producción debe hashearse
                      role: 'doctor' as UserRole,
                      isVerified: false, // Debe ser verificado por el admin
                      twoFactorEnabled: false,
                      tenantId: tenant.id,
                      createdAt: new Date().toISOString(),
                    };

                    return this.http.post<any>(`${this.baseUrl}/users`, userPayload).pipe(
                      switchMap((createdUser) => {
                        // Paso 8: Crear doctor
                        const doctorPayload = {
                          userId: createdUser.id,
                          tenantId: tenant.id,
                          isIndependent: false,
                          firstName: request.firstName,
                          lastName: request.lastName,
                          dni: request.dni,
                          specialty: request.specialty,
                          licenseNumber: request.licenseNumber,
                          phone: request.phone,
                          isVerified: false,
                          acceptingPatients: false, // Por defecto no acepta hasta que sea verificado
                          consultationFee: request.consultationFee || 0,
                          languages: request.languages || ['es'],
                          education: request.education || [],
                          joinedAt: new Date().toISOString(),
                        };

                        return this.http.post<any>(`${this.baseUrl}/doctors`, doctorPayload).pipe(
                          map((createdDoctor) => {
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

                            const doctorEntity = new DoctorEntity(
                              createdDoctor.id,
                              createdDoctor.userId,
                              createdDoctor.tenantId,
                              createdDoctor.isIndependent,
                              createdDoctor.firstName,
                              createdDoctor.lastName,
                              createdDoctor.dni,
                              createdDoctor.specialty,
                              createdDoctor.licenseNumber,
                              createdDoctor.phone,
                              createdDoctor.isVerified,
                              createdDoctor.acceptingPatients,
                              createdDoctor.consultationFee,
                              createdDoctor.languages,
                              createdDoctor.education,
                              createdDoctor.joinedAt
                            );

                            const result: DoctorRegistrationResult = {
                              user: userEntity,
                              doctor: doctorEntity,
                              tenant,
                              currentDoctorCount: currentDoctorCount + 1, // Incluye el recién creado
                              maxDoctorsLimit,
                            };

                            this._lastRegisteredDoctor.set(result);
                            return result;
                          })
                        );
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
        next: () => this._isRegistering.set(false),
        error: (error) => {
          this._isRegistering.set(false);
          this._registrationError.set(error.message || 'Doctor registration failed');
        },
      }),
      catchError((error) => {
        this._registrationError.set(error.message || 'Doctor registration failed');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene un tenant por id
   */
  private getTenantById(tenantId: string): Observable<TenantEntity | null> {
    return this.http.get<any>(`${this.baseUrl}/tenants/${tenantId}`).pipe(
      map((tenant) => {
        if (!tenant) return null;

        return new TenantEntity(
          tenant.id,
          tenant.adminUserId,
          tenant.name,
          tenant.address,
          tenant.phone,
          tenant.email,
          tenant.status,
          tenant.subscriptionId,
          tenant.registrationDate,
          tenant.settings
        );
      }),
      catchError(() => {
        return throwError(() => new Error(`Tenant with id ${tenantId} not found`));
      })
    );
  }

  /**
   * Cuenta cuántos doctores tiene un tenant
   */
  private countDoctorsByTenantId(tenantId: string): Observable<number> {
    return this.http.get<any[]>(`${this.baseUrl}/doctors?tenantId=${tenantId}`).pipe(
      map((doctors) => doctors.length),
      catchError(() => {
        console.error('Error counting doctors for tenant');
        return throwError(() => new Error('Failed to count tenant doctors'));
      })
    );
  }

  /**
   * Verifica si un email ya está registrado
   */
  private checkEmailExists(email: string): Observable<boolean> {
    return this.http.get<any[]>(`${this.baseUrl}/users?email=${email}`).pipe(
      map((users) => users.length > 0),
      catchError(() => {
        console.error('Error checking email existence');
        return throwError(() => new Error('Failed to verify email availability'));
      })
    );
  }

  /**
   * Obtiene información de límites para un tenant
   */
  getTenantDoctorLimits(tenantId: string): Observable<{
    currentCount: number;
    maxLimit: number;
    canAddMore: boolean;
    planName: string;
  }> {
    return this.getTenantById(tenantId).pipe(
      switchMap((tenant) => {
        if (!tenant || !tenant.subscriptionId) {
          return throwError(() => new Error('Tenant does not have an active subscription'));
        }

        return forkJoin({
          subscription: this.subscriptionService.getById(tenant.subscriptionId),
          currentCount: this.countDoctorsByTenantId(tenantId),
        }).pipe(
          switchMap(({ subscription, currentCount }) => {
            return this.subscriptionService.getPlanById(subscription.planId).pipe(
              map((plan) => {
                if (!plan) {
                  throw new Error(`Subscription plan not found`);
                }

                const maxLimit = plan.maxDoctors ?? -1;
                const canAddMore = maxLimit === -1 || currentCount < maxLimit;

                return {
                  currentCount,
                  maxLimit,
                  canAddMore,
                  planName: plan.name,
                };
              })
            );
          })
        );
      })
    );
  }

  /**
   * Limpia el estado de registro
   */
  clearRegistrationState(): void {
    this._isRegistering.set(false);
    this._registrationError.set(null);
  }
}
