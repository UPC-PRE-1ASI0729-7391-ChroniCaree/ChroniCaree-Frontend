import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../application/auth.service';

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
export class LoginComponent implements OnInit {
  form = signal<LoginForm>({
    email: '',
    password: '',
    rememberMe: false
  });

  submitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load remembered email if exists
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      this.form.update(current => ({
        ...current,
        email: rememberedEmail,
        rememberMe: true
      }));
    }
  }

  updateForm(field: keyof LoginForm, value: string | boolean): void {
    this.form.update(current => ({
      ...current,
      [field]: value
    }));
  }

  quickLogin(type: 'doctor' | 'patient'): void {
    // Quick login was removed from UI; method retained as no-op for backward compatibility.
    return;
  }

  onSubmit(): void {
    this.errorMessage.set(null);
    this.submitting.set(true);

    const { email, password, rememberMe } = this.form();

    // Validate form
    if (!email || !password) {
      this.errorMessage.set('Por favor completa todos los campos');
      this.submitting.set(false);
      return;
    }

    this.authService.signIn({ email, password }).subscribe({
      next: () => {
        // Remember me functionality
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        const role = this.authService.getUserRole();
        console.log('Login successful. Detected role:', role);
        this.submitting.set(false);

        // Normalize role to lowercase for comparison
        const normalizedRole = role ? role.toLowerCase() : '';

        if (normalizedRole.includes('patient')) {
          this.router.navigate(['/patient/dashboard']);
        } else if (normalizedRole.includes('doctor')) {
          this.router.navigate(['/doctor/dashboard']);
        } else if (normalizedRole.includes('hospital') || normalizedRole.includes('admin') || normalizedRole.includes('tenant')) {
          this.router.navigate(['/hospital/dashboard']);
        } else {
          console.warn('Unknown role, redirecting to home:', role);
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.submitting.set(false);
        
        // Handle specific error messages thrown by AuthService
        if (err.message === 'Correo electrónico o contraseña incorrectos.') {
          this.errorMessage.set('❌ Correo electrónico o contraseña incorrectos.');
        } else if (err.status === 401 || err.status === 404) {
          // Fallback for status codes if message doesn't match
          this.errorMessage.set('❌ Correo electrónico o contraseña incorrectos.');
        } else {
          this.errorMessage.set('⚠️ Error al conectar con el servidor. Por favor intenta de nuevo.');
        }
      }
    });
  }
}
