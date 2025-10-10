import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserStore } from '../../../application/user.store';
import { TenantStore } from '../../../../tenants/application/tenant.store';

interface HospitalRegistrationForm {
  // User data
  email: string;
  password: string;
  confirmPassword: string;
  adminName: string;
  
  // Hospital/Tenant data
  hospitalName: string;
  address: string;
  phone: string;
  plan: 'basic' | 'professional' | 'enterprise';
}

@Component({
  selector: 'app-register-hospital',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register-hospital.html',
  styleUrls: ['./register-hospital.css']
})
export class RegisterHospitalComponent {
  form = signal<HospitalRegistrationForm>({
    email: '',
    password: '',
    confirmPassword: '',
    adminName: '',
    hospitalName: '',
    address: '',
    phone: '',
    plan: 'basic'
  });

  currentStep = signal<number>(1);
  submitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private userStore: UserStore,
    private tenantStore: TenantStore,
    private router: Router
  ) {}

  nextStep(): void {
    if (this.currentStep() < 3) {
      this.currentStep.update(step => step + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
    }
  }

  updateForm(field: keyof HospitalRegistrationForm, value: string): void {
    this.form.update(current => ({
      ...current,
      [field]: value
    }));
  }

  validateStep1(): boolean {
    const f = this.form();
    if (!f.email || !f.password || !f.confirmPassword || !f.adminName) {
      this.errorMessage.set('Todos los campos son requeridos');
      return false;
    }
    if (f.password !== f.confirmPassword) {
      this.errorMessage.set('Las contraseñas no coinciden');
      return false;
    }
    if (f.password.length < 8) {
      this.errorMessage.set('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    this.errorMessage.set(null);
    return true;
  }

  validateStep2(): boolean {
    const f = this.form();
    if (!f.hospitalName || !f.address || !f.phone) {
      this.errorMessage.set('Todos los campos son requeridos');
      return false;
    }
    this.errorMessage.set(null);
    return true;
  }

  onNextStep(): void {
    if (this.currentStep() === 1 && this.validateStep1()) {
      this.nextStep();
    } else if (this.currentStep() === 2 && this.validateStep2()) {
      this.nextStep();
    }
  }

  onSubmit(): void {
    if (!this.validateStep1() || !this.validateStep2()) {
      return;
    }

    this.submitting.set(true);
    const f = this.form();

    // 1. Create user (hospital_admin)
    const newUser = {
      id: Date.now(), // Mock ID
      email: f.email,
      role: 'hospital_admin' as const,
      name: f.adminName,
      password: f.password,
      isVerified: false,
      twoFactorEnabled: false
    };

    this.userStore.createUser(newUser).subscribe({
      next: (user) => {
        // 2. Create tenant (hospital)
        const newTenant = {
          id: Date.now(), // Mock ID
          name: f.hospitalName,
          address: f.address,
          phone: f.phone,
          plan: f.plan,
          status: 'pending' as const,
          registrationDate: new Date().toISOString()
        };

        this.tenantStore.createTenant(newTenant).subscribe({
          next: () => {
            this.submitting.set(false);
            alert('¡Registro exitoso! Tu solicitud está siendo revisada.');
            this.router.navigate(['/iam/login']);
          },
          error: (err) => {
            this.submitting.set(false);
            this.errorMessage.set('Error al registrar el hospital');
            console.error('Error creating tenant:', err);
          }
        });
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set('Error al crear el usuario administrador');
        console.error('Error creating user:', err);
      }
    });
  }
}
