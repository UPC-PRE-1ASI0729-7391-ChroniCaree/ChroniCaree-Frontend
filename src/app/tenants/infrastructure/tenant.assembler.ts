import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { Tenant } from '../domain/model/tenant.entity';
import { TenantResource } from './tenant.resource';

/**
 * TenantAssembler - Convierte entre entidades Tenant y recursos TenantResource
 */
export class TenantAssembler implements BaseAssembler<Tenant, TenantResource, BaseResponse> {
  
  /**
   * Convierte un recurso TenantResource a una entidad Tenant
   */
  toEntityFromResource(resource: TenantResource): Tenant {
    return {
      id: resource.id,
      name: resource.name
    };
  }

  /**
   * Convierte una entidad Tenant a un recurso TenantResource
   */
  toResourceFromEntity(entity: Tenant): TenantResource {
    return {
      id: entity.id,
      name: entity.name
    };
  }

  /**
   * Convierte una respuesta BaseResponse en una lista de entidades Tenant (actualmente vacía)
   */
  toEntitiesFromResponse(response: BaseResponse): Tenant[] {
    return [];
  }
}
