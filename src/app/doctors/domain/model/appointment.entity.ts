/**
 * Appointment Entity
 * Doctors Bounded Context - Domain Layer
 * 
 * Entidad que representa una cita médica
 */

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum AppointmentType {
  CONSULTATION = 'Consulta de control',
  FOLLOW_UP = 'Seguimiento',
  EMERGENCY = 'Emergencia',
  ROUTINE_CHECK = 'Chequeo de rutina',
  LAB_RESULTS = 'Resultados de laboratorio'
}

export interface Appointment {
  id: number;
  patientId: number;
  doctorId: number;
  date: string;
  time: string;
  type: string;
  status: AppointmentStatus;
  notes?: string;
  // Datos enriquecidos
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  duration?: number; // minutos
}
