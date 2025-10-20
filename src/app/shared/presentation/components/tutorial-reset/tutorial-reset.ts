import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-tutorial-reset',
  imports: [CommonModule],
  template: `
    <div style="padding:16px; text-align:center">
      <p>Abriendo tutorial…</p>
    </div>
  `
})
export class TutorialResetComponent {
  private router = inject(Router);

  constructor() {
    try {

      localStorage.removeItem('hasSeenOnboarding');
      localStorage.removeItem('onboardingCompletedAt');

      const role = localStorage.getItem('userRole') || '';

      if (role.toLowerCase() === 'patient') {
        this.router.navigateByUrl('/patient/dashboard');
      } else {

        this.router.navigateByUrl('/patient/dashboard');
      }
    } catch {

      this.router.navigateByUrl('/patient/dashboard');
    }
  }
}
