import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HospitalDashboardStore } from '../../../../tenants/application/hospital-dashboard.store';
import { PatientService } from '../../../../patients/infrastructure/patient.service';

interface MonthlyStats {
  month: string;
  newPatients: number;
  consultations: number;
  revenue: number;
}

@Component({
  selector: 'app-hospital-statistics',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="statistics-container">
    <h1>Estadísticas del Hospital</h1>
    <p>Funcionalidad en desarrollo</p>
  </div>`,
  styles: [`
    .statistics-container {
      padding: 2rem;
    }
  `]
})
export class HospitalStatisticsView implements OnInit {
  private dashboardStore = inject(HospitalDashboardStore);
  private patientService = inject(PatientService);
  private router = inject(Router);

  loading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Stats
  totalDoctors = signal<number>(0);
  totalPatients = signal<number>(0);
  totalConsultations = signal<number>(0);
  averagePatientsPerDoctor = computed(() => {
    const doctors = this.totalDoctors();
    const patients = this.totalPatients();
    return doctors > 0 ? Math.round(patients / doctors) : 0;
  });

  // Monthly data
  selectedYear = signal<number>(new Date().getFullYear());
  monthlyStats = signal<MonthlyStats[]>([]);
  
  availableYears = computed(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 3 }, (_, i) => currentYear - i);
  });

  months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  ngOnInit(): void {
    this.loadStatistics();
  }

  private async loadStatistics(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const tenantId = currentUser.tenantId;

      if (!tenantId) {
        throw new Error('No se encontró el hospital asociado');
      }

      // Cargar estadísticas
      this.dashboardStore.loadDashboardStats(tenantId).subscribe({
        next: (result) => {
          if (result.success && result.data) {
            this.totalDoctors.set(result.data.totalDoctors);
            this.totalPatients.set(result.data.totalPatients);
            
            // Generar datos mensuales simulados
            this.generateMonthlyStats();
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar estadísticas');
          this.loading.set(false);
          console.error(err);
        }
      });
    } catch (err: any) {
      this.error.set(err.message);
      this.loading.set(false);
    }
  }

  private generateMonthlyStats(): void {
    const stats: MonthlyStats[] = this.months.map((month, index) => ({
      month,
      newPatients: Math.floor(Math.random() * 20) + 5,
      consultations: Math.floor(Math.random() * 100) + 50,
      revenue: Math.floor(Math.random() * 5000) + 2000
    }));
    
    this.monthlyStats.set(stats);
    
    // Total de consultations
    const totalConsults = stats.reduce((sum, s) => sum + s.consultations, 0);
    this.totalConsultations.set(totalConsults);
  }

  onYearChange(year: number): void {
    this.selectedYear.set(year);
    this.generateMonthlyStats();
  }

  getMaxValue(field: 'newPatients' | 'consultations' | 'revenue'): number {
    const values = this.monthlyStats().map(s => s[field]);
    return Math.max(...values);
  }

  getBarHeight(value: number, field: 'newPatients' | 'consultations' | 'revenue'): string {
    const max = this.getMaxValue(field);
    return max > 0 ? `${(value / max) * 100}%` : '0%';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  goToDashboard(): void {
    this.router.navigate(['/hospital/dashboard']);
  }
}
