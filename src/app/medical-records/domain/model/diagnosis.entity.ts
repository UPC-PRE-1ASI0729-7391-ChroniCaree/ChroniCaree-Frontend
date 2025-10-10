import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Diagnosis Entity - Diagnóstico médico con código ICD-10
 * Representa un diagnóstico médico del paciente
 */
export interface Diagnosis extends BaseEntity {
  id: number;
  patientId: number;
  doctorId: number;
  icd10Code: string; // Código ICD-10 (ej: E11.9 - Diabetes tipo 2)
  diagnosisName: string; // Nombre del diagnóstico
  status: DiagnosisStatus; // Estado actual
  severity: DiagnosisSeverity; // Gravedad
  diagnosedDate: string; // Fecha de diagnóstico (ISO 8601)
  resolvedDate?: string; // Fecha de resolución (si aplica)
  notes?: string; // Notas adicionales
  treatment?: string; // Tratamiento prescrito
  followUpRequired: boolean; // Requiere seguimiento
  lastReviewDate?: string; // Última revisión
  createdAt: string;
  updatedAt?: string;
}

/**
 * Estados posibles de un diagnóstico
 */
export enum DiagnosisStatus {
  ACTIVE = 'active',         // Activo - requiere tratamiento
  CONTROLLED = 'controlled', // Controlado - bajo tratamiento efectivo
  RESOLVED = 'resolved',     // Resuelto - ya no requiere tratamiento
  MONITORING = 'monitoring'  // En monitoreo - observación
}

/**
 * Niveles de gravedad del diagnóstico
 */
export enum DiagnosisSeverity {
  LOW = 'low',       // Leve
  MODERATE = 'moderate', // Moderado
  HIGH = 'high',     // Alto
  CRITICAL = 'critical' // Crítico
}

/**
 * DTO para crear un nuevo diagnóstico
 */
export interface CreateDiagnosisRequest {
  patientId: number;
  doctorId: number;
  icd10Code: string;
  diagnosisName: string;
  status: DiagnosisStatus;
  severity: DiagnosisSeverity;
  diagnosedDate: string;
  notes?: string;
  treatment?: string;
  followUpRequired: boolean;
}

/**
 * DTO para actualizar un diagnóstico existente
 */
export interface UpdateDiagnosisRequest extends Partial<CreateDiagnosisRequest> {
  id: number;
  resolvedDate?: string;
  lastReviewDate?: string;
}

/**
 * Códigos ICD-10 comunes para enfermedades crónicas
 */
export const COMMON_ICD10_CODES = [
  { code: 'E11.9', name: 'Diabetes mellitus tipo 2 sin complicaciones' },
  { code: 'E11.65', name: 'Diabetes tipo 2 con hiperglucemia' },
  { code: 'I10', name: 'Hipertensión arterial esencial (primaria)' },
  { code: 'I25.10', name: 'Enfermedad isquémica aterosclerótica del corazón' },
  { code: 'E78.5', name: 'Hiperlipidemia no especificada' },
  { code: 'E66.9', name: 'Obesidad no especificada' },
  { code: 'J45.909', name: 'Asma no especificada, no complicada' },
  { code: 'E03.9', name: 'Hipotiroidismo no especificado' },
  { code: 'M81.0', name: 'Osteoporosis posmenopáusica' },
  { code: 'F41.9', name: 'Trastorno de ansiedad no especificado' }
];
