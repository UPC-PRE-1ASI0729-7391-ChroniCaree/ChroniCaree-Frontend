import { BaseResource } from './base-response';

/**
 * Nudge Resource - Representa el formato de datos de la API REST
 */
export interface NudgeResource extends BaseResource {
  id: number;
  patientId: number;
  type: string;
  priority: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionRoute?: string;
  icon: string;
  isDismissed: boolean;
  isSnoozed: boolean;
  snoozeUntil?: string;
  createdAt: string;
  dismissedAt?: string;
}
