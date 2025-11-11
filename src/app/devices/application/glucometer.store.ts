import { Injectable, signal, computed } from '@angular/core';
import { Glucometer, GlucometerReading, GlucometerEntity } from '../domain/model/glucometer.entity';

@Injectable({
  providedIn: 'root'
})
export class GlucometerStore {
  private device = signal<Glucometer | null>(null);
  private isSimulating = signal<boolean>(false);
  private simulationInterval: any = null;

  // Public computed signals
  readonly currentDevice = computed(() => this.device());
  readonly latestReading = computed(() => this.device()?.readings[this.device()!.readings.length - 1] || null);
  readonly isConnected = computed(() => this.device()?.connectionStatus === 'connected');
  readonly batteryLevel = computed(() => this.device()?.batteryLevel || 0);

  initializeDevice(patientId: string): void {
    const initialDevice: Glucometer = {
      id: `gluco-${Date.now()}`,
      patientId,
      deviceName: 'Mi Glucómetro',
      manufacturer: 'Accu-Chek',
      model: 'Guide Me',
      serialNumber: `SN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      connectionStatus: 'connected',
      batteryLevel: 85,
      lastSync: new Date(),
      readings: []
    };

    // Add initial reading
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
    }, 5000); // Update every 5 seconds
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

  updateConnectionStatus(status: 'connected' | 'disconnected' | 'syncing'): void {
    const current = this.device();
    if (!current) return;

    this.device.set({ ...current, connectionStatus: status });
  }

  private generateReading(deviceId: string, patientId: string): GlucometerReading {
    // Simulate realistic glucose levels (70-140 mg/dL normal, with some variations)
    const baseLevel = 90 + Math.random() * 40; // 90-130
    const variation = (Math.random() - 0.5) * 30; // ±15
    const glucoseLevel = Math.round(Math.max(60, Math.min(180, baseLevel + variation)));

    const mealContexts: Array<'fasting' | 'before-meal' | 'after-meal' | 'random'> = 
      ['fasting', 'before-meal', 'after-meal', 'random'];

    return {
      id: `reading-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      deviceId,
      patientId,
      glucoseLevel,
      unit: 'mg/dL',
      timestamp: new Date(),
      mealContext: mealContexts[Math.floor(Math.random() * mealContexts.length)]
    };
  }

  getReadingHistory(limit: number = 10): GlucometerReading[] {
    const current = this.device();
    if (!current) return [];
    return current.readings.slice(-limit);
  }

  disconnect(): void {
    this.stopSimulation();
    this.device.set(null);
  }
}
