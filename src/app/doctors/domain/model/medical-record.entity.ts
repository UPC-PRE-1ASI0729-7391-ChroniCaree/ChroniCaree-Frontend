/**
 * Medical Record Entity
 * Doctors Bounded Context - Domain Layer
 * 
 * Entidad que representa un registro médico (historial)
 */

export enum RecordType {
  VITAL_SIGNS = 'vital_signs',
  SYMPTOMS = 'symptoms',
  CONSULTATION = 'consultation'
}

export enum ReviewStatus {
  PENDING_REVIEW = 'pending_review',  // ⭐ Pendiente de revisión médica
  REVIEWED = 'reviewed',              // ⭐ Revisado por el doctor
  ARCHIVED = 'archived'               // ⭐ Archivado
}

export interface MedicalRecord {
  id: number;
  patientId: number;
  doctorId: number;
  type: RecordType;
  date: string;
  // Vital Signs
  glucose?: number;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  // Symptoms
  fatigue?: number;
  pain?: number;
  dizziness?: number;
  // Consultation
  diagnosis?: string;
  treatment?: string;
  // General
  notes?: string;
  // Enriched data
  patientName?: string;
  // ⭐ Review Status
  reviewStatus?: ReviewStatus;
  reviewedAt?: string;  // Fecha de revisión
  reviewedBy?: number;  // ID del doctor que revisó
}
