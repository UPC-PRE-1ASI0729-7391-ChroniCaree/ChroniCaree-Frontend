import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PatientsListComponent } from './patients-list';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AssignedPatientsStore } from '../../../application/assigned-patients.store';
import { DoctorApiEndpoint } from '../../../infrastructure/doctor-api.endpoint';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { PatientHealthStatus } from '../../../domain/model/patient-health-summary.entity';

describe('PatientsListComponent', () => {
  let component: PatientsListComponent;
  let fixture: ComponentFixture<PatientsListComponent>;
  let mockPatientsStore: jasmine.SpyObj<AssignedPatientsStore>;
  let mockDoctorApi: jasmine.SpyObj<DoctorApiEndpoint>;

  const mockPatients = [
    {
      id: 1,
      userId: 1,
      assignedDoctorId: 2,
      firstName: 'Ana',
      lastName: 'Rodríguez',
      dni: '12345678',
      birthDate: '1980-05-15',
      gender: 'female' as const,
      phone: '+51 999 111 222',
      healthStatus: PatientHealthStatus.CONTROLLED,
      criticalAlertsCount: 0,
      activeAlertsCount: 2,
      activeMedicationsCount: 3,
      activeDiagnosesCount: 2,
      lastVitalSigns: {
        glucose: 120,
        bloodPressure: '120/80',
        heartRate: 75,
        temperature: 36.5,
        oxygenSaturation: 98,
        recordedAt: '2025-04-05T08:30:00Z'
      },
      assignedSince: '2025-01-15',
      tenantId: 1,
      hospitalName: 'Clínica SaludVida'
    }
  ];

  const mockDoctors = [
    {
      id: 2,
      userId: 3,
      tenantId: null,
      isIndependent: true,
      firstName: 'Juan',
      lastName: 'Torres',
      dni: '11223344',
      specialty: 'Cardiología',
      licenseNumber: 'CMP-54321',
      phone: '+51 999 555 666',
      isVerified: true
    }
  ];

  beforeEach(async () => {
    // Create mock store with proper signal structure
    mockPatientsStore = jasmine.createSpyObj('AssignedPatientsStore', [
      'loadPatientsByDoctor',
      'refresh',
      'clear'
    ], {
      patients: signal(mockPatients),
      loading: signal(false),
      error: signal(null),
      totalPatients: signal(1),
      criticalCount: signal(0),
      atRiskCount: signal(0),
      totalCriticalAlerts: signal(0)
    });

    // Create mock doctor API
    mockDoctorApi = jasmine.createSpyObj('DoctorApiEndpoint', ['getAll']);
    mockDoctorApi.getAll.and.returnValue(of(mockDoctors));

    await TestBed.configureTestingModule({
      imports: [PatientsListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AssignedPatientsStore, useValue: mockPatientsStore },
        { provide: DoctorApiEndpoint, useValue: mockDoctorApi }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientsListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load doctor and patients on init', () => {
    // Setup localStorage
    const mockUser = { id: 3, email: 'dr.juan@chronicaree.com', role: 'doctor' };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));

    fixture.detectChanges(); // ngOnInit

    expect(mockDoctorApi.getAll).toHaveBeenCalled();
    expect(mockPatientsStore.loadPatientsByDoctor).toHaveBeenCalledWith(2);
  });

  it('should handle missing user in localStorage', () => {
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(console, 'error');

    fixture.detectChanges();

    expect(console.error).toHaveBeenCalledWith('❌ No user found in localStorage');
    expect(mockPatientsStore.loadPatientsByDoctor).not.toHaveBeenCalled();
  });

  it('should return correct health status class', () => {
    expect(component.getHealthStatusClass(PatientHealthStatus.CRITICAL))
      .toBe('status-critical');
    expect(component.getHealthStatusClass(PatientHealthStatus.AT_RISK))
      .toBe('status-at-risk');
    expect(component.getHealthStatusClass(PatientHealthStatus.CONTROLLED))
      .toBe('status-controlled');
    expect(component.getHealthStatusClass(PatientHealthStatus.STABLE))
      .toBe('status-stable');
  });

  it('should return correct health status text', () => {
    expect(component.getHealthStatusText(PatientHealthStatus.CRITICAL))
      .toBe('🔴 Crítico');
    expect(component.getHealthStatusText(PatientHealthStatus.AT_RISK))
      .toBe('🟡 En Riesgo');
    expect(component.getHealthStatusText(PatientHealthStatus.CONTROLLED))
      .toBe('🔵 Controlado');
    expect(component.getHealthStatusText(PatientHealthStatus.STABLE))
      .toBe('🟢 Estable');
  });

  it('should format date correctly', () => {
    const formatted = component.formatDate('2025-01-15');
    expect(formatted).toContain('ene');
    expect(formatted).toContain('2025');
  });

  it('should calculate age correctly', () => {
    const age = component.calculateAge('1980-05-15');
    expect(age).toBeGreaterThan(40);
    expect(age).toBeLessThan(50);
  });

  it('should open request modal', () => {
    expect(component.showModal()).toBe(false);
    
    component.openRequestModal();
    
    expect(component.showModal()).toBe(true);
  });

  it('should refresh patients list', () => {
    const mockUser = { id: 3, email: 'dr.juan@chronicaree.com', role: 'doctor' };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));
    
    fixture.detectChanges();
    mockPatientsStore.refresh.calls.reset();
    
    component.refresh();
    
    expect(mockPatientsStore.refresh).toHaveBeenCalledWith(2);
  });

  it('should handle patient-assigned event', () => {
    const mockUser = { id: 3, email: 'dr.juan@chronicaree.com', role: 'doctor' };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));
    
    fixture.detectChanges();
    mockPatientsStore.refresh.calls.reset();
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('patient-assigned'));
    
    expect(mockPatientsStore.refresh).toHaveBeenCalledWith(2);
  });

  it('should handle close-modal event', () => {
    component.showModal.set(true);
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('close-modal'));
    
    expect(component.showModal()).toBe(false);
  });

  it('should expose PatientHealthStatus enum to template', () => {
    expect(component.PatientHealthStatus).toBeDefined();
    expect(component.PatientHealthStatus.CRITICAL).toBe('critical');
  });
});
