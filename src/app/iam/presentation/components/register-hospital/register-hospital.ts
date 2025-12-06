import { Component, signal, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../application/auth.service';
import { TenantStore } from '../../../../tenants/application/tenant.store';
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

  private readonly authService = inject(AuthService);
  private readonly tenantStore = inject(TenantStore);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly paymentStore = inject(PaymentStore);
  private readonly stripeService = inject(StripeService);
  private readonly router = inject(Router);

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

  selectPlan(planOrId: unknown): void {
    // Accept either a plan object or an id. Normalize to string id.
    let id: unknown = planOrId;
    if (planOrId && typeof planOrId === 'object' && 'id' in (planOrId as any)) {
      id = (planOrId as any).id;
    }
    // store the plan id as string to avoid type mismatches between number/uuid
    this.updateForm('selectedPlanId', String(id));
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
    // Basic email format validation
    if (!this.isValidEmail(f.email)) {
      this.errorMessage.set('El correo electrónico no es válido');
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
    if (f.hospitalName.trim().length < 2) {
      this.errorMessage.set('El nombre del hospital debe tener al menos 2 caracteres');
      return false;
    }
    if (!this.isValidPhone(f.phone)) {
      this.errorMessage.set('El teléfono debe contener solo dígitos (6-15)');
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

  private isValidEmail(email: string): boolean {
    const trimmed = (email || '').trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(trimmed);
  }

  private isValidPhone(phone: string): boolean {
    const digits = (phone || '').trim().replaceAll(/\D/g, '');
    return digits.length >= 6 && digits.length <= 15;
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

    // ✅ Nuevo flujo: Usar el endpoint correcto que realiza la operación en una sola transacción atómica
    this.submitting.set(true);
    const f = this.form();

    console.log('🚀 [RegisterHospital] Starting hospital admin registration (ONE REQUEST)...');
    console.log('📧 Email:', f.email);
    console.log('🏥 Hospital Name:', f.hospitalName);

    // ✅ Un solo request - Operación en una transacción atómica
    this.authService.signUpHospitalAdmin({
      // User data
      email: f.email,
      password: f.password,
      name: f.adminName,
      
      // Hospital data
      hospitalName: f.hospitalName,
      hospitalPhone: f.phone,
      hospitalAddress: f.address
    }).subscribe({
      next: (response: any) => {
        console.log('✅ [RegisterHospital] Hospital admin registration successful!');
        console.log('📦 Full Response:', response);
        console.log('🎫 AccessToken:', response.accessToken ? 'Present' : 'Missing');
        console.log('🔄 RefreshToken:', response.refreshToken ? 'Present' : 'Missing');
        console.log('👤 User:', response.user);
        console.log('🏥 Tenant:', response.user?.tenant || response.tenant);

        // Estructura de respuesta del backend:
        // { accessToken, refreshToken, user: { id, email, name, role, tenantId, tenant: {...} } }
        const userId = response.user?.id;
        const tenantId = response.user?.tenantId;
        const tenant = response.user?.tenant || response.tenant;

        if (!tenantId) {
          console.error('❌ ERROR: Backend no devolvió tenantId en response.user.tenantId');
          this.submitting.set(false);
          this.errorMessage.set('Error: No se pudo crear el hospital. Por favor contacte al administrador.');
          return;
        }

        // Guardar los IDs para uso posterior
        this.createdUserId = userId;
        this.createdTenantId = tenantId;

        console.log('💾 IDs saved - User:', this.createdUserId, ', Tenant:', this.createdTenantId);
        if (tenant) {
          console.log('🏥 Hospital Name:', tenant.name);
          console.log('🏥 Hospital Status:', tenant.status);
        }
        console.log('✅ Session saved with tenantId (by authService)');

        console.log('📋 [RegisterHospital] Loading subscription plans...');
        // Cargar planes de suscripción
        this.loadPlans();

        // Avanzar al paso 3 (pago)
        this.submitting.set(false);
        console.log('➡️ [RegisterHospital] Proceeding to step 3 (payment)');
        this.nextStep();
      },
      error: (err: any) => {
        this.submitting.set(false);
        
        console.error('❌ [RegisterHospital] Hospital admin registration FAILED');
        console.error('Error object:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        console.error('Error body:', err.error);
        
        // Manejo de errores específicos
        if (!err?.status || err.status === 0) {
          // Network error suggests backend unreachable or CORS/network problem
          const backendUrl = this.authService.apiUrl || 'unknown';
          this.errorMessage.set('❌ No se pudo conectar al servidor de API: ' + backendUrl + '. Verifica que el backend esté corriendo y que CORS esté configurado.');
          console.error('📋 [RegisterHospital] Network/connection error to backend:', backendUrl, err);
          return;
        }
        const errorMsg = err.error?.message || err.error?.error || err.message || 'Error desconocido';
        
        if (errorMsg.includes('Email already exists') || errorMsg.includes('ya está registrado')) {
          this.errorMessage.set('⚠️ Este correo electrónico ya está registrado. Por favor inicia sesión.');
        } else if (errorMsg.includes('Hospital name already exists') || errorMsg.includes('hospital ya existe')) {
          this.errorMessage.set('⚠️ Ya existe un hospital con este nombre. Por favor usa otro nombre.');
        } else {
          this.errorMessage.set('❌ Error al registrar el hospital: ' + errorMsg);
        }
        
        console.error('📋 [RegisterHospital] User-friendly error message:', this.errorMessage());
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
      console.log('💳 [RegisterHospital] Processing payment with Stripe...');
      const payment = await this.paymentStore.processPayment(
        0, // subscriptionId será 0 por ahora
        this.createdTenantId,
        'tenant',
        selectedPlan.price,
        this.cardholderName()
      );
      console.log('✅ [RegisterHospital] Payment processed:', payment);

      // Crear la suscripción
      console.log('📋 [RegisterHospital] Creating subscription...');
      console.log('  - payerType: tenant');
      console.log('  - payerId:', this.createdTenantId);
      console.log('  - planId:', selectedPlan.id);
      
      const subscription = await firstValueFrom(this.subscriptionService.create({
        payerType: 'tenant',
        payerId: this.createdTenantId,
        planId: selectedPlan.id,
        autoRenew: true,
        paymentMethod: 'credit_card',
        billingEmail: this.form().email
      }));
      
      console.log('✅ [RegisterHospital] Subscription created:', subscription);

      // Actualizar el tenant con el subscriptionId
      if (subscription?.id) {
        console.log('🔄 [RegisterHospital] Updating tenant with subscriptionId:', subscription.id);
        
        // Cargar tenant actual y actualizarlo
        this.tenantStore.loadTenantById(this.createdTenantId).subscribe({
          next: (tenant) => {
            console.log('✅ [RegisterHospital] Tenant loaded:', tenant);
            
            const updatedTenant: any = {
              ...tenant,
              subscriptionId: subscription.id,
              status: 'active' as any
            };

            console.log('🔄 [RegisterHospital] Updating tenant to:', updatedTenant);

            this.tenantStore.updateTenant(updatedTenant).subscribe({
              next: () => {
                console.log('✅ [RegisterHospital] Tenant updated successfully!');
                console.log('🚀 [RegisterHospital] Redirecting to login...');
                this.submitting.set(false);
                setTimeout(() => {
                  this.router.navigate(['/iam/login']);
                }, 100);

              },
              error: (err: any) => {
                console.error('❌ [RegisterHospital] Error updating tenant subscription:', err);
                this.submitting.set(false);
                setTimeout(() => {
                  this.router.navigate(['/iam/login']);
                }, 100);

              }
            });
          },
          error: (err: any) => {
            console.error('Error loading tenant:', err);
            this.submitting.set(false);
            setTimeout(() => {
              this.router.navigate(['/iam/login']);
            }, 100);
          }
        });
      } else {
        this.submitting.set(false);
        setTimeout(() => {
          this.router.navigate(['/iam/login']);
        }, 100);

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

  // Accepts the raw `features` object from a plan and returns a normalized
  // tenant-features-like object so the template can safely read numeric
  // properties such as `maxDoctors` and `maxPatients`.
  getTenantFeatures(features: any): { maxDoctors: number; maxPatients: number; advancedAnalytics?: boolean; customBranding?: boolean; support?: string } {
    if (!features || typeof features !== 'object') {
      return { maxDoctors: 0, maxPatients: 0, advancedAnalytics: false, customBranding: false, support: 'email' };
    }

    // If features already contains tenant fields, return them preserving
    // sentinel values (e.g. -1 for unlimited).
    if (features.maxDoctors !== undefined || features.maxPatients !== undefined) {
      return {
        maxDoctors: features.maxDoctors ?? 0,
        maxPatients: features.maxPatients ?? 0,
        advancedAnalytics: !!features.advancedAnalytics,
        customBranding: !!features.customBranding,
        support: features.support ?? 'email'
      };
    }

    // Otherwise return safe defaults for non-tenant plans
    return { maxDoctors: 0, maxPatients: 0, advancedAnalytics: false, customBranding: false, support: 'email' };
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
