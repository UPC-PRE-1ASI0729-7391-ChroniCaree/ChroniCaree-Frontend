import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OnboardingComponent } from './onboarding';

describe('OnboardingComponent', () => {
  let component: OnboardingComponent;
  let fixture: ComponentFixture<OnboardingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 6 steps', () => {
    expect(component.steps.length).toBe(6);
  });

  it('should start at step 0', () => {
    expect(component.currentStep()).toBe(0);
  });

  it('should advance to next step', () => {
    component.nextStep();
    expect(component.currentStep()).toBe(1);
  });

  it('should go back to previous step', () => {
    component.nextStep();
    component.nextStep();
    component.previousStep();
    expect(component.currentStep()).toBe(1);
  });

  it('should calculate progress correctly', () => {
    expect(component.progress()).toBeCloseTo(16.67, 1);
    component.nextStep();
    expect(component.progress()).toBeCloseTo(33.33, 1);
  });
});
