import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HospitalPatientsComponent } from './hospital-patients.component';
import { PatientService } from '../../../../patients/infrastructure/patient.service';
import { DoctorService } from '../../../../doctors/infrastructure/doctor.service';
import { SubscriptionService } from '../../../../subscriptions/infrastructure/subscription.service';
import { FormsModule } from '@angular/forms';

describe('HospitalPatientsComponent', () => {
  let component: HospitalPatientsComponent;
  let fixture: ComponentFixture<HospitalPatientsComponent>;
  let mockPatientService: jasmine.SpyObj<PatientService>;
  let mockDoctorService: jasmine.SpyObj<DoctorService>;
  let mockSubscriptionService: jasmine.SpyObj<SubscriptionService>;

  beforeEach(async () => {
    mockPatientService = jasmine.createSpyObj('PatientService', ['getById']);
    mockDoctorService = jasmine.createSpyObj('DoctorService', ['getById']);
    mockSubscriptionService = jasmine.createSpyObj('SubscriptionService', ['getById']);

    await TestBed.configureTestingModule({
      imports: [HospitalPatientsComponent, FormsModule],
      providers: [
        { provide: PatientService, useValue: mockPatientService },
        { provide: DoctorService, useValue: mockDoctorService },
        { provide: SubscriptionService, useValue: mockSubscriptionService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalPatientsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load patients on init', () => {
    component.ngOnInit();
    expect(component.isLoading()).toBe(true);
  });

  it('should filter patients by search term', () => {
    component.patients.set([
      {
        id: 1,
        fullName: 'Ana Rodríguez',
        age: 45,
        gender: 'Femenino',
        assignedDoctorName: 'Dr. Juan Torres',
        subscriptionPlan: 'Premium',
        conditions: []
      },
      {
        id: 2,
        fullName: 'Carlos Mendoza',
        age: 50,
        gender: 'Masculino',
        assignedDoctorName: null,
        subscriptionPlan: 'Free',
        conditions: []
      }
    ]);

    component.updateFilters({ searchTerm: 'Ana' });
    expect(component.filteredPatients().length).toBe(1);
    expect(component.filteredPatients()[0].fullName).toBe('Ana Rodríguez');
  });

  it('should filter patients by subscription status', () => {
    component.patients.set([
      {
        id: 1,
        fullName: 'Ana Rodríguez',
        age: 45,
        gender: 'Femenino',
        assignedDoctorName: 'Dr. Juan Torres',
        subscriptionPlan: 'Premium',
        conditions: []
      },
      {
        id: 2,
        fullName: 'Carlos Mendoza',
        age: 50,
        gender: 'Masculino',
        assignedDoctorName: null,
        subscriptionPlan: 'Free',
        conditions: []
      }
    ]);

    component.updateFilters({ subscriptionStatus: 'premium' });
    expect(component.filteredPatients().length).toBe(1);
    expect(component.filteredPatients()[0].subscriptionPlan).toBe('Premium');
  });

  it('should update filters correctly', () => {
    const newFilters = { searchTerm: 'test', subscriptionStatus: 'premium' };
    component.updateFilters(newFilters);
    
    expect(component.filters().searchTerm).toBe('test');
    expect(component.filters().subscriptionStatus).toBe('premium');
  });
});
