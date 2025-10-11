import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { User } from '../domain/model/user.entity';
import { UserResource } from './user.resource';

// Clase responsable de convertir datos entre la entidad User y su recurso correspondiente
export class UserAssembler implements BaseAssembler<User, UserResource, BaseResponse> {
  
  // Convierte un recurso (generalmente recibido del backend) en una entidad User del dominio
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

  // Convierte una entidad User del dominio en un recurso (por ejemplo, para enviar al backend o mostrar en la interfaz)
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

  // Método reservado para transformar una respuesta base en una lista de entidades User (actualmente sin implementación)
  toEntitiesFromResponse(response: BaseResponse): User[] {
    return [];
  }
}
