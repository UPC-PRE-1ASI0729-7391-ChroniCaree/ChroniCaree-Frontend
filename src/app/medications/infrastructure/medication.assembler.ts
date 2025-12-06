/**
 * Medication Assembler
 * Converts between Medication entities and API resources
 */

import { Medication, MedicationLog } from '../domain/model/medication.entity';
import { MedicationResource, MedicationLogResource, CreateMedicationResource } from './medication.resource';

export class MedicationAssembler {
  /**
   * Convert API resource to domain entity
   */
  static toDomain(resource: MedicationResource): Medication {
    // Validar que resource.schedule existe antes de acceder a sus propiedades
    if (!resource.schedule) {
      console.error('❌ Backend returned MedicationResource WITHOUT schedule object:', resource);
      throw new Error('Backend response is missing required "schedule" object. Check backend MedicationResource structure.');
    }

    return new Medication({
      id: resource.id,
      patientId: resource.patientId,
      name: resource.name,
      type: resource.type,
      dosage: resource.dosage,
      schedule: {
        frequency: resource.schedule.frequency,
        times: resource.schedule.times,
        startDate: new Date(resource.schedule.startDate),
        endDate: resource.schedule.endDate ? new Date(resource.schedule.endDate) : undefined
      },
      prescribedBy: resource.prescribedBy,
      prescribedDate: new Date(resource.prescribedDate),
      status: resource.status,
      instructions: resource.instructions,
      sideEffects: resource.sideEffects ?? [],
      contraindications: resource.contraindications ?? [],
      purpose: resource.purpose,
      refillDate: resource.refillDate ? new Date(resource.refillDate) : undefined,
      logs: (resource.logs ?? []).map(log => this.logToDomain(log)),
      createdAt: new Date(resource.createdAt),
      updatedAt: new Date(resource.updatedAt)
    });
  }

  /**
   * Convert domain entity to CREATE resource (para POST al backend)
   * Estructura plana con frequency + timeOfDay en lugar de schedule object
   */
  static toCreateResource(medication: Medication): CreateMedicationResource {
    // Convertir array de times ["09:00", "21:00"] a string separado por comas
    const timeOfDay = medication.schedule.times.join(',');
    
    // Convertir enums a MAYÚSCULAS como espera el backend
    const type = medication.type.toUpperCase();
    const frequency = medication.schedule.frequency.toUpperCase();
    const status = medication.status.toUpperCase();
    
    // Formatear fechas a YYYY-MM-DD
    const prescribedDate = medication.prescribedDate.toISOString().split('T')[0];
    const refillDate = medication.refillDate?.toISOString().split('T')[0];
    
    return {
      patientId: medication.patientId.toString(), // Backend espera string
      name: medication.name,
      type: type,
      dosage: medication.dosage,
      frequency: frequency,
      timeOfDay: timeOfDay,
      prescribedBy: medication.prescribedBy,
      prescribedDate: prescribedDate,
      status: status,
      instructions: medication.instructions,
      sideEffects: medication.sideEffects ?? [],
      contraindications: medication.contraindications ?? [],
      purpose: medication.purpose,
      refillDate: refillDate
    };
  }

  /**
   * Convert domain entity to API resource (para respuestas del backend)
   * DEPRECATED: Usar toCreateResource para POST requests
   */
  static toResource(medication: Medication): MedicationResource {
    return {
      id: medication.id,
      patientId: medication.patientId,
      name: medication.name,
      type: medication.type,
      dosage: medication.dosage,
      schedule: {
        frequency: medication.schedule.frequency,
        times: medication.schedule.times,
        startDate: medication.schedule.startDate.toISOString(),
        endDate: medication.schedule.endDate?.toISOString()
      },
      prescribedBy: medication.prescribedBy,
      prescribedDate: medication.prescribedDate.toISOString(),
      status: medication.status,
      instructions: medication.instructions,
      sideEffects: medication.sideEffects ?? [],
      contraindications: medication.contraindications ?? [],
      purpose: medication.purpose,
      refillDate: medication.refillDate?.toISOString(),
      logs: (medication.logs ?? []).map(log => this.logToResource(log)),
      createdAt: medication.createdAt.toISOString(),
      updatedAt: medication.updatedAt.toISOString()
    };
  }

  /**
   * Convert array of resources to domain entities
   */
  static toDomainList(resources: MedicationResource[]): Medication[] {
    return resources.map(resource => this.toDomain(resource));
  }

  /**
   * Convert log resource to domain
   */
  private static logToDomain(resource: MedicationLogResource): MedicationLog {
    return {
      id: resource.id,
      medicationId: resource.medicationId,
      scheduledTime: new Date(resource.scheduledTime),
      actualTime: resource.actualTime ? new Date(resource.actualTime) : undefined,
      status: resource.status,
      notes: resource.notes,
      sideEffects: resource.sideEffects,
      skippedReason: resource.skippedReason,
      createdAt: new Date(resource.createdAt)
    };
  }

  /**
   * Convert log domain to resource
   */
  private static logToResource(log: MedicationLog): MedicationLogResource {
    return {
      id: log.id,
      medicationId: log.medicationId,
      scheduledTime: log.scheduledTime.toISOString(),
      actualTime: log.actualTime?.toISOString(),
      status: log.status,
      notes: log.notes,
      sideEffects: log.sideEffects,
      skippedReason: log.skippedReason,
      createdAt: log.createdAt.toISOString()
    };
  }
}
