import { Component, signal, OnInit } from '@angular/core';
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
export class LoginComponent implements OnInit {
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

    // Load users from store and authenticate
    this.userStore.loadAllUsers().subscribe({
      next: (users) => {
        // Find user with matching email and password
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
          // Store user in UserStore (this will persist + emit userChanged)
          this.userStore.setCurrentUser(user);

          // Remember me functionality (only rememberedEmail remains in localStorage)
          if (rememberMe) {
            localStorage.setItem('rememberedEmail', email);
          } else {
            localStorage.removeItem('rememberedEmail');
          }

          // Navigate based on role
          setTimeout(() => {
            this.submitting.set(false);
            
            switch(user.role) {
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
          }, 800);
        } else {
          this.errorMessage.set('❌ Email o contraseña incorrectos');
          this.submitting.set(false);
        }
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage.set('⚠️ Error al conectar con el servidor. Por favor intenta de nuevo.');
        this.submitting.set(false);
      }
    });
  }
}
