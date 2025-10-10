import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserStore } from '../../../application/user.store';

interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  form = signal<LoginForm>({
    email: '',
    password: '',
    rememberMe: false
  });

  submitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private userStore: UserStore,
    private router: Router
  ) {}

  updateForm(field: keyof LoginForm, value: string | boolean): void {
    this.form.update(current => ({
      ...current,
      [field]: value
    }));
  }

  onSubmit(): void {
    const f = this.form();
    
    if (!f.email || !f.password) {
      this.errorMessage.set('Por favor, completa todos los campos');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set(null);

    // Simulate login - In real app, call authentication service
    setTimeout(() => {
      // Mock successful login
      const mockUser = {
        id: 1,
        email: f.email,
        role: 'patient' as const,
        name: 'Usuario Demo',
        password: '',
        isVerified: true,
        twoFactorEnabled: false
      };

      this.userStore.setCurrentUser(mockUser);
      this.submitting.set(false);

      // Navigate based on role
      if (mockUser.role === 'patient') {
        this.router.navigate(['/patient/dashboard']);
      } else if (mockUser.role === 'doctor') {
        this.router.navigate(['/doctor/dashboard']);
      } else {
        this.router.navigate(['/']);
      }
    }, 1000);
  }
}
