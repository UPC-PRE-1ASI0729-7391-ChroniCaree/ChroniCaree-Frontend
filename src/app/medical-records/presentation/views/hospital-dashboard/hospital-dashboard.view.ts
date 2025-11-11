import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HospitalDashboardStore } from '../../../../tenants/application/hospital-dashboard.store';
import { DoctorsManagementComponent } from '../../components/doctors-management/doctors-management.component';
import { HospitalPatientsComponent } from '../../components/hospital-patients/hospital-patients.component';
import { DoctorPatientAssignmentComponent } from '../../components/doctor-patient-assignment/doctor-patient-assignment.component';
import { HospitalStatisticsComponent } from '../../components/hospital-statistics/hospital-statistics.component';

interface Tab {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-hospital-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    DoctorsManagementComponent,
    HospitalPatientsComponent,
    DoctorPatientAssignmentComponent,
    HospitalStatisticsComponent
  ],
  templateUrl: './hospital-dashboard.view.html',
  styleUrls: ['./hospital-dashboard.view.css']
})
export class HospitalDashboardView implements OnInit {
  private readonly store = inject(HospitalDashboardStore);

  // UI State
  activeTab = signal<string>('doctors');
  isLoadingStats = computed(() => this.store.loading());

  // Dashboard Data
  dashboardStats = computed(() => this.store.stats());
  errorMessage = computed(() => this.store.error());

  // Computed values
  hospitalName = computed(() => this.dashboardStats()?.planName || 'Mi Hospital');
  subscriptionStatus = computed(() => this.dashboardStats()?.subscriptionStatus || 'unknown');
  subscriptionPlanName = computed(() => this.dashboardStats()?.planName || 'Sin plan');
  doctorsCount = computed(() => this.dashboardStats()?.totalDoctors || 0);
  maxDoctors = computed(() => {
    const stats = this.dashboardStats();
    if (stats) {
      return stats.maxDoctors === -1 ? 'Ilimitado' : stats.maxDoctors;
    }
    return 0;
  });

  isPendingSubscription = computed(() => 
    this.subscriptionStatus() === 'pending_subscription'
  );

  isSubscriptionActive = computed(() => this.dashboardStats()?.activeSubscription || false);

  doctorsLimitReached = computed(() => {
    const max = this.maxDoctors();
    if (max === 'Ilimitado') return false;
    return this.doctorsCount() >= (max as number);
  });

  doctorsProgressPercentage = computed(() => {
    const max = this.maxDoctors();
    if (max === 'Ilimitado') return 0;
    return (this.doctorsCount() / (max as number)) * 100;
  });

  tabs: Tab[] = [
    { id: 'doctors', label: 'Doctores', icon: 'medical_services' },
    { id: 'patients', label: 'Pacientes', icon: 'people' },
    { id: 'assignments', label: 'Vinculaciones', icon: 'link' },
    { id: 'statistics', label: 'Estadísticas', icon: 'analytics' }
  ];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    // Get tenantId from logged user (this should come from auth service)
    // For now, using a hardcoded value for demonstration
    const tenantId = 1; // TODO: Get from auth service
    this.store.loadDashboardStats(tenantId);
  }

  selectTab(tabId: string): void {
    this.activeTab.set(tabId);
  }

  refreshData(): void {
    this.loadDashboard();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'pending_subscription':
        return 'text-yellow-600 bg-yellow-100';
      case 'suspended':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'active':
        return 'Activo';
      case 'pending_subscription':
        return 'Pendiente de Suscripción';
      case 'suspended':
        return 'Suspendido';
      default:
        return 'Desconocido';
    }
  }

  getPlanBadgeColor(planName: string): string {
    switch (planName.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-600 text-white';
      case 'professional':
        return 'bg-blue-600 text-white';
      case 'basic':
        return 'bg-green-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  }
}
