import { BaseResource } from '../../shared/infrastructure/base-response';

export interface TenantResource extends BaseResource {
  id: number;
  name: string;
}
