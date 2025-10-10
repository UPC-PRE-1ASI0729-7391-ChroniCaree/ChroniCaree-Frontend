import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { Doctor } from '../domain/model/doctor.entity';
import { DoctorResource } from './doctor.resource';

export class DoctorAssembler implements BaseAssembler<Doctor, DoctorResource, BaseResponse> {
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

  toEntitiesFromResponse(response: BaseResponse): Doctor[] {
    return [];
  }
}
