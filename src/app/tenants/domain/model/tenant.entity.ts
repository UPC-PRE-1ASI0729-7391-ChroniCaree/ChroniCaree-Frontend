import { BaseEntity } from '../../../shared/presentation/components/base-entity';

export interface Tenant extends BaseEntity {
  id: number;
  name: string;
}
