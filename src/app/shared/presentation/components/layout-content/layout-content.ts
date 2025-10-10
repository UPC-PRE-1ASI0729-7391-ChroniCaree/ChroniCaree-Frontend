import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { ToolbarDoctorComponent } from '../toolbar-doctor/toolbar-doctor';
import { ToolbarPatientComponent } from '../toolbar-patient/toolbar-patient';
import { HeaderContentComponent } from '../header-content/header-content';
import { FooterContentComponent } from '../footer-content/footer-content';

@Component({
  selector: 'app-layout-content',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    ToolbarDoctorComponent,
    ToolbarPatientComponent,
    HeaderContentComponent,
    FooterContentComponent
  ],
  templateUrl: './layout-content.html',
  styleUrl: './layout-content.css'
})
export class LayoutContentComponent {
  currentUrl = signal<string>('');
  currentUserRole = signal<'patient' | 'doctor' | 'hospital_admin' | null>(null);

  // Routes that should be full-screen (no header/footer/toolbar)
  // Only IAM routes (login, register) and home landing page should be fullscreen
  isFullScreen = computed(() => {
    const url = this.currentUrl();
    // Fullscreen ONLY for: /, /home, /iam/* (login, register), /404
    // coming-soon and dashboards should show WITH layout
    return url === '/' || 
           url.startsWith('/iam') || 
           url.startsWith('/home') ||
           url === '/404';
  });

  // Get user role from signal instead of computed
  userRole = computed(() => this.currentUserRole());

  constructor(private router: Router) {
    // Set initial URL and role
    this.currentUrl.set(this.router.url);
    this.updateUserRole();

    // Listen to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl.set(event.url);
        this.updateUserRole(); // Update role on route change
      });
  }

  private updateUserRole(): void {
    const role = localStorage.getItem('userRole') as 'patient' | 'doctor' | 'hospital_admin' | null;
    this.currentUserRole.set(role);
    console.log('Current user role:', role); // Debug log
  }
}
