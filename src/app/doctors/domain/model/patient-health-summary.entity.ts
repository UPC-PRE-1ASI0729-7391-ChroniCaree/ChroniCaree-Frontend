/**
 * Patient Health Summary Entity
 * Doctors Bounded Context - Domain Layer
 * 
 * Vista enriquecida del paciente con métricas de salud para el doctor
 * Combina datos del paciente + alertas + medicamentos + diagnósticos
 */

/**
 * Estado general de salud del paciente desde la perspectiva del doctor
 */
export enum PatientHealthStatus {
  STABLE = 'stable',           // 🟢 Verde - Todo bien, sin alertas críticas
  CONTROLLED = 'controlled',   // 🔵 Azul - Condición crónica controlada
  AT_RISK = 'at_risk',        // 🟡 Amarillo - Requiere atención, tiene alertas
  CRITICAL = 'critical'        // 🔴 Rojo - Urgente, alertas críticas activas
}

/**
 * Entidad: Resumen de salud del paciente para el doctor
 */
export interface PatientHealthSummary {
  // Datos básicos del paciente
  id: number;
  userId: number;
  assignedDoctorId: number;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  
  // Métricas de salud (calculadas)
  healthStatus: PatientHealthStatus;
  criticalAlertsCount: number;
  activeAlertsCount: number;
  activeMedicationsCount: number;
  activeDiagnosesCount: number;
  
  // Datos clínicos recientes
  lastVitalSigns?: {
    glucose?: number;
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    recordedAt: string;
  };
  
  // Información de seguimiento
  lastVisit?: string;
  nextAppointment?: string;
  assignedSince: string;
  
  // Hospital (si aplica)
  tenantId?: number | null;
  hospitalName?: string;
}
