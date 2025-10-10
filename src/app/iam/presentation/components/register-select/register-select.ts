import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

type RegisterType = 'patient' | 'hospital' | null;

@Component({
  selector: 'app-register-select',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './register-select.html',
  styleUrls: ['./register-select.css']
})
export class RegisterSelectComponent {
  protected readonly hoveredCard = signal<RegisterType>(null);

  constructor(private router: Router) {}

  selectRegisterType(type: RegisterType): void {
    if (type === 'patient') {
      this.router.navigate(['/iam/register/patient']);
    } else if (type === 'hospital') {
      this.router.navigate(['/iam/register/hospital']);
    }
  }

  setHoveredCard(type: RegisterType): void {
    this.hoveredCard.set(type);
  }

  clearHoveredCard(): void {
    this.hoveredCard.set(null);
  }
}
