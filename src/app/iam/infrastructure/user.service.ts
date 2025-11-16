/**
 * User Service
 * Servicio de infraestructura para comunicación con API de usuarios
 * NO contiene lógica de negocio, solo comunicación HTTP
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

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
   */
  emailExists(email: string): Observable<boolean> {
    return this.http.get<UserResource[]>(`${USER_API}?email=${email}`).pipe(
      map((resources) => resources.length > 0),
      catchError(() => throwError(() => new Error('Failed to check email existence')))
    );
  }

  /**
   * Crea un nuevo usuario
   */
  create(request: CreateUserRequest): Observable<UserEntity> {
    const payload: UserResource = {
      id: 0, // Will be assigned by backend
      email: request.email,
      role: request.role,
      name: request.name,
      password: request.password, // En producción debe hashearse
      isVerified: false,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      tenantId: request.tenantId || null,
    };

    return this.http.post<UserResource>(USER_API, payload).pipe(
      map((resource) => this.toEntity(resource)),
      catchError((error) => {
        console.error('Error creating user:', error);
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
