import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GlucometerStore } from '../../../application/glucometer.store';
import { UserStore } from '../../../../iam/application/user.store';

@Component({
  standalone: true,
  selector: 'cc-glucometer',
  imports: [CommonModule],
  templateUrl: './glucometer.component.html',
  styleUrls: ['./glucometer.component.css']
})
export class GlucometerComponent implements OnInit, OnDestroy {
  private store = inject(GlucometerStore);
  private userStore = inject(UserStore);
  private router = inject(Router);

  device = this.store.currentDevice;
  latestReading = this.store.latestReading;
  isConnected = this.store.isConnected;
  batteryLevel = this.store.batteryLevel;

  glucoseStatus = computed(() => {
    const reading = this.latestReading();
    if (!reading) return { label: '—', class: 'unknown' };

    const level = reading.glucoseLevel;
    if (level < 70) return { label: 'Bajo', class: 'low' };
    if (level <= 140) return { label: 'Normal', class: 'normal' };
    return { label: 'Alto', class: 'high' };
  });

  recentReadings = computed(() => {
    const device = this.device();
    if (!device) return [];
    return device.readings.slice(-10).reverse();
  });

  ngOnInit(): void {
    const currentUser = this.userStore.currentUser$();
    const patientId = currentUser ? (currentUser as any).id.toString() : 'PATIENT-123';

    this.store.initializeDevice(patientId);
    this.store.startSimulation();
  }

  ngOnDestroy(): void {
    this.store.stopSimulation();
  }

  refreshData(): void {
    this.store.manualReading();
  }

  registerSymptom(): void {
    const reading = this.latestReading();
    if (!reading) return;

    // Navigate to symptoms registration with glucose context
    alert(`Registrar síntoma con glucosa: ${reading.glucoseLevel} mg/dL\n\nEsta funcionalidad se integrará con el módulo de síntomas.`);
    
    // TODO: Integrate with symptoms module
    // this.router.navigate(['/clinical/symptoms/new'], {
    //   queryParams: {
    //     glucose: reading.glucoseLevel,
    //     timestamp: reading.timestamp.toISOString()
    //   }
    // });
  }

  goBack(): void {
    this.router.navigate(['/devices']);
  }

  getMealContextLabel(context?: string): string {
    const labels: Record<string, string> = {
      'fasting': 'En ayunas',
      'before-meal': 'Antes de comer',
      'after-meal': 'Después de comer',
      'random': 'Aleatorio'
    };
    return context ? labels[context] || context : '—';
  }
}
