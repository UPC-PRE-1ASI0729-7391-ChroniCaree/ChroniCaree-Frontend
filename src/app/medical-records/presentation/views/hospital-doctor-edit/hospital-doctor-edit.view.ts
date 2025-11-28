import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DoctorService } from '../../../../doctors/infrastructure/doctor.service';
import { DoctorEntity } from '../../../../doctors/domain/model/doctor.entity';

@Component({
  selector: 'app-hospital-doctor-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './hospital-doctor-edit.view.html',
  styleUrls: ['./hospital-doctor-edit.view.css']
})
export class HospitalDoctorEditView implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly doctorService = inject(DoctorService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  doctorForm!: FormGroup;
  loading = signal<boolean>(true);
  saving = signal<boolean>(false);
  doctor = signal<DoctorEntity | null>(null);
  doctorId: number = 0;

  ngOnInit(): void {
    this.initForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.doctorId = Number(id);
      this.loadDoctor();
    } else {
      this.router.navigate(['/hospital/doctors']);
    }
  }

  private initForm(): void {
    this.doctorForm = this.fb.group({
      phone: ['', [Validators.required, Validators.pattern(/^\d{9,}$/)]],
      consultationFee: [0, [Validators.required, Validators.min(0)]],
      acceptingPatients: [true]
    });
  }

  private loadDoctor(): void {
    this.loading.set(true);
    this.doctorService.getById(this.doctorId).subscribe({
      next: (doctor) => {
        this.doctor.set(doctor);
        this.doctorForm.patchValue({
          phone: doctor.phone,
          consultationFee: doctor.consultationFee,
          acceptingPatients: doctor.acceptingPatients
        });
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading doctor:', err);
        this.snackBar.open(this.translate.instant('hospitalDoctors.edit.snack.loadError'), 'OK', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        this.loading.set(false);
        this.router.navigate(['/hospital/doctors']);
      }
    });
  }

  onSubmit(): void {
    if (this.doctorForm.invalid) {
      this.markFormGroupTouched(this.doctorForm);
      return;
    }

    this.saving.set(true);
    const formValues = this.doctorForm.value;

    const updateRequest = {
      phone: formValues.phone,
      consultationFee: formValues.consultationFee,
      acceptingPatients: formValues.acceptingPatients
    };

    this.doctorService.update(this.doctorId, updateRequest).subscribe({
      next: () => {
        this.snackBar.open(this.translate.instant('hospitalDoctors.edit.snack.updatedOk'), 'OK', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.saving.set(false);
        this.router.navigate(['/hospital/doctors']);
      },
      error: (err) => {
        console.error('Error updating doctor:', err);
        this.snackBar.open(this.translate.instant('hospitalDoctors.edit.snack.updateError'), 'OK', {
          duration: 4000,
          panelClass: ['error-snackbar']
        });
        this.saving.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/hospital/doctors']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    for (const key of Object.keys(formGroup.controls)) {
      const control = formGroup.get(key);
      control?.markAsTouched();
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.doctorForm.get(fieldName);
    if (!field) return '';

    if (field.hasError('required')) {
      return this.translate.instant('common.errors.required');
    }
    if (field.hasError('minlength')) {
      const minLength = field.errors?.['minlength'].requiredLength;
      return this.translate.instant('common.errors.minlength', { min: minLength });
    }
    if (field.hasError('min')) {
      return this.translate.instant('common.errors.min');
    }
    if (field.hasError('pattern')) {
      if (fieldName === 'phone') return this.translate.instant('hospitalDoctors.edit.errors.phonePattern');
    }
    return '';
  }
}
