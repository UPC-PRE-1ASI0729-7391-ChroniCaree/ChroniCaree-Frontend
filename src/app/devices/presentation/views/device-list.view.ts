import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserStore } from '../../../iam/application/user.store';

type DeviceType = 'glucometer' | 'blood-pressure' | 'pulse-oximeter' | 'ecg' | 'smart-scale';

interface DeviceOption {
  type: DeviceType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

@Component({
  standalone: true,
  selector: 'cc-device-list',
  imports: [CommonModule],
  templateUrl: './device-list.view.html',
  styleUrls: ['./device-list.view.css']
})
export class DeviceListView implements OnInit {
  private router = inject(Router);
  private userStore = inject(UserStore);

  patientId = signal<string>('');

  devices: DeviceOption[] = [
    {
      type: 'glucometer',
      name: 'Glucómetro',
      description: 'Monitoreo de niveles de glucosa en sangre para control de diabetes',
      icon: '🩸',
      color: '#e74c3c'
    },
    {
      type: 'blood-pressure',
      name: 'Monitor de Presión Arterial',
      description: 'Medición de presión sistólica, diastólica y ritmo cardíaco',
      icon: '❤️',
      color: '#3498db'
    },
    {
      type: 'pulse-oximeter',
      name: 'Oxímetro de Pulso',
      description: 'Saturación de oxígeno (SpO2) y frecuencia cardíaca en tiempo real',
      icon: '🫁',
      color: '#2ecc71'
    },
    {
      type: 'ecg',
      name: 'Monitor ECG',
      description: 'Electrocardiograma portátil para análisis del ritmo cardíaco',
      icon: '📈',
      color: '#9b59b6'
    },
    {
      type: 'smart-scale',
      name: 'Báscula Inteligente',
      description: 'Peso, IMC, composición corporal y análisis de masa',
      icon: '⚖️',
      color: '#f39c12'
    }
  ];

  ngOnInit(): void {
    const currentUser = this.userStore.currentUser$();
    if (currentUser) {
      this.patientId.set(currentUser.id.toString());
    } else {
      // Fallback
      this.patientId.set('PATIENT-123');
    }
  }

  selectDevice(type: DeviceType): void {
    this.router.navigate(['/devices', type]);
  }
}
