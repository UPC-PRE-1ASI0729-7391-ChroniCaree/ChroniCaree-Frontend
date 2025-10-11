import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher';
import { UserStore } from '../../../../iam/application/user.store';

@Component({
  selector: 'app-header-content',
  standalone: true,
  imports: [CommonModule, LanguageSwitcherComponent, RouterLink],
  templateUrl: './header-content.html',
  styleUrl: './header-content.css'
})
export class HeaderContentComponent implements OnInit {
  readonly notifications = signal([
    { id: 1, message: 'Nueva cita programada', unread: true },
    { id: 2, message: 'Resultado de laboratorio disponible', unread: true },
    { id: 3, message: 'Mensaje de paciente', unread: false }
  ]);

  showNotifications = signal(false);
  showUserMenu = signal(false);

  // Get user from localStorage
  currentUser = computed(() => {
    const userStr = localStorage.getItem('currentUser');
    const role = localStorage.getItem('userRole');

    if (userStr && role) {
      const user = JSON.parse(userStr);
      return {
        name: user.name || 'Usuario',
        role: this.getRoleLabel(role),
        avatar: this.getRoleAvatar(role),
        email: user.email
      };
    }

    return {
      name: 'Usuario',
      role: 'Invitado',
      avatar: '👤',
      email: ''
    };
  });

  constructor(
    private router: Router,
    private userStore: UserStore
  ) {}

  ngOnInit(): void {
    // Load user from localStorage on component init
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userStore.setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }
  }

  getRoleLabel(role: string): string {
    const roleLabels: Record<string, string> = {
      'patient': 'Paciente',
      'doctor': 'Médico',
      'hospital_admin': 'Administrador'
    };
    return roleLabels[role] || role;
  }

  getRoleAvatar(role: string): string {
    const roleAvatars: Record<string, string> = {
      'patient': '🧑',
      'doctor': '👨‍⚕️',
      'hospital_admin': '👔'
    };
    return roleAvatars[role] || '👤';
  }

  getHelpRoute(): string {
    const role = (localStorage.getItem('userRole') || '').toLowerCase();
    return role === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard';
  }

  toggleNotifications(): void {
    this.showNotifications.update(v => !v);
    if (this.showNotifications()) {
      this.showUserMenu.set(false);
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
    if (this.showUserMenu()) {
      this.showNotifications.set(false);
    }
  }

  getUnreadCount(): number {
    return this.notifications().filter(n => n.unread).length;
  }

  /**
   * Obtiene la ruta del perfil según el rol del usuario
   */
  getProfileRoute(): string {
    const role = localStorage.getItem('userRole');

    switch (role) {
      case 'patient':
        return '/patient/edit-profile';
      case 'doctor':
        return '/doctor/edit-profile';
      case 'hospital_admin':
        return '/settings'; // Placeholder para admin
      default:
        return '/patient/edit-profile';
    }
  }

  closeMenus(): void {
    this.showUserMenu.set(false);
    this.showNotifications.set(false);
  }

  logout(): void {
    // Clear localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');

    // Clear user store
    this.userStore.setCurrentUser(null);

    // Navigate to login
    this.router.navigate(['/iam/login']);
  }
}
