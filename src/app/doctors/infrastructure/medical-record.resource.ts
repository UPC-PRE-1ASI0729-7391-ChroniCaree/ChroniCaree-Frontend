/**
 * Medical Record Resource
 * Doctors Bounded Context - Infrastructure Layer
 */

export interface MedicalRecordResource {
  id: number;
  patientId: number;
  doctorId: number;
  type: string;
  date: string;
  glucose?: number;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  fatigue?: number;
  pain?: number;
  dizziness?: number;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
}
