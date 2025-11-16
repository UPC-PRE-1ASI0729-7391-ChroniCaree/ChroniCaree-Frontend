import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HospitalDashboardStore } from '../../../../tenants/application/hospital-dashboard.store';

interface DoctorForm {
  name: string;
  specialty: string;
  email: string;
  phone: string;
  licenseNumber: string;
}

@Component({
  selector: 'app-add-doctor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-doctor.view.html',
  styleUrls: ['./add-doctor.view.css']
})
export class AddDoctorView {
  private dashboardStore = inject(HospitalDashboardStore);
  private router = inject(Router);

  form = signal<DoctorForm>({
    name: '',
    specialty: '',
    email: '',
    phone: '',
    licenseNumber: ''
  });

  submitting = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<boolean>(false);

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

  validateForm(): boolean {
    const f = this.form();
    
    if (!f.name.trim()) {
      this.error.set('El nombre es requerido');
      return false;
    }

    if (!f.specialty) {
      this.error.set('La especialidad es requerida');
      return false;
    }

    if (!f.email.trim() || !f.email.includes('@')) {
      this.error.set('Email inválido');
      return false;
    }

    if (!f.phone.trim()) {
      this.error.set('El teléfono es requerido');
      return false;
    }

    if (!f.licenseNumber.trim()) {
      this.error.set('El número de licencia es requerido');
      return false;
    }

    this.error.set(null);
    return true;
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    this.submitting.set(true);
    this.error.set(null);

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const tenantId = currentUser.tenantId;

    if (!tenantId) {
      this.error.set('No se encontró el hospital asociado');
      this.submitting.set(false);
      return;
    }

    const f = this.form();

    // Separar nombre en firstName y lastName
    const nameParts = f.name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];

    const request = {
      tenantId,
      email: f.email,
      password: 'temp' + Math.random().toString(36).slice(-8), // Password temporal
      firstName,
      lastName,
      licenseNumber: f.licenseNumber,
      specialty: f.specialty,
      phone: f.phone
    };

    // Use admin flow that doesn't require tenant subscription
    this.dashboardStore.registerDoctorAsAdmin(request).subscribe({
      next: () => {
        this.success.set(true);
        this.submitting.set(false);
        
        // Mostrar mensaje de éxito y redirigir después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/hospital/doctors']);
        }, 2000);
      },
      error: (err) => {
        this.error.set(err.message || 'Error al registrar el doctor');
        this.submitting.set(false);
        console.error('Error registering doctor:', err);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/hospital/doctors']);
  }
}
