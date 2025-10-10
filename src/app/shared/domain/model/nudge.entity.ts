import { BaseEntity } from '../../infrastructure/base-entity';

/**
 * Nudge Entity - Mensaje motivacional para el paciente
 */
export interface Nudge extends BaseEntity {
  id: number;
  patientId: number;
  type: NudgeType;
  priority: NudgePriority;
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  icon: string;
  isDismissed: boolean;
  isSnoozed: boolean;
  snoozeUntil?: string; // ISO 8601
  createdAt: string;
  dismissedAt?: string;
}

/**
 * Tipos de nudges
 */
export enum NudgeType {
  MEDICATION_REMINDER = 'medication_reminder',
  SYMPTOM_LOG = 'symptom_log',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  EXERCISE = 'exercise',
  HYDRATION = 'hydration',
  SLEEP = 'sleep',
  CHECKUP = 'checkup',
  MOTIVATION = 'motivation'
}

/**
 * Niveles de prioridad
 */
export enum NudgePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

/**
 * DTO para crear un nuevo nudge
 */
export interface CreateNudgeRequest {
  patientId: number;
  type: NudgeType;
  priority: NudgePriority;
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  icon: string;
}
