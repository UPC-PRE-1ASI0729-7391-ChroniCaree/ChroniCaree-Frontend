import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { HospitalDashboardStore } from '../../../application/hospital-dashboard.store';
import { SubscriptionService } from '../../../../subscriptions/infrastructure/subscription.service';
import { PatientService } from '../../../../patients/infrastructure/patient.service';
import { SubscriptionEntity } from '../../../../subscriptions/domain/model/subscription.entity';
import { SubscriptionPlanEntity } from '../../../../subscriptions/domain/model/subscription-plan.entity';

interface MonthlyPatientData {
  month: string;
  count: number;
}

interface DashboardMetrics {
  totalDoctors: number;
  totalPatients: number;
  activeSubscription: SubscriptionEntity | null;
  subscriptionPlan: SubscriptionPlanEntity | null;
  monthlyPatients: MonthlyPatientData[];
  monthlyRevenue: number;
  averagePatientsPerDoctor: number;
}

@Component({
  selector: 'app-hospital-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './hospital-dashboard.view.html',
  styleUrls: ['./hospital-dashboard.view.css']
})
export class HospitalDashboardView implements OnInit {
  private dashboardStore = inject(HospitalDashboardStore);
  private subscriptionService = inject(SubscriptionService);
  private patientService = inject(PatientService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  // State
  loading = signal(false);
  error = signal<string | null>(null);
  tenantId = signal<number>(0);
  selectedYear = signal(new Date().getFullYear());

  // Metrics
  metrics = signal<DashboardMetrics>({
    totalDoctors: 0,
    totalPatients: 0,
    activeSubscription: null,
    subscriptionPlan: null,
    monthlyPatients: [],
    monthlyRevenue: 0,
    averagePatientsPerDoctor: 0
  });

  // Month keys for i18n labels
  private readonly monthKeys = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

  // Computed
  availableYears = computed(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  });

  maxDoctorsAllowed = computed(() => {
    const plan = this.metrics().subscriptionPlan;
    if (!plan) return 0;
    const features = plan.features as any;
    return features?.maxDoctors === -1 ? -1 : (features?.maxDoctors ?? 0);
  });

  isMaxDoctorsUnlimited = computed(() => this.maxDoctorsAllowed() === -1);

  doctorsPercentage = computed(() => {
    const max = this.maxDoctorsAllowed();
    if (max === -1 || max === 0) return 0;
    const current = this.metrics().totalDoctors;
    return Math.min(100, Math.round((current / max) * 100));
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  private async loadDashboard(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const tenantId = currentUser?.tenantId;

      if (!tenantId) {
        throw new Error(this.translate.instant('hospitalDashboard.errors.noHospital'));
      }

      this.tenantId.set(tenantId);

      this.dashboardStore.loadDashboardStats(tenantId).subscribe({
        next: async (result) => {
          try {
            if (result?.success && result?.data) {
              const stats = result.data;

              // Load subscription & plan
              let subscription: SubscriptionEntity | null = null;
              let plan: SubscriptionPlanEntity | null = null;

              if (stats.activeSubscription) {
                try {
                  const subs = await firstValueFrom(
                    this.subscriptionService.getActiveByPayerId('tenant', tenantId)
                  );
                  if (subs) {
                    subscription = subs;
                    try {
                      const planResult = await firstValueFrom(this.subscriptionService.getPlanById(subs.planId));
                      plan = planResult ?? null;
                    } catch (err) {
                      console.error('Error loading plan for subscription:', err);
                    }
                  }
                } catch (err) {
                  console.error('Error loading subscription:', err);
                }
              }

              // Monthly patients
              const monthlyData = await this.loadMonthlyPatientData(tenantId, this.selectedYear());

              // Monthly revenue = plan price
              const monthlyRevenue = plan ? plan.price : 0;

              // Avg patients per doctor
              const totalDoctors = stats.totalDoctors ?? 0;
              const totalPatients = stats.totalPatients ?? 0;
              const avgPatients = totalDoctors > 0 ? Math.round(totalPatients / totalDoctors) : 0;

              this.metrics.set({
                totalDoctors,
                totalPatients,
                activeSubscription: subscription,
                subscriptionPlan: plan,
                monthlyPatients: monthlyData,
                monthlyRevenue,
                averagePatientsPerDoctor: avgPatients
              });
            }
          } catch (e: any) {
            console.error('Dashboard next() error:', e);
            this.error.set(this.translate.instant('hospitalDashboard.errors.loadError'));
          }
        },
        error: (err) => {
          console.error('Error loading dashboard:', err);
          this.error.set(err?.message || this.translate.instant('hospitalDashboard.errors.loadError'));
        },
        complete: () => {
          this.loading.set(false);
        }
      });
    } catch (err: any) {
      this.error.set(err?.message || this.translate.instant('hospitalDashboard.errors.loadError'));
      this.loading.set(false);
    }
  }

  private async loadMonthlyPatientData(_tenantId: number, _year: number): Promise<MonthlyPatientData[]> {
    // Si luego tienes API real, aquí filtras por año y tenant.
    const totalPatients = this.dashboardStore.stats()?.totalPatients ?? this.metrics().totalPatients ?? 0;

    return this.monthKeys.map((k) => {
      const randomFactor = 0.5 + Math.random() * 0.5; // 50% - 100%
      const count = Math.max(0, Math.round((totalPatients * randomFactor) / 6));
      return { month: k, count };
    });
  }

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.loadMonthlyPatientData(this.tenantId(), year).then((data) => {
      this.metrics.update((m) => ({ ...m, monthlyPatients: data }));
    });
  }

  getMaxPatientCount(): number {
    const data = this.metrics().monthlyPatients;
    if (!data.length) return 100;
    return Math.max(...data.map((d) => d.count), 10);
  }

  getBarHeight(count: number): string {
    const max = this.getMaxPatientCount();
    const percentage = (count / max) * 100;
    return `${percentage}%`;
  }

  formatCurrency(amount: number): string {
    const lang = (this.translate.currentLang || 'es').toLowerCase();
    const locale = lang.startsWith('en') ? 'en-US' : 'es-PE';

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  goToSubscription(): void {
    this.router.navigate(['/hospital/subscription']);
  }

  goToDoctors(): void {
    this.router.navigate(['/hospital/doctors']);
  }

  goToPatients(): void {
    this.router.navigate(['/hospital/patients']);
  }

  normalizeSubscriptionStatus(status?: string | null): string {
    const raw = (status || '').toString().trim().toLowerCase();
    if (!raw) return 'inactive';

    if (raw.includes('active')) return 'active';
    if (raw.includes('inactive')) return 'inactive';
    if (raw.includes('cancel')) return 'cancelled'; // cancelled/canceled
    if (raw.includes('pause')) return 'paused';
    if (raw.includes('expire')) return 'expired';

    return 'unknown';
  }
}
