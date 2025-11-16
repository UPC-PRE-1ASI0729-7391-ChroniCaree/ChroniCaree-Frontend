/**
 * Tenant Subscription Store
 * Orquesta el flujo de activación de suscripción de tenant
 */

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, forkJoin } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';

import { TenantEntity, TenantStatus } from '../../tenants/domain/model/tenant.entity';
import { environment } from '../../../environments/environment';
import { SubscriptionEntity } from '../../subscriptions/domain/model/subscription.entity';
import { SubscriptionPlanEntity, TenantPlanFeatures } from '../../subscriptions/domain/model/subscription-plan.entity';
import { SubscriptionService } from '../../subscriptions/infrastructure/subscription.service';
import { CreateSubscriptionRequest } from '../../subscriptions/infrastructure/subscription.resource';

export interface TenantSubscriptionRequest {
  tenantId: number;
  planId: string; // 'tenant_basic' | 'tenant_professional' | 'tenant_enterprise'
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
  billingEmail: string;
}

export interface TenantSubscriptionResult {
  tenant: TenantEntity;
  subscription: SubscriptionEntity;
  plan: SubscriptionPlanEntity;
}

@Injectable({
  providedIn: 'root',
})
export class TenantSubscriptionStore {
  private readonly baseUrl = environment.apiBaseUrl;

  // Signals para estado reactivo
  private readonly _isActivating = signal(false);
  private readonly _activationError = signal<string | null>(null);
  private readonly _currentTenantSubscription = signal<TenantSubscriptionResult | null>(null);

  // Computed signals
  readonly isActivating = computed(() => this._isActivating());
  readonly activationError = computed(() => this._activationError());
  readonly currentTenantSubscription = computed(() => this._currentTenantSubscription());

  constructor(
    private http: HttpClient,
    private subscriptionService: SubscriptionService
  ) {}

  /**
   * FLUJO: Activación de suscripción de tenant
   * 1. Valida que el tenant exista y esté en pending_subscription
   * 2. Valida que el plan sea de tipo 'tenant'
   * 3. Crea la suscripción con payerType: 'tenant'
   * 4. Actualiza tenant.subscriptionId
   * 5. Actualiza tenant.status a 'active'
   * 6. Actualiza tenant.settings.maxDoctors según el plan
   */
  activateTenantSubscription(request: TenantSubscriptionRequest): Observable<TenantSubscriptionResult> {
    this._isActivating.set(true);
    this._activationError.set(null);

    // Paso 1: Obtener el tenant y validar su estado
    return this.getTenantById(request.tenantId).pipe(
      switchMap((tenant) => {
        // Validación: El tenant debe existir
        if (!tenant) {
          return throwError(() => new Error(`Tenant ${request.tenantId} not found`));
        }

        // Validación: El tenant no debe tener ya una suscripción activa
        if (tenant.hasSubscription && tenant.isActive) {
          return throwError(() => new Error(`Tenant ${request.tenantId} already has an active subscription`));
        }

        // Paso 2: Obtener el plan y validarlo
        return this.subscriptionService.getPlanById(request.planId).pipe(
          switchMap((plan) => {
            // Validación: El plan debe existir
            if (!plan) {
              return throwError(() => new Error(`Plan ${request.planId} not found`));
            }

            // Validación: El plan debe ser de tipo 'tenant'
            if (plan.type !== 'tenant') {
              return throwError(() => new Error(`Plan ${request.planId} is not a tenant plan`));
            }

            // Paso 3: Crear la suscripción
            const subscriptionRequest: CreateSubscriptionRequest = {
              payerType: 'tenant',
              payerId: tenant.id,
              planId: request.planId,
              paymentMethod: request.paymentMethod,
              billingEmail: request.billingEmail,
              autoRenew: true,
            };

            return this.subscriptionService.create(subscriptionRequest).pipe(
              switchMap((subscription) => {
                // Paso 4 y 5: Actualizar el tenant
                const planFeatures = plan.features as TenantPlanFeatures;
                const updatedTenantData = {
                  subscriptionId: subscription.id,
                  status: 'active' as TenantStatus,
                  settings: {
                    ...tenant.settings,
                    maxDoctors: planFeatures.maxDoctors,
                  },
                };

                return this.http.patch<any>(`${this.baseUrl}/tenants/${tenant.id}`, updatedTenantData).pipe(
                  map((updatedTenant) => {
                    const tenantEntity = new TenantEntity(
                      updatedTenant.id,
                      updatedTenant.adminUserId,
                      updatedTenant.name,
                      updatedTenant.address,
                      updatedTenant.phone,
                      updatedTenant.email,
                      updatedTenant.status,
                      updatedTenant.subscriptionId,
                      updatedTenant.registrationDate,
                      updatedTenant.settings
                    );

                    const result: TenantSubscriptionResult = {
                      tenant: tenantEntity,
                      subscription,
                      plan,
                    };

                    this._currentTenantSubscription.set(result);
                    return result;
                  })
                );
              })
            );
          })
        );
      }),
      tap({
        next: () => this._isActivating.set(false),
        error: (error) => {
          this._isActivating.set(false);
          this._activationError.set(error.message || 'Activation failed');
        },
      }),
      catchError((error) => {
        this._activationError.set(error.message || 'Activation failed');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene un tenant por ID
   */
  private getTenantById(id: number): Observable<TenantEntity | null> {
    return this.http.get<any>(`${this.baseUrl}/tenants/${id}`).pipe(
      map((tenant) =>
        new TenantEntity(
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
        )
      ),
      catchError(() => throwError(() => new Error(`Tenant ${id} not found`)))
    );
  }

  /**
   * Obtiene la suscripción completa de un tenant (tenant + subscription + plan)
   */
  getTenantSubscriptionDetails(tenantId: number): Observable<TenantSubscriptionResult | null> {
    return this.getTenantById(tenantId).pipe(
      switchMap((tenant) => {
        if (!tenant || !tenant.subscriptionId) {
          return throwError(() => new Error(`Tenant ${tenantId} has no subscription`));
        }

        return forkJoin({
          tenant: [tenant],
          subscription: this.subscriptionService.getById(tenant.subscriptionId),
        }).pipe(
          switchMap(({ subscription }) => {
            return this.subscriptionService.getPlanById(subscription.planId).pipe(
              map((plan) => {
                if (!plan) {
                  throw new Error(`Plan ${subscription.planId} not found`);
                }
                return {
                  tenant,
                  subscription,
                  plan,
                };
              })
            );
          })
        );
      }),
      catchError((error) => {
        console.error('Error fetching tenant subscription details:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Limpia el estado
   */
  clearState(): void {
    this._isActivating.set(false);
    this._activationError.set(null);
  }
}
