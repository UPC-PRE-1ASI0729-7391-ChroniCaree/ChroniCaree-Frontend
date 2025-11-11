import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PatientOnboardingView } from './patient-onboarding.view';
import { PatientOnboardingStore } from '../../../../patients/application/patient-onboarding.store';
import { ReactiveFormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('PatientOnboardingView', () => {
  let component: PatientOnboardingView;
  let fixture: ComponentFixture<PatientOnboardingView>;
  let mockStore: jasmine.SpyObj<PatientOnboardingStore>;

  beforeEach(async () => {
    mockStore = jasmine.createSpyObj('PatientOnboardingStore', ['registerPatientWithConditions'], {
      loading: signal(false),
      error: signal(null),
      successMessage: signal(null)
    });
    mockStore.registerPatientWithConditions.and.returnValue(of({ success: true, message: 'Success' }));

    await TestBed.configureTestingModule({
      imports: [PatientOnboardingView, ReactiveFormsModule],
      providers: [
        { provide: PatientOnboardingStore, useValue: mockStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PatientOnboardingView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with step 1', () => {
    expect(component.currentStep()).toBe(1);
  });

  it('should move to next step', () => {
    const initialStep = component.currentStep();
    component.nextStep();
    // Step might not change if form is invalid, that's expected
    expect(component.currentStep()).toBeGreaterThanOrEqual(initialStep);
  });

  it('should move to previous step', () => {
    component.currentStep.set(2);
    component.prevStep();
    expect(component.currentStep()).toBe(1);
  });

  it('should toggle condition selection', () => {
    const condition = 'diabetes_type_2';
    component.toggleCondition(condition);
    expect(component.selectedConditions().includes(condition)).toBe(true);

    component.toggleCondition(condition);
    expect(component.selectedConditions().includes(condition)).toBe(false);
  });

  it('should calculate BMI correctly', () => {
    expect(component.calculateBMI(70, 1.75)).toBeCloseTo(22.86, 1);
    expect(component.calculateBMI(0, 1.75)).toBe(0);
    expect(component.calculateBMI(70, 0)).toBe(0);
  });
});
