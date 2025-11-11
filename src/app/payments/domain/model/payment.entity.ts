/**
 * Payment Entity
 * Payments Bounded Context - Domain Layer
 */
export interface PaymentEntity {
  id: number;
  subscriptionId: number;
  payerType: 'tenant' | 'patient';
  payerId: number;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'credit_card' | 'debit_card' | 'bank_transfer';
  transactionId: string;
  stripePaymentIntentId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CardDetails {
  number: string;
  exp_month: number;
  exp_year: number;
  cvc: string;
  name: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}
