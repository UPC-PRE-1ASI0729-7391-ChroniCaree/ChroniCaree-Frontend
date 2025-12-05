/**
 * Diagnosis Entity
 * Representa un diagnóstico médico de un paciente
 * 
 * Backend valid values:
 * - status: ACTIVE, CONTROLLED, RESOLVED, MONITORING
 * - severity: LOW, MODERATE, HIGH, CRITICAL
 * - source: NOT SUPPORTED BY BACKEND (removed)
 */

export type DiagnosisStatus = 'ACTIVE' | 'CONTROLLED' | 'RESOLVED' | 'MONITORING';
export type DiagnosisSeverity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

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
  doctorId: number;  // REQUIRED by backend
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
  // source field removed - NOT SUPPORTED BY BACKEND
}

export class DiagnosisEntity implements Diagnosis {
  constructor(
    public id: number,
    public patientId: number,
    public doctorId: number,  // REQUIRED by backend
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
    public updatedAt: string
    // source field removed - NOT SUPPORTED BY BACKEND
  ) {}

  /**
   * Verifica si el diagnóstico necesita revisión (MONITORING status)
   * Note: PENDING_CONFIRMATION no existe en el backend
   */
  get needsReview(): boolean {
    return this.status === 'MONITORING';
  }

  /**
   * Verifica si el diagnóstico está activo
   */
  get isActive(): boolean {
    return this.status === 'ACTIVE' || this.status === 'CONTROLLED';
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
    if (!this.doctorId) errors.push('Doctor ID is required');  // REQUIRED by backend
    if (!this.diagnosisName) errors.push('Diagnosis name is required');
    if (!this.icd10Code) errors.push('ICD-10 code is required');

    return errors;
  }
}
