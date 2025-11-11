import { Component, OnInit, OnDestroy, inject, signal, computed, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
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
  styleUrl: './hospital-subscription.view.css'
})
export class HospitalSubscriptionView implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cardElement') cardElementRef!: ElementRef;

  private readonly router = inject(Router);
  private readonly paymentStore = inject(PaymentStore);
  private readonly stripeService = inject(StripeService);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly tenantService = inject(TenantService);

  // State
  readonly loading = signal(false);
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
    // Stripe se inicializará cuando se muestre el formulario de pago
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
        throw new Error('No se encontró el hospital asociado');
      }

      // Cargar tenant
      this.tenantService.getById(tenantId).subscribe({
        next: (tenant) => {
          this.tenant.set(tenant);
          
          // Cargar suscripción activa
          if (tenant.subscriptionId) {
            this.subscriptionService.getById(tenant.subscriptionId).subscribe({
              next: (sub) => this.currentSubscription.set(sub),
              error: (err) => console.error('Error loading subscription:', err)
            });
          }
        },
        error: (err) => {
          console.error('Error loading tenant:', err);
          this.error.set('Error cargando información del hospital');
        }
      });

      // Cargar planes disponibles
      this.subscriptionService.getPlansByType('tenant').subscribe({
        next: (plans) => this.availablePlans.set(plans),
        error: (err) => {
          console.error('Error loading plans:', err);
          this.error.set('Error cargando planes de suscripción');
        }
      });

    } catch (err: any) {
      this.error.set(err.message || 'Error cargando datos');
    } finally {
      this.loading.set(false);
    }
  }

  selectPlan(plan: SubscriptionPlanEntity): void {
    this.selectedPlan.set(plan);
    this.showPaymentForm.set(true);
    this.error.set(null);
    
    // Inicializar Stripe cuando se muestre el formulario
    setTimeout(() => {
      if (this.cardElementRef) {
        this.stripeService.createCardElement(this.cardElementRef.nativeElement);
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
      this.error.set('Información incompleta para procesar el pago');
      return;
    }

    this.error.set(null);
    this.success.set(null);

    try {
      console.log('💳 Procesando pago...');

      // 1. Procesar pago con Stripe
      const payment = await this.paymentStore.processPayment(
        tenantData.subscriptionId || 0,
        tenantData.id,
        'tenant',
        plan.price,
        this.cardholderName()
      );

      console.log('✅ Pago procesado:', payment);

      // 2. Crear o actualizar suscripción
      if (tenantData.subscriptionId) {
        // Renovar suscripción existente
        await this.subscriptionService.update(tenantData.subscriptionId, {
          status: 'active',
          lastPaymentDate: new Date().toISOString(),
          lastPaymentAmount: plan.price
        }).toPromise();
      } else {
        // Crear nueva suscripción
        const newSub = await this.subscriptionService.create({
          payerType: 'tenant',
          payerId: tenantData.id,
          planId: plan.id,
          autoRenew: true,
          paymentMethod: 'credit_card',
          billingEmail: tenantData.email
        }).toPromise();

        // 3. Asignar suscripción al tenant
        await this.tenantService.update(tenantData.id, {
          subscriptionId: newSub!.id,
          status: 'active'
        }).toPromise();
      }

      this.success.set('¡Pago procesado exitosamente! Suscripción activada.');
      
      // Recargar datos
      setTimeout(() => {
        this.loadData();
        this.cancelPayment();
        this.success.set(null);
      }, 3000);

    } catch (err: any) {
      console.error('❌ Error processing payment:', err);
      this.error.set(err.message || 'Error procesando el pago. Por favor intenta nuevamente.');
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'active': 'Activa',
      'cancelled': 'Cancelada',
      'expired': 'Expirada',
      'pending': 'Pendiente'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getTenantFeatures(features: any): any {
    return features;
  }
}
