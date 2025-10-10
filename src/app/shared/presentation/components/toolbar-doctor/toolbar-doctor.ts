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
    // Clear user store and localStorage
    this.userStore.clearCurrentUser();
    
    // Navigate to login
    this.router.navigate(['/iam/login']);
  }
}
