/**
 * Tenant Service
 * Servicio de infraestructura para comunicación con API de tenants
 * NO contiene lógica de negocio, solo comunicación HTTP
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

import { TenantEntity, TenantStatus, TenantSettings } from '../domain/model/tenant.entity';

const BASE_URL = 'http://localhost:3000';
const TENANT_API = `${BASE_URL}/tenants`;

export interface TenantResource {
  id: number;
  adminUserId: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  status: TenantStatus;
  subscriptionId: number | null;
  registrationDate: string;
  settings: TenantSettings;
}

export interface CreateTenantRequest {
  adminUserId: number;
  name: string;
  address?: string;
  phone?: string;
  email: string;
  status?: TenantStatus;
  subscriptionId?: number | null;
  settings?: TenantSettings;
}

export interface UpdateTenantRequest {
  subscriptionId?: number | null;
  status?: TenantStatus;
  settings?: Partial<TenantSettings>;
  name?: string;
  address?: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root',
})
export class TenantService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los tenants
   */
  getAll(): Observable<TenantEntity[]> {
    return this.http.get<TenantResource[]>(TENANT_API).pipe(
      map((resources) => resources.map((r) => this.toEntity(r))),
      catchError((error) => {
        console.error('Error fetching tenants:', error);
        return throwError(() => new Error('Failed to fetch tenants'));
      })
    );
  }

  /**
   * Obtiene un tenant por ID
   */
  getById(id: string | number): Observable<TenantEntity> {
    return this.http.get<TenantResource>(`${TENANT_API}/${id}`).pipe(
      map((resource) => this.toEntity(resource)),
      catchError((error) => {
        console.error(`Error fetching tenant ${id}:`, error);
        return throwError(() => new Error(`Failed to fetch tenant with id ${id}`));
      })
    );
  }

  /**
   * Obtiene tenant por adminUserId
   */
  getByAdminUserId(adminUserId: string | number): Observable<TenantEntity | null> {
    return this.http.get<TenantResource[]>(`${TENANT_API}?adminUserId=${adminUserId}`).pipe(
      map((resources) => {
        if (resources.length === 0) return null;
        return this.toEntity(resources[0]);
      }),
      catchError((error) => {
        console.error(`Error fetching tenant by adminUserId ${adminUserId}:`, error);
        return throwError(() => new Error(`Failed to fetch tenant with adminUserId ${adminUserId}`));
      })
    );
  }

  /**
   * Crea un nuevo tenant
   */
  create(request: CreateTenantRequest): Observable<TenantEntity> {
    const payload: TenantResource = {
      id: 0, // Will be assigned by backend
      adminUserId: request.adminUserId,
      name: request.name,
      address: request.address || '',
      phone: request.phone || '',
      email: request.email,
      status: request.status || 'pending_subscription',
      subscriptionId: request.subscriptionId || null,
      registrationDate: new Date().toISOString(),
      settings: request.settings || {
        allowIndependentDoctors: false,
        requirePatientApproval: true,
        maxDoctors: 5, // Default limit
      },
    };

    return this.http.post<TenantResource>(TENANT_API, payload).pipe(
      map((resource) => this.toEntity(resource)),
      catchError((error) => {
        console.error('Error creating tenant:', error);
        return throwError(() => new Error('Failed to create tenant'));
      })
    );
  }

  /**
   * Actualiza un tenant
   */
  update(id: string | number, request: UpdateTenantRequest): Observable<TenantEntity> {
    // Si se actualizan settings parcialmente, necesitamos merge
    let payload: any = { ...request };

    if (request.settings) {
      // Obtener tenant actual para hacer merge de settings
      return this.getById(id).pipe(
        switchMap((currentTenant) => {
          const mergedSettings = {
            ...currentTenant.settings,
            ...request.settings,
          };
          payload = { ...request, settings: mergedSettings };

          return this.http.patch<TenantResource>(`${TENANT_API}/${id}`, payload).pipe(
            map((resource) => this.toEntity(resource)),
            catchError((error) => {
              console.error(`Error updating tenant ${id}:`, error);
              return throwError(() => new Error(`Failed to update tenant ${id}`));
            })
          );
        })
      );
    }

    return this.http.patch<TenantResource>(`${TENANT_API}/${id}`, payload).pipe(
      map((resource) => this.toEntity(resource)),
      catchError((error) => {
        console.error(`Error updating tenant ${id}:`, error);
        return throwError(() => new Error(`Failed to update tenant ${id}`));
      })
    );
  }

  /**
   * Elimina un tenant
   */
  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${TENANT_API}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error deleting tenant ${id}:`, error);
        return throwError(() => new Error(`Failed to delete tenant ${id}`));
      })
    );
  }

  /**
   * Convierte TenantResource a TenantEntity
   */
  private toEntity(resource: TenantResource): TenantEntity {
    return new TenantEntity(
      resource.id,
      resource.adminUserId,
      resource.name,
      resource.address,
      resource.phone,
      resource.email,
      resource.status,
      resource.subscriptionId,
      resource.registrationDate,
      resource.settings
    );
  }
}
