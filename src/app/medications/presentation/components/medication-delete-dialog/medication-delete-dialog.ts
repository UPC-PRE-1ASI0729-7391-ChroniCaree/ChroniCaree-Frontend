import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Medication } from '../../../domain/model/medication.entity';
import { MedicationStore } from '../../../application/medication.store';

export interface MedicationDeleteDialogData {
  medication: Medication;
}

@Component({
  selector: 'app-medication-delete-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './medication-delete-dialog.html',
  styleUrls: ['./medication-delete-dialog.css']
})
export class MedicationDeleteDialogComponent {
  private dialogRef = inject(MatDialogRef<MedicationDeleteDialogComponent>);
  private medicationStore = inject(MedicationStore);
  private snackBar = inject(MatSnackBar);
  data = inject<MedicationDeleteDialogData>(MAT_DIALOG_DATA);

  loading = signal(false);

  onConfirm(): void {
    if (!this.loading()) {
      this.loading.set(true);

      this.medicationStore.deleteMedication(this.data.medication.id).subscribe({
        next: () => {
          this.loading.set(false);
          this.snackBar.open('Medicación eliminada exitosamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Error deleting medication:', error);
          this.snackBar.open('Error al eliminar la medicación', 'Cerrar', {
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

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
