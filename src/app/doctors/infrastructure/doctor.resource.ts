import { BaseResource } from '../../../shared/infrastructure/base-response';

export interface DoctorResource extends BaseResource {
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
}
