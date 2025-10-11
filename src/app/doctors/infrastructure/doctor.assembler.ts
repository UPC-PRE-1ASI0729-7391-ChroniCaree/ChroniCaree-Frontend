import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { Doctor } from '../domain/model/doctor.entity';
import { DoctorResource } from './doctor.resource';

// Clase encargada de convertir datos entre la entidad Doctor y su recurso correspondiente
export class DoctorAssembler implements BaseAssembler<Doctor, DoctorResource, BaseResponse> {
  
  // Convierte un recurso (generalmente recibido del backend) en una entidad Doctor del dominio
  toEntityFromResource(resource: DoctorResource): Doctor {
    return {
      id: resource.id,
      userId: resource.userId,
      tenantId: resource.tenantId,
      isIndependent: resource.isIndependent,
      firstName: resource.firstName,
      lastName: resource.lastName,
      dni: resource.dni,
      specialty: resource.specialty,
      licenseNumber: resource.licenseNumber,
      phone: resource.phone,
      isVerified: resource.isVerified
    };
  }

  // Convierte una entidad Doctor en un recurso (por ejemplo, para enviar al backend o mostrar en la vista)
  toResourceFromEntity(entity: Doctor): DoctorResource {
    return {
      id: entity.id,
      userId: entity.userId,
      tenantId: entity.tenantId,
      isIndependent: entity.isIndependent,
      firstName: entity.firstName,
      lastName: entity.lastName,
      dni: entity.dni,
      specialty: entity.specialty,
      licenseNumber: entity.licenseNumber,
      phone: entity.phone,
      isVerified: entity.isVerified
    };
  }

  // Método preparado para transformar respuestas base en una lista de entidades Doctor (actualmente sin implementación)
  toEntitiesFromResponse(response: BaseResponse): Doctor[] {
    return [];
  }
}
