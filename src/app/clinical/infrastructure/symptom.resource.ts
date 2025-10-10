import { BaseResource } from '../../shared/infrastructure/base-response';

/**
 * Symptom Resource - Representa el formato de datos de la API REST
 */
export interface SymptomResource extends BaseResource {
  id: number;
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
  timestamp: string;
  isEdited?: boolean;
  editedAt?: string;
}
