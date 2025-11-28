import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError, BehaviorSubject } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../../environments/environment';
import { User } from '../domain/model/user.entity';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: any;
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
  private readonly API_URL = `${environment.apiBaseUrl}/api/v1/authentication`;
  
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

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
    return this.http.post<AuthResponse>(`${this.API_URL}/sign-in`, signInRequest).pipe(
      tap(response => {
        this.setSession(response);
      })
    );
  }

  /**
   * Sign up a new user
   */
  signUp(signUpRequest: any): Observable<any> {
    return this.http.post(`${this.API_URL}/sign-up`, signUpRequest);
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
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
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
    localStorage.setItem(this.ACCESS_TOKEN_KEY, authResult.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authResult.refreshToken);
    
    // Store user info if provided, otherwise decode from token
    let user = authResult.user;
    if (!user) {
      const decoded: any = jwtDecode(authResult.accessToken);
      user = {
        id: decoded.id,
        email: decoded.sub,
        role: decoded.role
      };
    }

    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem('isAuthenticated', 'true'); // Legacy support

    this.currentUserSubject.next(user);
    this.currentUserSignal.set(user);
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
