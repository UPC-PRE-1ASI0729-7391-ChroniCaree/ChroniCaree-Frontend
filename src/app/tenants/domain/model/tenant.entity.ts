import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export type TenantStatus = 'pending_subscription' | 'active' | 'suspended' | 'cancelled';

export interface TenantSettings {
  allowIndependentDoctors: boolean;
  requirePatientApproval: boolean;
  maxDoctors: number; // -1 = unlimited
}

export interface Tenant extends BaseEntity {
  id: number;
  adminUserId: number; // FK a User
  name: string;
  address: string;
  phone: string;
  email: string;
  status: TenantStatus;
  subscriptionId: number | null; // FK a Subscription
  registrationDate: string; // ISO 8601
  settings: TenantSettings;
}

export class TenantEntity implements Tenant {
  constructor(
    public id: number,
    public adminUserId: number,
    public name: string,
    public address: string,
    public phone: string,
    public email: string,
    public status: TenantStatus,
    public subscriptionId: number | null,
    public registrationDate: string,
    public settings: TenantSettings
  ) {}

  /**
   * Verifica si el tenant está activo
   */
  get isActive(): boolean {
    return this.status === 'active';
  }

  /**
   * Verifica si el tenant está pendiente de suscripción
   */
  get isPendingSubscription(): boolean {
    return this.status === 'pending_subscription';
  }

  /**
   * Verifica si el tenant está suspendido
   */
  get isSuspended(): boolean {
    return this.status === 'suspended';
  }

  /**
   * Verifica si el tenant tiene una suscripción asociada
   */
  get hasSubscription(): boolean {
    return this.subscriptionId !== null;
  }

  /**
   * Verifica si puede agregar N doctores
   */
  canAddDoctors(currentDoctorCount: number, doctorsToAdd: number): boolean {
    if (!this.isActive) return false;
    const limit = this.settings.maxDoctors;
    if (limit === -1) return true; // unlimited
    return currentDoctorCount + doctorsToAdd <= limit;
  }

  /**
   * Verifica si el tenant puede realizar operaciones
   */
  canPerformOperations(): boolean {
    return this.isActive && this.hasSubscription;
  }

  /**
   * Valida la consistencia de datos del tenant
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Tenant name is required');
    }

    if (!this.email || !this.email.includes('@')) {
      errors.push('Invalid email format');
    }

    if (!this.adminUserId || this.adminUserId <= 0) {
      errors.push('Valid adminUserId is required');
    }

    if (this.status === 'active' && !this.subscriptionId) {
      errors.push('Active tenants must have a subscription');
    }

    return errors;
  }

  /**
   * Bloquea operaciones si el tenant no está activo
   */
  assertCanPerformOperations(): void {
    if (!this.canPerformOperations()) {
      throw new Error(
        `Tenant ${this.id} cannot perform operations. Status: ${this.status}, HasSubscription: ${this.hasSubscription}`
      );
    }
  }
}
