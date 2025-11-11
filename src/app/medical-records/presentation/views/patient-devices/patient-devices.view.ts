import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DeviceManagementStore } from '../../../../devices/application/device-management.store';

interface DeviceView {
  id: number;
  patientId: number;
  type: string;
  brand: string;
  model: string;
  lastSync: string;
  isActive: boolean;
  autoSyncEnabled: boolean;
}

@Component({
  selector: 'app-patient-devices',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './patient-devices.view.html',
  styleUrls: ['./patient-devices.view.css']
})
export class PatientDevicesView implements OnInit {
  private readonly store = inject(DeviceManagementStore);
  private readonly fb = inject(FormBuilder);

  devices = signal<DeviceView[]>([]);
  showModal = signal<boolean>(false);
  isSubmitting = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  deviceForm!: FormGroup;

  deviceTypes = [
    { value: 'glucometer', label: 'Glucómetro', icon: 'bloodtype' },
    { value: 'blood_pressure', label: 'Tensiómetro', icon: 'favorite' },
    { value: 'pulse_oximeter', label: 'Oxímetro', icon: 'monitor_heart' },
    { value: 'thermometer', label: 'Termómetro', icon: 'thermostat' },
    { value: 'scale', label: 'Báscula', icon: 'scale' },
    { value: 'ecg', label: 'ECG', icon: 'ecg_heart' }
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadDevices();
  }

  initForm(): void {
    this.deviceForm = this.fb.group({
      type: ['', [Validators.required]],
      brand: ['', [Validators.required]],
      model: ['', [Validators.required]],
      autoSyncEnabled: [true]
    });
  }

  loadDevices(): void {
    const patientId = 1; // TODO: Get from context
    // Mock data for demonstration
    this.devices.set([
      {
        id: 1,
        patientId: 1,
        type: 'glucometer',
        brand: 'Accu-Chek',
        model: 'Guide',
        lastSync: new Date().toISOString(),
        isActive: true,
        autoSyncEnabled: true
      },
      {
        id: 2,
        patientId: 1,
        type: 'blood_pressure',
        brand: 'Omron',
        model: 'M3',
        lastSync: new Date().toISOString(),
        isActive: true,
        autoSyncEnabled: true
      }
    ]);
  }

  openModal(): void {
    this.showModal.set(true);
    this.deviceForm.reset({ autoSyncEnabled: true });
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSubmit(): void {
    if (this.deviceForm.invalid) return;

    this.isSubmitting.set(true);
    const patientId = 1; // TODO: Get from context

    const request = {
      patientId,
      deviceType: this.deviceForm.value.type,
      brand: this.deviceForm.value.brand,
      model: this.deviceForm.value.model,
      autoSyncEnabled: this.deviceForm.value.autoSyncEnabled
    };

    this.store.linkDevice(request).subscribe({
      next: (result: any) => {
        if (result.success) {
          this.successMessage.set('Dispositivo registrado exitosamente');
          setTimeout(() => {
            this.closeModal();
            this.loadDevices();
          }, 1500);
        } else {
          this.errorMessage.set(result.message);
        }
        this.isSubmitting.set(false);
      },
      error: (err: any) => {
        this.errorMessage.set('Error al registrar dispositivo: ' + err.message);
        this.isSubmitting.set(false);
      }
    });
  }

  toggleDeviceStatus(device: DeviceView): void {
    console.log('Toggle device:', device.id);
  }

  syncDevice(device: DeviceView): void {
    console.log('Sync device:', device.id);
  }

  getDeviceIcon(type: string): string {
    return this.deviceTypes.find(d => d.value === type)?.icon || 'sensors';
  }

  getDeviceLabel(type: string): string {
    return this.deviceTypes.find(d => d.value === type)?.label || type;
  }

  formatLastSync(lastSync: string): string {
    const date = new Date(lastSync);
    return date.toLocaleString('es-ES');
  }
}
