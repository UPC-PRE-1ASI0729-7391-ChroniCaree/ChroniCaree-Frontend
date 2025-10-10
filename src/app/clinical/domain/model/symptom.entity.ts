import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Symptom Entity - Registro de síntomas diarios
 * Representa un registro de síntomas del paciente
 */
export interface Symptom extends BaseEntity {
  id: number;
  patientId: number;
  glucose?: number; // mg/dL
  bloodPressure?: string; // Formato: "120/80"
  heartRate?: number; // bpm
  temperature?: number; // °C
  oxygenSaturation?: number; // %
  fatigue?: number; // Escala 1-10
  pain?: number; // Escala 1-10
  dizziness?: number; // Escala 1-10
  notes?: string;
  timestamp: string; // ISO 8601 format
  isEdited?: boolean;
  editedAt?: string;
}

/**
 * DTO para crear un nuevo síntoma
 */
export interface CreateSymptomRequest {
  patientId: number;
  glucose?: number;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  fatigue?: number;
  pain?: number;
  dizziness?: number;
  notes?: string;
}

/**
 * DTO para actualizar un síntoma existente
 */
export interface UpdateSymptomRequest extends Partial<CreateSymptomRequest> {
  id: number;
}
