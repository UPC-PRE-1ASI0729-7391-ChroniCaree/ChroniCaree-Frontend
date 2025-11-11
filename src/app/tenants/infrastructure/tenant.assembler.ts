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
      adminUserId: (resource as any).adminUserId || 0,
      name: resource.name,
      address: (resource as any).address || '',
      phone: (resource as any).phone || '',
      email: (resource as any).email || '',
      status: (resource as any).status || 'pending_subscription',
      subscriptionId: (resource as any).subscriptionId || null,
      registrationDate: (resource as any).registrationDate || new Date().toISOString(),
      settings: (resource as any).settings || {
        allowIndependentDoctors: false,
        requirePatientApproval: true,
        maxDoctors: 5
      }
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
