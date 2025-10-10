import { BaseResource } from '../../shared/infrastructure/base-response';

/**
 * Nudge Resource - Representa el formato de datos de la API REST
 * Communication Bounded Context
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
