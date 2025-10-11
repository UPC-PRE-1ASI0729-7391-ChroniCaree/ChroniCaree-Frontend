import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UserStore } from '../../../../iam/application/user.store';

@Component({
  standalone: true,
  selector: 'app-toolbar-doctor',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './toolbar-doctor.html',
  styleUrls: ['./toolbar-doctor.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarDoctorComponent {
  constructor(
    private router: Router,
    private userStore: UserStore
  ) {}

  logout(): void {
    // Clear user store and localStorage
    this.userStore.clearCurrentUser();
    
    // Navigate to login
    this.router.navigate(['/iam/login']);

  }
}
