import { Component, OnInit, OnDestroy, inject, signal, computed, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PaymentStore } from '../../../../payments/application/payment.store';
import { StripeService } from '../../../../payments/infrastructure/stripe.service';
import { SubscriptionService } from '../../../../subscriptions/infrastructure/subscription.service';
import { TenantService } from '../../../infrastructure/tenant.service';
import { SubscriptionEntity } from '../../../../subscriptions/domain/model/subscription.entity';
import { SubscriptionPlanEntity } from '../../../../subscriptions/domain/model/subscription-plan.entity';

@Component({
  selector: 'app-hospital-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hospital-subscription.view.html',
  styleUrls: ['./hospital-subscription.view.css']
})
export class HospitalSubscriptionView implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cardElement') cardElementRef!: ElementRef;

  private readonly router = inject(Router);
  private readonly paymentStore = inject(PaymentStore);
  private readonly stripeService = inject(StripeService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly tenantService = inject(TenantService);

  // State
  readonly loading = signal(true); // Start with loading true
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly currentSubscription = signal<SubscriptionEntity | null>(null);
  readonly availablePlans = signal<SubscriptionPlanEntity[]>([]);
  readonly tenant = signal<any>(null);
  
  // Payment form
  readonly selectedPlan = signal<SubscriptionPlanEntity | null>(null);
  readonly cardholderName = signal('');
  readonly acceptTerms = signal(false);
  readonly showPaymentForm = signal(false);

  readonly processing = this.paymentStore.processing;
  
  readonly canProceed = computed(() => 
    this.cardholderName().trim().length > 0 && 
    this.acceptTerms() && 
    this.selectedPlan() !== null
  );

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    // Stripe will be initialized when the payment form is shown
  }

  ngOnDestroy(): void {
    this.stripeService.destroyCardElement();
  }

  private async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const tenantId = currentUser.tenantId;

      if (!tenantId) {
        throw new Error('No se encontró el hospital asociado. Por favor, inicia sesión de nuevo.');
      }

      // Cargar tenant
      const tenant = await firstValueFrom(this.tenantService.getById(tenantId));
      this.tenant.set(tenant);
      
      // Cargar suscripción activa si existe
      if (tenant.subscriptionId) {
        const sub = await firstValueFrom(this.subscriptionService.getById(tenant.subscriptionId));
        this.currentSubscription.set(sub);
      }

      // Cargar planes disponibles
      const plans = await firstValueFrom(this.subscriptionService.getPlansByType('tenant'));
      this.availablePlans.set(plans);

    } catch (err: any) {
      console.error('Error loading data:', err);
      this.error.set(err.message || 'Error cargando los datos de la suscripción.');
    } finally {
      this.loading.set(false);
    }
  }

  selectPlan(plan: SubscriptionPlanEntity): void {
    if (this.currentSubscription()?.planId === plan.id) {
      this.error.set('Ya estás suscrito a este plan.');
      return;
    }
    this.selectedPlan.set(plan);
    this.showPaymentForm.set(true);
    this.error.set(null);
    
    // Initialize Stripe when the form is shown
    setTimeout(() => {
      if (this.cardElementRef) {
        try {
          this.stripeService.createCardElement(this.cardElementRef.nativeElement);
        } catch (e) {
          console.error("Error creating Stripe element:", e);
          this.error.set("No se pudo cargar el formulario de pago. Revisa si un bloqueador de anuncios está activo.");
        }
      }
    }, 100);
  }

  cancelPayment(): void {
    this.showPaymentForm.set(false);
    this.selectedPlan.set(null);
    this.cardholderName.set('');
    this.acceptTerms.set(false);
    this.stripeService.destroyCardElement();
  }

  async processPayment(): Promise<void> {
    if (!this.canProceed()) return;

    const plan = this.selectedPlan();
    const tenantData = this.tenant();
    
    if (!plan || !tenantData) {
      this.error.set('Información incompleta para procesar el pago.');
      return;
    }

    this.error.set(null);
    this.success.set(null);

    try {
      // 1. Process payment with Stripe
      const payment = await this.paymentStore.processPayment(
        tenantData.subscriptionId || 0,
        tenantData.id,
        'tenant',
        plan.price,
        this.cardholderName()
      );

      // 2. Create or update subscription
      let subscription: SubscriptionEntity | null = null;
      if (tenantData.subscriptionId) {
        // Update existing subscription
        subscription = await firstValueFrom(this.subscriptionService.update(tenantData.subscriptionId, {
          planId: plan.id,
          status: 'active',
          lastPaymentDate: new Date().toISOString(),
          lastPaymentAmount: plan.price,
          endDate: this.calculateNextBillingDate(new Date()).toISOString()
        }));
      } else {
        // Create new subscription
        subscription = await firstValueFrom(this.subscriptionService.create({
          payerType: 'tenant',
          payerId: tenantData.id,
          planId: plan.id,
          autoRenew: true,
          paymentMethod: 'credit_card',
          billingEmail: tenantData.email
        }));
      }

      // 3. Assign subscription to tenant and activate
      if (subscription) {
        await firstValueFrom(this.tenantService.update(tenantData.id, {
          subscriptionId: subscription.id,
          status: 'active'
        }));
      }

      this.success.set('¡Pago procesado exitosamente! Redirigiendo al dashboard...');
      
      // Redirect to dashboard with a full page reload
      setTimeout(() => {
        window.location.href = '/hospital/dashboard';
      }, 2000);

    } catch (err: any) {
      console.error('Error processing payment:', err);
      this.error.set(err.message || 'Error procesando el pago. Por favor intenta nuevamente.');
    }
  }

  private calculateNextBillingDate(startDate: Date): Date {
    const nextDate = new Date(startDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusLabel(status: string | undefined): string {
    if (!status) return 'Desconocido';
    const labels: Record<string, string> = {
      'active': 'Activa',
      'cancelled': 'Cancelada',
      'expired': 'Expirada',
      'pending': 'Pendiente'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string | undefined): string {
    return `status-${status || 'unknown'}`;
  }

  /**
   * Normalize a raw `features` object (PlanFeatures) into a tenant-style
   * object that templates can read safely (numeric fields preserved).
   */
  getTenantFeatures(features: any): { maxDoctors: number; maxPatients: number; advancedAnalytics?: boolean; customBranding?: boolean; support?: string | null } | null {
    if (!features || typeof features !== 'object') return null;

    // If it already looks like tenant features, return normalized values
    if (typeof features.maxDoctors !== 'undefined' || typeof features.maxPatients !== 'undefined') {
      return {
        maxDoctors: typeof features.maxDoctors !== 'undefined' ? features.maxDoctors : 0,
        maxPatients: typeof features.maxPatients !== 'undefined' ? features.maxPatients : 0,
        advancedAnalytics: !!features.advancedAnalytics,
        customBranding: !!features.customBranding,
        support: features.support ?? null
      };
    }

    // Otherwise there are no tenant-specific fields
    return { maxDoctors: 0, maxPatients: 0, advancedAnalytics: false, customBranding: false, support: null };
  }
}
