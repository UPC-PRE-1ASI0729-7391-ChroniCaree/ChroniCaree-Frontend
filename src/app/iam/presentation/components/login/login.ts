import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../application/auth.service';
import { PatientStore } from '../../../../patients/application/patient.store';
import { DoctorStore } from '../../../../doctors/application/doctor.store';
import { TotpValidatorService } from '../../../../shared/infrastructure/totp-validator.service';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  form = signal<LoginForm>({
    email: '',
    password: '',
    rememberMe: false
  });

  submitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  
  showTwoFactorVerification = signal<boolean>(false);
  twoFactorCode = signal<string>('');
  verifyingCode = signal<boolean>(false);
  authenticatedUser: any = null;
  pendingNavigation: string | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private patientStore: PatientStore,
    private doctorStore: DoctorStore,
    private totpValidator: TotpValidatorService
  ) {}

  ngOnInit(): void {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      this.form.update(current => ({
        ...current,
        email: rememberedEmail,
        rememberMe: true
      }));
    }
  }

  updateForm(field: keyof LoginForm, value: string | boolean): void {
    this.form.update(current => ({
      ...current,
      [field]: value
    }));
  }

  quickLogin(type: 'doctor' | 'patient'): void {
    return;
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    this.submitting.set(true);

    const { email, password, rememberMe } = this.form();

    if (!email || !password) {
      this.errorMessage.set('Por favor completa todos los campos');
      this.submitting.set(false);
      return;
    }

    this.authService.signIn({ email, password }).subscribe({
      next: () => {
        // Remember me functionality
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        const role = this.authService.getUserRole();
        const userId = this.authService.getCurrentUserId();
        console.log('Login successful. Detected role:', role);

        // Normalize role to lowercase for comparison
        const normalizedRole = role ? role.toLowerCase() : '';

        // Check if 2FA is enabled based on role
        if (normalizedRole.includes('patient')) {
          this.checkPatient2FA(userId, email);
        } else if (normalizedRole.includes('doctor')) {
          this.checkDoctor2FA(userId, email);
        } else if (normalizedRole.includes('hospital') || normalizedRole.includes('admin') || normalizedRole.includes('tenant')) {
          this.checkHospitalAdmin2FA(userId, email);
        } else {
          console.warn('Unknown role, redirecting to home:', role);
          this.submitting.set(false);
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.submitting.set(false);
        
        // Handle specific error messages thrown by AuthService
        if (err.message === 'Correo electrónico o contraseña incorrectos.') {
          this.errorMessage.set('❌ Correo electrónico o contraseña incorrectos.');
        } else if (err.status === 401 || err.status === 404) {
          this.errorMessage.set('❌ Correo electrónico o contraseña incorrectos.');
        } else {
          this.errorMessage.set('⚠️ Error al conectar con el servidor. Por favor intenta de nuevo.');
        }
      }
    });
  }

  private checkPatient2FA(userId: string, email: string): void {
    this.patientStore.loadAllPatients().subscribe({
      next: (patients) => {
        const patient = patients.find(p => p.userId === userId);
        const patientId = patient?.id;
        
        if (patientId) {
          const has2FA = localStorage.getItem(`patient_${patientId}_2fa_verified`) === 'true';
          
          if (has2FA) {
            this.authenticatedUser = { email, role: 'patient', patientId, userId };
            this.submitting.set(false);
            this.showTwoFactorVerification.set(true);
            this.errorMessage.set(null);
            this.pendingNavigation = '/patient/dashboard';
            return;
          }
        }
        
        // No 2FA enabled, proceed to dashboard
        this.submitting.set(false);
        this.router.navigate(['/patient/dashboard']);
      },
      error: (error) => {
        console.error('Error loading patients for 2FA check:', error);
        this.submitting.set(false);
        this.router.navigate(['/patient/dashboard']);
      }
    });
  }

  private checkDoctor2FA(userId: string, email: string): void {
    this.doctorStore.loadAllDoctors().subscribe({
      next: (doctors) => {
        const doctor = doctors.find(d => d.userId === userId);
        const doctorId = doctor?.id;
        
        if (doctorId) {
          const has2FA = localStorage.getItem(`doctor_${doctorId}_2fa_verified`) === 'true';
          
          if (has2FA) {
            this.authenticatedUser = { email, role: 'doctor', doctorId, userId };
            this.submitting.set(false);
            this.showTwoFactorVerification.set(true);
            this.errorMessage.set(null);
            this.pendingNavigation = '/doctor/dashboard';
            return;
          }
        }
        
        // No 2FA enabled, proceed to dashboard
        this.submitting.set(false);
        this.router.navigate(['/doctor/dashboard']);
      },
      error: (error) => {
        console.error('Error loading doctors for 2FA check:', error);
        this.submitting.set(false);
        this.router.navigate(['/doctor/dashboard']);
      }
    });
  }

  private checkHospitalAdmin2FA(userId: string, email: string): void {
    const has2FA = localStorage.getItem(`hospital_admin_${userId}_2fa_verified`) === 'true';
    
    if (has2FA) {
      this.authenticatedUser = { email, role: 'hospital_admin', userId };
      this.submitting.set(false);
      this.showTwoFactorVerification.set(true);
      this.errorMessage.set(null);
      this.pendingNavigation = '/hospital/dashboard';
    } else {
      // No 2FA enabled, proceed to dashboard
      this.submitting.set(false);
      this.router.navigate(['/hospital/dashboard']);
    }
  }

  onTwoFactorCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value.length > 6) {
      input.value = input.value.substring(0, 6);
    }
    this.twoFactorCode.set(input.value);
  }

  onVerifyTwoFactorCode(): void {
    const code = this.twoFactorCode();
    
    if (!code || code.length !== 6) {
      this.errorMessage.set('Por favor ingresa un código de 6 dígitos');
      return;
    }

    this.verifyingCode.set(true);
    this.errorMessage.set(null);
    
    setTimeout(() => {
      const patientId = this.authenticatedUser?.patientId;
      const doctorId = this.authenticatedUser?.doctorId;
      const userId = this.authenticatedUser?.userId;
      const userRole = this.authenticatedUser?.role;
      
      let savedSecret: string | null = null;
      
      if (userRole === 'patient' && patientId) {
        savedSecret = localStorage.getItem(`patient_${patientId}_2fa_secret`);
      } else if (userRole === 'doctor' && doctorId) {
        savedSecret = localStorage.getItem(`doctor_${doctorId}_2fa_secret`);
      } else if (userRole === 'hospital_admin' && userId) {
        savedSecret = localStorage.getItem(`hospital_admin_${userId}_2fa_secret`);
      }
      
      if (!savedSecret) {
        this.errorMessage.set('Error: No se encontró el secreto de autenticación');
        this.verifyingCode.set(false);
        return;
      }
      
      const isValid = this.totpValidator.validateToken(code, savedSecret);
      
      if (isValid) {
        this.completeLogin();
      } else {
        this.errorMessage.set('Código de verificación inválido. Por favor, verifica el código en Google Authenticator.');
        this.verifyingCode.set(false);
        this.twoFactorCode.set('');
      }
    }, 300);
  }

  onCancelTwoFactorVerification(): void {
    this.showTwoFactorVerification.set(false);
    this.twoFactorCode.set('');
    this.authenticatedUser = null;
    this.pendingNavigation = null;
    this.verifyingCode.set(false);
    this.errorMessage.set(null);
  }

  private completeLogin(): void {
    setTimeout(() => {
      this.submitting.set(false);
      this.verifyingCode.set(false);
      this.showTwoFactorVerification.set(false);
      
      if (this.pendingNavigation) {
        this.router.navigate([this.pendingNavigation]);
      }
      
      this.authenticatedUser = null;
      this.pendingNavigation = null;
    }, 300);
  }
}