import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HospitalDashboardStore } from '../../../../tenants/application/hospital-dashboard.store';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: string;
}

@Component({
  selector: 'app-hospital-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hospital-sidebar.component.html',
  styleUrls: ['./hospital-sidebar.component.css']
})
export class HospitalSidebarComponent {
  private readonly router = inject(Router);
  private readonly store = inject(HospitalDashboardStore);

  // State
  readonly isCollapsed = signal(false);
  readonly activeRoute = signal('dashboard');

  // Hospital info from store
  readonly hospitalName = computed(() => this.store.stats()?.planName || 'Hospital');
  readonly dashboardStats = this.store.stats;

  // Menu items
  readonly menuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/hospital/dashboard'
    },
    {
      id: 'doctors',
      label: 'Doctores',
      icon: 'medical_services',
      route: '/hospital/dashboard',
      badge: 'doctors'
    },
    {
      id: 'patients',
      label: 'Pacientes',
      icon: 'people',
      route: '/hospital/dashboard',
      badge: 'patients'
    },
    {
      id: 'onboarding',
      label: 'Registrar Paciente',
      icon: 'person_add',
      route: '/hospital/patient-onboarding'
    },
    {
      id: 'devices',
      label: 'Dispositivos IoT',
      icon: 'devices',
      route: '/hospital/patient-devices'
    },
    {
      id: 'assignments',
      label: 'Asignaciones',
      icon: 'assignment',
      route: '/hospital/dashboard'
    },
    {
      id: 'statistics',
      label: 'Estadísticas',
      icon: 'bar_chart',
      route: '/hospital/dashboard'
    },
    {
      id: 'subscription',
      label: 'Suscripción',
      icon: 'card_membership',
      route: '/hospital/subscription'
    }
  ];

  readonly settingsItems: MenuItem[] = [
    {
      id: 'settings',
      label: 'Configuración',
      icon: 'settings',
      route: '/hospital/settings'
    },
    {
      id: 'profile',
      label: 'Mi Perfil',
      icon: 'account_circle',
      route: '/hospital/profile'
    }
  ];

  constructor() {
    // Update active route on navigation
    this.updateActiveRoute();
  }

  toggleSidebar(): void {
    this.isCollapsed.set(!this.isCollapsed());
  }

  navigateTo(item: MenuItem): void {
    this.activeRoute.set(item.id);
    this.router.navigate([item.route]);
  }

  isActive(itemId: string): boolean {
    return this.activeRoute() === itemId;
  }

  getBadgeValue(badge: string): string | undefined {
    const stats = this.dashboardStats();
    if (!stats) return undefined;

    switch (badge) {
      case 'doctors':
        return stats.totalDoctors?.toString();
      case 'patients':
        return stats.totalPatients?.toString();
      default:
        return undefined;
    }
  }

  logout(): void {
    // TODO: Implement logout logic
    localStorage.removeItem('auth_token');
    this.router.navigate(['/iam/login']);
  }

  private updateActiveRoute(): void {
    const currentUrl = this.router.url;
    if (currentUrl.includes('patient-onboarding')) {
      this.activeRoute.set('onboarding');
    } else if (currentUrl.includes('patient-devices')) {
      this.activeRoute.set('devices');
    } else if (currentUrl.includes('settings')) {
      this.activeRoute.set('settings');
    } else if (currentUrl.includes('profile')) {
      this.activeRoute.set('profile');
    } else {
      this.activeRoute.set('dashboard');
    }
  }
}
