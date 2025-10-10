import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RegisterHospitalComponent } from './register-hospital';

describe('RegisterHospitalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterHospitalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RegisterHospitalComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should start at step 1', () => {
    const fixture = TestBed.createComponent(RegisterHospitalComponent);
    const component = fixture.componentInstance;
    expect(component.currentStep()).toBe(1);
  });

  it('should have empty form initially', () => {
    const fixture = TestBed.createComponent(RegisterHospitalComponent);
    const component = fixture.componentInstance;
    const form = component.form();
    expect(form.email).toBe('');
    expect(form.hospitalName).toBe('');
  });

  it('should not be submitting initially', () => {
    const fixture = TestBed.createComponent(RegisterHospitalComponent);
    const component = fixture.componentInstance;
    expect(component.submitting()).toBeFalse();
  });
});
