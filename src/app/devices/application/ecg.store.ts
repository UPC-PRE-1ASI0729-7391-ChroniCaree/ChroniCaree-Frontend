import { Injectable, signal, computed } from '@angular/core';
import { ECGMonitor, ECGReading } from '../domain/model/ecg.entity';

@Injectable({
  providedIn: 'root'
})
export class ECGStore {
  private device = signal<ECGMonitor | null>(null);
  private isSimulating = signal<boolean>(false);
  private simulationInterval: any = null;

  readonly currentDevice = computed(() => this.device());
  readonly latestReading = computed(() => this.device()?.readings[this.device()!.readings.length - 1] || null);
  readonly isConnected = computed(() => this.device()?.connectionStatus === 'connected');
  readonly batteryLevel = computed(() => this.device()?.batteryLevel || 0);
  readonly isRecording = computed(() => this.device()?.connectionStatus === 'recording');

  initializeDevice(patientId: string): void {
    const initialDevice: ECGMonitor = {
      id: `ecg-${Date.now()}`,
      patientId,
      deviceName: 'ECG Portátil',
      manufacturer: 'AliveCor',
      model: 'KardiaMobile 6L',
      serialNumber: `SN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      connectionStatus: 'connected',
      batteryLevel: 88,
      lastSync: new Date(),
      readings: []
    };

    initialDevice.readings.push(this.generateReading(initialDevice.id, patientId));
    this.device.set(initialDevice);
  }

  startSimulation(): void {
    if (this.isSimulating()) return;
    
    this.isSimulating.set(true);
    this.simulationInterval = setInterval(() => {
      const current = this.device();
      if (!current) return;

      const newReading = this.generateReading(current.id, current.patientId);
      const updatedDevice = {
        ...current,
        readings: [...current.readings, newReading],
        lastSync: new Date(),
        batteryLevel: Math.max(0, current.batteryLevel - 1)
      };

      this.device.set(updatedDevice);
    }, 8000); // Update every 8 seconds
  }

  stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isSimulating.set(false);
  }

  startRecording(): void {
    const current = this.device();
    if (!current) return;

    this.device.set({ ...current, connectionStatus: 'recording' });
    
    // Simulate recording for 30 seconds
    setTimeout(() => {
      this.stopRecording();
      this.manualReading();
    }, 30000);
  }

  stopRecording(): void {
    const current = this.device();
    if (!current) return;

    this.device.set({ ...current, connectionStatus: 'connected' });
  }

  manualReading(): void {
    const current = this.device();
    if (!current) return;

    const newReading = this.generateReading(current.id, current.patientId);
    const updatedDevice = {
      ...current,
      readings: [...current.readings, newReading],
      lastSync: new Date()
    };

    this.device.set(updatedDevice);
  }

  private generateReading(deviceId: string, patientId: string): ECGReading {
    const heartRate = Math.round(60 + Math.random() * 40); // 60-100 bpm
    
    const rhythms: Array<'normal' | 'irregular' | 'tachycardia' | 'bradycardia' | 'afib'> = 
      ['normal', 'normal', 'normal', 'normal', 'irregular', 'tachycardia', 'bradycardia'];
    const rhythm = rhythms[Math.floor(Math.random() * rhythms.length)];

    // Generate simplified ECG waveform (300 samples for 30 seconds at 10Hz)
    const waveformData = this.generateECGWaveform(rhythm, 300);

    return {
      id: `reading-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      deviceId,
      patientId,
      heartRate,
      rhythm,
      waveformData,
      duration: 30,
      timestamp: new Date(),
      aiAnalysis: {
        confidence: Math.round(85 + Math.random() * 15),
        flags: rhythm === 'normal' ? [] : [`${rhythm} detected`]
      }
    };
  }

  private generateECGWaveform(rhythm: string, samples: number): number[] {
    const waveform: number[] = [];
    const baseAmplitude = 0.5;
    
    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      let value = 0;

      // Simulate P wave, QRS complex, and T wave
      if (rhythm === 'normal') {
        value = Math.sin(t * Math.PI * 2 * 3) * baseAmplitude + 
                Math.sin(t * Math.PI * 2 * 7) * baseAmplitude * 2;
      } else if (rhythm === 'irregular') {
        value = Math.sin(t * Math.PI * 2 * (3 + Math.random())) * baseAmplitude;
      } else {
        value = Math.sin(t * Math.PI * 2 * 5) * baseAmplitude;
      }

      waveform.push(Math.round(value * 100) / 100);
    }

    return waveform;
  }

  getReadingHistory(limit: number = 10): ECGReading[] {
    const current = this.device();
    if (!current) return [];
    return current.readings.slice(-limit);
  }

  disconnect(): void {
    this.stopSimulation();
    this.device.set(null);
  }
}
