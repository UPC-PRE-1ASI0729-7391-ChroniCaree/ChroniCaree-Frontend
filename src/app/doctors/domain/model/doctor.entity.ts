import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export interface Education {
  degree: string;
  institution: string;
  year: number;
}

export interface Doctor extends BaseEntity {
  id: number;
  userId: number;
  tenantId: number | null;
  isIndependent: boolean;
  firstName: string;
  lastName: string;
  dni: string;
  specialty: string;
  licenseNumber: string;
  phone: string;
  isVerified: boolean;
  acceptingPatients: boolean;
  consultationFee: number;
  languages: string[];
  education: Education[];
  joinedAt: string; // ISO 8601
}

export class DoctorEntity implements Doctor {
  constructor(
    public id: number,
    public userId: number,
    public tenantId: number | null,
    public isIndependent: boolean,
    public firstName: string,
    public lastName: string,
    public dni: string,
    public specialty: string,
    public licenseNumber: string,
    public phone: string,
    public isVerified: boolean,
    public acceptingPatients: boolean,
    public consultationFee: number,
    public languages: string[],
    public education: Education[],
    public joinedAt: string
  ) {}

  /**
   * Obtiene el nombre completo del doctor
   */
  get fullName(): string {
    return `Dr. ${this.firstName} ${this.lastName}`;
  }

  /**
   * Verifica si el doctor pertenece a un tenant
   */
  get belongsToTenant(): boolean {
    return this.tenantId !== null;
  }

  /**
   * Verifica si el doctor puede aceptar nuevos pacientes
   */
  canAcceptPatient(): boolean {
    return this.isVerified && this.acceptingPatients;
  }

  /**
   * Verifica si el doctor es independiente
   */
  get isIndependentDoctor(): boolean {
    return this.isIndependent && this.tenantId === null;
  }

  /**
   * Valida la consistencia de datos del doctor
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.firstName || this.firstName.trim().length === 0) {
      errors.push('First name is required');
    }

    if (!this.lastName || this.lastName.trim().length === 0) {
      errors.push('Last name is required');
    }

    if (!this.dni || this.dni.trim().length === 0) {
      errors.push('DNI is required');
    }

    if (!this.specialty || this.specialty.trim().length === 0) {
      errors.push('Specialty is required');
    }

    if (!this.licenseNumber || this.licenseNumber.trim().length === 0) {
      errors.push('License number is required');
    }

    if (this.isIndependent && this.tenantId !== null) {
      errors.push('Independent doctors should not have a tenantId');
    }

    if (!this.isIndependent && this.tenantId === null) {
      errors.push('Non-independent doctors must have a tenantId');
    }

    if (this.consultationFee < 0) {
      errors.push('Consultation fee must be non-negative');
    }

    return errors;
  }

  /**
   * Verifica si el doctor puede ser asignado a un paciente
   */
  canBeAssignedToPatient(): string | null {
    if (!this.isVerified) {
      return 'Doctor must be verified';
    }
    if (!this.acceptingPatients) {
      return 'Doctor is not accepting new patients';
    }
    return null;
  }
}
