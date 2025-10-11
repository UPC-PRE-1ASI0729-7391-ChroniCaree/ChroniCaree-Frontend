import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MedicationEditDialogComponent } from './medication-edit-dialog';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MedicationStore } from '../../../application/medication.store';

describe('MedicationEditDialogComponent', () => {
  let component: MedicationEditDialogComponent;
  let fixture: ComponentFixture<MedicationEditDialogComponent>;

  const mockDialogRef = {
    close: jasmine.createSpy('close')
  };

  const mockData = {
    id: '1',
    name: 'Test Medication',
    dosage: '10mg',
    instructions: 'Take daily'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MedicationEditDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        MedicationStore,
        provideHttpClient(),
        provideAnimations()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MedicationEditDialogComponent);
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
