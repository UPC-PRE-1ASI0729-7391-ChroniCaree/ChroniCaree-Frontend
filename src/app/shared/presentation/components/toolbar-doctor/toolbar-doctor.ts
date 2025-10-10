import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserStore } from '../../../../iam/application/user.store';

@Component({
  selector: 'app-toolbar-doctor',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './toolbar-doctor.html',
  styleUrls: ['./toolbar-doctor.css']
})
export class ToolbarDoctorComponent {
  constructor(
    private router: Router,
    public userStore: UserStore
  ) {}

  get currentUser() {
    return this.userStore.currentUser$();
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
