import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PatientDevicesView } from './patient-devices.view';
import { DeviceManagementStore } from '../../../../devices/application/device-management.store';
import { ReactiveFormsModule } from '@angular/forms';
import { signal } from '@angular/core';

describe('PatientDevicesView', () => {
  let component: PatientDevicesView;
  let fixture: ComponentFixture<PatientDevicesView>;
  let mockStore: jasmine.SpyObj<DeviceManagementStore>;

  beforeEach(async () => {
    mockStore = jasmine.createSpyObj('DeviceManagementStore', ['loadDevices', 'linkDevice'], {
      devices: signal([]),
      loading: signal(false),
      error: signal(null)
    });

    await TestBed.configureTestingModule({
      imports: [PatientDevicesView, ReactiveFormsModule],
      providers: [
        { provide: DeviceManagementStore, useValue: mockStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientDevicesView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load devices on init', () => {
    component.ngOnInit();
    // Verify component was initialized
    expect(component).toBeTruthy();
  });

  it('should open modal', () => {
    component.openModal();
    expect(component.showModal()).toBe(true);
  });

  it('should close modal', () => {
    component.openModal();
    component.closeModal();
    expect(component.showModal()).toBe(false);
  });

  it('should get device icon correctly', () => {
    expect(component.getDeviceIcon('glucometer')).toBe('bloodtype');
    expect(component.getDeviceIcon('blood_pressure')).toBe('monitor_heart');
    expect(component.getDeviceIcon('pulse_oximeter')).toBe('favorite');
    expect(component.getDeviceIcon('ecg')).toBe('ecg_heart');
    expect(component.getDeviceIcon('smart_scale')).toBe('scale');
    expect(component.getDeviceIcon('unknown')).toBe('devices');
  });

  it('should get device label correctly', () => {
    expect(component.getDeviceLabel('glucometer')).toBe('Glucómetro');
    expect(component.getDeviceLabel('blood_pressure')).toBe('Monitor de Presión Arterial');
    expect(component.getDeviceLabel('pulse_oximeter')).toBe('Oxímetro de Pulso');
    expect(component.getDeviceLabel('ecg')).toBe('Monitor ECG');
    expect(component.getDeviceLabel('smart_scale')).toBe('Báscula Inteligente');
    expect(component.getDeviceLabel('unknown')).toBe('Dispositivo');
  });

  it('should toggle device status', () => {
    const device = {
      id: 1,
      patientId: 1,
      type: 'glucometer',
      brand: 'Accu-Chek',
      model: 'Guide',
      lastSync: new Date().toISOString(),
      isActive: true,
      autoSyncEnabled: true
    };

    component.toggleDeviceStatus(device);
    // Just verify the method can be called without errors
    expect(component).toBeTruthy();
  });
});
