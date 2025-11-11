import { Injectable, signal, computed } from '@angular/core';
import { BloodPressureMonitor, BloodPressureReading } from '../domain/model/blood-pressure.entity';

@Injectable({
  providedIn: 'root'
})
export class BloodPressureStore {
  private device = signal<BloodPressureMonitor | null>(null);
  private isSimulating = signal<boolean>(false);
  private simulationInterval: any = null;

  readonly currentDevice = computed(() => this.device());
  readonly latestReading = computed(() => this.device()?.readings[this.device()!.readings.length - 1] || null);
  readonly isConnected = computed(() => this.device()?.connectionStatus === 'connected');
  readonly batteryLevel = computed(() => this.device()?.batteryLevel || 0);

  initializeDevice(patientId: string): void {
    const initialDevice: BloodPressureMonitor = {
      id: `bp-${Date.now()}`,
      patientId,
      deviceName: 'Monitor de Presión',
      manufacturer: 'Omron',
      model: 'M7 Intelli IT',
      serialNumber: `SN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      connectionStatus: 'connected',
      batteryLevel: 92,
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
    }, 6000); // Update every 6 seconds
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

  private generateReading(deviceId: string, patientId: string): BloodPressureReading {
    // Simulate realistic blood pressure (120/80 ±20)
    const baseSystolic = 115 + Math.random() * 20; // 115-135
    const baseDiastolic = 70 + Math.random() * 20; // 70-90
    const systolic = Math.round(baseSystolic);
    const diastolic = Math.round(baseDiastolic);
    const heartRate = Math.round(60 + Math.random() * 30); // 60-90 bpm

    const positions: Array<'sitting' | 'standing' | 'lying'> = ['sitting', 'standing', 'lying'];

    return {
      id: `reading-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      deviceId,
      patientId,
      systolic,
      diastolic,
      heartRate,
      timestamp: new Date(),
      position: positions[Math.floor(Math.random() * positions.length)]
    };
  }

  getReadingHistory(limit: number = 10): BloodPressureReading[] {
    const current = this.device();
    if (!current) return [];
    return current.readings.slice(-limit);
  }

  disconnect(): void {
    this.stopSimulation();
    this.device.set(null);
  }
}
