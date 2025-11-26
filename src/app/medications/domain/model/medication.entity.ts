/**
 * Medication Domain Model
 * Represents a medication entry in the patient's record
 */

export enum MedicationType {
  PILL = 'pill',
  CAPSULE = 'capsule',
  LIQUID = 'liquid',
  INJECTION = 'injection',
  INHALER = 'inhaler',
  CREAM = 'cream',
  DROPS = 'drops',
  PATCH = 'patch'
}

export enum MedicationFrequency {
  ONCE_DAILY = 'once_daily',
  TWICE_DAILY = 'twice_daily',
  THREE_TIMES_DAILY = 'three_times_daily',
  FOUR_TIMES_DAILY = 'four_times_daily',
  EVERY_4_HOURS = 'every_4_hours',
  EVERY_6_HOURS = 'every_6_hours',
  EVERY_8_HOURS = 'every_8_hours',
  EVERY_12_HOURS = 'every_12_hours',
  WEEKLY = 'weekly',
  AS_NEEDED = 'as_needed'
}

export enum MedicationStatus {
  ACTIVE = 'active',
  TAKEN = 'taken',
  MISSED = 'missed',
  SCHEDULED = 'scheduled',
  DISCONTINUED = 'discontinued'
}

export interface MedicationSchedule {
  frequency: MedicationFrequency;
  times: string[]; // Array of times in format "HH:mm"
  startDate: Date;
  endDate?: Date;
}

export interface MedicationLog {
  id: string;
  medicationId: number;
  scheduledTime: Date;
  actualTime?: Date;
  status: MedicationStatus;
  notes?: string;
  sideEffects?: string;
  skippedReason?: string;
  createdAt: Date;
}

export class Medication {
  id: number;
  patientId: number;
  name: string;
  type: MedicationType;
  dosage: string; // e.g., "500mg", "2 pills", "5ml"
  schedule: MedicationSchedule;
  prescribedBy: string;
  prescribedDate: Date;
  status: MedicationStatus;
  instructions?: string;
  sideEffects?: string[];
  contraindications?: string[];
  purpose?: string;
  refillDate?: Date;
  logs: MedicationLog[];
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Medication> = {}) {
    this.id = data.id || 0;
    this.patientId = data.patientId || 0;
    this.name = data.name || '';
    this.type = data.type || MedicationType.PILL;
    this.dosage = data.dosage || '';
    this.schedule = data.schedule || {
      frequency: MedicationFrequency.ONCE_DAILY,
      times: ['09:00'],
      startDate: new Date()
    };
    this.prescribedBy = data.prescribedBy || '';
    this.prescribedDate = data.prescribedDate || new Date();
    this.status = data.status || MedicationStatus.ACTIVE;
    this.instructions = data.instructions;
    this.sideEffects = data.sideEffects || [];
    this.contraindications = data.contraindications || [];
    this.purpose = data.purpose;
    this.refillDate = data.refillDate;
    this.logs = data.logs || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Helper methods
  get isActive(): boolean {
    return this.status === MedicationStatus.ACTIVE;
  }

  get needsRefill(): boolean {
    if (!this.refillDate) return false;
    const daysUntilRefill = Math.ceil(
      (this.refillDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilRefill <= 7;
  }

  get todaySchedule(): string[] {
    return this.schedule.times;
  }

  get adherenceRate(): number {
    const recentLogs = this.logs.slice(-30); // Last 30 logs
    if (recentLogs.length === 0) return 100;
    const taken = recentLogs.filter(log => log.status === MedicationStatus.TAKEN).length;
    return Math.round((taken / recentLogs.length) * 100);
  }

  get lastTaken(): Date | null {
    const takenLogs = this.logs
      .filter(log => log.status === MedicationStatus.TAKEN)
      .sort((a, b) => b.actualTime!.getTime() - a.actualTime!.getTime());
    return takenLogs.length > 0 ? takenLogs[0].actualTime! : null;
  }

  markAsTaken(scheduledTime: Date, notes?: string): MedicationLog {
    const log: MedicationLog = {
      id: `log_${Date.now()}`,
      medicationId: this.id,
      scheduledTime,
      actualTime: new Date(),
      status: MedicationStatus.TAKEN,
      notes,
      createdAt: new Date()
    };
    this.logs.push(log);
    this.updatedAt = new Date();
    return log;
  }

  markAsMissed(scheduledTime: Date, reason?: string): MedicationLog {
    const log: MedicationLog = {
      id: `log_${Date.now()}`,
      medicationId: this.id,
      scheduledTime,
      status: MedicationStatus.MISSED,
      skippedReason: reason,
      createdAt: new Date()
    };
    this.logs.push(log);
    this.updatedAt = new Date();
    return log;
  }
}
