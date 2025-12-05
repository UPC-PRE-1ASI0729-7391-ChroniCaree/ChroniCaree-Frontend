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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DoctorStore } from '../../../application/doctor.store';
import { UserStore } from '../../../../iam/application/user.store';
import { TotpValidatorService } from '../../../../shared/infrastructure/totp-validator.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    MatSlideToggleModule,
    MatCheckboxModule,
    MatTooltipModule
    TranslateModule
  ],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css'
})
export class EditProfileDoctorComponent implements OnInit {
  profileForm!: FormGroup;
  verificationForm!: FormGroup;
  
  // 2FA Configuration
  twoFactorSecret = signal<string>('');
  twoFactorQRCode = signal<string>('');
  showTwoFactorSetup = signal(false);
  twoFactorVerified = signal(false);
  private translate = inject(TranslateService);
  // Getters para evitar errores de inicialización
  get loading() { return this.doctorStore.loading$; }
  get currentDoctor() { return this.doctorStore.selectedDoctor$; }

  yearsOfExperience = computed(() => {
    const licenseDate = this.profileForm?.get('licenseDate')?.value;
    if (licenseDate) {
      const years = new Date().getFullYear() - new Date(licenseDate).getFullYear();
      return years >= 0 ? years : 0;
    }
    return 0;
  });

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
    private userStore: UserStore,
    private totpValidator: TotpValidatorService
  ) {
    this.initializeForm();
    this.initializeVerificationForm();
  }

  ngOnInit(): void {
    this.loadDoctorData();
    this.loadTwoFactorStatus();
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
      availableForEmergencies: [false],
      twoFactorEnabled: [false]
    });
  }

  private initializeVerificationForm(): void {
    this.verificationForm = this.fb.group({
      verificationCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  private loadTwoFactorStatus(): void {
    const user = this.userStore.currentUser$();
    if (user && user.role === 'doctor') {
      const doctor = this.currentDoctor();
      if (doctor) {
        const doctorId = doctor.id;
        const has2FA = localStorage.getItem(`doctor_${doctorId}_2fa_verified`) === 'true';
        if (has2FA) {
          this.twoFactorVerified.set(true);
          this.profileForm.patchValue({ twoFactorEnabled: true });
        }
      }
    }
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

    const updatedDoctor = {
      ...doctor,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      dni: formValue.dni,
      phone: formValue.phone,
      specialty: formValue.specialty,
      licenseNumber: formValue.licenseNumber
    };

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

  onTwoFactorToggle(): void {
    const isEnabled = this.profileForm.get('twoFactorEnabled')?.value;
    if (isEnabled) {
      if (!this.twoFactorVerified()) {
        this.generateTwoFactorSecret();
        this.showTwoFactorSetup.set(true);
      }
    } else {
      if (confirm('¿Estás seguro de que deseas desactivar la autenticación en dos pasos? Esto reducirá la seguridad de tu cuenta.')) {
        this.twoFactorVerified.set(false);
        this.showTwoFactorSetup.set(false);
        this.twoFactorSecret.set('');
        this.twoFactorQRCode.set('');
        this.verificationForm.reset();
        
        const doctor = this.currentDoctor();
        if (doctor) {
          localStorage.removeItem(`doctor_${doctor.id}_2fa_verified`);
          localStorage.removeItem(`doctor_${doctor.id}_2fa_secret`);
        }
        
        this.showNotification('Autenticación en dos pasos desactivada', 'warning');
      } else {
        this.profileForm.patchValue({ twoFactorEnabled: true });
      }
    }
  }

  private generateTwoFactorSecret(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const formattedSecret = secret.match(/.{1,4}/g)?.join(' ') || secret;
    this.twoFactorSecret.set(formattedSecret);

    const doctor = this.currentDoctor();
    const accountName = doctor 
      ? `Dr. ${doctor.firstName} ${doctor.lastName}`.replace(/\s+/g, ' ')
      : 'Doctor ChroniCare';
    const issuer = 'ChroniCare';
    const totpUri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
    
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`;
    this.twoFactorQRCode.set(qrCodeUrl);
  }

  onVerifyCode(): void {
    if (this.verificationForm.valid) {
      const code = this.verificationForm.get('verificationCode')?.value;
      const secret = this.twoFactorSecret().replace(/\s/g, '');
      
      if (!code || code.length !== 6) {
        this.showNotification('Código inválido. Por favor, ingresa un código de 6 dígitos.', 'error');
        return;
      }
      
      if (!secret) {
        this.showNotification('Error: No se encontró el secreto de autenticación', 'error');
        return;
      }
      
      const isValid = this.totpValidator.validateToken(code, secret);
      
      if (isValid) {
        this.twoFactorVerified.set(true);
        this.showTwoFactorSetup.set(false);
        
        const doctor = this.currentDoctor();
        if (doctor) {
          localStorage.setItem(`doctor_${doctor.id}_2fa_verified`, 'true');
          localStorage.setItem(`doctor_${doctor.id}_2fa_secret`, secret);
        }
        
        this.showNotification('Autenticación en dos pasos configurada correctamente', 'success');
        console.log('2FA Secret saved for doctor:', secret);
      } else {
        this.showNotification('Código de verificación inválido. Por favor, verifica el código en Google Authenticator e inténtalo de nuevo.', 'error');
        this.verificationForm.patchValue({ verificationCode: '' });
      }
    } else {
      this.showNotification('Por favor, ingresa un código de verificación válido', 'warning');
    }
  }

  onCopySecret(): void {
    const secret = this.twoFactorSecret().replace(/\s/g, '');
    navigator.clipboard.writeText(secret).then(() => {
      this.showNotification('Código secreto copiado al portapapeles', 'success');
    }).catch(() => {
      this.showNotification('Error al copiar el código', 'error');
    });
  }

  onCancelTwoFactorSetup(): void {
    this.showTwoFactorSetup.set(false);
    this.profileForm.patchValue({ twoFactorEnabled: false });
    this.twoFactorSecret.set('');
    this.twoFactorQRCode.set('');
    this.verificationForm.reset();
    this.showNotification('Configuración de autenticación cancelada', 'warning');
  }

  onVerificationCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.verificationForm.patchValue({ verificationCode: input.value });
  }
}
