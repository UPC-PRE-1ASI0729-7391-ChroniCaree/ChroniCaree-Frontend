import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppointmentsListComponent } from './appointments-list';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AppointmentsStore } from '../../../application/appointments.store';
import { DoctorApiEndpoint } from '../../../infrastructure/doctor-api.endpoint';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { AppointmentStatus } from '../../../domain/model/appointment.entity';

describe('AppointmentsListComponent', () => {
  let component: AppointmentsListComponent;
  let fixture: ComponentFixture<AppointmentsListComponent>;
  let mockAppointmentsStore: jasmine.SpyObj<AppointmentsStore>;
  let mockDoctorApi: jasmine.SpyObj<DoctorApiEndpoint>;

  const mockAppointments = [
    {
      id: 1,
      patientId: 1,
      doctorId: 2,
      date: '2025-04-15',
      time: '10:00',
      type: 'Consulta de control',
      status: AppointmentStatus.SCHEDULED,
      notes: '',
      patientName: 'Ana Rodríguez',
      patientPhone: '+51 999 111 222',
      patientEmail: 'ana@b2c.com'
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
    mockAppointmentsStore = jasmine.createSpyObj('AppointmentsStore', [
      'loadAppointmentsByDoctor',
      'updateAppointmentStatus',
      'refresh',
      'clear'
    ], {
      appointments: signal(mockAppointments),
      loading: signal(false),
      error: signal(null),
      todayAppointments: signal([]),
      upcomingAppointments: signal(mockAppointments),
      scheduledAppointments: signal(mockAppointments),
      completedAppointments: signal([]),
      todayCount: signal(0),
      upcomingCount: signal(1),
      totalAppointments: signal(1)
    });

    mockDoctorApi = jasmine.createSpyObj('DoctorApiEndpoint', ['getAll']);
    mockDoctorApi.getAll.and.returnValue(of(mockDoctors));

    await TestBed.configureTestingModule({
      imports: [AppointmentsListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: AppointmentsStore, useValue: mockAppointmentsStore },
        { provide: DoctorApiEndpoint, useValue: mockDoctorApi }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppointmentsListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load doctor and appointments on init', () => {
    const mockUser = { id: 3, email: 'dr.juan@chronicaree.com', role: 'doctor' };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));

    fixture.detectChanges();

    expect(mockDoctorApi.getAll).toHaveBeenCalled();
    expect(mockAppointmentsStore.loadAppointmentsByDoctor).toHaveBeenCalledWith(2);
  });

  it('should handle missing user in localStorage', () => {
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(console, 'error');

    fixture.detectChanges();

    expect(console.error).toHaveBeenCalledWith('❌ No user found in localStorage');
    expect(mockAppointmentsStore.loadAppointmentsByDoctor).not.toHaveBeenCalled();
  });

  it('should change selected tab', () => {
    expect(component.selectedTab()).toBe('upcoming');
    
    component.setTab('today');
    expect(component.selectedTab()).toBe('today');
    
    component.setTab('completed');
    expect(component.selectedTab()).toBe('completed');
  });

  it('should return correct filtered appointments', () => {
    component.setTab('upcoming');
    let filtered = component.getFilteredAppointments();
    expect(filtered).toEqual(mockAppointments);

    component.setTab('all');
    filtered = component.getFilteredAppointments();
    expect(filtered).toEqual(mockAppointments);
  });

  it('should update appointment status', () => {
    component.updateStatus(1, 'confirmed');
    expect(mockAppointmentsStore.updateAppointmentStatus).toHaveBeenCalledWith(1, 'confirmed');
  });

  it('should format date correctly', () => {
    const formatted = component.formatDate('2025-04-15');
    expect(formatted).toContain('abril');
    expect(formatted).toContain('2025');
  });

  it('should format time correctly', () => {
    const formatted = component.formatTime('10:00');
    expect(formatted).toBe('10:00');
  });

  it('should return correct status class', () => {
    expect(component.getStatusClass(AppointmentStatus.SCHEDULED)).toBe('status-scheduled');
    expect(component.getStatusClass(AppointmentStatus.CONFIRMED)).toBe('status-confirmed');
    expect(component.getStatusClass(AppointmentStatus.IN_PROGRESS)).toBe('status-in-progress');
    expect(component.getStatusClass(AppointmentStatus.COMPLETED)).toBe('status-completed');
    expect(component.getStatusClass(AppointmentStatus.CANCELLED)).toBe('status-cancelled');
    expect(component.getStatusClass(AppointmentStatus.NO_SHOW)).toBe('status-no-show');
  });

  it('should return correct status text', () => {
    expect(component.getStatusText(AppointmentStatus.SCHEDULED)).toBe('📅 Programada');
    expect(component.getStatusText(AppointmentStatus.CONFIRMED)).toBe('✅ Confirmada');
    expect(component.getStatusText(AppointmentStatus.IN_PROGRESS)).toBe('⏳ En Progreso');
    expect(component.getStatusText(AppointmentStatus.COMPLETED)).toBe('✔️ Completada');
    expect(component.getStatusText(AppointmentStatus.CANCELLED)).toBe('❌ Cancelada');
    expect(component.getStatusText(AppointmentStatus.NO_SHOW)).toBe('🚫 No Asistió');
  });

  it('should check if appointment is today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(component.isToday(today)).toBe(true);
    expect(component.isToday('2025-04-15')).toBe(false);
  });

  it('should refresh appointments list', () => {
    const mockUser = { id: 3, email: 'dr.juan@chronicaree.com', role: 'doctor' };
    spyOn(localStorage, 'getItem').and.returnValue(JSON.stringify(mockUser));
    
    fixture.detectChanges();
    mockAppointmentsStore.refresh.calls.reset();
    
    component.refresh();
    
    expect(mockAppointmentsStore.refresh).toHaveBeenCalledWith(2);
  });

  it('should expose AppointmentStatus enum to template', () => {
    expect(component.AppointmentStatus).toBeDefined();
    expect(component.AppointmentStatus.SCHEDULED).toBe('scheduled');
  });
});
