import { BaseResource } from '../../shared/infrastructure/base-response';

export interface UserResource extends BaseResource {
  id: number;
  email: string;
  role: 'patient' | 'doctor' | 'hospital_admin';
  name: string;
  password: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
}
