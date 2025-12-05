/**
 * User Service
 * Servicio de infraestructura para comunicación con API de usuarios
 * NO contiene lógica de negocio, solo comunicación HTTP
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { UserEntity, UserRole } from '../domain/model/user.entity';
import { environment } from '../../../environments/environment';

const USER_API = `${environment.apiBaseUrl}${environment.usersEndpointPath}`;

export interface UserResource {
  id: number;
  email: string;
  role: UserRole;
  name: string;
  password: string;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  tenantId: number | null;
}

export interface CreateUserRequest {
  email: string;
  role: UserRole;
  name: string;
  password: string;
  tenantId?: number | null;
}

export interface UpdateUserRequest {
  name?: string;
  isVerified?: boolean;
  twoFactorEnabled?: boolean;
  tenantId?: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los usuarios
   */
  getAll(): Observable<UserEntity[]> {
    return this.http.get<UserResource[]>(USER_API).pipe(
      map((resources) => resources.map((r) => this.toEntity(r))),
      catchError((error) => {
        console.error('Error fetching users:', error);
        return throwError(() => new Error('Failed to fetch users'));
      })
    );
  }

  /**
   * Obtiene un usuario por ID
   */
  getById(id: string | number): Observable<UserEntity> {
    return this.http.get<UserResource>(`${USER_API}/${id}`).pipe(
      map((resource) => this.toEntity(resource)),
      catchError((error) => {
        console.error(`Error fetching user ${id}:`, error);
        return throwError(() => new Error(`Failed to fetch user with id ${id}`));
      })
    );
  }

  /**
   * Obtiene un usuario por email
   */
  getByEmail(email: string): Observable<UserEntity | null> {
    return this.http.get<UserResource[]>(`${USER_API}?email=${email}`).pipe(
      map((resources) => {
        if (resources.length === 0) return null;
        return this.toEntity(resources[0]);
      }),
      catchError((error) => {
        console.error(`Error fetching user by email ${email}:`, error);
        return throwError(() => new Error(`Failed to fetch user with email ${email}`));
      })
    );
  }

  /**
   * Verifica si un email ya existe
   * NOTA: El backend tiene un bug donde GET /users?email=X devuelve TODOS los usuarios
   * en lugar de filtrar. Por eso filtramos manualmente en el frontend.
   */
  emailExists(email: string): Observable<boolean> {
    console.log('🔍 [UserService] emailExists() - Checking email:', email);
    console.log('  → URL:', `${USER_API}?email=${email}`);
    
    const normalizedEmail = email.toLowerCase().trim();
    
    return this.http.get<UserResource[]>(`${USER_API}?email=${email}`).pipe(
      tap(resources => {
        console.log('📦 [UserService] emailExists() - Raw response:', resources);
        console.log('  → Total users returned:', resources.length);
      }),
      map((resources) => {
        // Filtrar manualmente porque el backend no filtra correctamente
        const matchingUsers = resources.filter(u => 
          u.email && u.email.toLowerCase().trim() === normalizedEmail
        );
        console.log('🔍 [UserService] emailExists() - After filtering:');
        console.log('  → Users with exact email match:', matchingUsers.length);
        if (matchingUsers.length > 0) {
          console.log('  → Matching user:', matchingUsers[0]);
        }
        return matchingUsers.length > 0;
      }),
      catchError((error) => {
        console.error('❌ [UserService] emailExists() - Error:', error);
        // Si hay error, asumir que no existe para permitir continuar
        // El backend validará de nuevo al crear
        return of(false);
      })
    );
  }

  /**
   * Crea un nuevo usuario
   * Backend expects: email, password, role (UPPERCASE), name, tenantId
   */
  create(request: CreateUserRequest): Observable<UserEntity> {
    // Payload para el backend - role debe ser UPPERCASE
    const payload = {
      email: request.email,
      password: request.password,
      role: request.role.toUpperCase(),  // Backend expects UPPERCASE: DOCTOR, PATIENT, etc.
      name: request.name,
      tenantId: request.tenantId ?? null,
    };

    console.log('📤 [UserService] Creating user with payload:', {
      email: payload.email,
      role: payload.role,
      name: payload.name,
      tenantId: payload.tenantId
    });
    console.log('  → URL:', USER_API);

    return this.http.post<UserResource>(USER_API, payload).pipe(
      map((resource) => {
        console.log('✅ [UserService] User created successfully:', resource);
        return this.toEntity(resource);
      }),
      catchError((error) => {
        console.error('❌ [UserService] Error creating user:', error);
        console.error('  → Status:', error.status);
        console.error('  → Error body:', error.error);
        return throwError(() => new Error('Failed to create user'));
      })
    );
  }

  /**
   * Actualiza un usuario
   */
  update(id: string | number, request: UpdateUserRequest): Observable<UserEntity> {
    return this.http.patch<UserResource>(`${USER_API}/${id}`, request).pipe(
      map((resource) => this.toEntity(resource)),
      catchError((error) => {
        console.error(`Error updating user ${id}:`, error);
        return throwError(() => new Error(`Failed to update user ${id}`));
      })
    );
  }

  /**
   * Elimina un usuario
   */
  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${USER_API}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error deleting user ${id}:`, error);
        return throwError(() => new Error(`Failed to delete user ${id}`));
      })
    );
  }

  /**
   * Convierte UserResource a UserEntity
   */
  private toEntity(resource: UserResource): UserEntity {
    return new UserEntity(
      resource.id,
      resource.email,
      resource.role,
      resource.name,
      resource.password,
      resource.isVerified,
      resource.twoFactorEnabled,
      resource.createdAt,
      resource.tenantId
    );
  }
}
