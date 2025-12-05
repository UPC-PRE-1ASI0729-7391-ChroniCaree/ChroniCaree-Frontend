import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { TenantStore } from '../../../application/tenant.store';
import { UserStore } from '../../../../iam/application/user.store';
import { TotpValidatorService } from '../../../../shared/infrastructure/totp-validator.service';

/**
 * Hospital Profile Edit View
 * Permite al administrador del hospital editar su perfil personal y los datos del hospital
 */
@Component({
  selector: 'app-hospital-profile-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatCheckboxModule,
    TranslateModule
  ],
  templateUrl: './hospital-profile-edit.view.html',
  styleUrls: ['./hospital-profile-edit.view.css']
})
export class HospitalProfileEditView implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly tenantStore = inject(TenantStore);
  private readonly userStore = inject(UserStore);
  private readonly totpValidator = inject(TotpValidatorService);

  loading = signal(false);
  savingHospital = signal(false);
  savingAdmin = signal(false);

  hospitalForm!: FormGroup;
  adminForm!: FormGroup;
  verificationForm!: FormGroup;

  twoFactorSecret = signal<string>('');
  twoFactorQRCode = signal<string>('');
  showTwoFactorSetup = signal(false);
  twoFactorVerified = signal(false);

  currentUser: any = null;
  currentTenant: any = null;

  ngOnInit(): void {
    this.initForms();
    this.loadCurrentUserAndTenant();
  }

  private initForms(): void {
    // Formulario del hospital
    this.hospitalForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{9,10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      website: ['']
    });

    // Formulario del administrador (con 2FA)
    this.adminForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\d{9,10}$/)]],
      position: ['', Validators.required],
      twoFactorEnabled: [false]
    });

    // Formulario de verificación 2FA
    this.verificationForm = this.fb.group({
      verificationCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  private loadCurrentUserAndTenant(): void {
    this.loading.set(true);

    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
      this.loading.set(false);
      this.router.navigate(['/iam/login']);
      return;
    }

    this.currentUser = JSON.parse(currentUserStr);

    this.tenantStore.loadAllTenants().subscribe({
      next: (tenants) => {
        const tenantId = this.currentUser?.tenantId;
        if (tenantId) {
          this.currentTenant = tenants.find(t => t.id === tenantId) ?? null;
        }
        if (!this.currentTenant) {
          this.currentTenant = tenants.find(t => t.adminUserId === this.currentUser.id) ?? null;
        }

        if (this.currentTenant) {
          this.populateForms();
        } else {
          this.snackBar.open(
            this.translate.instant('hospital.profileEdit.snack.noTenant'),
            this.translate.instant('common.close'),
            { duration: 3000 }
          );
        }

        // Cargar estado de 2FA
        this.loadTwoFactorStatus();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading tenant:', err);
        this.loading.set(false);
        this.snackBar.open(
          this.translate.instant('hospital.profileEdit.snack.loadError'),
          this.translate.instant('common.close'),
          { duration: 3000 }
        );
      }
    });
  }

  private populateForms(): void {
    if (this.currentTenant) {
      this.hospitalForm.patchValue({
        name: this.currentTenant.name ?? '',
        address: this.currentTenant.address ?? '',
        city: this.currentTenant.city ?? '',
        state: this.currentTenant.state ?? '',
        zipCode: this.currentTenant.zipCode ?? '',
        phone: this.currentTenant.phone ?? '',
        email: this.currentTenant.email ?? '',
        website: this.currentTenant.website ?? ''
      });
    }

    if (this.currentUser) {
      this.adminForm.patchValue({
        fullName: this.currentUser.name ?? '',
        email: this.currentUser.email ?? '',
        phone: this.currentUser.phone ?? '',
        position: this.currentUser.position ?? this.translate.instant('hospital.profileEdit.defaults.position')
      });
    }
  }

  private loadTwoFactorStatus(): void {
    if (this.currentUser && this.currentUser.role === 'hospital_admin') {
      const userId = this.currentUser.id;
      const has2FA = localStorage.getItem(`hospital_admin_${userId}_2fa_verified`) === 'true';
      if (has2FA) {
        this.twoFactorVerified.set(true);
        this.adminForm.patchValue({ twoFactorEnabled: true });
      }
    }
  }

  saveHospitalInfo(): void {
    if (this.hospitalForm.invalid) {
      this.snackBar.open(
        this.translate.instant('hospital.profileEdit.snack.hospitalInvalid'),
        this.translate.instant('common.close'),
        { duration: 3000 }
      );
      return;
    }

    if (!this.currentTenant?.id) {
      this.snackBar.open(
        this.translate.instant('hospital.profileEdit.snack.noTenant'),
        this.translate.instant('common.close'),
        { duration: 3000 }
      );
      return;
    }

    this.savingHospital.set(true);

    const hospitalData = {
      ...this.currentTenant,
      ...this.hospitalForm.value
    };

    this.tenantStore.updateTenant(hospitalData).subscribe({
      next: () => {
        this.savingHospital.set(false);
        this.snackBar.open(
          this.translate.instant('hospital.profileEdit.snack.hospitalSaved'),
          this.translate.instant('common.close'),
          { duration: 3000 }
        );
      },
      error: (err) => {
        console.error('Error updating hospital:', err);
        this.savingHospital.set(false);
        this.snackBar.open(
          this.translate.instant('hospital.profileEdit.snack.hospitalSaveError'),
          this.translate.instant('common.close'),
          { duration: 3000 }
        );
      }
    });
  }

  saveAdminProfile(): void {
    if (this.adminForm.invalid) {
      this.snackBar.open(
        this.translate.instant('hospital.profileEdit.snack.adminInvalid'),
        this.translate.instant('common.close'),
        { duration: 3000 }
      );
      return;
    }

    if (!this.currentUser?.id) {
      this.router.navigate(['/iam/login']);
      return;
    }

    this.savingAdmin.set(true);

    const userData = {
      ...this.currentUser,
      name: this.adminForm.value.fullName,
      email: this.adminForm.value.email,
      phone: this.adminForm.value.phone,
      position: this.adminForm.value.position
    };

    this.userStore.updateUser(userData).subscribe({
      next: (updatedUser) => {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.currentUser = updatedUser;

        this.savingAdmin.set(false);
        this.snackBar.open(
          this.translate.instant('hospital.profileEdit.snack.adminSaved'),
          this.translate.instant('common.close'),
          { duration: 3000 }
        );
      },
      error: (err) => {
        console.error('Error updating user:', err);
        this.savingAdmin.set(false);
        this.snackBar.open(
          this.translate.instant('hospital.profileEdit.snack.adminSaveError'),
          this.translate.instant('common.close'),
          { duration: 3000 }
        );
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/hospital/dashboard']);
  }

  // ========== MÉTODOS DE 2FA ==========

  onTwoFactorToggle(): void {
    const isEnabled = this.adminForm.get('twoFactorEnabled')?.value;
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
        
        if (this.currentUser) {
          const userId = this.currentUser.id;
          localStorage.removeItem(`hospital_admin_${userId}_2fa_verified`);
          localStorage.removeItem(`hospital_admin_${userId}_2fa_secret`);
        }
        
        this.snackBar.open('Autenticación en dos pasos desactivada', 'Cerrar', { duration: 3000 });
      } else {
        this.adminForm.patchValue({ twoFactorEnabled: true });
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

    const accountName = this.currentUser?.name || 'Administrador ChroniCare';
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
        this.snackBar.open('Código inválido. Por favor, ingresa un código de 6 dígitos.', 'Cerrar', { duration: 3000 });
        return;
      }
      
      if (!secret) {
        this.snackBar.open('Error: No se encontró el secreto de autenticación', 'Cerrar', { duration: 3000 });
        return;
      }
      
      const isValid = this.totpValidator.validateToken(code, secret);
      
      if (isValid) {
        this.twoFactorVerified.set(true);
        this.showTwoFactorSetup.set(false);
        
        if (this.currentUser) {
          const userId = this.currentUser.id;
          localStorage.setItem(`hospital_admin_${userId}_2fa_verified`, 'true');
          localStorage.setItem(`hospital_admin_${userId}_2fa_secret`, secret);
        }
        
        this.snackBar.open('Autenticación en dos pasos configurada correctamente', 'Cerrar', { duration: 4000 });
      } else {
        this.snackBar.open('Código de verificación inválido. Por favor, verifica el código en Google Authenticator e inténtalo de nuevo.', 'Cerrar', { duration: 4000 });
        this.verificationForm.patchValue({ verificationCode: '' });
      }
    } else {
      this.snackBar.open('Por favor, ingresa un código de verificación válido', 'Cerrar', { duration: 3000 });
    }
  }

  onCopySecret(): void {
    const secret = this.twoFactorSecret().replace(/\s/g, '');
    navigator.clipboard.writeText(secret).then(() => {
      this.snackBar.open('Código secreto copiado al portapapeles', 'Cerrar', { duration: 2000 });
    }).catch(() => {
      this.snackBar.open('Error al copiar el código', 'Cerrar', { duration: 2000 });
    });
  }

  onCancelTwoFactorSetup(): void {
    this.showTwoFactorSetup.set(false);
    this.adminForm.patchValue({ twoFactorEnabled: false });
    this.twoFactorSecret.set('');
    this.twoFactorQRCode.set('');
    this.verificationForm.reset();
    this.snackBar.open('Configuración de autenticación cancelada', 'Cerrar', { duration: 2000 });
  }

  onVerificationCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.verificationForm.patchValue({ verificationCode: input.value });
  }
}