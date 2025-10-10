import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedicationLogComponent } from './medication-log';
import { MedicationStore } from '../../../application/medication.store';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

describe('MedicationLogComponent', () => {
  let component: MedicationLogComponent;
  let fixture: ComponentFixture<MedicationLogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicationLogComponent],
      providers: [
        MedicationStore,
        provideHttpClient(),
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MedicationLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default maxItems', () => {
    expect(component.maxItems).toBe(5);
  });
});
