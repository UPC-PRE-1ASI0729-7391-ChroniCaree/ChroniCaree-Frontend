import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { PatientStore } from '../../../application/patient.store';
import { Patient } from '../../../domain/model/patient.entity';

/**
 * Edit Profile View - US20: Actualizar perfil del paciente
 */
@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css'
})
export class EditProfileComponent implements OnInit {
  profileForm!: FormGroup;
  
  // Computed BMI
  calculatedBMI = computed(() => {
    const weight = this.profileForm?.get('weight')?.value;
    const height = this.profileForm?.get('height')?.value;
    
    if (weight && height && height > 0) {
      const heightInMeters = height / 100;
      const bmi = weight / (heightInMeters * heightInMeters);
      return Math.round(bmi * 10) / 10;
    }
    return 0;
  });
  
  // BMI category
  bmiCategory = computed(() => {
    const bmi = this.calculatedBMI();
    if (bmi === 0) return '';
    if (bmi < 18.5) return 'Bajo peso';
    if (bmi < 25) return 'Peso normal';
    if (bmi < 30) return 'Sobrepeso';
    return 'Obesidad';
  });
  
  // BMI color
  bmiColor = computed(() => {
    const bmi = this.calculatedBMI();
    if (bmi === 0) return 'gray';
    if (bmi < 18.5) return '#ff9800'; // warning
    if (bmi < 25) return '#4CAF50'; // success
    if (bmi < 30) return '#ff9800'; // warning
    return '#f44336'; // danger
  });

  // Age calculation
  calculatedAge = computed(() => {
    const birthDate = this.profileForm?.get('birthDate')?.value;
    if (!birthDate) return 0;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  });

  constructor(
    private fb: FormBuilder,
    private patientStore: PatientStore,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {}
  
  get loading() {
    return this.patientStore.loading$;
  }
  
  get currentPatient() {
    return this.patientStore.selectedPatient$;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentPatient();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      birthDate: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      weight: [null, [Validators.required, Validators.min(20), Validators.max(300)]],
      height: [null, [Validators.required, Validators.min(50), Validators.max(250)]]
    });
  }

  private loadCurrentPatient(): void {
    // TODO: Get patient ID from auth service
    const patientId = 1;
    
    this.patientStore.loadPatientById(patientId).subscribe({
      next: (patient) => {
        this.profileForm.patchValue({
          firstName: patient.firstName,
          lastName: patient.lastName,
          birthDate: patient.birthDate,
          phone: patient.phone,
          address: patient.address,
          weight: patient.weight,
          height: patient.height
        });
      },
      error: (error) => {
        this.snackBar.open('❌ Error al cargar perfil', 'Cerrar', {
          duration: 3000
        });
        console.error('Error loading patient:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      const formValue = this.profileForm.value;
      const patient = this.currentPatient();
      
      if (!patient) {
        this.snackBar.open('❌ No se encontró el paciente', 'Cerrar', {
          duration: 3000
        });
        return;
      }

      // Check for unusual values
      const warnings = this.checkUnusualValues(formValue);
      
      if (warnings.length > 0) {
        this.showWarningDialog(warnings, () => this.saveProfile(patient, formValue));
      } else {
        this.saveProfile(patient, formValue);
      }
    } else {
      this.snackBar.open('⚠️ Por favor, revisa los campos del formulario', 'Cerrar', {
        duration: 3000
      });
    }
  }

  private checkUnusualValues(formValue: any): string[] {
    const warnings: string[] = [];
    
    // Weight warnings
    if (formValue.weight < 40) {
      warnings.push('El peso ingresado es inusualmente bajo (< 40 kg)');
    } else if (formValue.weight > 200) {
      warnings.push('El peso ingresado es inusualmente alto (> 200 kg)');
    }
    
    // Height warnings
    if (formValue.height < 100) {
      warnings.push('La altura ingresada es inusualmente baja (< 100 cm)');
    } else if (formValue.height > 220) {
      warnings.push('La altura ingresada es inusualmente alta (> 220 cm)');
    }
    
    // BMI warnings
    const bmi = this.calculatedBMI();
    if (bmi < 16) {
      warnings.push('El IMC calculado es extremadamente bajo (< 16)');
    } else if (bmi > 40) {
      warnings.push('El IMC calculado es extremadamente alto (> 40)');
    }
    
    // Age warnings
    const age = this.calculatedAge();
    if (age < 18) {
      warnings.push('La fecha de nacimiento indica que eres menor de edad');
    } else if (age > 120) {
      warnings.push('La fecha de nacimiento parece incorrecta (> 120 años)');
    }
    
    return warnings;
  }

  private showWarningDialog(warnings: string[], onConfirm: () => void): void {
    const message = `Se detectaron valores inusuales:\n\n${warnings.join('\n')}\n\n¿Deseas continuar?`;
    
    if (confirm(message)) {
      onConfirm();
    }
  }

  private saveProfile(patient: Patient, formValue: any): void {
    const updatedPatient: Patient = {
      ...patient,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      birthDate: formValue.birthDate,
      phone: formValue.phone,
      address: formValue.address,
      weight: formValue.weight,
      height: formValue.height,
      bmi: this.calculatedBMI()
    };

    this.patientStore.updatePatient(updatedPatient).subscribe({
      next: () => {
        this.snackBar.open('✅ Perfil actualizado exitosamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        setTimeout(() => {
          this.router.navigate(['/patient/dashboard']);
        }, 1500);
      },
      error: (error) => {
        this.snackBar.open('❌ Error al actualizar perfil', 'Cerrar', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        console.error('Error updating patient:', error);
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/patient/dashboard']);
  }
}
