import { Injectable, signal, computed } from '@angular/core';
import { PulseOximeter, PulseOximeterReading } from '../domain/model/pulse-oximeter.entity';

@Injectable({
  providedIn: 'root'
})
export class PulseOximeterStore {
  private device = signal<PulseOximeter | null>(null);
  private isSimulating = signal<boolean>(false);
  private simulationInterval: any = null;

  readonly currentDevice = computed(() => this.device());
  readonly latestReading = computed(() => this.device()?.readings[this.device()!.readings.length - 1] || null);
  readonly isConnected = computed(() => this.device()?.connectionStatus === 'connected');
  readonly batteryLevel = computed(() => this.device()?.batteryLevel || 0);

  initializeDevice(patientId: string): void {
    const initialDevice: PulseOximeter = {
      id: `ox-${Date.now()}`,
      patientId,
      deviceName: 'Oxímetro de Pulso',
      manufacturer: 'Masimo',
      model: 'MightySat Rx',
      serialNumber: `SN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      connectionStatus: 'connected',
      batteryLevel: 78,
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
    }, 3000); // Update every 3 seconds (faster for pulse ox)
  }

  stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isSimulating.set(false);
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

  private generateReading(deviceId: string, patientId: string): PulseOximeterReading {
    // Simulate realistic SpO2 (95-100% normal)
    const baseSpO2 = 96 + Math.random() * 3; // 96-99
    const oxygenSaturation = Math.round(Math.max(92, Math.min(100, baseSpO2)));
    const heartRate = Math.round(65 + Math.random() * 25); // 65-90 bpm
    const perfusionIndex = Math.round((2 + Math.random() * 8) * 10) / 10; // 2-10%

    const activities: Array<'resting' | 'active' | 'sleeping'> = ['resting', 'active', 'sleeping'];

    return {
      id: `reading-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      deviceId,
      patientId,
      oxygenSaturation,
      heartRate,
      perfusionIndex,
      timestamp: new Date(),
      activity: activities[Math.floor(Math.random() * activities.length)]
    };
  }

  getReadingHistory(limit: number = 10): PulseOximeterReading[] {
    const current = this.device();
    if (!current) return [];
    return current.readings.slice(-limit);
  }

  disconnect(): void {
    this.stopSimulation();
    this.device.set(null);
  }
}
