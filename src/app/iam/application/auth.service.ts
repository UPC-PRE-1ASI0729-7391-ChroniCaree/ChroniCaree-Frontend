import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import { User } from '../domain/model/user.entity';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: any;
  tenant?: any; // Para el endpoint de hospital admin sign-up
}

export interface DecodedToken {
  sub: string; // Usually the username or email
  id: number;
  role: string;
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // API Endpoint configuration
  // Using the path specified by the user: /api/v1/authentication
  private readonly API_URL = `${environment.apiBaseUrl}${environment.authEndpointPath}`;
  
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'currentUser';

  // State management
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Signal for modern Angular components
  public currentUserSignal = signal<User | null>(null);

  constructor() {
    this.loadSession();
  }

  /**
   * Sign in with email and password
   */
  signIn(signInRequest: any): Observable<AuthResponse> {
    console.log('🔑 [AuthService] signIn() called');
    console.log('📧 Email:', signInRequest.email);
    console.log('🌐 Endpoint:', `${this.API_URL}/sign-in`);
    
    return this.http.post<AuthResponse>(`${this.API_URL}/sign-in`, signInRequest).pipe(
      tap(response => {
        console.log('✅ [AuthService] signIn() successful');
        console.log('📦 [AuthService] FULL RESPONSE:', response);
        console.log('🎫 Token received:', response.accessToken?.substring(0, 50) + '...');
        console.log('👤 User in response:', response.user);
        console.log('🏥 Tenant in response.user:', response.user?.tenant);
        this.setSession(response);
      }),
      catchError(error => {
        console.error('❌ [AuthService] signIn() failed');
        console.error('Error status:', error.status);
        console.error('Error:', error);
        
        if (error.status === 404) {
          // Backend returns 404 for invalid credentials
          return throwError(() => new Error('Correo electrónico o contraseña incorrectos.'));
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Sign up a new user
   */
  signUp(signUpRequest: any): Observable<any> {
    console.log('🔐 [AuthService] signUp() called');
    console.log('📧 Request:', { email: signUpRequest.email, role: signUpRequest.role });
    console.log('🌐 Endpoint:', `${this.API_URL}/sign-up`);
    
    return this.http.post(`${this.API_URL}/sign-up`, signUpRequest).pipe(
      tap({
        next: (response) => {
          console.log('✅ [AuthService] signUp() successful');
          console.log('📦 Response:', response);
        },
        error: (error) => {
          console.error('❌ [AuthService] signUp() failed');
          console.error('Error:', error);
        }
      })
    );
  }

  /**
   * Sign up a Hospital Admin with their Hospital in ONE atomic transaction
   * This endpoint creates User + Tenant + updates user.tenantId in a single request
   */
  signUpHospitalAdmin(data: {
    email: string;
    password: string;
    name: string;
    hospitalName: string;
    hospitalEmail: string;
    hospitalPhone: string;
    hospitalAddress: string;
  }): Observable<AuthResponse> {
    console.log('🏥 [AuthService] signUpHospitalAdmin() called');
    console.log('  📧 Email:', data.email);
    console.log('  🏥 Hospital Name:', data.hospitalName);
    console.log('  🌐 Endpoint:', `${this.API_URL}/sign-up/hospital-admin`);

    return this.http.post<AuthResponse>(`${this.API_URL}/sign-up/hospital-admin`, data).pipe(
      tap({
        next: (response) => {
          console.log('✅ [AuthService] Hospital admin registration successful!');
          console.log('  👤 User ID:', response.user?.id);
          console.log('  👤 User Name:', response.user?.name);
          console.log('  👤 User Email:', response.user?.email);
          console.log('  👤 User Role:', response.user?.role);
          console.log('  🏥 User tenantId:', response.user?.tenantId);
          console.log('  🏥 Tenant ID:', response.tenant?.id);
          console.log('  🏥 Tenant Name:', response.tenant?.name);
          console.log('  🎫 Token length:', response.accessToken?.length);
          
          // Guardar sesión con el tenant incluido
          console.log('💾 [AuthService] Saving session to localStorage...');
          this.setSession(response);
          console.log('✅ [AuthService] Session saved successfully');
          
          // Verificar lo que se guardó en localStorage
          console.log('🔍 [AuthService] Verifying localStorage after save:');
          console.log('  - currentUser:', localStorage.getItem('currentUser'));
          console.log('  - userRole:', localStorage.getItem('userRole'));
        },
        error: (error) => {
          console.error('❌ [AuthService] Hospital admin registration failed');
          console.error('  Status:', error.status);
          console.error('  Error:', error);
        }
      })
    );
  }

  /**
   * Refresh the access token using the refresh token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http.post<AuthResponse>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
      tap(response => {
        this.setSession(response);
      }),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout the user
   */
  logout(): void {
    // Optional: Call backend to revoke refresh token
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      this.http.post(`${this.API_URL}/logout`, { refreshToken }).subscribe({
        next: () => console.log('Logout successful on backend'),
        error: (err) => console.warn('Backend logout failed', err)
      });
    }

    // Clear local storage
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('isAuthenticated'); // Legacy support

    // Update state
    this.currentUserSubject.next(null);
    this.currentUserSignal.set(null);

    // Redirect to login
    this.router.navigate(['/iam/login']);
  }

  /**
   * Get the current access token
   */
  getAccessToken(): string | null {
    const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
    if (token) {
      console.log('🎫 [AuthService] Token retrieved from localStorage:', token.substring(0, 50) + '...');
    } else {
      console.warn('⚠️ [AuthService] No token found in localStorage');
    }
    return token;
  }

  /**
   * Get the current refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Check if the user is authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      const decoded: DecodedToken = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get the current user's role from the token
   */
  getUserRole(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const decoded: any = jwtDecode(token);
      return decoded.role || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Helper to set session data
   */
  private setSession(authResult: AuthResponse): void {
    console.log('💾 [AuthService] setSession() called');
    console.log('🎫 Access Token:', authResult.accessToken?.substring(0, 50) + '...');
    console.log('🎫 Refresh Token:', authResult.refreshToken?.substring(0, 50) + '...');
    
    localStorage.setItem(this.ACCESS_TOKEN_KEY, authResult.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authResult.refreshToken);
    console.log('✅ [AuthService] Tokens saved to localStorage');
    
    // Store user info if provided, otherwise decode from token
    let user = authResult.user;
    if (!user) {
      console.log('👤 [AuthService] No user in response, decoding from token...');
      const decoded: any = jwtDecode(authResult.accessToken);
      user = {
        id: decoded.id,
        email: decoded.sub,
        role: decoded.role
      };
      console.log('👤 [AuthService] Decoded user from token:', user);
    } else {
      console.log('👤 [AuthService] User provided in response:', user);
      console.log('  - ID:', user.id);
      console.log('  - Email:', user.email);
      console.log('  - Name:', user.name);
      console.log('  - Role:', user.role);
      console.log('  - TenantId:', user.tenantId);
      console.log('  - Tenant object:', user.tenant);
    }

    console.log('💾 [AuthService] Saving user to localStorage...');
    const userJson = JSON.stringify(user);
    console.log('  📦 User JSON to save:', userJson);
    localStorage.setItem(this.USER_KEY, userJson);
    console.log('  ✅ Saved with key:', this.USER_KEY);
    
    localStorage.setItem('isAuthenticated', 'true'); // Legacy support
    localStorage.setItem('userRole', user.role); // For LayoutContentComponent
    console.log('  ✅ Saved isAuthenticated and userRole');

    this.currentUserSubject.next(user);
    this.currentUserSignal.set(user);
    
    console.log('✅ [AuthService] Session saved successfully');
    console.log('🔍 [AuthService] Verifying localStorage NOW:');
    console.log('  - access_token:', localStorage.getItem(this.ACCESS_TOKEN_KEY)?.substring(0, 50) + '...');
    console.log('  - currentUser:', localStorage.getItem(this.USER_KEY));
    console.log('  - userRole:', localStorage.getItem('userRole'));
    console.log('  - isAuthenticated:', localStorage.getItem('isAuthenticated'));
  }

  /**
   * Load user from storage on app start
   */
  private loadSession(): void {
    const userJson = localStorage.getItem(this.USER_KEY);
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        this.currentUserSubject.next(user);
        this.currentUserSignal.set(user);
      } catch (e) {
        console.error('Error parsing user from storage', e);
        this.logout();
      }
    }
  }
}
