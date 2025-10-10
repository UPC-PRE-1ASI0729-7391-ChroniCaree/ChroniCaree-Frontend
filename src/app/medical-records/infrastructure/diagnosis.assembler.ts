import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { Diagnosis, DiagnosisStatus, DiagnosisSeverity } from '../domain/model/diagnosis.entity';
import { DiagnosisResource } from './diagnosis.resource';

/**
 * Diagnosis Assembler - Convierte entre entidades de dominio y recursos de API
 */
export class DiagnosisAssembler implements BaseAssembler<Diagnosis, DiagnosisResource, BaseResponse> {
  /**
   * Convierte un recurso de API a entidad de dominio
   */
  toEntityFromResource(resource: DiagnosisResource): Diagnosis {
    return {
      id: resource.id,
      patientId: resource.patientId,
      doctorId: resource.doctorId,
      icd10Code: resource.icd10Code,
      diagnosisName: resource.diagnosisName,
      status: resource.status as DiagnosisStatus,
      severity: resource.severity as DiagnosisSeverity,
      diagnosedDate: resource.diagnosedDate,
      resolvedDate: resource.resolvedDate,
      notes: resource.notes,
      treatment: resource.treatment,
      followUpRequired: resource.followUpRequired,
      lastReviewDate: resource.lastReviewDate,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt
    };
  }

  /**
   * Convierte una entidad de dominio a recurso de API
   */
  toResourceFromEntity(entity: Diagnosis): DiagnosisResource {
    return {
      id: entity.id,
      patientId: entity.patientId,
      doctorId: entity.doctorId,
      icd10Code: entity.icd10Code,
      diagnosisName: entity.diagnosisName,
      status: entity.status,
      severity: entity.severity,
      diagnosedDate: entity.diagnosedDate,
      resolvedDate: entity.resolvedDate,
      notes: entity.notes,
      treatment: entity.treatment,
      followUpRequired: entity.followUpRequired,
      lastReviewDate: entity.lastReviewDate,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Convierte una respuesta de API a array de entidades
   */
  toEntitiesFromResponse(response: BaseResponse): Diagnosis[] {
    return (response as unknown as DiagnosisResource[]).map(resource => this.toEntityFromResource(resource));
  }
}
