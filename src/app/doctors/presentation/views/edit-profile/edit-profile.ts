import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { DoctorStore } from '../../../application/doctor.store';
import { UserStore } from '../../../../iam/application/user.store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/**
 * Edit Profile View - Doctor Profile Management
 * Permite al doctor actualizar su información profesional
 */
@Component({
  selector: 'app-edit-profile-doctor',
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
    MatSelectModule,
    TranslateModule
  ],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css'
})
export class EditProfileDoctorComponent implements OnInit {
  profileForm!: FormGroup;
  private translate = inject(TranslateService);

  // Getters para evitar errores de inicialización
  get loading() { return this.doctorStore.loading$; }
  get currentDoctor() { return this.doctorStore.selectedDoctor$; }

  // Años de experiencia calculados
  yearsOfExperience = computed(() => {
    const licenseDate = this.profileForm?.get('licenseDate')?.value;
    if (licenseDate) {
      const years = new Date().getFullYear() - new Date(licenseDate).getFullYear();
      return years >= 0 ? years : 0;
    }
    return 0;
  });

  // Especialidades médicas disponibles
  specialties = [
    'Cardiología',
    'Dermatología',
    'Endocrinología',
    'Gastroenterología',
    'Geriatría',
    'Medicina General',
    'Neumología',
    'Neurología',
    'Oncología',
    'Pediatría',
    'Psiquiatría',
    'Traumatología',
    'Urología'
  ];

  constructor(
    private fb: FormBuilder,
    private doctorStore: DoctorStore,
    private snackBar: MatSnackBar,
    private router: Router,
    private userStore: UserStore
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadDoctorData();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({

      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?\d{9,15}$/)]],

      specialty: ['', Validators.required],
      licenseNumber: ['', [Validators.required, Validators.minLength(5)]],
      licenseDate: ['', Validators.required],

      professionalBio: ['', [Validators.maxLength(500)]],
      consultationFee: [0, [Validators.min(0)]],
      languages: ['Español'],
      availableForEmergencies: [false]
    });
  }

  private loadDoctorData(): void {
    const user = this.userStore.currentUser$() || (() => {
      try {
        const s = localStorage.getItem('currentUser');
        return s ? JSON.parse(s) : null;
      } catch { return null; }
    })();

    if (user) {
      const doctorId = user.doctorId || 1;

      this.doctorStore.loadDoctorById(doctorId).subscribe({
        next: () => {
          const doctor = this.currentDoctor();
          if (doctor) {
            this.profileForm.patchValue({
              firstName: doctor.firstName,
              lastName: doctor.lastName,
              dni: doctor.dni,
              phone: doctor.phone,
              specialty: doctor.specialty,
              licenseNumber: doctor.licenseNumber,
              licenseDate: '2015-01-01', // Demo date
              professionalBio: 'Médico especialista con amplia experiencia en el tratamiento de enfermedades crónicas.',
              consultationFee: 150,
              languages: 'Español, Inglés',
              availableForEmergencies: true
            });
          }
        },
        error: (error) => {
          console.error('Error loading doctor data:', error);
          this.showNotification(
            this.translate.instant('doctors.profileEdit.snack.loadError'),
            'error'
          );
        }
      });
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.showNotification(
        this.translate.instant('doctors.profileEdit.snack.invalidForm'),
        'error'
      );
      return;
    }

    const formValue = this.profileForm.value;
    const doctor = this.currentDoctor();

    if (!doctor) {
      this.showNotification('No se encontró el perfil del doctor', 'error');
      return;
    }

    // Preparar datos actualizados
    const updatedDoctor = {
      ...doctor,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      dni: formValue.dni,
      phone: formValue.phone,
      specialty: formValue.specialty,
      licenseNumber: formValue.licenseNumber
    };

    // Guardar cambios
    this.doctorStore.updateDoctor(updatedDoctor).subscribe({
      next: () => {
        this.showNotification(
          this.translate.instant('doctors.profileEdit.snack.updateSuccess'),
          'success'
        );

        try {
          const userStr = localStorage.getItem('currentUser');
          if (userStr) {
            const user = JSON.parse(userStr);
            user.name = `Dr. ${formValue.firstName} ${formValue.lastName}`;
            this.userStore.setCurrentUser(user);
          }
        } catch (e) {
          console.error('Error updating currentUser after profile update:', e);
        }
      },
      error: (error) => {
        console.error('Error updating doctor profile:', error);
        this.showNotification(
          this.translate.instant('doctors.profileEdit.snack.updateError'),
          'error'
        );
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/doctor/dashboard']);
  }

  checkUnusualValues(): void {
    const fee = this.profileForm.get('consultationFee')?.value;

    if (fee && (fee < 50 || fee > 1000)) {
      this.showNotification(
        this.translate.instant('doctors.profileEdit.snack.unusualFee'),
        'warning'
      );
    }
  }
  private showNotification(message: string, type: 'success' | 'error' | 'warning'): void {
    const config = {
      duration: 4000,
      horizontalPosition: 'end' as const,
      verticalPosition: 'top' as const,
      panelClass: [`snackbar-${type}`]
    };

    this.snackBar.open(message, this.translate.instant('common.close') || 'Cerrar', config);
  }
  getErrorMessage(fieldName: string): string {
    const field = this.profileForm.get(fieldName);

    if (field?.hasError('required')) {
      return this.translate.instant('common.errors.required');
    }

    if (field?.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return this.translate.instant('common.errors.minlength', { min: minLength });
    }

    if (field?.hasError('pattern')) {
      if (fieldName === 'dni') return this.translate.instant('doctors.profileEdit.errors.dniPattern');
      if (fieldName === 'phone') return this.translate.instant('doctors.profileEdit.errors.phonePattern');
    }

    if (field?.hasError('min')) {
      return this.translate.instant('common.errors.min');
    }

    return '';
  }
}
