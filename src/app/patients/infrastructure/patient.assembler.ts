/**
 * Patient Assembler
 * Transforma datos raw del API en entidades del dominio
 */

import { PatientEntity, EmergencyContact } from '../domain/model/patient.entity';
import { PatientResource, EmergencyContactResource } from './patient.resource';

export class PatientAssembler {
  /**
   * Convierte un PatientResource (DTO) a PatientEntity (dominio)
   */
  static toEntity(resource: PatientResource): PatientEntity {
    const emergencyContact: EmergencyContact = {
      name: resource.emergencyContact?.name || '',
      relationship: resource.emergencyContact?.relationship || '',
      phone: resource.emergencyContact?.phone || '',
    };

    return new PatientEntity(
      resource.id,
      resource.userId,
      resource.assignedDoctorId,
      resource.tenantId,
      resource.subscriptionId,
      resource.firstName,
      resource.lastName,
      resource.dni,
      resource.birthDate,
      resource.gender,
      resource.phone,
      resource.address,
      resource.weight,
      resource.height,
      resource.bmi,
      emergencyContact
    );
  }

  /**
   * Convierte una lista de PatientResource a PatientEntity[]
   */
  static toEntityList(resources: PatientResource[]): PatientEntity[] {
    return resources.map((resource) => this.toEntity(resource));
  }

  /**
   * Convierte una PatientEntity a PatientResource (para enviar al API)
   */
  static toResource(entity: PatientEntity): PatientResource {
    const emergencyContactResource: EmergencyContactResource = {
      name: entity.emergencyContact.name,
      relationship: entity.emergencyContact.relationship,
      phone: entity.emergencyContact.phone,
    };

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
      bmi: entity.bmi,
      emergencyContact: emergencyContactResource,
    };
  }
}
