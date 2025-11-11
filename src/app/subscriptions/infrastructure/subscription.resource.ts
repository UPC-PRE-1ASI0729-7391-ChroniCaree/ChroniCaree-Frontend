/**
 * Subscription Resource (DTO)
 * Representa el formato de datos raw del API
 */

export interface SubscriptionResource {
  id: number;
  payerType: 'patient' | 'tenant';
  payerId: number;
  patientId?: number | null;
  planId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trial' | 'suspended';
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
  billingEmail: string;
  nextBillingDate: string;
  lastPaymentDate: string;
  lastPaymentAmount: number;
}

export interface SubscriptionPlanResource {
  id: string;
  type: 'patient' | 'tenant';
  name: string;
  price: number;
  currency: string;
  billingPeriod: 'monthly' | 'yearly';
  features: any; // PatientPlanFeatures | TenantPlanFeatures
}

export interface CreateSubscriptionRequest {
  payerType: 'patient' | 'tenant';
  payerId: number;
  patientId?: number | null;
  planId: string;
  paymentMethod: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
  billingEmail: string;
  autoRenew?: boolean;
}

export interface UpdateSubscriptionRequest {
  planId?: string;
  status?: 'active' | 'cancelled' | 'past_due' | 'trial' | 'suspended';
  autoRenew?: boolean;
  paymentMethod?: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer';
}
