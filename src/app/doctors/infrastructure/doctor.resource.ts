import { BaseResource } from '../../shared/infrastructure/base-response';

export interface Education {
  degree: string;
  institution: string;
  year: number;
}

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
  acceptingPatients?: boolean;
  consultationFee?: number;
  languages?: string[];
  education?: Education[];
  joinedAt?: string;
}
