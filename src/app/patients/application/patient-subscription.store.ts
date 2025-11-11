/**
 * Patient Subscription Store
 * Orquesta el upgrade de suscripción del paciente (free → premium/family)
 */

import { Injectable, signal, computed } from '@angular/core';
import { Observable, throwError, forkJoin } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';

import { PatientEntity } from '../domain/model/patient.entity';
import { PatientService } from '../infrastructure/patient.service';
import { SubscriptionEntity } from '../../subscriptions/domain/model/subscription.entity';
import { SubscriptionPlanEntity } from '../../subscriptions/domain/model/subscription-plan.entity';
import { SubscriptionService } from '../../subscriptions/infrastructure/subscription.service';

export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';

export interface PatientSubscriptionUpgradeRequest {
  patientId: string;
  planId: string;
  paymentMethod: PaymentMethod;
  billingEmail: string;
  autoRenew?: boolean;
}

export interface PatientSubscriptionResult {
  patient: PatientEntity;
  subscription: SubscriptionEntity;
  plan: SubscriptionPlanEntity;
}

@Injectable({
  providedIn: 'root',
})
export class PatientSubscriptionStore {
  // Signals para estado reactivo
  private readonly _isUpgrading = signal(false);
  private readonly _upgradeError = signal<string | null>(null);
  private readonly _currentPatientSubscription = signal<PatientSubscriptionResult | null>(null);

  // Computed signals
  readonly isUpgrading = computed(() => this._isUpgrading());
  readonly upgradeError = computed(() => this._upgradeError());
  readonly currentPatientSubscription = computed(() => this._currentPatientSubscription());

  constructor(
    private subscriptionService: SubscriptionService,
    private patientService: PatientService
  ) {}

  /**
   * Upgrade de suscripción del paciente
   * 1. Valida que el paciente exista
   * 2. Valida que el plan sea de tipo "patient"
   * 3. Crea la suscripción con payerType: 'patient'
   * 4. Actualiza el patient.subscriptionId
   * 5. Retorna patient, subscription, plan
   */
  upgradePatientSubscription(
    request: PatientSubscriptionUpgradeRequest
  ): Observable<PatientSubscriptionResult> {
    this._isUpgrading.set(true);
    this._upgradeError.set(null);

    // Paso 1: Obtener el paciente
    return this.patientService.getById(request.patientId).pipe(
      switchMap((patient) => {
        if (!patient) {
          return throwError(() => new Error(`Patient with id ${request.patientId} not found`));
        }

        // Validación: Si ya tiene suscripción, verificar que no esté activa
        if (patient.subscriptionId) {
          // Debería verificar si está expirada o cancelada antes de crear nueva
          console.warn('Patient already has a subscriptionId. Consider canceling old subscription first.');
        }

        // Paso 2: Validar que el plan sea de tipo "patient"
        return this.subscriptionService.getPlanById(request.planId).pipe(
          switchMap((plan) => {
            if (!plan) {
              return throwError(() => new Error(`Subscription plan with id ${request.planId} not found`));
            }

            if (plan.type !== 'patient') {
              return throwError(
                () => new Error(`Plan ${plan.name} is not a patient plan (type: ${plan.type})`)
              );
            }

            // Paso 3: Crear la suscripción
            const createRequest = {
              payerType: 'patient' as const,
              payerId: Number(patient.id),
              patientId: Number(patient.id),
              planId: request.planId,
              paymentMethod: request.paymentMethod,
              billingEmail: request.billingEmail,
              autoRenew: request.autoRenew ?? true,
            };

            return this.subscriptionService.create(createRequest).pipe(
              switchMap((subscription) => {
                // Paso 4: Actualizar patient.subscriptionId
                return this.patientService.updateSubscription(patient.id, subscription.id).pipe(
                  map((updatedPatient) => {
                    const result: PatientSubscriptionResult = {
                      patient: updatedPatient,
                      subscription,
                      plan,
                    };

                    this._currentPatientSubscription.set(result);
                    return result;
                  })
                );
              })
            );
          })
        );
      }),
      tap({
        next: () => this._isUpgrading.set(false),
        error: (error) => {
          this._isUpgrading.set(false);
          this._upgradeError.set(error.message || 'Subscription upgrade failed');
        },
      }),
      catchError((error) => {
        this._upgradeError.set(error.message || 'Subscription upgrade failed');
        return throwError(() => error);
      })
    );
  }

  /**
   * Obtiene los detalles completos de la suscripción de un paciente
   * Incluye: patient, subscription, plan
   */
  getPatientSubscriptionDetails(patientId: string): Observable<PatientSubscriptionResult | null> {
    return this.patientService.getById(patientId).pipe(
      switchMap((patient) => {
        if (!patient || !patient.subscriptionId) {
          // Paciente sin suscripción (plan free)
          return throwError(() => new Error('Patient does not have an active subscription'));
        }

        return forkJoin({
          patient: this.patientService.getById(patientId),
          subscription: this.subscriptionService.getById(patient.subscriptionId),
        }).pipe(
          switchMap(({ patient: patientEntity, subscription }) => {
            return this.subscriptionService.getPlanById(subscription.planId).pipe(
              map((plan) => {
                return {
                  patient: patientEntity,
                  subscription,
                  plan,
                } as PatientSubscriptionResult;
              })
            );
          })
        );
      }),
      catchError((error) => {
        console.error('Error fetching patient subscription details:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Limpia el estado de upgrade
   */
  clearUpgradeState(): void {
    this._isUpgrading.set(false);
    this._upgradeError.set(null);
  }
}
