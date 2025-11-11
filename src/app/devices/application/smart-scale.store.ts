import { Injectable, signal, computed } from '@angular/core';
import { SmartScale, SmartScaleReading } from '../domain/model/smart-scale.entity';

@Injectable({
  providedIn: 'root'
})
export class SmartScaleStore {
  private device = signal<SmartScale | null>(null);
  private isSimulating = signal<boolean>(false);
  private simulationInterval: any = null;

  readonly currentDevice = computed(() => this.device());
  readonly latestReading = computed(() => this.device()?.readings[this.device()!.readings.length - 1] || null);
  readonly isConnected = computed(() => this.device()?.connectionStatus === 'connected');
  readonly batteryLevel = computed(() => this.device()?.batteryLevel || 0);

  initializeDevice(patientId: string, userHeight: number = 170): void {
    const initialDevice: SmartScale = {
      id: `scale-${Date.now()}`,
      patientId,
      deviceName: 'Báscula Inteligente',
      manufacturer: 'Withings',
      model: 'Body+',
      serialNumber: `SN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      connectionStatus: 'connected',
      batteryLevel: 95,
      lastSync: new Date(),
      readings: [],
      userHeight
    };

    initialDevice.readings.push(this.generateReading(initialDevice.id, patientId, userHeight));
    this.device.set(initialDevice);
  }

  startSimulation(): void {
    if (this.isSimulating()) return;
    
    this.isSimulating.set(true);
    this.simulationInterval = setInterval(() => {
      const current = this.device();
      if (!current) return;

      const newReading = this.generateReading(current.id, current.patientId, current.userHeight);
      const updatedDevice = {
        ...current,
        readings: [...current.readings, newReading],
        lastSync: new Date(),
        batteryLevel: Math.max(0, current.batteryLevel - 1)
      };

      this.device.set(updatedDevice);
    }, 10000); // Update every 10 seconds
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

    const newReading = this.generateReading(current.id, current.patientId, current.userHeight);
    const updatedDevice = {
      ...current,
      readings: [...current.readings, newReading],
      lastSync: new Date()
    };

    this.device.set(updatedDevice);
  }

  updateUserHeight(height: number): void {
    const current = this.device();
    if (!current) return;

    this.device.set({ ...current, userHeight: height });
  }

  private generateReading(deviceId: string, patientId: string, userHeight: number): SmartScaleReading {
    // Simulate realistic weight (65-85 kg with small variations)
    const baseWeight = 70 + Math.random() * 10; // 70-80 kg
    const weight = Math.round(baseWeight * 10) / 10;

    // Calculate BMI
    const heightM = userHeight / 100;
    const bmi = Math.round((weight / (heightM * heightM)) * 10) / 10;

    // Simulate body composition
    const bodyFatPercentage = Math.round((15 + Math.random() * 15) * 10) / 10; // 15-30%
    const muscleMass = Math.round((weight * (0.3 + Math.random() * 0.2)) * 10) / 10; // 30-50% of weight
    const boneMass = Math.round((2 + Math.random() * 2) * 10) / 10; // 2-4 kg
    const waterPercentage = Math.round((50 + Math.random() * 10) * 10) / 10; // 50-60%
    const visceralFat = Math.round(5 + Math.random() * 10); // 5-15

    return {
      id: `reading-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      deviceId,
      patientId,
      weight,
      bmi,
      bodyFatPercentage,
      muscleMass,
      boneMass,
      waterPercentage,
      visceralFat,
      timestamp: new Date()
    };
  }

  getReadingHistory(limit: number = 10): SmartScaleReading[] {
    const current = this.device();
    if (!current) return [];
    return current.readings.slice(-limit);
  }

  disconnect(): void {
    this.stopSimulation();
    this.device.set(null);
  }
}
