import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RegistrationFacade } from '../../../infrastructure/registration.facade';
import { SubscriptionService } from '../../../../subscriptions/infrastructure/subscription.service';
import { SubscriptionPlanEntity } from '../../../../subscriptions/domain/model/subscription-plan.entity';

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
  
  // Subscription data
  selectedPlanId: string | null;
}

@Component({
  selector: 'app-register-hospital',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register-hospital.html',
  styleUrls: ['./register-hospital.css']
})
export class RegisterHospitalComponent implements OnInit {
  private registrationFacade = inject(RegistrationFacade);
  private subscriptionService = inject(SubscriptionService);
  private router = inject(Router);

  form = signal<HospitalRegistrationForm>({
    email: '',
    password: '',
    confirmPassword: '',
    adminName: '',
    hospitalName: '',
    address: '',
    phone: '',
    selectedPlanId: null
  });

  currentStep = signal<number>(1);
  submitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  availablePlans = signal<SubscriptionPlanEntity[]>([]);
  loadingPlans = signal<boolean>(false);

  ngOnInit(): void {
    this.loadPlans();
  }

  private loadPlans(): void {
    this.loadingPlans.set(true);
    this.subscriptionService.getPlansByType('tenant').subscribe({
      next: (plans) => {
        this.availablePlans.set(plans);
        this.loadingPlans.set(false);
      },
      error: (err) => {
        console.error('Error loading plans:', err);
        this.errorMessage.set('Error al cargar los planes disponibles');
        this.loadingPlans.set(false);
      }
    });
  }

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

  updateForm(field: keyof HospitalRegistrationForm, value: string | null): void {
    this.form.update(current => ({
      ...current,
      [field]: value
    }));
  }

  selectPlan(planId: string): void {
    this.updateForm('selectedPlanId', planId);
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

  validateStep3(): boolean {
    const f = this.form();
    if (!f.selectedPlanId) {
      this.errorMessage.set('Por favor selecciona un plan');
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
    if (!this.validateStep1() || !this.validateStep2() || !this.validateStep3()) {
      return;
    }

    this.submitting.set(true);
    const f = this.form();

    const registrationData = {
      email: f.email,
      password: f.password,
      adminName: f.adminName,
      hospitalName: f.hospitalName,
      address: f.address,
      phone: f.phone,
      planId: f.selectedPlanId!
    };

    this.registrationFacade.registerHospital(registrationData).subscribe({
      next: (result) => {
        this.submitting.set(false);
        
        // Save user to localStorage
        localStorage.setItem('currentUser', JSON.stringify({
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          name: result.user.name,
          tenantId: result.user.tenantId
        }));

        // Hospitals always need payment
        alert('¡Registro exitoso! Procede con el pago para activar tu suscripción.');
        this.router.navigate(['/hospital/subscription']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMessage.set(err.message || 'Error al completar el registro');
        console.error('Error in registration:', err);
      }
    });
  }
}
