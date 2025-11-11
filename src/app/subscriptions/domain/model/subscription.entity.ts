/**
 * Subscription Entity
 * Representa una suscripción activa (de paciente o tenant)
 */

export type PayerType = 'patient' | 'tenant';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trial' | 'suspended';
export type PaymentMethod = 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';

export interface Subscription {
  id: number;
  payerType: PayerType;
  payerId: number; // patientId or tenantId
  patientId?: number | null; // Solo para payerType === 'patient'
  planId: string; // FK a SubscriptionPlan
  status: SubscriptionStatus;
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  autoRenew: boolean;
  paymentMethod: PaymentMethod;
  billingEmail: string;
  nextBillingDate: string; // ISO 8601
  lastPaymentDate: string; // ISO 8601
  lastPaymentAmount: number;
}

export class SubscriptionEntity implements Subscription {
  constructor(
    public id: number,
    public payerType: PayerType,
    public payerId: number,
    public planId: string,
    public status: SubscriptionStatus,
    public startDate: string,
    public endDate: string,
    public autoRenew: boolean,
    public paymentMethod: PaymentMethod,
    public billingEmail: string,
    public nextBillingDate: string,
    public lastPaymentDate: string,
    public lastPaymentAmount: number,
    public patientId?: number | null
  ) {}

  /**
   * Verifica si la suscripción está activa
   */
  get isActive(): boolean {
    if (this.status !== 'active') return false;
    const now = new Date();
    const endDate = new Date(this.endDate);
    return now <= endDate;
  }

  /**
   * Verifica si la suscripción ha expirado
   */
  get isExpired(): boolean {
    const now = new Date();
    const endDate = new Date(this.endDate);
    return now > endDate;
  }

  /**
   * Verifica si la suscripción está próxima a vencer (menos de 7 días)
   */
  get isExpiringSoon(): boolean {
    const now = new Date();
    const endDate = new Date(this.endDate);
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  }

  /**
   * Días restantes hasta el vencimiento
   */
  get daysRemaining(): number {
    const now = new Date();
    const endDate = new Date(this.endDate);
    return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * Valida si puede renovarse automáticamente
   */
  canAutoRenew(): boolean {
    return this.autoRenew && this.status === 'active';
  }

  /**
   * Valida consistencia de datos
   */
  validate(): string[] {
    const errors: string[] = [];

    if (this.payerType === 'patient' && !this.patientId) {
      errors.push('Patient subscriptions must have a patientId');
    }

    if (this.payerType === 'tenant' && this.patientId) {
      errors.push('Tenant subscriptions should not have a patientId');
    }

    if (new Date(this.startDate) >= new Date(this.endDate)) {
      errors.push('Start date must be before end date');
    }

    if (!this.billingEmail || !this.billingEmail.includes('@')) {
      errors.push('Invalid billing email');
    }

    return errors;
  }
}
