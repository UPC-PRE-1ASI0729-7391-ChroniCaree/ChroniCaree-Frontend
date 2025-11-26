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

  constructor(private http: HttpClient) {}

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
    return this.http
      .get<SubscriptionResource>(`${this.baseUrl}${SubscriptionApiEndpoint.getById(id)}`)
      .pipe(
        map((resource) => SubscriptionAssembler.toEntity(resource)),
        catchError((error) => throwError(() => new Error(`Error fetching subscription ${id}: ${error.message}`)))
      );
  }

  /**
   * Obtiene suscripciones por payer (patient o tenant)
   */
  getByPayerId(payerType: 'patient' | 'tenant', payerId: number): Observable<SubscriptionEntity[]> {
    return this.http
      .get<SubscriptionResource[]>(`${this.baseUrl}${SubscriptionApiEndpoint.getByPayerId(payerType, payerId)}`)
      .pipe(
        map((resources) => SubscriptionAssembler.toEntityList(resources)),
        catchError((error) => throwError(() => new Error(`Error fetching subscriptions for payer ${payerId}: ${error.message}`)))
      );
  }

  /**
   * Obtiene la suscripción activa de un payer
   */
  getActiveByPayerId(payerType: 'patient' | 'tenant', payerId: number): Observable<SubscriptionEntity | null> {
    return this.http
      .get<SubscriptionResource[]>(`${this.baseUrl}${SubscriptionApiEndpoint.getActiveByPayerId(payerType, payerId)}`)
      .pipe(
        map((resources) => {
          if (resources.length === 0) return null;
          const entities = SubscriptionAssembler.toEntityList(resources);
          // Retorna la primera suscripción activa que no haya expirado
          return entities.find((entity) => entity.isActive) || null;
        }),
        catchError((error) => throwError(() => new Error(`Error fetching active subscription for payer ${payerId}: ${error.message}`)))
      );
  }

  /**
   * Crea una nueva suscripción con validaciones
   */
  create(request: CreateSubscriptionRequest): Observable<SubscriptionEntity> {
    // Validación: Verificar que el plan existe
    return this.getPlanById(request.planId).pipe(
      switchMap((plan) => {
        if (!plan) {
          return throwError(() => new Error(`Plan ${request.planId} does not exist`));
        }

        // Validación: payerType debe coincidir con el tipo de plan
        if (plan.type !== request.payerType) {
          return throwError(
            () => new Error(`Plan type ${plan.type} does not match payer type ${request.payerType}`)
          );
        }

        // Validación: pacientes deben tener patientId
        if (request.payerType === 'patient' && !request.patientId) {
          return throwError(() => new Error('Patient subscriptions must have a patientId'));
        }

        // Calcular fechas
        const startDate = new Date().toISOString();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1); // 1 mes por defecto

        // Obtener siguiente ID
        return this.getNextId('subscriptions').pipe(
          switchMap((nextId) => {
            const subscriptionResource: Partial<SubscriptionResource> = {
              id: nextId,
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

            return this.http
              .post<SubscriptionResource>(`${this.baseUrl}${SubscriptionApiEndpoint.create()}`, subscriptionResource)
              .pipe(
                map((resource) => SubscriptionAssembler.toEntity(resource)),
                catchError((error) => throwError(() => new Error(`Error creating subscription: ${error.message}`)))
              );
          })
        );
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
    return this.http
      .get<SubscriptionPlanResource[]>(`${this.baseUrl}${SubscriptionApiEndpoint.getSubscriptionPlansByType(type)}`)
      .pipe(
        map((resources) => SubscriptionAssembler.planToEntityList(resources)),
        catchError((error) => throwError(() => new Error(`Error fetching ${type} plans: ${error.message}`)))
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
}
