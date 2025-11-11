import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HospitalDashboardStore } from '../../../../tenants/application/hospital-dashboard.store';
import { DoctorService } from '../../../../doctors/infrastructure/doctor.service';

interface DoctorView {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  specialty: string;
  licenseNumber: string;
  phone?: string;
  isVerified: boolean;
  acceptingPatients: boolean;
  joinedAt: string;
}

@Component({
  selector: 'app-doctors-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './doctors-management.component.html',
  styleUrls: ['./doctors-management.component.css']
})
export class DoctorsManagementComponent implements OnInit {
  private readonly store = inject(HospitalDashboardStore);
  private readonly doctorService = inject(DoctorService);
  private readonly fb = inject(FormBuilder);

  // UI State
  showModal = signal<boolean>(false);
  modalMode = signal<'register' | 'invite'>('register');
  isSubmitting = signal<boolean>(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  // Doctors List
  doctors = signal<DoctorView[]>([]);
  isLoadingDoctors = signal<boolean>(false);

  // Forms
  registerForm!: FormGroup;
  inviteForm!: FormGroup;

  // Computed
  canAddDoctors = computed(() => this.store.stats()?.availableDoctorSlots || 0 > 0);
  doctorsCount = computed(() => this.doctors().length);

  ngOnInit(): void {
    this.initForms();
    this.loadDoctors();
  }

  initForms(): void {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      dni: ['', [Validators.required]],
      specialty: ['', [Validators.required]],
      licenseNumber: ['', [Validators.required]],
      phone: ['']
    });

    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  loadDoctors(): void {
    this.isLoadingDoctors.set(true);
    const tenantId = 1; // TODO: Get from auth service

    this.doctorService.getByTenantId(tenantId).subscribe({
      next: (doctors) => {
        const doctorViews: DoctorView[] = doctors.map(d => ({
          id: d.id,
          userId: d.userId,
          firstName: d.firstName,
          lastName: d.lastName,
          fullName: `${d.firstName} ${d.lastName}`,
          specialty: d.specialty,
          licenseNumber: d.licenseNumber,
          phone: d.phone,
          isVerified: d.isVerified,
          acceptingPatients: d.acceptingPatients,
          joinedAt: d.joinedAt
        }));
        this.doctors.set(doctorViews);
        this.isLoadingDoctors.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Error al cargar doctores: ' + err.message);
        this.isLoadingDoctors.set(false);
      }
    });
  }

  openModal(mode: 'register' | 'invite'): void {
    this.modalMode.set(mode);
    this.showModal.set(true);
    this.resetMessages();
    
    if (mode === 'register') {
      this.registerForm.reset();
    } else {
      this.inviteForm.reset();
    }
  }

  closeModal(): void {
    this.showModal.set(false);
    this.resetMessages();
  }

  resetMessages(): void {
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  onRegisterDoctor(): void {
    if (this.registerForm.invalid) {
      this.errorMessage.set('Por favor complete todos los campos requeridos');
      return;
    }

    this.isSubmitting.set(true);
    const tenantId = 1; // TODO: Get from auth service
    const adminUserId = 4; // TODO: Get from auth service

    const formValue = this.registerForm.value;
    const request = {
      tenantId,
      email: formValue.email,
      password: formValue.password,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      licenseNumber: formValue.licenseNumber,
      specialty: formValue.specialty,
      phone: formValue.phone || undefined
    };

    this.store.registerDoctor(request).subscribe({
      next: (result) => {
        if (result.success) {
          this.successMessage.set('Doctor registrado exitosamente');
          setTimeout(() => {
            this.closeModal();
            this.loadDoctors();
          }, 2000);
        } else {
          this.errorMessage.set(result.message);
        }
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Error al registrar doctor: ' + err.message);
        this.isSubmitting.set(false);
      }
    });
  }

  onInviteDoctor(): void {
    if (this.inviteForm.invalid) {
      this.errorMessage.set('Por favor ingrese un email válido');
      return;
    }

    this.isSubmitting.set(true);
    const tenantId = 1; // TODO: Get from auth service
    const invitedBy = 4; // TODO: Get from auth service

    const request = {
      tenantId,
      invitedBy,
      email: this.inviteForm.value.email
    };

    this.store.inviteDoctor(request).subscribe({
      next: (result) => {
        if (result.success) {
          this.successMessage.set('Invitación enviada exitosamente');
          setTimeout(() => {
            this.closeModal();
          }, 2000);
        } else {
          this.errorMessage.set(result.message);
        }
        this.isSubmitting.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Error al enviar invitación: ' + err.message);
        this.isSubmitting.set(false);
      }
    });
  }

  toggleAcceptingPatients(doctor: DoctorView): void {
    // TODO: Implement toggle accepting patients
    console.log('Toggle accepting patients for doctor:', doctor.id);
  }

  viewDoctorProfile(doctor: DoctorView): void {
    // TODO: Navigate to doctor profile
    console.log('View doctor profile:', doctor.id);
  }
}
