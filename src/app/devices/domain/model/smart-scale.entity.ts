export interface SmartScaleReading {
  id: string;
  deviceId: string;
  patientId: string;
  weight: number; // kg
  bmi: number;
  bodyFatPercentage?: number;
  muscleMass?: number; // kg
  boneMass?: number; // kg
  waterPercentage?: number;
  visceralFat?: number; // 1-59 scale
  timestamp: Date;
  notes?: string;
}

export interface SmartScale {
  id: string;
  patientId: string;
  deviceName: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  connectionStatus: 'connected' | 'disconnected' | 'syncing';
  batteryLevel: number; // 0-100
  lastSync: Date;
  readings: SmartScaleReading[];
  userHeight: number; // cm (for BMI calculation)
}

export class SmartScaleEntity implements SmartScale {
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
    public readings: SmartScaleReading[],
    public userHeight: number
  ) {}

  get latestReading(): SmartScaleReading | null {
    return this.readings.length > 0 
      ? this.readings[this.readings.length - 1] 
      : null;
  }

  get averageWeight(): number {
    if (this.readings.length === 0) return 0;
    const sum = this.readings.reduce((acc, r) => acc + r.weight, 0);
    return Math.round((sum / this.readings.length) * 10) / 10;
  }

  get weightTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.readings.length < 2) return 'stable';
    
    const recent = this.readings.slice(-5);
    const firstWeight = recent[0].weight;
    const lastWeight = recent[recent.length - 1].weight;
    const diff = lastWeight - firstWeight;
    
    if (diff > 1) return 'increasing';
    if (diff < -1) return 'decreasing';
    return 'stable';
  }

  getBMICategory(reading: SmartScaleReading): 'underweight' | 'normal' | 'overweight' | 'obese' {
    const bmi = reading.bmi;
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  }

  calculateBMI(weight: number): number {
    const heightM = this.userHeight / 100;
    return Math.round((weight / (heightM * heightM)) * 10) / 10;
  }
}
