export interface GlucometerReading {
  id: string;
  deviceId: string;
  patientId: string;
  glucoseLevel: number; // mg/dL
  unit: 'mg/dL' | 'mmol/L';
  timestamp: Date;
  mealContext?: 'fasting' | 'before-meal' | 'after-meal' | 'random';
  notes?: string;
}

export interface Glucometer {
  id: string;
  patientId: string;
  deviceName: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  connectionStatus: 'connected' | 'disconnected' | 'syncing';
  batteryLevel: number; // 0-100
  lastSync: Date;
  readings: GlucometerReading[];
}

export class GlucometerEntity implements Glucometer {
  constructor(
    public id: string,
    public patientId: string,
    public deviceName: string,
    public manufacturer: string,
    public model: string,
    public serialNumber: string,
    public connectionStatus: 'connected' | 'disconnected' | 'syncing',
    public batteryLevel: number,
    public lastSync: Date,
    public readings: GlucometerReading[]
  ) {}

  get latestReading(): GlucometerReading | null {
    return this.readings.length > 0 
      ? this.readings[this.readings.length - 1] 
      : null;
  }

  get averageGlucose(): number {
    if (this.readings.length === 0) return 0;
    const sum = this.readings.reduce((acc, r) => acc + r.glucoseLevel, 0);
    return Math.round(sum / this.readings.length);
  }

  isGlucoseInRange(reading: GlucometerReading): 'low' | 'normal' | 'high' {
    const level = reading.glucoseLevel;
    if (level < 70) return 'low';
    if (level > 140) return 'high';
    return 'normal';
  }
}
