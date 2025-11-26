import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GlucometerStore } from '../../../application/glucometer.store';
import { UserStore } from '../../../../iam/application/user.store';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'cc-glucometer',
  imports: [CommonModule, TranslateModule],
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

  /**
   * Estado de la glucosa (devuelve clave de traducción + clase CSS)
   */
  glucoseStatus = computed(() => {
    const reading = this.latestReading();
    if (!reading) {
      return { labelKey: 'devices.glucometer.status.unknown', class: 'unknown' };
    }

    const level = reading.glucoseLevel;

    if (level < 70) {
      return { labelKey: 'devices.glucometer.status.low', class: 'low' };
    }

    if (level <= 140) {
      return { labelKey: 'devices.glucometer.status.normal', class: 'normal' };
    }

    return { labelKey: 'devices.glucometer.status.high', class: 'high' };
  });

  /**
   * Últimas lecturas (máximo 10) en orden descendente
   */
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

    // TODO: Integrar con módulo de síntomas
    alert(
      `Registrar síntoma con glucosa: ${reading.glucoseLevel} mg/dL\n\n` +
      'Esta funcionalidad se integrará con el módulo de síntomas.'
    );
  }

  goBack(): void {
    this.router.navigate(['/devices']);
  }

  /**
   * Devuelve la clave de traducción para el contexto de la comida
   * (el pipe translate se aplica en el template)
   */
  getMealContextLabel(context?: string): string {
    const map: Record<string, string> = {
      'fasting': 'devices.glucometer.mealContext.fasting',
      'before-meal': 'devices.glucometer.mealContext.beforeMeal',
      'after-meal': 'devices.glucometer.mealContext.afterMeal',
      'random': 'devices.glucometer.mealContext.random'
    };

    if (!context) {
      return 'devices.glucometer.mealContext.unknown';
    }

    return map[context] || 'devices.glucometer.mealContext.unknown';
  }
}
