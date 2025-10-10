import { BaseEntity } from '../../../shared/infrastructure/base-entity';

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
  gender: string;
  phone: string;
  address: string;
  weight: number;
  height: number;
  bmi: number;
}
