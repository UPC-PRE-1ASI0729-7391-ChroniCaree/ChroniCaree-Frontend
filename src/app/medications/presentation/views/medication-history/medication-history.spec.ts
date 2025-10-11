import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MedicationHistoryComponent } from './medication-history';
import { MedicationStore } from '../../../application/medication.store';

describe('MedicationHistoryComponent', () => {
  let component: MedicationHistoryComponent;
  let fixture: ComponentFixture<MedicationHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicationHistoryComponent],
      providers: [
        MedicationStore,
        provideHttpClient(),
        provideRouter([]),
        provideAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MedicationHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with medications from store', () => {
    expect(component.medications).toBeDefined();
  });

  it('should initialize with activeMedications from store', () => {
    expect(component.activeMedications).toBeDefined();
  });

  it('should initialize with loading from store', () => {
    expect(component.loading).toBeDefined();
  });

  it('should initialize with adherenceStats from store', () => {
    expect(component.adherenceStats).toBeDefined();
  });

  it('should have selectedTab signal initialized to 0', () => {
    expect(component.selectedTab()).toBe(0);
  });
});
