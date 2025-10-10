/**
 * Appointment Assembler
 * Doctors Bounded Context - Infrastructure Layer
 * 
 * Convierte entre Resource (API) y Entity (Domain)
 */
import { Appointment, AppointmentStatus } from '../domain/model/appointment.entity';
import { AppointmentResource } from './appointment.resource';

export class AppointmentAssembler {
  static toDomain(resource: AppointmentResource): Appointment {
    return {
      id: resource.id,
      patientId: resource.patientId,
      doctorId: resource.doctorId,
      date: resource.date,
      time: resource.time,
      type: resource.type,
      status: resource.status as AppointmentStatus,
      notes: resource.notes
    };
  }

  static toResource(entity: Appointment): AppointmentResource {
    return {
      id: entity.id,
      patientId: entity.patientId,
      doctorId: entity.doctorId,
      date: entity.date,
      time: entity.time,
      type: entity.type,
      status: entity.status,
      notes: entity.notes
    };
  }
}
