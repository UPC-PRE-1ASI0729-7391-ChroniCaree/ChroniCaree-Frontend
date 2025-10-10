import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserStore } from '../../../application/user.store';
import { PatientStore } from '../../../../patients/application/patient.store';

interface PatientRegistrationForm {
  // User data
  email: string;
  password: string;
  confirmPassword: string;
  
  // Patient data
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  gender: string;
  phone: string;
  address: string;
}

@Component({
  selector: 'app-register-patient',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register-patient.html',
  styleUrls: ['./register-patient.css']
})
export class RegisterPatientComponent {
  form = signal<PatientRegistrationForm>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dni: '',
    birthDate: '',
    gender: 'male',
    phone: '',
    address: ''
  });

  currentStep = signal<number>(1);
  submitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private userStore: UserStore,
    private patientStore: PatientStore,
    private router: Router
  ) {}

  nextStep(): void {
    if (this.currentStep() < 2) {
      this.currentStep.update(step => step + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
    }
  }

  updateForm(field: keyof PatientRegistrationForm, value: string): void {
    this.form.update(current => ({
      ...current,
      [field]: value
    }));
  }

  validateStep1(): boolean {
    const f = this.form();
    if (!f.email || !f.password || !f.confirmPassword) {
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
    if (!f.firstName || !f.lastName || !f.dni || !f.birthDate || !f.phone || !f.address) {
      this.errorMessage.set('Todos los campos son requeridos');
      return false;
    }
    this.errorMessage.set(null);
    return true;
  }

  onNextStep(): void {
    if (this.currentStep() === 1 && this.validateStep1()) {
      this.nextStep();
    }
  }

  onSubmit(): void {
    if (!this.validateStep1() || !this.validateStep2()) {
      return;
    }

    this.submitting.set(true);
    const f = this.form();

    // Create user
    const newUser = {
      id: Date.now(),
      email: f.email,
      role: 'patient' as const,
      name: `${f.firstName} ${f.lastName}`,
      password: f.password,
      isVerified: false,
      twoFactorEnabled: false
    };

    this.userStore.createUser(newUser).subscribe({
      next: (user) => {
        // Create patient profile
        const newPatient = {
          id: Date.now(),
          userId: user.id,
          assignedDoctorId: null,
          tenantId: null,
          subscriptionId: null,
          firstName: f.firstName,
          lastName: f.lastName,
          dni: f.dni,
          birthDate: f.birthDate,
          gender: f.gender,
          phone: f.phone,
          address: f.address,
          weight: 0,
          height: 0,
          bmi: 0
        };

        this.patientStore.createPatient(newPatient).subscribe({
          next: () => {
            this.submitting.set(false);
            alert('¡Registro exitoso! Ahora puedes iniciar sesión.');
            this.router.navigate(['/iam/login']);
          },
          error: (err) => {
            this.submitting.set(false);
            this.errorMessage.set('Error al crear el perfil de paciente');
            console.error('Error creating patient:', err);
          }
        });
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set('Error al crear el usuario');
        console.error('Error creating user:', err);
      }
    });
  }
}
