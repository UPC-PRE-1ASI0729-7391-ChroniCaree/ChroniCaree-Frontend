/**
 * Medical Record Assembler
 * Doctors Bounded Context - Infrastructure Layer
 */
import { MedicalRecord, RecordType } from '../domain/model/medical-record.entity';
import { MedicalRecordResource } from './medical-record.resource';

export class MedicalRecordAssembler {
  static toDomain(resource: MedicalRecordResource): MedicalRecord {
    return {
      id: resource.id,
      patientId: resource.patientId,
      doctorId: resource.doctorId,
      type: resource.type as RecordType,
      date: resource.date,
      glucose: resource.glucose,
      bloodPressure: resource.bloodPressure,
      heartRate: resource.heartRate,
      temperature: resource.temperature,
      weight: resource.weight,
      fatigue: resource.fatigue,
      pain: resource.pain,
      dizziness: resource.dizziness,
      diagnosis: resource.diagnosis,
      treatment: resource.treatment,
      notes: resource.notes
    };
  }

  static toResource(entity: MedicalRecord): MedicalRecordResource {
    return {
      id: entity.id,
      patientId: entity.patientId,
      doctorId: entity.doctorId,
      type: entity.type,
      date: entity.date,
      glucose: entity.glucose,
      bloodPressure: entity.bloodPressure,
      heartRate: entity.heartRate,
      temperature: entity.temperature,
      weight: entity.weight,
      fatigue: entity.fatigue,
      pain: entity.pain,
      dizziness: entity.dizziness,
      diagnosis: entity.diagnosis,
      treatment: entity.treatment,
      notes: entity.notes
    };
  }
}
