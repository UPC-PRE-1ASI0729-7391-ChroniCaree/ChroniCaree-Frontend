import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';

// ============================================================================
// INTERFACES - Según documentación del backend
// ============================================================================

// Respuesta del backend para sign-in y sign-up
// El backend SIEMPRE responde con esta estructura:
// { accessToken, refreshToken, user: { id, email, name, role, tenantId, tenant, doctorId } }
export interface BackendAuthResponse {
  accessToken: string;      // ← NO es "token"
  refreshToken: string;
  user: BackendUserInfo;    // ← Los datos están DENTRO de "user"
}

export interface BackendUserInfo {
  id: number;
  email: string;
  name: string;
  role: string;             // 'patient' | 'doctor' | 'hospital_admin'
  tenantId: number | null;
  tenant: BackendTenantInfo | null;
  doctorId: number | null;
}

export interface BackendTenantInfo {
  id: number;
  name: string;
  status: string;
  subscriptionId: number | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  allowIndependentDoctors: boolean;
  requirePatientApproval: boolean;
  maxDoctors: number;
}

// Alias para compatibilidad
export type AuthResponse = BackendAuthResponse;
export type BackendTenantResponse = BackendTenantInfo;
export type BackendRegisterResponse = BackendUserInfo;

export interface DecodedToken {
  sub: string;
  id: number;
  role: string;
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // API Endpoint configuration
  // Using the path specified by the user: /api/v1/authentication
  private readonly API_URL = `${environment.apiBaseUrl}${environment.authEndpointPath}`;
  
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'currentUser';

  // State management - usando BackendUserInfo para el usuario actual
  private readonly currentUserSubject = new BehaviorSubject<BackendUserInfo | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Signal for modern Angular components
  public currentUserSignal = signal<BackendUserInfo | null>(null);

  constructor() {
    this.loadSession();
  }

  /**
   * Sign in with email and password
   * Backend responde: { accessToken, refreshToken, user: { id, email, name, role, tenantId, tenant, doctorId } }
   */
  signIn(signInRequest: any): Observable<AuthResponse> {
    console.log('🔑 [AuthService] signIn() called');
    console.log('📧 Email:', signInRequest.email);
    console.log('🌐 Endpoint:', `${this.API_URL}/sign-in`);
    
    return this.http.post<BackendAuthResponse>(`${this.API_URL}/sign-in`, signInRequest).pipe(
      tap(response => {
        console.log('✅ [AuthService] signIn() successful');
        console.log('📦 [AuthService] Backend response:', response);
        console.log('🎫 AccessToken:', response.accessToken ? 'Present' : 'Missing');
        console.log('🔄 RefreshToken:', response.refreshToken ? 'Present' : 'Missing');
        console.log('👤 User ID:', response.user?.id);
        console.log('📧 User Email:', response.user?.email);
        console.log('👔 User Role:', response.user?.role);
        console.log('🏥 Tenant ID:', response.user?.tenantId);
        console.log('🏥 Tenant:', response.user?.tenant);
      }),
      map(response => {
        // Normalizar el rol
        const normalizedResponse: AuthResponse = {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          user: {
            ...response.user,
            role: this.normalizeRole(response.user.role)
          }
        };
        return normalizedResponse;
      }),
      tap(response => {
        this.setSession(response);
      }),
      catchError(error => {
        console.error('❌ [AuthService] signIn() failed');
        console.error('Error status:', error.status);
        console.error('Error:', error);
        
        if (error.status === 404 || error.status === 401) {
          return throwError(() => new Error('Correo electrónico o contraseña incorrectos.'));
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Sign up a new user (patient)
   * Backend endpoint: POST /authentication/sign-up
   * Request: { email, password, firstName, lastName }
   * Response: { accessToken, refreshToken, user: {...} }
   */
  signUp(signUpRequest: any): Observable<AuthResponse> {
    console.log('🔐 [AuthService] signUp() called');
    console.log('📧 Request:', { email: signUpRequest.email });
    console.log('🌐 Endpoint:', `${this.API_URL}/sign-up`);
    
    // Formato según documentación del backend
    const backendRequest = {
      email: signUpRequest.email,
      password: signUpRequest.password,
      firstName: signUpRequest.firstName || signUpRequest.name?.split(' ')[0] || '',
      lastName: signUpRequest.lastName || signUpRequest.name?.split(' ').slice(1).join(' ') || ''
    };
    console.log('📤 Backend request:', { ...backendRequest, password: '***' });
    
    return this.http.post<BackendAuthResponse>(`${this.API_URL}/sign-up`, backendRequest).pipe(
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
   * Sign up a Hospital Admin with their Hospital
   * Backend endpoint: POST /authentication/sign-up/hospital-admin
   * 
   * Respuesta del backend (estructura anidada):
   * {
   *   accessToken: string,
   *   refreshToken: string,
   *   user: { id, email, name, role, tenantId, tenant: {...}, doctorId }
   * }
   */
  signUpHospitalAdmin(data: {
    email: string;
    password: string;
    name: string;
    hospitalName: string;
    hospitalEmail?: string;
    hospitalPhone?: string;
    hospitalAddress?: string;
    ruc?: string;
  }): Observable<AuthResponse> {
    console.log('🏥 [AuthService] signUpHospitalAdmin() called');
    console.log('  📧 Email:', data.email);
    console.log('  🏥 Hospital Name:', data.hospitalName);

    // Request según documentación del backend
    const hospitalAdminRequest: any = {
      adminName: (data.name || '').trim(),
      adminEmail: (data.email || '').trim(),
      adminPassword: data.password,
      hospitalName: (data.hospitalName || '').trim(),
      address: (data.hospitalAddress || '').trim(),
      phone: (data.hospitalPhone || '').trim(),
      ruc: (data.ruc || '').trim()
    };
    
    console.log('📤 Registering hospital admin:', { ...hospitalAdminRequest, adminPassword: '***' });
    console.log('🌐 Endpoint:', `${this.API_URL}/sign-up/hospital-admin`);

    // El backend responde con estructura anidada:
    // { accessToken, refreshToken, user: { id, email, name, role, tenantId, tenant, doctorId } }
    return this.http.post<{
      accessToken: string;
      refreshToken: string;
      user: {
        id: number;
        email: string;
        name: string;
        role: string;
        tenantId: number;
        tenant: any;
        doctorId: number | null;
      };
    }>(
      `${this.API_URL}/sign-up/hospital-admin`, 
      hospitalAdminRequest
    ).pipe(
      tap(response => {
        console.log('✅ Hospital admin created, raw response:', response);
      }),
      // Mapear la respuesta al formato AuthResponse interno
      map(response => {
        console.log('📦 Mapping response to AuthResponse...');
        
        // Construir respuesta normalizada desde la estructura anidada
        const authResponse: AuthResponse = {
          accessToken: response.accessToken,
          refreshToken: response.refreshToken || '',
          user: {
            id: response.user.id,
            email: response.user.email,
            name: response.user.name,
            role: this.normalizeRole(response.user.role),
            tenantId: response.user.tenantId,
            tenant: response.user.tenant,
            doctorId: response.user.doctorId
          }
        };
        
        console.log('📦 [AuthService] Auth response:', authResponse);
        return authResponse;
      }),
      tap({
        next: (response) => {
          console.log('✅ [AuthService] Hospital admin registration successful!');
          console.log('  👤 User ID:', response.user?.id);
          console.log('  👤 User Name:', response.user?.name);
          console.log('  👤 User Email:', response.user?.email);
          console.log('  👤 User Role:', response.user?.role);
          console.log('  🏥 User tenantId:', response.user?.tenantId);
          console.log('  🏥 Tenant:', response.user?.tenant);
          console.log('  🎫 AccessToken:', response.accessToken ? 'Present' : 'Missing');
          console.log('  🔄 RefreshToken:', response.refreshToken ? 'Present' : 'Missing');
          
          // Guardar sesión con el token
          console.log('💾 [AuthService] Saving session to localStorage...');
          this.setSession(response);
          console.log('✅ [AuthService] Session saved successfully');
        },
        error: (error) => {
          console.error('❌ [AuthService] Hospital admin registration failed');
          console.error('  Status:', error.status);
          console.error('  Error:', error);
          if (error?.error?.details) {
            console.error('  Details:', error.error.details);
          }
        }
      }),
      catchError(error => {
        console.error('❌ [AuthService] Registration error:', error);
        // Prefer detailed backend validation messages if available
        if (error.status === 400) {
          const details = error.error?.details;
          const message = error.error?.message || 'Datos de entrada inválidos';
          if (details && typeof details === 'object') {
            // Build a concise message from field errors
            const fieldErrors = Object.entries(details)
              .map(([field, msg]) => `${field}: ${msg}`)
              .join('; ');
            const suffix = fieldErrors ? ' – ' + fieldErrors : '';
            return throwError(() => new Error(message + suffix));
          }
        }

        // Specific duplicates
        if (error.status === 409) {
          return throwError(() => new Error('El usuario o hospital ya existe'));
        }

        // Fallback
        return throwError(() => error);
      })
    );
  }

  /**
   * Refresh the access token using the refresh token
   * Backend endpoint: POST /authentication/refresh-token
   * Request: { refreshToken }
   * Response: { accessToken, refreshToken }
   */
  refreshToken(): Observable<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    console.log('🔄 [AuthService] Refreshing token...');
    return this.http.post<{ accessToken: string; refreshToken: string }>(
      `${this.API_URL}/refresh-token`, 
      { refreshToken }
    ).pipe(
      tap(response => {
        console.log('✅ [AuthService] Token refreshed successfully');
        // Actualizar tokens en localStorage
        localStorage.setItem(this.ACCESS_TOKEN_KEY, response.accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
      }),
      catchError(error => {
        console.error('❌ [AuthService] Token refresh failed:', error);
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
    localStorage.removeItem('userRole');
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
    } catch {
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
    } catch {
      return null;
    }
  }

  /**
   * Normaliza el rol del backend (MAYÚSCULAS) al formato del frontend
   * Backend: TENANT_ADMIN, DOCTOR, PATIENT
   * Frontend: hospital_admin, doctor, patient
   */
  private normalizeRole(backendRole: string): string {
    const roleMapping: Record<string, string> = {
      'TENANT_ADMIN': 'hospital_admin',
      'HOSPITAL_ADMIN': 'hospital_admin',
      'DOCTOR': 'doctor',
      'PATIENT': 'patient',
      'ADMIN': 'admin'
    };
    return roleMapping[backendRole?.toUpperCase()] || backendRole?.toLowerCase() || 'patient';
  }

  /**
   * Convierte el rol del frontend al formato del backend (MAYÚSCULAS)
   * Frontend: hospital_admin, doctor, patient
   * Backend: TENANT_ADMIN, DOCTOR, PATIENT
   */
  private toBackendRole(frontendRole: string): string {
    const roleMapping: Record<string, string> = {
      'hospital_admin': 'TENANT_ADMIN',
      'doctor': 'DOCTOR',
      'patient': 'PATIENT',
      'admin': 'ADMIN'
    };
    return roleMapping[frontendRole?.toLowerCase()] || frontendRole?.toUpperCase() || 'PATIENT';
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
    let user: any = authResult.user;
    if (user) {
      console.log('👤 [AuthService] User provided in response:', user);
      console.log('  - ID:', user.id);
      console.log('  - Email:', user.email);
      console.log('  - Name:', user.name);
      console.log('  - Role:', user.role);
      console.log('  - TenantId:', user.tenantId);
      console.log('  - Tenant object:', user.tenant);
    } else {
      console.log('👤 [AuthService] No user in response, decoding from token...');
      const decoded: any = jwtDecode(authResult.accessToken);
      user = {
        id: decoded.id,
        email: decoded.sub,
        name: decoded.name || '',
        role: this.normalizeRole(decoded.role),
        tenantId: decoded.tenantId || null,
        tenant: null,
        doctorId: decoded.doctorId || null
      };
      console.log('👤 [AuthService] Decoded user from token:', user);
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
