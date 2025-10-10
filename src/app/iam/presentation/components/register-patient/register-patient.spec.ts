import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RegisterPatientComponent } from './register-patient';

describe('RegisterPatientComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPatientComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(RegisterPatientComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should start at step 1', () => {
    const fixture = TestBed.createComponent(RegisterPatientComponent);
    const component = fixture.componentInstance;
    expect(component.currentStep()).toBe(1);
  });

  it('should not be submitting initially', () => {
    const fixture = TestBed.createComponent(RegisterPatientComponent);
    const component = fixture.componentInstance;
    expect(component.submitting()).toBeFalse();
  });
});
