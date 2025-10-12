import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

export interface SymptomSummary {
  glucose?: number;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  fatigue: number;
  pain: number;
  dizziness: number;
  notes?: string;
  hasCriticalValues: boolean;
}

/**
 * Symptom Confirmation Dialog - Diálogo de confirmación después de registrar síntomas
 */
@Component({
  selector: 'app-symptom-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './symptom-confirmation-dialog.html',
  styleUrl: './symptom-confirmation-dialog.css'
})
export class SymptomConfirmationDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: SymptomSummary,
    private dialogRef: MatDialogRef<SymptomConfirmationDialogComponent>,
    private router: Router
  ) {}

  onViewHistory(): void {
    this.dialogRef.close();
    // TODO: Navigate to symptoms history when implemented
    this.router.navigate(['/patient/dashboard']);
  }

  onBackToDashboard(): void {
    this.dialogRef.close();
    this.router.navigate(['/patient/dashboard']);
  }
}
