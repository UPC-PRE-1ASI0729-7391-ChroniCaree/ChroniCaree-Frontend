import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BloodPressureStore } from '../../../application/blood-pressure.store';
import { UserStore } from '../../../../iam/application/user.store';

@Component({
  standalone: true,
  selector: 'cc-blood-pressure',
  imports: [CommonModule],
  templateUrl: './blood-pressure.component.html',
  styleUrls: ['./blood-pressure.component.css']
})
export class BloodPressureComponent implements OnInit, OnDestroy {
  private store = inject(BloodPressureStore);
  private userStore = inject(UserStore);
  private router = inject(Router);

  device = this.store.currentDevice;
  latestReading = this.store.latestReading;
  isConnected = this.store.isConnected;
  batteryLevel = this.store.batteryLevel;

  bpStatus = computed(() => {
    const reading = this.latestReading();
    if (!reading) return { label: '—', class: 'unknown' };

    const { systolic, diastolic } = reading;
    if (systolic < 90 || diastolic < 60) return { label: 'Baja', class: 'low' };
    if (systolic >= 180 || diastolic >= 120) return { label: 'Crisis', class: 'crisis' };
    if (systolic >= 140 || diastolic >= 90) return { label: 'Alta', class: 'high' };
    if (systolic >= 120 && systolic < 130 && diastolic < 80) return { label: 'Elevada', class: 'elevated' };
    return { label: 'Normal', class: 'normal' };
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
    alert(`Registrar síntoma con PA: ${reading.systolic}/${reading.diastolic} mmHg`);
  }

  goBack(): void {
    this.router.navigate(['/devices']);
  }
}
