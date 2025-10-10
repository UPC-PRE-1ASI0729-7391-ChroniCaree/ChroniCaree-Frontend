import { BaseResource } from '../../shared/infrastructure/base-response';

export interface PatientResource extends BaseResource {
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
