import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, signal, computed, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PaymentStore } from '../../../../payments/application/payment.store';
import { StripeService } from '../../../../payments/infrastructure/stripe.service';
import { SubscriptionService } from '../../../../subscriptions/infrastructure/subscription.service';
import { PatientService } from '../../../infrastructure/patient.service';
import { SubscriptionEntity } from '../../../../subscriptions/domain/model/subscription.entity';
import { SubscriptionPlanEntity } from '../../../../subscriptions/domain/model/subscription-plan.entity';

@Component({
  selector: 'app-patient-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-subscription.view.html',
  styleUrl: './patient-subscription.view.css'
})
export class PatientSubscriptionView implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cardElement') cardElementRef!: ElementRef;

  private paymentStore = inject(PaymentStore);
  private stripeService = inject(StripeService);
  private subscriptionService = inject(SubscriptionService);
  private patientService = inject(PatientService);
  private router = inject(Router);

  loading = signal(false);
  stripeBlocked = signal(false);
  patientId = signal<number>(0);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  currentSubscription = signal<SubscriptionEntity | null>(null);
  availablePlans = signal<SubscriptionPlanEntity[]>([]);
  selectedPlan = signal<SubscriptionPlanEntity | null>(null);
  cardholderName = signal('');
  acceptTerms = signal(false);
  showPaymentForm = signal(false);

  processing = computed(() => this.paymentStore.processing());
  canProceed = computed(() => 
    this.cardholderName().trim().length > 0 && 
    this.acceptTerms() && 
    this.selectedPlan() !== null
  );

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.stripeService.initializeStripe();
  }

  ngOnDestroy(): void {
    if (this.showPaymentForm()) {
      this.stripeService.destroyCardElement();
    }
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const userId = this.getUserId();

      const patient = await firstValueFrom(this.patientService.getByUserId(userId));

      if (!patient) {
        throw new Error('No se encontró el perfil del paciente');
      }

      this.patientId.set(patient.id);

      const [subscription, plans] = await Promise.all([
        firstValueFrom(this.subscriptionService.getActiveByPayerId('patient', patient.id)),
        firstValueFrom(this.subscriptionService.getPlansByType('patient'))
      ]);

      this.currentSubscription.set(subscription || null);
      this.availablePlans.set(plans || []);
    } catch (err: any) {
      console.error('Error loading data:', err);
      this.error.set('Error al cargar la información');
    } finally {
      this.loading.set(false);
    }
  }

  selectPlan(plan: SubscriptionPlanEntity): void {
    if (plan.price === 0) {
      this.subscribeToPlan(plan);
      return;
    }

    this.selectedPlan.set(plan);
    this.showPaymentForm.set(true);
    
    // Montar el elemento de tarjeta de Stripe
    setTimeout(() => {
      if (this.cardElementRef?.nativeElement) {
        this.stripeService.createCardElement(this.cardElementRef.nativeElement);
      }
    }, 100);
  }

  reloadPage(): void {
    window.location.reload();
  }

  async subscribeToPlan(plan: SubscriptionPlanEntity): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const patId = this.patientId();
      const email = this.getPatientEmail();
      
      await firstValueFrom(this.subscriptionService.create({
        payerType: 'patient',
        payerId: patId,
        patientId: patId,
        planId: plan.id,
        autoRenew: true,
        paymentMethod: 'credit_card',
        billingEmail: email
      }));

      this.success.set('¡Suscripción activada exitosamente!');
      setTimeout(() => {
        this.loadData();
        this.success.set(null);
      }, 3000);
    } catch (err: any) {
      this.error.set(err.message || 'Error al procesar la suscripción');
    } finally {
      this.loading.set(false);
    }
  }

  async processPayment(): Promise<void> {
    if (!this.canProceed()) return;

    const plan = this.selectedPlan();
    const patId = this.patientId();
    
    if (!plan || !patId) {
      this.error.set('Información incompleta para procesar el pago');
      return;
    }

    this.error.set(null);
    this.success.set(null);

    try {
      const email = this.getPatientEmail();
      console.log('💳 Procesando pago...');

      // 1. Procesar pago con Stripe
      const payment = await this.paymentStore.processPayment(
        0,
        patId,
        'patient',
        plan.price,
        this.cardholderName()
      );

      console.log('✅ Pago procesado:', payment);

      // 2. Crear suscripción después del pago exitoso
      const newSub = await firstValueFrom(this.subscriptionService.create({
        payerType: 'patient',
        payerId: patId,
        patientId: patId,
        planId: plan.id,
        autoRenew: true,
        paymentMethod: 'credit_card',
        billingEmail: email
      }));

      console.log('✅ Suscripción creada:', newSub);

      this.success.set('¡Pago procesado exitosamente! Suscripción activada.');
      
      setTimeout(() => {
        this.router.navigate(['/patient/dashboard']);
      }, 2000);

    } catch (err: any) {
      console.error('❌ Error processing payment:', err);
      const msg = err?.message || '';
      if (msg.includes('Failed to fetch') || msg.toLowerCase().includes('blocked')) {
        this.error.set('Error cargando recursos de Stripe (posible bloqueador). Desactiva adblock y prueba de nuevo.');
        this.stripeBlocked.set(true);
      } else {
        this.error.set(msg || 'Error procesando el pago. Por favor intenta nuevamente.');
      }
    }
  }

  cancelPayment(): void {
    this.showPaymentForm.set(false);
    this.selectedPlan.set(null);
    this.cardholderName.set('');
    this.acceptTerms.set(false);
    this.stripeService.destroyCardElement();
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

  getPatientFeatures(features: any): any {
    return features;
  }

  private getUserId(): number {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id;
    }
    return 0;
  }

  private getPatientEmail(): string {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.email;
    }
    return '';
  }
}
