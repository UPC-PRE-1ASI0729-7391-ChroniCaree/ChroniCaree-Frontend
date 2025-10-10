import { BaseAssembler } from '../../shared/presentation/components/base-assembler';
import { BaseResponse } from '../../shared/presentation/components/base-response';
import { Tenant } from '../domain/model/tenant.entity';
import { TenantResource } from './tenant.resource';

export class TenantAssembler implements BaseAssembler<Tenant, TenantResource, BaseResponse> {
  toEntityFromResource(resource: TenantResource): Tenant {
    return {
      id: resource.id,
      name: resource.name
    };
  }

  toResourceFromEntity(entity: Tenant): TenantResource {
    return {
      id: entity.id,
      name: entity.name
    };
  }

  toEntitiesFromResponse(response: BaseResponse): Tenant[] {
    return [];
  }
}
