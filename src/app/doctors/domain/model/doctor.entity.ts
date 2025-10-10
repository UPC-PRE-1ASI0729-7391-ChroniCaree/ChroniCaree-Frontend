import { BaseEntity } from '../../../shared/infrastructure/base-entity';

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
}
