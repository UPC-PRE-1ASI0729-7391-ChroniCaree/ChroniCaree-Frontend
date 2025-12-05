import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { Doctor } from '../domain/model/doctor.entity';
import { DoctorResource } from './doctor.resource';

/**
 * DoctorAssembler - Convierte entre entidades Doctor y recursos DoctorResource
 * Maneja tanto el formato plano como el formato con Value Objects del backend
 */
export class DoctorAssembler implements BaseAssembler<Doctor, DoctorResource, BaseResponse> {
  
  /**
   * Extrae el valor de un campo que puede ser string o Value Object
   * Backend puede devolver: "Cardiología" o { "value": "Cardiología" }
   */
  private extractValue(field: any): string {
    if (field === null || field === undefined) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object' && 'value' in field) return field.value;
    return String(field);
  }

  /**
   * Convierte un recurso DoctorResource en una entidad Doctor
   * Maneja tanto formato plano como Value Objects del backend
   */
  toEntityFromResource(resource: any): Doctor {
    // Manejar el nombre que puede venir como objeto { firstName, lastName, fullName }
    let firstName = resource.firstName;
    let lastName = resource.lastName;
    
    if (resource.name && typeof resource.name === 'object') {
      firstName = resource.name.firstName || firstName;
      lastName = resource.name.lastName || lastName;
    }

    return {
      id: resource.id,
      userId: resource.userId,
      tenantId: resource.tenantId,
      isIndependent: resource.isIndependent ?? false,
      firstName: firstName || '',
      lastName: lastName || '',
      dni: this.extractValue(resource.dni),
      specialty: this.extractValue(resource.specialty),
      licenseNumber: this.extractValue(resource.licenseNumber),
      phone: this.extractValue(resource.phone),
      isVerified: resource.isVerified ?? false,
      acceptingPatients: resource.acceptingPatients ?? true,
      consultationFee: resource.consultationFee ?? 0,
      languages: resource.languages ?? [],
      education: resource.education ?? [],
      joinedAt: resource.joinedAt ?? new Date().toISOString()
    };
  }

  /**
   * Convierte una entidad Doctor en un recurso DoctorResource
   */
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
      isVerified: entity.isVerified,
      acceptingPatients: entity.acceptingPatients,
      consultationFee: entity.consultationFee,
      languages: entity.languages,
      education: entity.education,
      joinedAt: entity.joinedAt
    };
  }

  /**
   * Convierte una respuesta BaseResponse en una lista de entidades Doctor (sin implementación actual)
   */
  toEntitiesFromResponse(response: BaseResponse): Doctor[] {
    return [];
  }
}
