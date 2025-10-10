import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { Patient } from '../domain/model/patient.entity';
import { PatientResource } from './patient.resource';

export class PatientAssembler implements BaseAssembler<Patient, PatientResource, BaseResponse> {
  toEntityFromResource(resource: PatientResource): Patient {
    return {
      id: resource.id,
      userId: resource.userId,
      assignedDoctorId: resource.assignedDoctorId,
      tenantId: resource.tenantId,
      subscriptionId: resource.subscriptionId,
      firstName: resource.firstName,
      lastName: resource.lastName,
      dni: resource.dni,
      birthDate: resource.birthDate,
      gender: resource.gender,
      phone: resource.phone,
      address: resource.address,
      weight: resource.weight,
      height: resource.height,
      bmi: resource.bmi
    };
  }

  toResourceFromEntity(entity: Patient): PatientResource {
    return {
      id: entity.id,
      userId: entity.userId,
      assignedDoctorId: entity.assignedDoctorId,
      tenantId: entity.tenantId,
      subscriptionId: entity.subscriptionId,
      firstName: entity.firstName,
      lastName: entity.lastName,
      dni: entity.dni,
      birthDate: entity.birthDate,
      gender: entity.gender,
      phone: entity.phone,
      address: entity.address,
      weight: entity.weight,
      height: entity.height,
      bmi: entity.bmi
    };
  }

  toEntitiesFromResponse(response: BaseResponse): Patient[] {
    return [];
  }
}
