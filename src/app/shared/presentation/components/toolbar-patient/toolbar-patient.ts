import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserStore } from '../../../../iam/application/user.store';

@Component({
  selector: 'app-toolbar-patient',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './toolbar-patient.html',
  styleUrls: ['./toolbar-patient.css']
})
export class ToolbarPatientComponent {
  readonly isCollapsed = signal<boolean>(false);

  constructor(
    private router: Router,
    public userStore: UserStore
  ) {}

  get currentUser() {
    return this.userStore.currentUser$();
  }

  toggleSidebar(): void {
    this.isCollapsed.update(v => !v);
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
