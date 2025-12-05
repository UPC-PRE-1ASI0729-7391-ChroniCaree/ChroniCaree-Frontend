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
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PatientStore } from '../../../application/patient.store';
import { Patient } from '../../../domain/model/patient.entity';
import { SubscriptionService } from '../../../../subscriptions/infrastructure/subscription.service';
import { SubscriptionEntity } from '../../../../subscriptions/domain/model/subscription.entity';
import { TotpValidatorService } from '../../../../shared/infrastructure/totp-validator.service';
import { firstValueFrom } from 'rxjs';

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
    MatNativeDateModule,
    MatSlideToggleModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css'
})
export class EditProfileComponent implements OnInit {
  profileForm!: FormGroup;
  currentSubscription = signal<SubscriptionEntity | null>(null);
  loadingSubscription = signal(false);
  
  // 2FA Configuration
  twoFactorSecret = signal<string>('');
  twoFactorQRCode = signal<string>('');
  showTwoFactorSetup = signal(false);
  twoFactorVerified = signal(false);
  verificationForm!: FormGroup;
  
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
    private dialog: MatDialog,
    private translate: TranslateService,
    private subscriptionService: SubscriptionService,
    private totpValidator: TotpValidatorService
  ) {}
  
  get loading() {
    return this.patientStore.loading$;
  }
  
  get currentPatient() {
    return this.patientStore.selectedPatient$;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.initializeVerificationForm();
    this.loadCurrentPatient();
    this.loadSubscription();
  }

  private initializeForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      birthDate: ['', [Validators.required]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      weight: [null, [Validators.required, Validators.min(20), Validators.max(300)]],
      height: [null, [Validators.required, Validators.min(50), Validators.max(250)]],
      twoFactorEnabled: [false]
    });
  }

  private initializeVerificationForm(): void {
    this.verificationForm = this.fb.group({
      verificationCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  private loadCurrentPatient(): void {
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
        
        const saved2FA = localStorage.getItem(`patient_${patientId}_2fa_verified`);
        if (saved2FA === 'true') {
          this.twoFactorVerified.set(true);
          this.profileForm.patchValue({ twoFactorEnabled: true });
        }
      },
      error: (error) => {
        this.snackBar.open('Error al cargar perfil', 'Cerrar', {
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
        this.snackBar.open('No se encontró el paciente', 'Cerrar', {
          duration: 3000
        });
        return;
      }

      const warnings = this.checkUnusualValues(formValue);
      
      if (warnings.length > 0) {
        this.showWarningDialog(warnings, () => this.saveProfile(patient, formValue));
      } else {
        this.saveProfile(patient, formValue);
      }
    } else {
      this.snackBar.open('Por favor, revisa los campos del formulario', 'Cerrar', {
        duration: 3000
      });
    }
  }

  private checkUnusualValues(formValue: any): string[] {
    const warnings: string[] = [];
    
    if (formValue.weight < 40) {
      warnings.push('El peso ingresado es inusualmente bajo (< 40 kg)');
    } else if (formValue.weight > 200) {
      warnings.push('El peso ingresado es inusualmente alto (> 200 kg)');
    }
    
    if (formValue.height < 100) {
      warnings.push('La altura ingresada es inusualmente baja (< 100 cm)');
    } else if (formValue.height > 220) {
      warnings.push('La altura ingresada es inusualmente alta (> 220 cm)');
    }
    
    const bmi = this.calculatedBMI();
    if (bmi < 16) {
      warnings.push('El IMC calculado es extremadamente bajo (< 16)');
    } else if (bmi > 40) {
      warnings.push('El IMC calculado es extremadamente alto (> 40)');
    }
    
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
        this.snackBar.open('Perfil actualizado exitosamente', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        setTimeout(() => {
          this.router.navigate(['/patient/dashboard']);
        }, 1500);
      },
      error: (error) => {
        this.snackBar.open('Error al actualizar perfil', 'Cerrar', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        console.error('Error updating patient:', error);
      }
    });
  }

  private async loadSubscription(): Promise<void> {
    this.loadingSubscription.set(true);
    try {
      const patientId = this.currentPatient()?.id;
      if (!patientId) return;

      const subscription = await firstValueFrom(
        this.subscriptionService.getActiveByPayerId('patient', patientId)
      );
      this.currentSubscription.set(subscription);
    } catch (error) {
      console.error('Error loading subscription:', error);
    } finally {
      this.loadingSubscription.set(false);
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'active': 'Activa',
      'cancelled': 'Cancelada',
      'expired': 'Expirada',
      'pending': 'Pendiente'
    };
    return labels[status] || status;
  }

  navigateToSubscription(): void {
    this.router.navigate(['/patient/subscription']);
  }

  onCancel(): void {
    this.router.navigate(['/patient/dashboard']);
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
        
        const patient = this.currentPatient();
        if (patient) {
          localStorage.removeItem(`patient_${patient.id}_2fa_verified`);
          localStorage.removeItem(`patient_${patient.id}_2fa_secret`);
        }
        
        this.snackBar.open('Autenticación en dos pasos desactivada', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
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

    const patient = this.currentPatient();
    const accountName = patient 
      ? `${patient.firstName} ${patient.lastName}`.replace(/\s+/g, ' ')
      : 'Usuario ChroniCare';
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
        this.snackBar.open('Código inválido. Por favor, ingresa un código de 6 dígitos.', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        return;
      }
      
      if (!secret) {
        this.snackBar.open('Error: No se encontró el secreto de autenticación', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        return;
      }
      
      const isValid = this.totpValidator.validateToken(code, secret);
      
      if (isValid) {
        this.twoFactorVerified.set(true);
        this.showTwoFactorSetup.set(false);
        
        const patient = this.currentPatient();
        if (patient) {
          localStorage.setItem(`patient_${patient.id}_2fa_verified`, 'true');
          localStorage.setItem(`patient_${patient.id}_2fa_secret`, secret);
        }
        
        this.snackBar.open('Autenticación en dos pasos configurada correctamente', 'Cerrar', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        
        console.log('2FA Secret saved:', secret);
      } else {
        this.snackBar.open('Código de verificación inválido. Por favor, verifica el código en Google Authenticator e inténtalo de nuevo.', 'Cerrar', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.verificationForm.patchValue({ verificationCode: '' });
      }
    } else {
      this.snackBar.open('Por favor, ingresa un código de verificación válido', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
  }

  onCopySecret(): void {
    const secret = this.twoFactorSecret().replace(/\s/g, '');
    navigator.clipboard.writeText(secret).then(() => {
      this.snackBar.open('Código secreto copiado al portapapeles', 'Cerrar', {
        duration: 2000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }).catch(() => {
      this.snackBar.open('Error al copiar el código', 'Cerrar', {
        duration: 2000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    });
  }

  onCancelTwoFactorSetup(): void {
    this.showTwoFactorSetup.set(false);
    this.profileForm.patchValue({ twoFactorEnabled: false });
    this.twoFactorSecret.set('');
    this.twoFactorQRCode.set('');
    this.verificationForm.reset();
    
    this.snackBar.open('Configuración de autenticación cancelada', 'Cerrar', {
      duration: 2000,
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  onVerificationCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.verificationForm.patchValue({ verificationCode: input.value });
  }
}
