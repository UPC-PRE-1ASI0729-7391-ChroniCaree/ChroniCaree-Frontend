/**
 * Medication Resource
 * API format for medication data
 */

import { MedicationType, MedicationFrequency, MedicationStatus } from '../domain/model/medication.entity';

export interface MedicationScheduleResource {
  frequency: MedicationFrequency;
  times: string[];
  startDate: string;
  endDate?: string;
}

export interface MedicationLogResource {
  id: string;
  medicationId: number;
  scheduledTime: string;
  actualTime?: string;
  status: MedicationStatus;
  notes?: string;
  sideEffects?: string;
  skippedReason?: string;
  createdAt: string;
}

/**
 * Recurso para crear medicación (coincide con CreateMedicationResource del backend)
 */
export interface CreateMedicationResource {
  patientId: string;              // Backend espera string
  name: string;
  type: string;                   // ENUM en MAYÚSCULAS: PILL, CAPSULE, etc.
  dosage: string;
  frequency: string;              // ENUM en MAYÚSCULAS: ONCE_DAILY, TWICE_DAILY, etc.
  timeOfDay: string;              // Separado por comas: "09:00,21:00"
  prescribedBy?: string;
  prescribedDate?: string;        // YYYY-MM-DD
  status: string;                 // ENUM en MAYÚSCULAS: ACTIVE, TAKEN, etc.
  instructions?: string;
  sideEffects?: string[];
  contraindications?: string[];
  purpose?: string;
  refillDate?: string;            // YYYY-MM-DD
}

/**
 * Recurso completo de medicación (respuesta del backend)
 */
export interface MedicationResource {
  id: number;
  patientId: number;
  name: string;
  type: MedicationType;
  dosage: string;
  schedule: MedicationScheduleResource;
  prescribedBy: string;
  prescribedDate: string;
  status: MedicationStatus;
  instructions?: string;
  sideEffects?: string[];
  contraindications?: string[];
  purpose?: string;
  refillDate?: string;
  logs: MedicationLogResource[];
  createdAt: string;
  updatedAt: string;
}
