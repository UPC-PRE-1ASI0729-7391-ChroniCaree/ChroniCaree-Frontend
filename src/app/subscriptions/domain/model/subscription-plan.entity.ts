/**
 * Subscription Plan Entity
 * Representa los planes de suscripción disponibles (patient_free, patient_premium, tenant_basic, etc.)
 */

export type SubscriptionType = 'patient' | 'tenant';
export type BillingPeriod = 'monthly' | 'yearly';

export interface PatientPlanFeatures {
  doctorAccess: boolean;
  symptomTracking: boolean;
  medicationReminders: boolean;
  basicReports?: boolean;
  advancedReports?: boolean;
  dataStorage: string;
  support: 'community' | 'priority';
  aiInsights?: boolean;
  familySharing?: boolean;
  maxMembers?: number;
}

export interface TenantPlanFeatures {
  maxDoctors: number; // -1 = unlimited
  maxPatients: number; // -1 = unlimited
  basicAnalytics: boolean;
  advancedAnalytics: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  support: 'email' | 'phone' | 'dedicated';
  dataRetention: string;
  whiteLabel?: boolean;
  customIntegrations?: boolean;
}

export type PlanFeatures = PatientPlanFeatures | TenantPlanFeatures;

export interface SubscriptionPlan {
  id: string; // e.g., "patient_free", "tenant_enterprise"
  type: SubscriptionType;
  name: string;
  price: number;
  currency: string;
  billingPeriod: BillingPeriod;
  features: PlanFeatures;
}

export class SubscriptionPlanEntity implements SubscriptionPlan {
  constructor(
    public id: string,
    public type: SubscriptionType,
    public name: string,
    public price: number,
    public currency: string,
    public billingPeriod: BillingPeriod,
    public features: PlanFeatures
  ) {}

  /**
   * Verifica si el plan permite acceso a doctores (solo para planes de paciente)
   */
  get allowsDoctorAccess(): boolean {
    if (this.type !== 'patient') return false;
    return (this.features as PatientPlanFeatures).doctorAccess;
  }

  /**
   * Obtiene el límite de doctores (solo para planes de tenant)
   */
  get maxDoctors(): number | null {
    if (this.type !== 'tenant') return null;
    const maxDoctors = (this.features as TenantPlanFeatures).maxDoctors;
    return maxDoctors === -1 ? Infinity : maxDoctors;
  }

  /**
   * Obtiene el límite de pacientes (solo para planes de tenant)
   */
  get maxPatients(): number | null {
    if (this.type !== 'tenant') return null;
    const maxPatients = (this.features as TenantPlanFeatures).maxPatients;
    return maxPatients === -1 ? Infinity : maxPatients;
  }

  /**
   * Verifica si el plan es gratuito
   */
  get isFree(): boolean {
    return this.price === 0;
  }

  /**
   * Verifica si el plan incluye analytics avanzado
   */
  get hasAdvancedAnalytics(): boolean {
    if (this.type !== 'tenant') return false;
    return (this.features as TenantPlanFeatures).advancedAnalytics;
  }

  /**
   * Valida si el plan permite agregar N doctores adicionales
   */
  canAddDoctors(currentDoctorCount: number, doctorsToAdd: number): boolean {
    const limit = this.maxDoctors;
    if (limit === null || limit === Infinity) return true;
    return currentDoctorCount + doctorsToAdd <= limit;
  }
}
