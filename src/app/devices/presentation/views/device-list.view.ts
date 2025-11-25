import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UserStore } from '../../../iam/application/user.store';
import { TranslateModule } from '@ngx-translate/core';

type DeviceType = 'glucometer' | 'blood-pressure' | 'pulse-oximeter' | 'ecg' | 'smart-scale';

interface DeviceOption {
  type: DeviceType;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  color: string;
}

@Component({
  standalone: true,
  selector: 'cc-device-list',
  imports: [CommonModule, TranslateModule],
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
      nameKey: 'devices.options.glucometer.name',
      descriptionKey: 'devices.options.glucometer.description',
      icon: '🩸',
      color: '#e74c3c'
    },
    {
      type: 'blood-pressure',
      nameKey: 'devices.options.bloodPressure.name',
      descriptionKey: 'devices.options.bloodPressure.description',
      icon: '❤️',
      color: '#3498db'
    },
    {
      type: 'pulse-oximeter',
      nameKey: 'devices.options.pulseOximeter.name',
      descriptionKey: 'devices.options.pulseOximeter.description',
      icon: '🫁',
      color: '#2ecc71'
    },
    {
      type: 'ecg',
      nameKey: 'devices.options.ecg.name',
      descriptionKey: 'devices.options.ecg.description',
      icon: '📈',
      color: '#9b59b6'
    },
    {
      type: 'smart-scale',
      nameKey: 'devices.options.smartScale.name',
      descriptionKey: 'devices.options.smartScale.description',
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
