import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HospitalDashboardStore } from '../../../../tenants/application/hospital-dashboard.store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface DoctorForm {
  name: string;
  specialty: string;
  email: string;
  phone: string;
  licenseNumber: string;
  dni: string; 
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-add-doctor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule
  ],
  templateUrl: './add-doctor.view.html',
  styleUrls: ['./add-doctor.view.css']
})
export class AddDoctorView {
  private dashboardStore = inject(HospitalDashboardStore);
  private router = inject(Router);
  private translate = inject(TranslateService); // 3. Inyectar el servicio de traducción

  form = signal<DoctorForm>({
    name: '',
    specialty: '',
    email: '',
    phone: '',
    licenseNumber: '',
    dni: '',
    password: '',
    confirmPassword: ''
  });

  submitting = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<boolean>(false);

  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);

  specialties = [
    'Cardiología',
    'Dermatología',
    'Endocrinología',
    'Gastroenterología',
    'Medicina General',
    'Medicina Interna',
    'Nefrología',
    'Neumología',
    'Neurología',
    'Oncología',
    'Pediatría',
    'Psiquiatría',
    'Traumatología',
    'Urología'
  ];

  updateForm(field: keyof DoctorForm, value: string): void {
    this.form.update(current => ({
      ...current,
      [field]: value
    }));
  }

  toggleShowPassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  generatePassword(): void {
    const pwd = this.generateSecurePassword(12);
    this.form.update(c => ({ ...c, password: pwd, confirmPassword: pwd }));
  }

  private generateSecurePassword(length = 12): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghijkmnopqrstuvwxyz';
    const digits = '23456789';
    const symbols = '!@#$%*?';

    const all = upper + lower + digits + symbols;

    const rand = (max: number) => {
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const arr = new Uint32Array(1);
        crypto.getRandomValues(arr);
        return arr[0] % max;
      }
      return Math.floor(Math.random() * max);
    };

    const pick = (set: string) => set[rand(set.length)];

    let pass = pick(upper) + pick(lower) + pick(digits) + pick(symbols);
    while (pass.length < length) pass += pick(all);

    // shuffle
    return pass
      .split('')
      .sort(() => rand(1000) - 500)
      .join('');
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  validateForm(): boolean {
    const f = this.form();

    if (!f.name.trim()) {
      this.error.set(this.translate.instant('common.errors.required'));
      return false;
    }

    if (!f.specialty) {
      this.error.set(this.translate.instant('common.errors.required'));
      return false;
    }

    if (!f.email.trim() || !this.isValidEmail(f.email)) {
      this.error.set(this.translate.instant('hospital.profileEdit.errors.email'));
      return false;
    }

    if (!f.phone.trim()) {
      this.error.set(this.translate.instant('common.errors.required'));
      return false;
    }

    if (!f.licenseNumber.trim()) {
      this.error.set(this.translate.instant('common.errors.required'));
      return false;
    }


    // Validar DNI (requerido por backend, mínimo 8 caracteres)
    if (!f.dni.trim()) {
      this.error.set('El DNI es requerido');
      return false;
    }

    if (f.dni.trim().length < 8 || f.dni.trim().length > 20) {
      this.error.set('El DNI debe tener entre 8 y 20 caracteres');
      return false;
    }


    if (!f.password || !f.confirmPassword) {
      this.error.set(this.translate.instant('common.errors.required'));
      return false;
    }

    if (f.password.length < 8) {
      this.error.set(this.translate.instant('common.errors.minlength', { min: 8 }));
      return false;
    }

    if (f.password !== f.confirmPassword) {
      this.error.set('Las contraseñas no coinciden');
      return false;
    }

    this.error.set(null);
    return true;
  }

  onSubmit(): void {
    if (!this.validateForm()) return;

    this.submitting.set(true);
    this.error.set(null);

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const tenantId = currentUser.tenantId;

    if (!tenantId) {
      this.error.set(this.translate.instant('hospital.profileEdit.snack.noTenant'));
      this.submitting.set(false);
      return;
    }
    const f = this.form();

    const nameParts = f.name.trim().replace(/\s+/g, ' ').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

    const request = {
      tenantId,
      email: f.email.trim(),
      password: f.password,
      firstName,
      lastName,
      licenseNumber: f.licenseNumber.trim(),
      specialty: f.specialty,
      phone: f.phone.trim(),
      dni: f.dni.trim() // DNI requerido por backend
    };
    this.dashboardStore.registerDoctorAsAdmin(request).subscribe({
      next: () => {
        this.success.set(true);
        this.submitting.set(false);

        setTimeout(() => {
          this.router.navigate(['/hospital/doctors']);
        }, 2000);
      },
      error: (err) => {
        this.error.set(err?.message || 'Error al registrar el doctor');
        this.submitting.set(false);
        console.error('Error registering doctor:', err);
      }
    });
  }
  cancel(): void {
    this.router.navigate(['/hospital/doctors']);
  }
}
