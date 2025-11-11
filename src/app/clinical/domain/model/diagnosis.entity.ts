/**
 * Diagnosis Entity
 * Representa un diagnóstico médico de un paciente
 */

export type DiagnosisStatus = 'active' | 'controlled' | 'resolved' | 'pending_confirmation';
export type DiagnosisSeverity = 'low' | 'moderate' | 'high' | 'critical';
export type DiagnosisSource = 'patient_reported' | 'doctor_confirmed';

// Enfermedades comunes predefinidas para auto-reporte
export const COMMON_CONDITIONS = {
  DIABETES_TYPE_2: 'diabetes_type_2',
  HYPERTENSION: 'hypertension',
  HYPERLIPIDEMIA: 'hyperlipidemia',
  ASTHMA: 'asthma',
  DEPRESSION_ANXIETY: 'depression_anxiety',
} as const;

export type CommonCondition = typeof COMMON_CONDITIONS[keyof typeof COMMON_CONDITIONS];

export interface Diagnosis {
  id: number;
  patientId: number;
  doctorId: number | null;
  icd10Code: string;
  diagnosisName: string;
  status: DiagnosisStatus;
  severity: DiagnosisSeverity;
  diagnosedDate: string;
  resolvedDate: string | null;
  notes: string;
  treatment: string;
  followUpRequired: boolean;
  lastReviewDate: string;
  createdAt: string;
  updatedAt: string;
  source: DiagnosisSource;
}

export class DiagnosisEntity implements Diagnosis {
  constructor(
    public id: number,
    public patientId: number,
    public doctorId: number | null,
    public icd10Code: string,
    public diagnosisName: string,
    public status: DiagnosisStatus,
    public severity: DiagnosisSeverity,
    public diagnosedDate: string,
    public resolvedDate: string | null,
    public notes: string,
    public treatment: string,
    public followUpRequired: boolean,
    public lastReviewDate: string,
    public createdAt: string,
    public updatedAt: string,
    public source: DiagnosisSource
  ) {}

  /**
   * Verifica si el diagnóstico está pendiente de confirmación
   */
  get isPendingConfirmation(): boolean {
    return this.status === 'pending_confirmation';
  }

  /**
   * Verifica si fue auto-reportado por el paciente
   */
  get isPatientReported(): boolean {
    return this.source === 'patient_reported';
  }

  /**
   * Verifica si está confirmado por un doctor
   */
  get isDoctorConfirmed(): boolean {
    return this.source === 'doctor_confirmed';
  }

  /**
   * Verifica si el diagnóstico está activo
   */
  get isActive(): boolean {
    return this.status === 'active' || this.status === 'controlled';
  }

  /**
   * Verifica si requiere seguimiento
   */
  get needsFollowUp(): boolean {
    return this.followUpRequired && this.isActive;
  }

  /**
   * Calcula días desde el último review
   */
  get daysSinceLastReview(): number {
    const lastReview = new Date(this.lastReviewDate);
    const now = new Date();
    const diff = now.getTime() - lastReview.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Valida la entidad
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.patientId) errors.push('Patient ID is required');
    if (!this.diagnosisName) errors.push('Diagnosis name is required');
    if (!this.icd10Code) errors.push('ICD-10 code is required');
    if (this.source === 'doctor_confirmed' && !this.doctorId) {
      errors.push('Doctor ID is required for doctor-confirmed diagnoses');
    }

    return errors;
  }
}
