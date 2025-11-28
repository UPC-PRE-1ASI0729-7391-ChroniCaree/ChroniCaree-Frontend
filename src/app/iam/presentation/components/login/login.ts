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

    this.authService.signIn(email, password).subscribe({
      next: () => {
        // Remember me functionality
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        const role = this.authService.getUserRole();
        this.submitting.set(false);

        switch(role) {
          case 'patient':
            this.router.navigate(['/patient/dashboard']);
            break;
          case 'doctor':
            this.router.navigate(['/doctor/dashboard']);
            break;
          case 'hospital_admin':
            this.router.navigate(['/hospital/dashboard']);
            break;
          default:
            this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.submitting.set(false);
        if (err.status === 401) {
          this.errorMessage.set('❌ Email o contraseña incorrectos');
        } else {
          this.errorMessage.set('⚠️ Error al conectar con el servidor. Por favor intenta de nuevo.');
        }
      }
    });
  }
}
