import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher';

@Component({
  selector: 'app-header-content',
  standalone: true,
  imports: [CommonModule, LanguageSwitcherComponent],
  templateUrl: './header-content.html',
  styleUrl: './header-content.css'
})
export class HeaderContentComponent {
  readonly currentUser = signal({
    name: 'Dr. Juan Torres',
    role: 'Médico',
    avatar: '👨‍⚕️'
  });

  readonly notifications = signal([
    { id: 1, message: 'Nueva cita programada', unread: true },
    { id: 2, message: 'Resultado de laboratorio disponible', unread: true },
    { id: 3, message: 'Mensaje de paciente', unread: false }
  ]);

  showNotifications = signal(false);
  showUserMenu = signal(false);

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

  logout(): void {
    console.log('Cerrando sesión...');
    // Implementar lógica de logout
  }
}
