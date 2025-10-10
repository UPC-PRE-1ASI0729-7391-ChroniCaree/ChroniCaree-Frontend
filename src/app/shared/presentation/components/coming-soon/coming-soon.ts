import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coming-soon.html',
  styleUrls: ['./coming-soon.css']
})
export class ComingSoonComponent {
  // Get user role from localStorage
  userRole = computed(() => {
    return localStorage.getItem('userRole') as 'patient' | 'doctor' | 'hospital_admin' | null;
  });

  constructor(private router: Router) {}

  goBack(): void {
    const role = this.userRole();
    
    // Redirect to appropriate dashboard based on user role
    if (role === 'doctor' || role === 'hospital_admin') {
      this.router.navigate(['/doctor/dashboard']);
    } else if (role === 'patient') {
      this.router.navigate(['/patient/dashboard']);
    } else {
      // If no role, go to login
      this.router.navigate(['/iam/login']);
    }
  }
}
