import { BaseEntity } from '../../../shared/infrastructure/base-entity';

export interface Tenant extends BaseEntity {
  id: number;
  name: string;
}
