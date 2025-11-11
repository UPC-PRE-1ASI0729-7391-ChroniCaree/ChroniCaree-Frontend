import { Component, signal, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserStore } from '../../../application/user.store';
import { TenantStore } from '../../../../tenants/application/tenant.store';
import { User } from '../../../domain/model/user.entity';
import { SubscriptionService } from '../../../../subscriptions/infrastructure/subscription.service';
import { SubscriptionPlanEntity } from '../../../../subscriptions/domain/model/subscription-plan.entity';
import { PaymentStore } from '../../../../payments/application/payment.store';
import { StripeService } from '../../../../payments/infrastructure/stripe.service';

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
  
  // Payment
  selectedPlanId: string | null;
}

@Component({
  selector: 'app-register-hospital',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register-hospital.html',
  styleUrls: ['./register-hospital.css']
})
export class RegisterHospitalComponent implements AfterViewInit {
  @ViewChild('cardElement') cardElement!: ElementRef;

  private userStore = inject(UserStore);
  private tenantStore = inject(TenantStore);
  private subscriptionService = inject(SubscriptionService);
  private paymentStore = inject(PaymentStore);
  private stripeService = inject(StripeService);
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
  cardholderName = signal<string>('');
  acceptTerms = signal<boolean>(false);
  // Stripe availability signals
  stripeAvailable = signal(false);
  stripeBlocked = signal(false);
  
  private cardMounted = false;
  private createdUserId: number | null = null;
  private createdTenantId: number | null = null;

  ngAfterViewInit(): void {
    // Initialize Stripe (already loaded via script tag in index.html)
    this.stripeService.initializeStripe();
  }

  /** Retry initializing Stripe (used when blocked by adblock) */
  retryStripeLoad(): void {
    this.errorMessage.set(null);
    this.stripeBlocked.set(false);
    this.stripeService.initializeStripe();

    // If a card container exists and a plan is selected, attempt to mount
    if (this.cardElement && this.form().selectedPlanId) {
      this.mountStripeCard();
    }
  }

  canProceedWithPayment(): boolean {
    return (
      !!this.form().selectedPlanId &&
      this.cardholderName().trim().length > 0 &&
      this.acceptTerms()
    );
  }

  nextStep(): void {
    // Allow advancing up to step 3 (account -> hospital -> plan/payment)
    if (this.currentStep() < 3) {
      this.currentStep.update(step => step + 1);
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
    }
  }

  updateForm(field: keyof HospitalRegistrationForm, value: string | number | null): void {
    this.form.update(current => ({
      ...current,
      [field]: value
    }));
  }

  selectPlan(planId: unknown): void {
    // store the plan id as string to avoid type mismatches between number/uuid
    this.updateForm('selectedPlanId', String(planId));
    // Montar el card element después de seleccionar el plan
    setTimeout(() => {
      if (!this.cardMounted && this.cardElement) {
        this.mountStripeCard();
      }
    }, 100);
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

  private mountStripeCard(): void {
    if (this.cardMounted || !this.cardElement) {
      return;
    }

    const cardElementContainer = this.cardElement.nativeElement;
    if (cardElementContainer) {
      try {
        // prefer createCardElement which mounts the element safely
        this.stripeService.createCardElement(cardElementContainer);
        this.cardMounted = true;
        this.stripeBlocked.set(false);
        this.stripeAvailable.set(true);
      } catch (err: any) {
        console.error('Error mounting Stripe card element (register):', err);
        this.errorMessage.set('No se pudo inicializar el formulario de pago. Revisa si tienes un bloqueador de anuncios.');
        this.stripeBlocked.set(true);
      }
    }
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
    }
  }

  onNextToPlans(): void {
    if (!this.validateStep2()) {
      return;
    }

    // Crear usuario y tenant ANTES de ir al paso 3
    this.submitting.set(true);
    const f = this.form();

    // Crear el usuario (admin del hospital)
    const newUser: User = {
      id: Date.now(),
      email: f.email,
      password: f.password,
      role: 'hospital_admin',
      name: f.adminName,
      isVerified: false,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      tenantId: null
    };

    this.userStore.createUser(newUser).subscribe({
      next: (user: User) => {
        // Crear el tenant (hospital) con todos los datos
        const tenantId = Date.now();
        const newTenant: any = {
          id: tenantId,
          adminUserId: user.id,
          name: f.hospitalName,
          address: f.address,
          phone: f.phone,
          email: f.email,
          status: 'active',
          subscriptionId: null,
          registrationDate: new Date().toISOString(),
          settings: {
            allowIndependentDoctors: false,
            requirePatientApproval: true,
            maxDoctors: 5
          }
        };

        this.tenantStore.createTenant(newTenant).subscribe({
          next: (tenant: any) => {
            // Actualizar el usuario con el tenantId
            const updatedUser = { ...user, tenantId: tenant.id };
            
            // Actualizar el usuario en la base de datos
            this.userStore.updateUser(updatedUser).subscribe({
              next: () => {
                // Guardar datos en el componente
                this.createdUserId = updatedUser.id;
                this.createdTenantId = tenant.id;

                // Guardar en localStorage
                localStorage.setItem('currentUser', JSON.stringify({
                  id: updatedUser.id,
                  email: updatedUser.email,
                  role: updatedUser.role,
                  name: updatedUser.name,
                  tenantId: tenant.id
                }));

                // Cargar planes disponibles
                this.loadPlans();

                // Pasar al paso 3 (selección de plan)
                this.submitting.set(false);
                this.nextStep();
              },
              error: (err: any) => {
                console.error('Error updating user tenantId:', err);
                // Guardar datos incluso si falla la actualización
                this.createdUserId = updatedUser.id;
                this.createdTenantId = tenant.id;

                localStorage.setItem('currentUser', JSON.stringify({
                  id: updatedUser.id,
                  email: updatedUser.email,
                  role: updatedUser.role,
                  name: updatedUser.name,
                  tenantId: tenant.id
                }));

                this.loadPlans();
                this.submitting.set(false);
                this.nextStep();
              }
            });
          },
          error: (err: any) => {
            this.submitting.set(false);
            this.errorMessage.set('Error al crear el hospital: ' + (err.message || 'Error desconocido'));
            console.error('Error creating tenant:', err);
          }
        });
      },
      error: (err: any) => {
        this.submitting.set(false);
        this.errorMessage.set('Error al crear el usuario: ' + (err.message || 'Error desconocido'));
        console.error('Error creating user:', err);
      }
    });
  }

  async onCompleteRegistration(): Promise<void> {
    if (!this.canProceedWithPayment() || !this.createdTenantId) {
      this.errorMessage.set('Información incompleta. Por favor verifica todos los campos.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    try {
  const selectedPlan = this.availablePlans().find(p => String(p.id) === this.form().selectedPlanId);
      
      if (!selectedPlan) {
        throw new Error('Plan no encontrado');
      }

      // Procesar el pago con Stripe
      const payment = await this.paymentStore.processPayment(
        0, // subscriptionId será 0 por ahora
        this.createdTenantId,
        'tenant',
        selectedPlan.price,
        this.cardholderName()
      );

      // Crear la suscripción
      const subscription = await firstValueFrom(this.subscriptionService.create({
        payerType: 'tenant',
        payerId: this.createdTenantId,
        planId: selectedPlan.id,
        autoRenew: true,
        paymentMethod: 'credit_card',
        billingEmail: this.form().email
      }));

      // Actualizar el tenant con el subscriptionId
      if (subscription && subscription.id) {
        // Cargar tenant actual y actualizarlo
        this.tenantStore.loadTenantById(this.createdTenantId).subscribe({
          next: (tenant) => {
            const updatedTenant: any = {
              ...tenant,
              subscriptionId: subscription.id,
              status: 'active' as any
            };
            
            this.tenantStore.updateTenant(updatedTenant).subscribe({
              next: () => {
                this.submitting.set(false);
                alert('¡Registro completado exitosamente! Redirigiendo al dashboard...');
                this.router.navigate(['/hospital/dashboard']);
              },
              error: (err: any) => {
                console.error('Error updating tenant subscription:', err);
                // Continuar de todos modos
                this.submitting.set(false);
                alert('¡Registro completado exitosamente! Redirigiendo al dashboard...');
                this.router.navigate(['/hospital/dashboard']);
              }
            });
          },
          error: (err: any) => {
            console.error('Error loading tenant:', err);
            // Continuar de todos modos
            this.submitting.set(false);
            alert('¡Registro completado exitosamente! Redirigiendo al dashboard...');
            this.router.navigate(['/hospital/dashboard']);
          }
        });
      } else {
        this.submitting.set(false);
        alert('¡Registro completado exitosamente! Redirigiendo al dashboard...');
        this.router.navigate(['/hospital/dashboard']);
      }

    } catch (error: any) {
      console.error('Error completing registration:', error);
      this.errorMessage.set(error.message || 'Error al procesar el pago');
      this.submitting.set(false);
    }
  }

  getPlanMaxDoctors(plan: SubscriptionPlanEntity): string {
    const features = plan.features as any;
    return features.maxDoctors === -1 ? 'Ilimitados' : features.maxDoctors.toString();
  }

  getPlanMaxPatients(plan: SubscriptionPlanEntity): string {
    const features = plan.features as any;
    return features.maxPatients === -1 ? 'Ilimitados' : features.maxPatients.toString();
  }

  getPlanAnalytics(plan: SubscriptionPlanEntity): string {
    const features = plan.features as any;
    return features.advancedAnalytics ? 'avanzadas' : 'básicas';
  }

  getSelectedPlanName(): string {
    const plan = this.availablePlans().find(p => String(p.id) === this.form().selectedPlanId);
    return plan ? plan.name : '';
  }

  getSelectedPlanPrice(): number {
    const plan = this.availablePlans().find(p => String(p.id) === this.form().selectedPlanId);
    return plan ? plan.price : 0;
  }
}
