export interface BloodPressureReading {
  id: string;
  deviceId: string;
  patientId: string;
  systolic: number; // mmHg
  diastolic: number; // mmHg
  heartRate: number; // bpm
  timestamp: Date;
  position?: 'sitting' | 'standing' | 'lying';
  notes?: string;
}

export interface BloodPressureMonitor {
  id: string;
  patientId: string;
  deviceName: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  connectionStatus: 'connected' | 'disconnected' | 'syncing';
  batteryLevel: number; // 0-100
  lastSync: Date;
  readings: BloodPressureReading[];
}

export class BloodPressureMonitorEntity implements BloodPressureMonitor {
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
    public readings: BloodPressureReading[]
  ) {}

  get latestReading(): BloodPressureReading | null {
    return this.readings.length > 0 
      ? this.readings[this.readings.length - 1] 
      : null;
  }

  get averageSystolic(): number {
    if (this.readings.length === 0) return 0;
    const sum = this.readings.reduce((acc, r) => acc + r.systolic, 0);
    return Math.round(sum / this.readings.length);
  }

  get averageDiastolic(): number {
    if (this.readings.length === 0) return 0;
    const sum = this.readings.reduce((acc, r) => acc + r.diastolic, 0);
    return Math.round(sum / this.readings.length);
  }

  getBloodPressureCategory(reading: BloodPressureReading): 'low' | 'normal' | 'elevated' | 'high' | 'crisis' {
    const { systolic, diastolic } = reading;
    
    if (systolic < 90 || diastolic < 60) return 'low';
    if (systolic >= 180 || diastolic >= 120) return 'crisis';
    if (systolic >= 140 || diastolic >= 90) return 'high';
    if (systolic >= 120 && systolic < 130 && diastolic < 80) return 'elevated';
    return 'normal';
  }
}
