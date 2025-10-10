import { BaseResource } from '../../shared/infrastructure/base-response';

/**
 * Diagnosis Resource - Representa el formato de datos de la API REST
 */
export interface DiagnosisResource extends BaseResource {
  id: number;
  patientId: number;
  doctorId: number;
  icd10Code: string;
  diagnosisName: string;
  status: string;
  severity: string;
  diagnosedDate: string;
  resolvedDate?: string;
  notes?: string;
  treatment?: string;
  followUpRequired: boolean;
  lastReviewDate?: string;
  createdAt: string;
  updatedAt?: string;
}
