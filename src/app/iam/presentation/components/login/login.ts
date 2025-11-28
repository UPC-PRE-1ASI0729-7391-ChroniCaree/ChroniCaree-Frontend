import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserStore } from '../../../application/user.store';
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
    private userStore: UserStore,
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

    this.userStore.loadAllUsers().subscribe({
      next: (users) => {
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }

          if (user.role === 'patient') {
            this.patientStore.loadAllPatients().subscribe({
              next: (patients) => {
                const patient = patients.find(p => p.userId === user.id);
                const patientId = patient?.id;
                
                if (patientId) {
                  const has2FA = localStorage.getItem(`patient_${patientId}_2fa_verified`) === 'true';
                  
                  if (has2FA) {
                    this.authenticatedUser = { ...user, patientId };
                    this.submitting.set(false);
                    this.showTwoFactorVerification.set(true);
                    this.errorMessage.set(null);
                    
                    this.pendingNavigation = '/patient/dashboard';
                    return;
                  }
                }
                
                this.completeLogin(user);
              },
              error: (error) => {
                console.error('Error loading patients for 2FA check:', error);
                this.completeLogin(user);
              }
            });
          } else if (user.role === 'doctor') {
            this.doctorStore.loadAllDoctors().subscribe({
              next: (doctors) => {
                const doctor = doctors.find(d => d.userId === user.id);
                const doctorId = doctor?.id;
                
                if (doctorId) {
                  const has2FA = localStorage.getItem(`doctor_${doctorId}_2fa_verified`) === 'true';
                  
                  if (has2FA) {
                    this.authenticatedUser = { ...user, doctorId };
                    this.submitting.set(false);
                    this.showTwoFactorVerification.set(true);
                    this.errorMessage.set(null);
                    
                    this.pendingNavigation = '/doctor/dashboard';
                    return;
                  }
                }
                
                this.completeLogin(user);
              },
              error: (error) => {
                console.error('Error loading doctors for 2FA check:', error);
                this.completeLogin(user);
              }
            });
          } else if (user.role === 'hospital_admin') {
            const userId = user.id;
            const has2FA = localStorage.getItem(`hospital_admin_${userId}_2fa_verified`) === 'true';
            
            if (has2FA) {
              this.authenticatedUser = { ...user };
              this.submitting.set(false);
              this.showTwoFactorVerification.set(true);
              this.errorMessage.set(null);
              
              this.pendingNavigation = '/hospital/dashboard';
              return;
            } else {
              this.completeLogin(user);
            }
          } else {
            this.completeLogin(user);
          }
        } else {
          this.errorMessage.set('Email o contraseña incorrectos');
          this.submitting.set(false);
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage.set('Error al conectar con el servidor. Por favor intenta de nuevo.');
        this.submitting.set(false);
      }
    });
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
      const userId = this.authenticatedUser?.id;
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
        this.completeLogin(this.authenticatedUser);
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

  private completeLogin(user: any): void {
    this.userStore.setCurrentUser(user);

    setTimeout(() => {
      this.submitting.set(false);
      this.verifyingCode.set(false);
      this.showTwoFactorVerification.set(false);
      
      const navigationPath = this.pendingNavigation || 
        (user.role === 'patient' ? '/patient/dashboard' :
         user.role === 'doctor' ? '/doctor/dashboard' :
         user.role === 'hospital_admin' ? '/hospital/dashboard' : '/home');
      
      this.router.navigate([navigationPath]);
      this.authenticatedUser = null;
      this.pendingNavigation = null;
    }, 300);
  }
}
