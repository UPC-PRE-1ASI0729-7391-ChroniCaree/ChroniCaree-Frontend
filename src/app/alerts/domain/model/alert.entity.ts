// Enumeraciones
export enum AlertType {
  VITAL_SIGN_HIGH = 'vital_sign_high',
  VITAL_SIGN_LOW = 'vital_sign_low',
  MEDICATION_OVERDUE = 'medication_overdue',
  SYMPTOM_SEVERE = 'symptom_severe',
  APPOINTMENT_REMINDER = 'appointment_reminder',
  ABNORMAL_PATTERN = 'abnormal_pattern'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed'
}

// Interfaces
export interface VitalSignRange {
  vitalSign: string;
  minValue: number;
  maxValue: number;
  unit: string;
}

export interface AlertAction {
  label: string;
  action: string;
  icon?: string;
}

export interface AlertMetadata {
  vitalSign?: string;
  value?: number;
  unit?: string;
  threshold?: number;
  measurement?: string;
  medicationId?: string;
  symptomId?: string;
  appointmentId?: string;
  [key: string]: any;
}

// Entidad principal
export class Alert {
  constructor(
    public id: string,
    public patientId: string,
    public type: AlertType,
    public severity: AlertSeverity,
    public title: string,
    public message: string,
    public status: AlertStatus,
    public metadata: AlertMetadata,
    public createdAt: string,
    public acknowledgedAt?: string,
    public resolvedAt?: string,
    public dismissedAt?: string,
    public acknowledgedBy?: string,
    public notes?: string
  ) {}

  // Computed properties
  get isActive(): boolean {
    return this.status === AlertStatus.ACTIVE;
  }

  get isAcknowledged(): boolean {
    return this.status === AlertStatus.ACKNOWLEDGED;
  }

  get isResolved(): boolean {
    return this.status === AlertStatus.RESOLVED;
  }

  get isDismissed(): boolean {
    return this.status === AlertStatus.DISMISSED;
  }

  get severityColor(): string {
    const colors: Record<AlertSeverity, string> = {
      [AlertSeverity.LOW]: 'info',
      [AlertSeverity.MEDIUM]: 'accent',
      [AlertSeverity.HIGH]: 'warn',
      [AlertSeverity.CRITICAL]: 'error'
    };
    return colors[this.severity];
  }

  get severityIcon(): string {
    const icons: Record<AlertSeverity, string> = {
      [AlertSeverity.LOW]: 'info',
      [AlertSeverity.MEDIUM]: 'warning',
      [AlertSeverity.HIGH]: 'error',
      [AlertSeverity.CRITICAL]: 'emergency'
    };
    return icons[this.severity];
  }

  get typeIcon(): string {
    const icons: Record<AlertType, string> = {
      [AlertType.VITAL_SIGN_HIGH]: 'trending_up',
      [AlertType.VITAL_SIGN_LOW]: 'trending_down',
      [AlertType.MEDICATION_OVERDUE]: 'medication',
      [AlertType.SYMPTOM_SEVERE]: 'sick',
      [AlertType.APPOINTMENT_REMINDER]: 'event',
      [AlertType.ABNORMAL_PATTERN]: 'insights'
    };
    return icons[this.type];
  }

  get timeSinceCreated(): string {
    const now = new Date();
    const created = new Date(this.createdAt);
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Ahora mismo';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  }

  // Métodos de acción
  acknowledge(userId: string, notes?: string): Alert {
    return new Alert(
      this.id,
      this.patientId,
      this.type,
      this.severity,
      this.title,
      this.message,
      AlertStatus.ACKNOWLEDGED,
      this.metadata,
      this.createdAt,
      new Date().toISOString(),
      this.resolvedAt,
      this.dismissedAt,
      userId,
      notes || this.notes
    );
  }

  resolve(notes?: string): Alert {
    return new Alert(
      this.id,
      this.patientId,
      this.type,
      this.severity,
      this.title,
      this.message,
      AlertStatus.RESOLVED,
      this.metadata,
      this.createdAt,
      this.acknowledgedAt,
      new Date().toISOString(),
      this.dismissedAt,
      this.acknowledgedBy,
      notes || this.notes
    );
  }

  dismiss(notes?: string): Alert {
    return new Alert(
      this.id,
      this.patientId,
      this.type,
      this.severity,
      this.title,
      this.message,
      AlertStatus.DISMISSED,
      this.metadata,
      this.createdAt,
      this.acknowledgedAt,
      this.resolvedAt,
      new Date().toISOString(),
      this.acknowledgedBy,
      notes || this.notes
    );
  }
}

// Rangos normales de signos vitales (valores de referencia)
export const VITAL_SIGN_RANGES: Record<string, VitalSignRange> = {
  'Presión Arterial Sistólica': {
    vitalSign: 'Presión Arterial Sistólica',
    minValue: 90,
    maxValue: 120,
    unit: 'mmHg'
  },
  'Presión Arterial Diastólica': {
    vitalSign: 'Presión Arterial Diastólica',
    minValue: 60,
    maxValue: 80,
    unit: 'mmHg'
  },
  'Frecuencia Cardíaca': {
    vitalSign: 'Frecuencia Cardíaca',
    minValue: 60,
    maxValue: 100,
    unit: 'bpm'
  },
  'Glucosa': {
    vitalSign: 'Glucosa',
    minValue: 70,
    maxValue: 100,
    unit: 'mg/dL'
  },
  'Temperatura': {
    vitalSign: 'Temperatura',
    minValue: 36.1,
    maxValue: 37.2,
    unit: '°C'
  },
  'Saturación de Oxígeno': {
    vitalSign: 'Saturación de Oxígeno',
    minValue: 95,
    maxValue: 100,
    unit: '%'
  },
  'Peso': {
    vitalSign: 'Peso',
    minValue: 40,
    maxValue: 200,
    unit: 'kg'
  }
};
