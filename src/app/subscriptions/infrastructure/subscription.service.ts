/**
 * Subscription Infrastructure Service
 * Maneja operaciones CRUD contra db.json con validaciones de reglas de negocio
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

import { SubscriptionEntity } from '../domain/model/subscription.entity';
import { SubscriptionPlanEntity } from '../domain/model/subscription-plan.entity';
import { SubscriptionAssembler } from './subscription.assembler';
import { SubscriptionApiEndpoint } from './subscription-api.endpoint';
import {
  SubscriptionResource,
  SubscriptionPlanResource,
  CreateSubscriptionRequest,
  UpdateSubscriptionRequest,
} from './subscription.resource';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly subscriptionsUrl = `${environment.apiBaseUrl}${environment.subscriptionsEndpointPath}`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Obtiene todas las suscripciones
   */
  getAll(): Observable<SubscriptionEntity[]> {
    return this.http
      .get<SubscriptionResource[]>(`${this.baseUrl}${SubscriptionApiEndpoint.getAll()}`)
      .pipe(
        map((resources) => SubscriptionAssembler.toEntityList(resources)),
        catchError((error) => throwError(() => new Error(`Error fetching subscriptions: ${error.message}`)))
      );
  }

  /**
   * Obtiene una suscripción por ID
   */
  getById(id: number): Observable<SubscriptionEntity> {
    const url = `${this.baseUrl}${SubscriptionApiEndpoint.getById(id)}`;
    console.log(`🌐 [SubscriptionService] getById(${id}) - URL: ${url}`);
    
    return this.http
      .get<SubscriptionResource>(url)
      .pipe(
        map((resource) => {
          console.log('📦 [SubscriptionService] Response raw:', resource);
          console.log('📦 [SubscriptionService] Response raw dates:');
          console.log('  → startDate:', resource.startDate, typeof resource.startDate);
          console.log('  → endDate:', resource.endDate, typeof resource.endDate);
          console.log('  → status:', resource.status);
          
          const entity = SubscriptionAssembler.toEntity(resource);
          console.log('📦 [SubscriptionService] Entity mapped:', entity);
          console.log('  → id:', entity.id);
          console.log('  → status:', entity.status);
          console.log('  → isActive:', entity.isActive);
          console.log('  → planId:', entity.planId);
          return entity;
        }),
        catchError((error) => {
          console.error(`❌ [SubscriptionService] getById(${id}) error:`, error);
          console.error('  → status:', error.status);
          console.error('  → error:', error.error);
          return throwError(() => new Error(`Error fetching subscription ${id}: ${error.message}`));
        })
      );
  }

  /**
   * Obtiene suscripciones por payer (patient o tenant)
   */
  getByPayerId(payerType: 'patient' | 'tenant', payerId: number): Observable<SubscriptionEntity[]> {
    const url = `${this.baseUrl}${SubscriptionApiEndpoint.getByPayerId(payerType, payerId)}`;
    console.log(`🌐 [SubscriptionService] getByPayerId(${payerType}, ${payerId}) - URL: ${url}`);
    
    return this.http
      .get<SubscriptionResource[]>(url)
      .pipe(
        map((resources) => {
          console.log('📦 [SubscriptionService] Response raw:', resources);
          const entities = SubscriptionAssembler.toEntityList(resources);
          console.log('📦 [SubscriptionService] Entities mapped:', entities.length, 'subscriptions');
          return entities;
        }),
        catchError((error) => {
          console.error(`❌ [SubscriptionService] getByPayerId error:`, error);
          return throwError(() => new Error(`Error fetching subscriptions for payer ${payerId}: ${error.message}`));
        })
      );
  }

  /**
   * Obtiene la suscripción activa de un payer
   * NOTE: Now fetches ALL subscriptions for payer and filters on frontend
   * because backend returns status='pending' instead of 'active' after payment
   */
  getActiveByPayerId(payerType: 'patient' | 'tenant', payerId: number): Observable<SubscriptionEntity | null> {
    const url = `${this.baseUrl}${SubscriptionApiEndpoint.getActiveByPayerId(payerType, payerId)}`;
    console.log(`🌐 [SubscriptionService] getActiveByPayerId(${payerType}, ${payerId}) - URL: ${url}`);
    
    // Valid subscription statuses (includes 'pending' as workaround for backend issue)
    const validStatuses = new Set(['active', 'ACTIVE', 'pending', 'PENDING', 'trial', 'TRIAL']);
    
    return this.http
      .get<SubscriptionResource[]>(url)
      .pipe(
        map((resources): SubscriptionEntity | null => {
          console.log('📦 [SubscriptionService] Response raw:', resources);
          console.log('📦 [SubscriptionService] Number of resources:', resources.length);
          
          if (resources.length === 0) {
            console.warn('⚠️ [SubscriptionService] No subscriptions found for payer');
            return null;
          }
          
          const entities = SubscriptionAssembler.toEntityList(resources);
          console.log('📦 [SubscriptionService] Entities mapped:', entities);
          
          // Find subscription with valid status (active, pending, or trial)
          // Priority: active > trial > pending
          let activeEntity: SubscriptionEntity | null = entities.find((entity) => 
            entity.status.toLowerCase() === 'active' && entity.isActive
          ) ?? null;
          
          activeEntity ??= entities.find((entity) => 
            entity.status.toLowerCase() === 'trial' && entity.isActive
          ) ?? null;
          
          if (!activeEntity) {
            // Fallback: Accept 'pending' status as valid subscription
            // This is a WORKAROUND - backend should return 'active' after payment
            activeEntity = entities.find((entity) => 
              validStatuses.has(entity.status) || entity.isActive
            ) ?? null;
            if (activeEntity) {
              console.log('⚠️ [SubscriptionService] Using pending/other subscription as fallback:', activeEntity.status);
            }
          }
          
          console.log('📦 [SubscriptionService] Active subscription found:', activeEntity);
          
          return activeEntity;
        }),
        catchError((error) => {
          console.error(`❌ [SubscriptionService] getActiveByPayerId error:`, error);
          console.error('  → status:', error.status);
          console.error('  → error:', error.error);
          return throwError(() => new Error(`Error fetching active subscription for payer ${payerId}: ${error.message}`));
        })
      );
  }

  /**
   * Crea una nueva suscripción con validaciones
   */
  create(request: CreateSubscriptionRequest): Observable<SubscriptionEntity> {
    console.log('📋 [SubscriptionService] create() called with:', request);
    
    // Validación: Verificar que el plan existe
    return this.getPlanById(request.planId).pipe(
      switchMap((plan) => {
        console.log('📋 [SubscriptionService] Plan lookup result:', plan);
        
        if (!plan) {
          console.error('❌ [SubscriptionService] Plan not found:', request.planId);
          return throwError(() => new Error(`Plan ${request.planId} does not exist`));
        }

        // Validación: payerType debe coincidir con el tipo de plan
        if (plan.type !== request.payerType) {
          console.warn(`⚠️ WARNING: Plan type mismatch. Plan: ${plan.type}, Request: ${request.payerType}. Proceeding anyway...`);
          // NOTE: We allow this mismatch as a workaround - backend should validate
        }

        // Validación: pacientes deben tener patientId
        if (request.payerType === 'patient' && !request.patientId) {
          return throwError(() => new Error('Patient subscriptions must have a patientId'));
        }

        // Calcular fechas
        const startDate = new Date().toISOString();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 mes por defecto

        // Crear objeto de suscripción sin ID (el backend debe generarlo)
        // NOTE: omitimos la propiedad `id` deliberadamente para evitar errores
        //  en backends que no aceptan IDs en POST create payloads.
        const subscriptionResource: Partial<SubscriptionResource> = {
          payerType: request.payerType,
          payerId: request.payerId,
          patientId: request.patientId,
          planId: request.planId,
          status: 'active',
          startDate,
          endDate: endDate.toISOString(),
          autoRenew: request.autoRenew ?? true,
          paymentMethod: request.paymentMethod,
          billingEmail: request.billingEmail,
          nextBillingDate: endDate.toISOString(),
          lastPaymentDate: startDate,
          lastPaymentAmount: plan.price,
        };

        console.log('📋 [SubscriptionService] Creating subscription with:', subscriptionResource);
        console.log('📋 [SubscriptionService] POST URL:', `${this.baseUrl}${SubscriptionApiEndpoint.create()}`);

        // Use POST helper that can attempt fallback to alternative base URL in dev
        return this.postWithFallback<SubscriptionResource>(SubscriptionApiEndpoint.create(), subscriptionResource)
          .pipe(
            map((resource) => {
              console.log('✅ [SubscriptionService] Subscription created:', resource);
              return SubscriptionAssembler.toEntity(resource);
            }),
            catchError((error) => {
              // Try to surface server-side message if available
              let msg = 'Error creating subscription';
              try {
                if (error?.error && typeof error.error === 'object') {
                  msg = error.error.message || JSON.stringify(error.error);
                } else if (error?.message) {
                  msg = error.message;
                }
              } catch (e) {
                msg = String(error);
              }
              console.error('❌ [SubscriptionService] Error creating subscription:', error);
              return throwError(() => new Error(`Error creating subscription: ${msg}`));
            })
          );
      }),
      catchError((error) => {
        console.error('❌ [SubscriptionService] Error in create() pipeline:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Actualiza una suscripción
   */
  update(id: number, request: UpdateSubscriptionRequest): Observable<SubscriptionEntity> {
    return this.getById(id).pipe(
      switchMap((existing) => {
        const updated = {
          ...SubscriptionAssembler.toResource(existing),
          ...request,
        };

        return this.http
          .patch<SubscriptionResource>(`${this.baseUrl}${SubscriptionApiEndpoint.update(id)}`, updated)
          .pipe(
            map((resource) => SubscriptionAssembler.toEntity(resource)),
            catchError((error) => throwError(() => new Error(`Error updating subscription ${id}: ${error.message}`)))
          );
      })
    );
  }

  /**
   * Cancela una suscripción
   */
  cancel(id: number): Observable<SubscriptionEntity> {
    return this.update(id, { status: 'cancelled', autoRenew: false });
  }

  /**
   * Obtiene todos los planes de suscripción
   */
  getAllPlans(): Observable<SubscriptionPlanEntity[]> {
    return this.http
      .get<SubscriptionPlanResource[]>(`${this.baseUrl}${SubscriptionApiEndpoint.getSubscriptionPlans()}`)
      .pipe(
        map((resources) => SubscriptionAssembler.planToEntityList(resources)),
        catchError((error) => throwError(() => new Error(`Error fetching subscription plans: ${error.message}`)))
      );
  }

  /**
   * Obtiene un plan por ID
   */
  getPlanById(planId: string): Observable<SubscriptionPlanEntity | null> {
    return this.http
      .get<SubscriptionPlanResource[]>(`${this.baseUrl}${SubscriptionApiEndpoint.getSubscriptionPlanById(planId)}`)
      .pipe(
        map((resources) => {
          if (resources.length === 0) return null;
          return SubscriptionAssembler.planToEntity(resources[0]);
        }),
        catchError((error) => throwError(() => new Error(`Error fetching plan ${planId}: ${error.message}`)))
      );
  }

  /**
   * Obtiene planes por tipo (patient o tenant)
   */
  getPlansByType(type: 'patient' | 'tenant'): Observable<SubscriptionPlanEntity[]> {
    const path = SubscriptionApiEndpoint.getSubscriptionPlansByType(type);
    console.log('🌐 [SubscriptionService] getPlansByType:', type, 'URL:', `${this.baseUrl}${path}`);
    return this.getWithFallback<SubscriptionPlanResource[]>(path).pipe(
      map((resources) => {
        console.log('✅ [SubscriptionService] Plans loaded:', resources.length);
        return SubscriptionAssembler.planToEntityList(resources);
      }),
      catchError((error) => {
        console.error('❌ [SubscriptionService] Error fetching plans:', error);
        return throwError(() => new Error(`Error fetching ${type} plans: ${error.message}`));
      })
    );
  }

  /**
   * Obtiene el siguiente ID secuencial para una colección
   */
  private getNextId(collection: string): Observable<number> {
    return this.http.get<any[]>(`${this.baseUrl}/${collection}?_sort=id&_order=desc&_limit=1`).pipe(
      map((items) => {
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
   * GET helper que reintenta con apiBaseUrlFallback si hay error de red (status 0)
   * Similar al helper de AuthService, para manejar puertos alternativos en desarrollo
   */
  private getWithFallback<T>(path: string): Observable<T> {
    const primaryUrl = `${this.baseUrl}${path}`;
    console.log('📤 [SubscriptionService] GET primary:', primaryUrl);
    return this.http.get<T>(primaryUrl).pipe(
      catchError(err => {
        // Network-level error (connection refused, CORS, etc.)
        if (!err?.status || err.status === 0) {
          const fallbackBaseUrl = (environment as any).apiBaseUrlFallback;
          if (fallbackBaseUrl && !this.baseUrl.includes(fallbackBaseUrl)) {
            const fallbackUrl = `${fallbackBaseUrl}${path}`;
            console.warn('⚠️ [SubscriptionService] Primary API unreachable, attempting fallback:', fallbackUrl);
            return this.http.get<T>(fallbackUrl);
          }
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * POST helper that attempts an alternate base URL when primary fails.
   * Useful for local development when backend might run on alternate port.
   */
  private postWithFallback<T>(path: string, body: any, options?: any): Observable<T> {
    const primaryUrl = `${this.baseUrl}${path}`;
    console.log('📤 [SubscriptionService] POST primary:', primaryUrl);
    const primaryCall = this.http.post<T>(primaryUrl, body, options as any) as Observable<T>;
    return primaryCall.pipe(
      catchError(err => {
        // Network-level error (connection refused, CORS, etc.)
        const fallbackBaseUrl = (environment as any).apiBaseUrlFallback;
        if ((!err?.status || err.status === 0) && fallbackBaseUrl && !this.baseUrl.includes(fallbackBaseUrl)) {
          const fallbackUrl = `${fallbackBaseUrl}${path}`;
          console.warn('⚠️ [SubscriptionService] Primary API unreachable, attempting POST fallback:', fallbackUrl);
          return this.http.post<T>(fallbackUrl, body, options as any) as Observable<T>;
        }

        // If server returned 5xx, attempt fallback once if configured
        if (err?.status && err.status >= 500 && fallbackBaseUrl && !this.baseUrl.includes(fallbackBaseUrl)) {
          const fallbackUrl = `${fallbackBaseUrl}${path}`;
          console.warn('⚠️ [SubscriptionService] Server error on primary POST, attempting POST fallback:', fallbackUrl);
          return this.http.post<T>(fallbackUrl, body, options as any) as Observable<T>;
        }

        return throwError(() => err);
      })
    );
  }
}
