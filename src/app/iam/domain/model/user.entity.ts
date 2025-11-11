import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export type UserRole = 'patient' | 'doctor' | 'hospital_admin';

export interface User extends BaseEntity {
  id: number;
  email: string;
  role: UserRole;
  name: string;
  password: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  tenantId?: number | null; // Solo para hospital_admin y doctors que pertenecen a un tenant
  createdAt: string; // ISO 8601
}

export class UserEntity implements User {
  constructor(
    public id: number,
    public email: string,
    public role: UserRole,
    public name: string,
    public password: string,
    public isVerified: boolean,
    public twoFactorEnabled: boolean,
    public createdAt: string,
    public tenantId?: number | null
  ) {}

  /**
   * Verifica si el usuario es un administrador de hospital
   */
  get isHospitalAdmin(): boolean {
    return this.role === 'hospital_admin';
  }

  /**
   * Verifica si el usuario es un doctor
   */
  get isDoctor(): boolean {
    return this.role === 'doctor';
  }

  /**
   * Verifica si el usuario es un paciente
   */
  get isPatient(): boolean {
    return this.role === 'patient';
  }

  /**
   * Verifica si el usuario pertenece a un tenant
   */
  get belongsToTenant(): boolean {
    return this.tenantId !== null && this.tenantId !== undefined;
  }

  /**
   * Valida la consistencia de datos del usuario
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.email || !this.email.includes('@')) {
      errors.push('Invalid email format');
    }

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Name is required');
    }

    if (this.role === 'hospital_admin' && !this.tenantId) {
      errors.push('Hospital admin must have a tenantId');
    }

    if (this.role === 'patient' && this.tenantId) {
      errors.push('Patients should not have a tenantId');
    }

    return errors;
  }

  /**
   * Obtiene el nombre completo formateado
   */
  get displayName(): string {
    return this.name;
  }

  /**
   * Verifica si el usuario puede acceder a funcionalidades de tenant
   */
  canAccessTenantFeatures(): boolean {
    return this.isHospitalAdmin && this.belongsToTenant;
  }
}
