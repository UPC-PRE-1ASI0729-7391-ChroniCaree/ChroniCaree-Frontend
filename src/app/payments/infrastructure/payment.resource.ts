/**
 * Payment Resource
 * Payments Bounded Context - Infrastructure Layer
 */
export interface PaymentResource {
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
