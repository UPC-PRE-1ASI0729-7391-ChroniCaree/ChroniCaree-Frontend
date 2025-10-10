import { BaseResource } from '../../shared/presentation/components/base-response';

export interface TenantResource extends BaseResource {
  id: number;
  name: string;
}
