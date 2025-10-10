/**
 * Appointment Resource
 * Doctors Bounded Context - Infrastructure Layer
 */

export interface AppointmentResource {
  id: number;
  patientId: number;
  doctorId: number;
  date: string;
  time: string;
  type: string;
  status: string;
  notes?: string;
}
