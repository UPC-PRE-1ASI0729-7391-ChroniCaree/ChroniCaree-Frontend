import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export interface User extends BaseEntity {
  id: number;
  email: string;
  role: 'patient' | 'doctor' | 'hospital_admin';
  name: string;
  password: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
}
