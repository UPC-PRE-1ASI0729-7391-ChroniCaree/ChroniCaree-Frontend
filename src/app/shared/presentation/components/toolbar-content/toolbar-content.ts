import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-toolbar-content',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './toolbar-content.html',
  styleUrl: './toolbar-content.css'
})
export class ToolbarContentComponent {
  menuItems = [
    { icon: '🏠', label: 'Inicio', route: '/' },
    { icon: '🏥', label: 'Pacientes', route: '/patients' },
    { icon: '👨‍⚕️', label: 'Doctores', route: '/doctors' },
    { icon: '📅', label: 'Citas', route: '/appointments' },
    { icon: '💊', label: 'Medicamentos', route: '/medications' },
    { icon: '📊', label: 'Reportes', route: '/reports' },
    { icon: '⚙️', label: 'Configuración', route: '/settings' }
  ];

  isCollapsed = false;

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
