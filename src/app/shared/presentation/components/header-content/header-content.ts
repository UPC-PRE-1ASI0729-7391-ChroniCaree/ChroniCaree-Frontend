import { Component, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher';
import { TranslateModule } from '@ngx-translate/core';
import { UserStore } from '../../../../iam/application/user.store';

@Component({
  selector: 'app-header-content',
  standalone: true,
  imports: [CommonModule, LanguageSwitcherComponent, RouterLink, TranslateModule],
  templateUrl: './header-content.html',
  styleUrl: './header-content.css'
})
export class HeaderContentComponent implements OnInit {
  showUserMenu = signal(false);

  // Get user from localStorage
  // Compute header user info from UserStore, fallback to localStorage for initial load
  currentUser = computed(() => {
    const userFromStore = this.userStore.currentUser$();
    const roleFromStore = localStorage.getItem('userRole') || undefined;

    console.log('🔄 [HeaderContent] currentUser computed called');
    console.log('  📊 userFromStore:', userFromStore);
    console.log('  📊 roleFromStore:', roleFromStore);

    if (userFromStore && userFromStore.id) {
      const role = (roleFromStore || userFromStore.role || 'patient') as string;
      const userName = userFromStore.name || 'Usuario';
      console.log('  ✅ Using UserStore data');
      console.log('    - Name:', userName);
      console.log('    - Role:', role);
      return {
        name: userName,
        role: role,
        avatar: this.getRoleAvatar(role),
        email: userFromStore.email
      };
    }

    // Fallback to localStorage if UserStore empty
    const userStr = localStorage.getItem('currentUser');
    const role = localStorage.getItem('userRole');

    if (userStr && role) {
      const user = JSON.parse(userStr);
      const userName = user.name || 'Usuario';
      console.log('  ✅ Using localStorage fallback');
      console.log('    - Name:', userName);
      console.log('    - Role:', role);
      return {
        name: userName,
        role: role,
        avatar: this.getRoleAvatar(role),
        email: user.email
      };
    }

    console.log('  ⚠️ No user data found, using defaults');
    return {
      name: 'Usuario',
      role: 'guest',
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
    console.log('🔍 [HeaderContent] ngOnInit - Loading user from localStorage');
    console.log('  📦 userStr:', userStr);
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log('  👤 Parsed user:', user);
        console.log('    - Name:', user.name);
        console.log('    - Role:', user.role);
        console.log('    - TenantId:', user.tenantId);
        this.userStore.setCurrentUser(user);
      } catch (error) {
        console.error('❌ [HeaderContent] Error parsing user from localStorage:', error);
      }
    } else {
      console.warn('⚠️ [HeaderContent] No user found in localStorage');
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

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
  }

  /**
   * Obtiene la ruta del perfil según el rol del usuario
   */
  getProfileRoute(): string {

    const role = localStorage.getItem('userRole') || this.userStore.currentUser$()?.role;

    switch (role) {
      case 'patient':
        return '/patient/edit-profile';
      case 'doctor':
        return '/doctor/edit-profile';
      case 'hospital_admin':
        return '/hospital/profile';
      default:
        return '/patient/edit-profile';
    }
  }

  /**
   * Verifica si el usuario actual es un paciente
   */
  isPatient(): boolean {
    const role = localStorage.getItem('userRole') || this.userStore.currentUser$()?.role;
    return role === 'patient';
  }

  closeMenus(): void {
    this.showUserMenu.set(false);
  }

  logout(): void {
    // Clear localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');

    // Use UserStore to clear session (this will clear localStorage and emit userChanged)
    this.userStore.clearCurrentUser();
    // Navigate to login
    this.router.navigate(['/iam/login']);
  }
}
