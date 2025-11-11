/**
 * Payment Store
 * Payments Bounded Context - Application Layer
 * 
 * Manages payment state and operations
 */
import { Injectable, inject, signal, computed } from '@angular/core';
import { PaymentService } from '../infrastructure/payment.service';
import { StripeService } from '../infrastructure/stripe.service';
import { PaymentEntity } from '../domain/model/payment.entity';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentStore {
  private readonly paymentService = inject(PaymentService);
  private readonly stripeService = inject(StripeService);

  // State
  private readonly _payments = signal<PaymentEntity[]>([]);
  private readonly _currentPayment = signal<PaymentEntity | null>(null);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _processing = signal(false);

  // Selectors
  readonly payments = this._payments.asReadonly();
  readonly currentPayment = this._currentPayment.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly processing = this._processing.asReadonly();

  readonly hasPayments = computed(() => this._payments().length > 0);

  /**
   * Procesa un pago con Stripe
   */
  async processPayment(
    subscriptionId: number,
    payerId: number,
    payerType: 'tenant' | 'patient',
    amount: number,
    cardholderName: string
  ): Promise<PaymentEntity> {
    this._processing.set(true);
    this._error.set(null);

    try {
      // 1. Crear token de Stripe
      console.log('🔐 Validando tarjeta con Stripe...');
      const token = await firstValueFrom(
        this.stripeService.createPaymentToken(cardholderName)
      );

      console.log('✅ Tarjeta validada, token:', token);

      // 2. Crear registro de pago en backend
      const payment = await firstValueFrom(
        this.paymentService.createPayment({
          subscriptionId,
          payerType,
          payerId,
          amount,
          currency: 'USD',
          status: 'completed',
          paymentMethod: 'credit_card',
          transactionId: token,
          stripePaymentIntentId: token
        })
      );

      console.log('✅ Pago registrado:', payment);

      this._currentPayment.set(payment);
      this._payments.update(payments => [...payments, payment]);
      
      return payment;
    } catch (error: any) {
      const errorMessage = error.message || 'Error procesando el pago';
      console.error('❌ Error en processPayment:', errorMessage);
      this._error.set(errorMessage);
      throw error;
    } finally {
      this._processing.set(false);
    }
  }

  /**
   * Carga pagos de una suscripción
   */
  async loadPaymentsBySubscription(subscriptionId: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const payments = await firstValueFrom(
        this.paymentService.getPaymentsBySubscription(subscriptionId)
      );
      
      this._payments.set(payments);
    } catch (error: any) {
      const errorMessage = error.message || 'Error cargando pagos';
      console.error('❌ Error loading payments:', errorMessage);
      this._error.set(errorMessage);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Limpia el estado
   */
  clear(): void {
    this._payments.set([]);
    this._currentPayment.set(null);
    this._error.set(null);
    this._loading.set(false);
    this._processing.set(false);
  }
}
