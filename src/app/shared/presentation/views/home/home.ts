import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

type UserType = 'patient' | 'doctor' | null;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  protected readonly selectedUserType = signal<UserType>(null);
  protected readonly hoveredCard = signal<UserType>(null);

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Check if user has already selected a type
    const savedUserType = localStorage.getItem('userType') as UserType;
    if (savedUserType === 'patient' || savedUserType === 'doctor') {
      this.navigateToDashboard(savedUserType);
    }
  }

  selectUserType(userType: UserType): void {
    if (!userType) return;
    
    this.selectedUserType.set(userType);
    localStorage.setItem('userType', userType);
    
    // Small delay for visual feedback
    setTimeout(() => {
      this.navigateToDashboard(userType);
    }, 300);
  }

  setHoveredCard(userType: UserType): void {
    this.hoveredCard.set(userType);
  }

  clearHoveredCard(): void {
    this.hoveredCard.set(null);
  }

  private navigateToDashboard(userType: UserType): void {
    if (userType === 'patient') {
      this.router.navigate(['/patient/dashboard']);
    } else if (userType === 'doctor') {
      this.router.navigate(['/doctor/dashboard']);
    }
  }
}
