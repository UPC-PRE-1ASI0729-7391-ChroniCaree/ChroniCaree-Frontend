import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { User } from '../domain/model/user.entity';
import { UserResource } from './user.resource';

export class UserAssembler implements BaseAssembler<User, UserResource, BaseResponse> {
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

  toEntitiesFromResponse(response: BaseResponse): User[] {
    return [];
  }
}
