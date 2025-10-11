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
  medicationId: string;
  scheduledTime: string;
  actualTime?: string;
  status: MedicationStatus;
  notes?: string;
  sideEffects?: string;
  skippedReason?: string;
  createdAt: string;
}

export interface MedicationResource {
  id: string;
  patientId: string;
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
