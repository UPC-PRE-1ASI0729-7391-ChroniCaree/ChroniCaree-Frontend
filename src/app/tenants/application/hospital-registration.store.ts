/**
 * Hospital Registration Store
 * Orquesta el flujo de registro de hospital_admin → creación automática de tenant
 */

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';

import { UserEntity, UserRole } from '../../iam/domain/model/user.entity';
import { TenantEntity, TenantStatus } from '../../tenants/domain/model/tenant.entity';
import { environment } from '../../../../environments/environment';

export interface HospitalRegistrationRequest {
  // User data
  email: string;
  name: string;
  password: string;
  // Tenant data
  hospitalName: string;
  address?: string;
  phone?: string;
}

export interface HospitalRegistrationResult {
  user: UserEntity;
  tenant: TenantEntity;
}

@Injectable({
  providedIn: 'root',
})
export class HospitalRegistrationStore {
  private readonly baseUrl = environment.apiBaseUrl;

  // Signals para estado reactivo
  private readonly _isRegistering = signal(false);
  private readonly _registrationError = signal<string | null>(null);
  private readonly _lastRegisteredHospital = signal<HospitalRegistrationResult | null>(null);

  // Computed signals
  readonly isRegistering = computed(() => this._isRegistering());
  readonly registrationError = computed(() => this._registrationError());
  readonly lastRegisteredHospital = computed(() => this._lastRegisteredHospital());

  constructor(private http: HttpClient) {}

  /**
   * FLUJO 1: Registro de Hospital
   * 1. Valida que el email no exista
   * 2. Crea el user con role: 'hospital_admin'
   * 3. Crea el tenant automáticamente con status: 'pending_subscription'
   * 4. Actualiza el user.tenantId con el ID del tenant creado
   * 5. Retorna ambos objetos
   */
  registerHospital(request: HospitalRegistrationRequest): Observable<HospitalRegistrationResult> {
    this._isRegistering.set(true);
    this._registrationError.set(null);

    // Paso 1: Validar que el email no exista
    return this.checkEmailExists(request.email).pipe(
      switchMap((exists) => {
        if (exists) {
          return throwError(() => new Error(`Email ${request.email} is already registered`));
        }

        // Paso 2: Crear user con role hospital_admin
        const userPayload = {
          email: request.email,
          name: request.name,
          password: request.password, // En producción debe hashearse
          role: 'hospital_admin' as UserRole,
          isVerified: false,
          twoFactorEnabled: false,
          createdAt: new Date().toISOString(),
          tenantId: null, // Se actualizará después
        };

        return this.http.post<any>(`${this.baseUrl}/users`, userPayload).pipe(
          switchMap((createdUser) => {
            // Paso 3: Crear tenant con status pending_subscription
            const tenantPayload = {
              adminUserId: createdUser.id,
              name: request.hospitalName,
              address: request.address || '',
              phone: request.phone || '',
              email: request.email,
              status: 'pending_subscription' as TenantStatus,
              subscriptionId: null,
              registrationDate: new Date().toISOString(),
              settings: {
                allowIndependentDoctors: false,
                requirePatientApproval: true,
                maxDoctors: 5, // Límite por defecto hasta que se suscriba
              },
            };

            return this.http.post<any>(`${this.baseUrl}/tenants`, tenantPayload).pipe(
              switchMap((createdTenant) => {
                // Paso 4: Actualizar user.tenantId
                return this.http
                  .patch<any>(`${this.baseUrl}/users/${createdUser.id}`, {
                    tenantId: createdTenant.id,
                  })
                  .pipe(
                    map((updatedUser) => {
                      const userEntity = new UserEntity(
                        updatedUser.id,
                        updatedUser.email,
                        updatedUser.role,
                        updatedUser.name,
                        updatedUser.password,
                        updatedUser.isVerified,
                        updatedUser.twoFactorEnabled,
                        updatedUser.createdAt,
                        updatedUser.tenantId
                      );

                      const tenantEntity = new TenantEntity(
                        createdTenant.id,
                        createdTenant.adminUserId,
                        createdTenant.name,
                        createdTenant.address,
                        createdTenant.phone,
                        createdTenant.email,
                        createdTenant.status,
                        createdTenant.subscriptionId,
                        createdTenant.registrationDate,
                        createdTenant.settings
                      );

                      const result: HospitalRegistrationResult = {
                        user: userEntity,
                        tenant: tenantEntity,
                      };

                      this._lastRegisteredHospital.set(result);
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
   * Limpia el estado de registro
   */
  clearRegistrationState(): void {
    this._isRegistering.set(false);
    this._registrationError.set(null);
  }
}
