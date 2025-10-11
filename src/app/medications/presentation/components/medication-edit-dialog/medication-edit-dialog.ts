import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Medication } from '../../../domain/model/medication.entity';
import { MedicationStore } from '../../../application/medication.store';

export interface MedicationEditDialogData {
  medication: Medication;
}

@Component({
  selector: 'app-medication-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './medication-edit-dialog.html',
  styleUrls: ['./medication-edit-dialog.css']
})
export class MedicationEditDialogComponent {
  private dialogRef = inject(MatDialogRef<MedicationEditDialogComponent>);
  private medicationStore = inject(MedicationStore);
  private snackBar = inject(MatSnackBar);
  data = inject<MedicationEditDialogData>(MAT_DIALOG_DATA);

  loading = signal(false);

  editForm = new FormGroup({
    name: new FormControl(this.data.medication.name, [Validators.required]),
    dosage: new FormControl(this.data.medication.dosage, [Validators.required]),
    instructions: new FormControl(this.data.medication.instructions || '')
  });

  onSubmit(): void {
    if (this.editForm.valid && !this.loading()) {
      this.loading.set(true);

      const updatedMedication = new Medication({
        ...this.data.medication,
        name: this.editForm.value.name!,
        dosage: this.editForm.value.dosage!,
        instructions: this.editForm.value.instructions || undefined,
        updatedAt: new Date()
      });

      this.medicationStore.updateMedication(this.data.medication.id, updatedMedication).subscribe({
        next: () => {
          this.loading.set(false);
          this.snackBar.open('Medicación actualizada exitosamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Error updating medication:', error);
          this.snackBar.open('Error al actualizar la medicación', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
