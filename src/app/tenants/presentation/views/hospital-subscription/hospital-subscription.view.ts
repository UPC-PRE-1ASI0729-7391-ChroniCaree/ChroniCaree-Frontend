import {Component, OnInit, OnDestroy, AfterViewInit, inject, signal, computed, ElementRef, ViewChild
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { PaymentStore } from '../../../../payments/application/payment.store';
import { StripeService } from '../../../../payments/infrastructure/stripe.service';
import { SubscriptionService } from '../../../../subscriptions/infrastructure/subscription.service';
import { TenantService } from '../../../infrastructure/tenant.service';
import { SubscriptionEntity } from '../../../../subscriptions/domain/model/subscription.entity';
import { SubscriptionPlanEntity } from '../../../../subscriptions/domain/model/subscription-plan.entity';

@Component({
  selector: 'app-hospital-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
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
  private readonly translate = inject(TranslateService);

  // State
  readonly loading = signal(true);
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

        throw new Error(this.translate.instant('hospital.subscription.errors.noTenant'));
      }

      const tenant = await firstValueFrom(this.tenantService.getById(tenantId));
      this.tenant.set(tenant);

      if (tenant?.subscriptionId) {
        const sub = await firstValueFrom(this.subscriptionService.getById(tenant.subscriptionId));
        this.currentSubscription.set(sub);
      }

      const plans = await firstValueFrom(this.subscriptionService.getPlansByType('tenant'));
      this.availablePlans.set(plans);
    } catch (err: any) {
      console.error('Error loading data:', err);
      this.error.set(
        err?.message || this.translate.instant('hospital.subscription.errors.loadFailed')
      );
    } finally {
      this.loading.set(false);
    }
  }

  selectPlan(plan: SubscriptionPlanEntity): void {
    if (this.currentSubscription()?.planId === plan.id) {
      this.error.set(this.translate.instant('hospital.subscription.errors.samePlan'));
      return;
    }

    this.selectedPlan.set(plan);
    this.showPaymentForm.set(true);
    this.error.set(null);

    setTimeout(() => {
      if (this.cardElementRef) {
        try {
          this.stripeService.createCardElement(this.cardElementRef.nativeElement);
        } catch (e) {
          console.error('Error creating Stripe element:', e);
          this.error.set(this.translate.instant('hospital.subscription.errors.stripeBlocked'));
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
      this.error.set(this.translate.instant('hospital.subscription.errors.incompletePayment'));
      return;
    }

    this.error.set(null);
    this.success.set(null);

    try {
      // 1) Pago
      await this.paymentStore.processPayment(
        tenantData.subscriptionId || 0,
        tenantData.id,
        'tenant',
        plan.price,
        this.cardholderName()
      );

      let subscription: SubscriptionEntity | null = null;

      if (tenantData.subscriptionId) {
        subscription = await firstValueFrom(
          this.subscriptionService.update(tenantData.subscriptionId, {
            planId: plan.id,
            status: 'active',
            lastPaymentDate: new Date().toISOString(),
            lastPaymentAmount: plan.price,
            endDate: this.calculateNextBillingDate(new Date()).toISOString()
          })
        );
      } else {
        subscription = await firstValueFrom(
          this.subscriptionService.create({
            payerType: 'tenant',
            payerId: tenantData.id,
            planId: plan.id,
            autoRenew: true,
            paymentMethod: 'credit_card',
            billingEmail: tenantData.email
          })
        );
      }

      if (subscription) {
        await firstValueFrom(
          this.tenantService.update(tenantData.id, {
            subscriptionId: subscription.id,
            status: 'active'
          })
        );
      }

      this.success.set(this.translate.instant('hospital.subscription.success.paymentOkRedirect'));

      // Redirect
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      console.error('Error processing payment:', err);
      this.error.set(
        err?.message || this.translate.instant('hospital.subscription.errors.paymentFailed')
      );
    }
  }

  private calculateNextBillingDate(startDate: Date): Date {
    const nextDate = new Date(startDate);
    nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate;
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return this.translate.instant('common.na');

    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getStatusLabel(status: string | undefined): string {
    if (!status) return this.translate.instant('hospital.subscription.status.unknown');

    const keyMap: Record<string, string> = {
      active: 'hospital.subscription.status.active',
      cancelled: 'hospital.subscription.status.cancelled',
      expired: 'hospital.subscription.status.expired',
      pending: 'hospital.subscription.status.pending'
    };

    return this.translate.instant(keyMap[status] ?? 'hospital.subscription.status.unknown');
  }

  getStatusClass(status: string | undefined): string {
    return `status-${status || 'unknown'}`;
  }

  /**
   * Normalize a raw `features` object (PlanFeatures) into a tenant-style
   * object that templates can read safely (numeric fields preserved).
   */
  getTenantFeatures(features: any): {
    maxDoctors: number;
    maxPatients: number;
    advancedAnalytics?: boolean;
    customBranding?: boolean;
    support?: string | null;
  } | null {
    if (!features || typeof features !== 'object') return null;

    if (typeof features.maxDoctors !== 'undefined' || typeof features.maxPatients !== 'undefined') {
      return {
        maxDoctors: typeof features.maxDoctors !== 'undefined' ? features.maxDoctors : 0,
        maxPatients: typeof features.maxPatients !== 'undefined' ? features.maxPatients : 0,
        advancedAnalytics: !!features.advancedAnalytics,
        customBranding: !!features.customBranding,
        support: features.support ?? null
      };
    }

    return { maxDoctors: 0, maxPatients: 0, advancedAnalytics: false, customBranding: false, support: null };
  }
}
