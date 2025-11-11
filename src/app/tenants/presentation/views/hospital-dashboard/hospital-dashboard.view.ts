import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './hospital-dashboard.view.html',
  styleUrls: ['./hospital-dashboard.view.css']
})
export class HospitalDashboardView implements OnInit {
  private dashboardStore = inject(HospitalDashboardStore);
  private subscriptionService = inject(SubscriptionService);
  private patientService = inject(PatientService);
  private router = inject(Router);

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

  // Computed
  availableYears = computed(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  });

  maxDoctorsAllowed = computed(() => {
    const plan = this.metrics().subscriptionPlan;
    if (!plan) return 0;
    const features = plan.features as any;
    return features.maxDoctors === -1 ? -1 : features.maxDoctors;
  });

  isMaxDoctorsUnlimited = computed(() => this.maxDoctorsAllowed() === -1);

  doctorsPercentage = computed(() => {
    const max = this.maxDoctorsAllowed();
    if (max === -1) return 0;
    const current = this.metrics().totalDoctors;
    return Math.round((current / max) * 100);
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  private async loadDashboard(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const tenantId = currentUser.tenantId;

      if (!tenantId) {
        throw new Error('No se encontró el hospital asociado');
      }

      this.tenantId.set(tenantId);

      // Cargar estadísticas del dashboard
      this.dashboardStore.loadDashboardStats(tenantId).subscribe({
        next: async (result) => {
          if (result.success && result.data) {
            const stats = result.data;
            
            // Cargar suscripción y plan
            let subscription: SubscriptionEntity | null = null;
            let plan: SubscriptionPlanEntity | null = null;

            if (stats.activeSubscription) {
              // Obtener detalles de suscripción
              const doctors = this.dashboardStore.doctors();
              if (doctors.length > 0) {
                const firstDoctor = doctors[0];
                const tenantIdFromDoctor = firstDoctor.tenantId;
                
                // Buscar suscripción activa del tenant
                if (tenantIdFromDoctor) {
                  try {
                    const subs = await this.subscriptionService.getActiveByPayerId('tenant', tenantIdFromDoctor).toPromise();
                    if (subs) {
                      subscription = subs;
                      // Obtener el plan
                      const planResult = await this.subscriptionService.getPlanById(subs.planId).toPromise();
                      plan = planResult ?? null;
                    }
                  } catch (err) {
                    console.error('Error loading subscription:', err);
                  }
                }
              }
            }

            // Cargar datos mensuales de pacientes
            const monthlyData = await this.loadMonthlyPatientData(tenantId, this.selectedYear());

            // Calcular revenue mensual (precio del plan)
            const monthlyRevenue = plan ? plan.price : 0;

            // Calcular promedio de pacientes por doctor
            const avgPatients = stats.totalDoctors > 0 
              ? Math.round(stats.totalPatients / stats.totalDoctors) 
              : 0;

            this.metrics.set({
              totalDoctors: stats.totalDoctors,
              totalPatients: stats.totalPatients,
              activeSubscription: subscription,
              subscriptionPlan: plan,
              monthlyPatients: monthlyData,
              monthlyRevenue,
              averagePatientsPerDoctor: avgPatients
            });
          }
        },
        error: (err) => {
          console.error('Error loading dashboard:', err);
          this.error.set(err.message || 'Error al cargar el dashboard');
        },
        complete: () => {
          this.loading.set(false);
        }
      });

    } catch (err: any) {
      this.error.set(err.message || 'Error al cargar el dashboard');
      this.loading.set(false);
    }
  }

  private async loadMonthlyPatientData(tenantId: number, year: number): Promise<MonthlyPatientData[]> {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    // Por ahora, simulamos datos basados en el total de pacientes
    // En producción, esto vendría de una API con filtro de fecha
    const doctors = this.dashboardStore.doctors();
    const monthlyData: MonthlyPatientData[] = [];

    for (let i = 0; i < 12; i++) {
      // Simulación: distribución aleatoria del total
      const randomFactor = 0.5 + Math.random() * 0.5; // 50% - 100%
      const count = Math.round(this.dashboardStore.stats()?.totalPatients || 0 * randomFactor / 6);
      
      monthlyData.push({
        month: months[i],
        count: count
      });
    }

    return monthlyData;
  }

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.loadMonthlyPatientData(this.tenantId(), year).then(data => {
      this.metrics.update(m => ({ ...m, monthlyPatients: data }));
    });
  }

  getMaxPatientCount(): number {
    const data = this.metrics().monthlyPatients;
    if (data.length === 0) return 100;
    return Math.max(...data.map(d => d.count), 10);
  }

  getBarHeight(count: number): string {
    const max = this.getMaxPatientCount();
    const percentage = (count / max) * 100;
    return `${percentage}%`;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
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
}
