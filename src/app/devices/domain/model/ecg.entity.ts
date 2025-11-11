export interface ECGReading {
  id: string;
  deviceId: string;
  patientId: string;
  heartRate: number; // bpm
  rhythm: 'normal' | 'irregular' | 'tachycardia' | 'bradycardia' | 'afib';
  waveformData: number[]; // Simplified ECG waveform samples
  duration: number; // seconds
  timestamp: Date;
  aiAnalysis?: {
    confidence: number; // 0-100
    flags: string[];
  };
  notes?: string;
}

export interface ECGMonitor {
  id: string;
  patientId: string;
  deviceName: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  connectionStatus: 'connected' | 'disconnected' | 'syncing' | 'recording';
  batteryLevel: number; // 0-100
  lastSync: Date;
  readings: ECGReading[];
}

export class ECGMonitorEntity implements ECGMonitor {
  constructor(
    public id: string,
    public patientId: string,
    public deviceName: string,
    public manufacturer: string,
    public model: string,
    public serialNumber: string,
    public connectionStatus: 'connected' | 'disconnected' | 'syncing' | 'recording',
    public batteryLevel: number,
    public lastSync: Date,
    public readings: ECGReading[]
  ) {}

  get latestReading(): ECGReading | null {
    return this.readings.length > 0 
      ? this.readings[this.readings.length - 1] 
      : null;
  }

  get averageHeartRate(): number {
    if (this.readings.length === 0) return 0;
    const sum = this.readings.reduce((acc, r) => acc + r.heartRate, 0);
    return Math.round(sum / this.readings.length);
  }

  get abnormalRhythmsCount(): number {
    return this.readings.filter(r => r.rhythm !== 'normal').length;
  }

  getRhythmSeverity(reading: ECGReading): 'normal' | 'warning' | 'critical' {
    if (reading.rhythm === 'normal') return 'normal';
    if (reading.rhythm === 'tachycardia' || reading.rhythm === 'bradycardia') return 'warning';
    return 'critical';
  }
}
