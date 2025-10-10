import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedicationDeleteDialogComponent } from './medication-delete-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MedicationStore } from '../../../application/medication.store';

describe('MedicationDeleteDialogComponent', () => {
  let component: MedicationDeleteDialogComponent;
  let fixture: ComponentFixture<MedicationDeleteDialogComponent>;

  const mockDialogRef = {
    close: jasmine.createSpy('close')
  };

  const mockData = {
    id: '1',
    name: 'Test Medication',
    dosage: '10mg'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicationDeleteDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        MedicationStore,
        provideHttpClient(),
        provideAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MedicationDeleteDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close dialog on cancel', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
