import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { Symptom } from '../domain/model/symptom.entity';
import { SymptomResource } from './symptom.resource';

/**
 * Symptom Assembler - Convierte entre entidades de dominio y recursos de API
 */
export class SymptomAssembler implements BaseAssembler<Symptom, SymptomResource, BaseResponse> {
  /**
   * Convierte un recurso de API a entidad de dominio
   */
  toEntityFromResource(resource: SymptomResource): Symptom {
    return {
      id: resource.id,
      patientId: resource.patientId,
      glucose: resource.glucose,
      bloodPressure: resource.bloodPressure,
      heartRate: resource.heartRate,
      temperature: resource.temperature,
      oxygenSaturation: resource.oxygenSaturation,
      fatigue: resource.fatigue,
      pain: resource.pain,
      dizziness: resource.dizziness,
      notes: resource.notes,
      timestamp: resource.timestamp,
      isEdited: resource.isEdited,
      editedAt: resource.editedAt
    };
  }

  /**
   * Convierte una entidad de dominio a recurso de API
   */
  toResourceFromEntity(entity: Symptom): SymptomResource {
    return {
      id: entity.id,
      patientId: entity.patientId,
      glucose: entity.glucose,
      bloodPressure: entity.bloodPressure,
      heartRate: entity.heartRate,
      temperature: entity.temperature,
      oxygenSaturation: entity.oxygenSaturation,
      fatigue: entity.fatigue,
      pain: entity.pain,
      dizziness: entity.dizziness,
      notes: entity.notes,
      timestamp: entity.timestamp,
      isEdited: entity.isEdited,
      editedAt: entity.editedAt
    };
  }

  /**
   * Convierte una respuesta de API a array de entidades
   */
  toEntitiesFromResponse(response: BaseResponse): Symptom[] {
    return [];
  }
}
