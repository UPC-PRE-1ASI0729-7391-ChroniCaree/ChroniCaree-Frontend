import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DoctorsManagementComponent } from './doctors-management.component';
import { HospitalDashboardStore } from '../../../../tenants/application/hospital-dashboard.store';
import { DoctorService } from '../../../../doctors/infrastructure/doctor.service';
import { ReactiveFormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('DoctorsManagementComponent', () => {
  let component: DoctorsManagementComponent;
  let fixture: ComponentFixture<DoctorsManagementComponent>;
  let mockStore: jasmine.SpyObj<HospitalDashboardStore>;
  let mockDoctorService: jasmine.SpyObj<DoctorService>;

  beforeEach(async () => {
    mockStore = jasmine.createSpyObj('HospitalDashboardStore', ['registerDoctor', 'inviteDoctor'], {
      stats: signal({ availableDoctorSlots: 5 }),
      loading: signal(false),
      error: signal(null)
    });

    mockDoctorService = jasmine.createSpyObj('DoctorService', ['getByTenantId']);
    mockDoctorService.getByTenantId.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [DoctorsManagementComponent, ReactiveFormsModule],
      providers: [
        { provide: HospitalDashboardStore, useValue: mockStore },
        { provide: DoctorService, useValue: mockDoctorService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DoctorsManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize forms on init', () => {
    component.ngOnInit();
    expect(component.registerForm).toBeDefined();
    expect(component.inviteForm).toBeDefined();
  });

  it('should load doctors on init', () => {
    component.ngOnInit();
    expect(mockDoctorService.getByTenantId).toHaveBeenCalled();
  });

  it('should open modal in register mode', () => {
    component.openModal('register');
    expect(component.showModal()).toBe(true);
    expect(component.modalMode()).toBe('register');
  });

  it('should open modal in invite mode', () => {
    component.openModal('invite');
    expect(component.showModal()).toBe(true);
    expect(component.modalMode()).toBe('invite');
  });

  it('should close modal', () => {
    component.openModal('register');
    component.closeModal();
    expect(component.showModal()).toBe(false);
  });

  it('should validate register form', () => {
    expect(component.registerForm.valid).toBe(false);
    
    component.registerForm.patchValue({
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@hospital.com',
      password: 'password123',
      dni: '12345678',
      specialty: 'Cardiología',
      licenseNumber: 'CMP-12345'
    });
    
    expect(component.registerForm.valid).toBe(true);
  });

  it('should validate invite form', () => {
    expect(component.inviteForm.valid).toBe(false);
    
    component.inviteForm.patchValue({
      email: 'doctor@email.com'
    });
    
    expect(component.inviteForm.valid).toBe(true);
  });

  it('should not submit invalid register form', () => {
    component.onRegisterDoctor();
    expect(component.errorMessage()).toBeTruthy();
    expect(mockStore.registerDoctor).not.toHaveBeenCalled();
  });

  it('should not submit invalid invite form', () => {
    component.onInviteDoctor();
    expect(component.errorMessage()).toBeTruthy();
    expect(mockStore.inviteDoctor).not.toHaveBeenCalled();
  });
});
