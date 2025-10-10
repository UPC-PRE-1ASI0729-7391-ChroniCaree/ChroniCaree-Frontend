import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageSwitcherContentComponent } from '../language-switcher-content/language-switcher-content';

@Component({
  selector: 'app-header-content',
  standalone: true,
  imports: [CommonModule, LanguageSwitcherContentComponent],
  templateUrl: './header-content.html',
  styleUrl: './header-content.css'
})
export class HeaderContentComponent {
  protected readonly currentUser = signal({
    name: 'Dr. Juan Torres',
    role: 'Médico',
    avatar: '👨‍⚕️'
  });

  protected readonly notifications = signal([
    { id: 1, message: 'Nueva cita programada', unread: true },
    { id: 2, message: 'Resultado de laboratorio disponible', unread: true },
    { id: 3, message: 'Mensaje de paciente', unread: false }
  ]);

  protected showNotifications = signal(false);
  protected showUserMenu = signal(false);

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
