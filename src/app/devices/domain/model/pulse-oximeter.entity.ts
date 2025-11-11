export interface PulseOximeterReading {
  id: string;
  deviceId: string;
  patientId: string;
  oxygenSaturation: number; // SpO2 percentage (0-100)
  heartRate: number; // bpm
  perfusionIndex?: number; // PI percentage
  timestamp: Date;
  activity?: 'resting' | 'active' | 'sleeping';
  notes?: string;
}

export interface PulseOximeter {
  id: string;
  patientId: string;
  deviceName: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  connectionStatus: 'connected' | 'disconnected' | 'syncing';
  batteryLevel: number; // 0-100
  lastSync: Date;
  readings: PulseOximeterReading[];
}

export class PulseOximeterEntity implements PulseOximeter {
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
    public readings: PulseOximeterReading[]
  ) {}

  get latestReading(): PulseOximeterReading | null {
    return this.readings.length > 0 
      ? this.readings[this.readings.length - 1] 
      : null;
  }

  get averageSpO2(): number {
    if (this.readings.length === 0) return 0;
    const sum = this.readings.reduce((acc, r) => acc + r.oxygenSaturation, 0);
    return Math.round(sum / this.readings.length);
  }

  get averageHeartRate(): number {
    if (this.readings.length === 0) return 0;
    const sum = this.readings.reduce((acc, r) => acc + r.heartRate, 0);
    return Math.round(sum / this.readings.length);
  }

  getSpO2Status(reading: PulseOximeterReading): 'critical' | 'low' | 'normal' {
    const spo2 = reading.oxygenSaturation;
    if (spo2 < 90) return 'critical';
    if (spo2 < 95) return 'low';
    return 'normal';
  }
}
