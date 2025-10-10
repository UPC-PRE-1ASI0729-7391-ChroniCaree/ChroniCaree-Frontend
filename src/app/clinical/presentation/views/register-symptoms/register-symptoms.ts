import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SymptomStore } from '../../../application/symptom.store';
import { Symptom } from '../../../domain/model/symptom.entity';

/**
 * Register Symptoms View - Registro de síntomas diarios
 */
@Component({
  selector: 'app-register-symptoms',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSliderModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register-symptoms.html',
  styleUrl: './register-symptoms.css'
})
export class RegisterSymptomsComponent implements OnInit {
  symptomForm!: FormGroup;
  
  // Valores de escalas (1-10)
  fatigueValue = signal(5);
  painValue = signal(5);
  dizzinessValue = signal(5);

  constructor(
    private fb: FormBuilder,
    private symptomStore: SymptomStore,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}
  
  get loading() {
    return this.symptomStore.loading$;
  }

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    this.symptomForm = this.fb.group({
      glucose: [null, [Validators.min(0), Validators.max(600)]],
      bloodPressure: ['', [Validators.pattern(/^\d{2,3}\/\d{2,3}$/)]],
      heartRate: [null, [Validators.min(30), Validators.max(220)]],
      temperature: [null, [Validators.min(34), Validators.max(42)]],
      oxygenSaturation: [null, [Validators.min(0), Validators.max(100)]],
      notes: ['', [Validators.maxLength(500)]]
    });
  }

  onFatigueChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.fatigueValue.set(Number(value));
  }

  onPainChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.painValue.set(Number(value));
  }

  onDizzinessChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dizzinessValue.set(Number(value));
  }

  formatLabel(value: number): string {
    if (value === 1) return 'Muy bajo';
    if (value <= 3) return 'Bajo';
    if (value <= 5) return 'Moderado';
    if (value <= 7) return 'Alto';
    return 'Muy alto';
  }

  onSubmit(): void {
    if (this.symptomForm.valid) {
      const formValue = this.symptomForm.value;
      
      const newSymptom: Symptom = {
        id: 0, // Will be assigned by backend
        patientId: 1, // TODO: Get from auth service
        glucose: formValue.glucose || undefined,
        bloodPressure: formValue.bloodPressure || undefined,
        heartRate: formValue.heartRate || undefined,
        temperature: formValue.temperature || undefined,
        oxygenSaturation: formValue.oxygenSaturation || undefined,
        fatigue: this.fatigueValue(),
        pain: this.painValue(),
        dizziness: this.dizzinessValue(),
        notes: formValue.notes || undefined,
        timestamp: new Date().toISOString(),
        isEdited: false
      };

      this.symptomStore.createSymptom(newSymptom).subscribe({
        next: () => {
          this.snackBar.open('✅ Síntomas registrados exitosamente', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          this.symptomForm.reset();
          this.fatigueValue.set(5);
          this.painValue.set(5);
          this.dizzinessValue.set(5);
        },
        error: (error) => {
          this.snackBar.open('❌ Error al registrar síntomas', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          console.error('Error:', error);
        }
      });
    } else {
      this.snackBar.open('⚠️ Por favor, revisa los campos del formulario', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
