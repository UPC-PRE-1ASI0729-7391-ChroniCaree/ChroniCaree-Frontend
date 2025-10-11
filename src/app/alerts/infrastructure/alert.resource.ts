import { AlertType, AlertSeverity, AlertStatus, AlertMetadata } from '../domain/model/alert.entity';

export interface AlertResource {
  id: string;
  patientId: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  metadata: AlertMetadata;
  createdAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  dismissedAt?: string;
  acknowledgedBy?: string;
  notes?: string;
}
