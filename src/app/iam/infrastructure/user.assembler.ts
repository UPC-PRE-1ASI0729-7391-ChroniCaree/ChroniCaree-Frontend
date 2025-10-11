import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { User } from '../domain/model/user.entity';
import { UserResource } from './user.resource';

/**
 * UserAssembler - Convierte entre entidades User y recursos UserResource
 */
export class UserAssembler implements BaseAssembler<User, UserResource, BaseResponse> {
  
  /**
   * Convierte un recurso UserResource en una entidad User
   */
  toEntityFromResource(resource: UserResource): User {
    return {
      id: resource.id,
      email: resource.email,
      role: resource.role,
      name: resource.name,
      password: resource.password,
      isVerified: resource.isVerified,
      twoFactorEnabled: resource.twoFactorEnabled
    };
  }

  /**
   * Convierte una entidad User en un recurso UserResource
   */
  toResourceFromEntity(entity: User): UserResource {
    return {
      id: entity.id,
      email: entity.email,
      role: entity.role,
      name: entity.name,
      password: entity.password,
      isVerified: entity.isVerified,
      twoFactorEnabled: entity.twoFactorEnabled
    };
  }

  /**
   * Convierte una respuesta BaseResponse en una lista de entidades User (sin implementación actual)
   */
  toEntitiesFromResponse(response: BaseResponse): User[] {
    return [];
  }
}
