import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Patient extends BaseEntity {
  id: number;
  userId: number;
  assignedDoctorId: number | null;
  tenantId: number | null;
  subscriptionId: number | null;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  address: string;
  weight: number;
  height: number;
  bmi: number;
  emergencyContact: EmergencyContact;
}

export class PatientEntity implements Patient {
  constructor(
    public id: number,
    public userId: number,
    public assignedDoctorId: number | null,
    public tenantId: number | null,
    public subscriptionId: number | null,
    public firstName: string,
    public lastName: string,
    public dni: string,
    public birthDate: string,
    public gender: 'male' | 'female' | 'other',
    public phone: string,
    public address: string,
    public weight: number,
    public height: number,
    public bmi: number,
    public emergencyContact: EmergencyContact
  ) {}

  /**
   * Obtiene el nombre completo del paciente
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Verifica si el paciente tiene doctor asignado
   */
  get hasAssignedDoctor(): boolean {
    return this.assignedDoctorId !== null;
  }

  /**
   * Verifica si el paciente tiene suscripción activa
   */
  get hasActiveSubscription(): boolean {
    return this.subscriptionId !== null;
  }

  /**
   * Verifica si el paciente pertenece a un tenant (B2B)
   */
  get belongsToTenant(): boolean {
    return this.tenantId !== null;
  }

  /**
   * Calcula la edad del paciente
   */
  get age(): number {
    const birthDate = new Date(this.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }

  /**
   * Calcula el BMI si no está calculado
   */
  calculateBMI(): number {
    if (this.height <= 0 || this.weight <= 0) return 0;
    return Math.round((this.weight / (this.height * this.height)) * 10) / 10;
  }

  /**
   * Verifica si puede asignar un doctor (requiere suscripción con doctorAccess)
   */
  canAssignDoctor(hasDoctorAccess: boolean): boolean {
    if (!this.hasActiveSubscription) return false;
    return hasDoctorAccess;
  }

  /**
   * Valida la consistencia de datos del paciente
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

    if (!this.birthDate) {
      errors.push('Birth date is required');
    }

    if (this.height < 0 || this.weight < 0) {
      errors.push('Height and weight must be positive');
    }

    const calculatedBMI = this.calculateBMI();
    if (calculatedBMI > 0 && Math.abs(this.bmi - calculatedBMI) > 0.5) {
      errors.push('BMI does not match height and weight');
    }

    return errors;
  }
}
