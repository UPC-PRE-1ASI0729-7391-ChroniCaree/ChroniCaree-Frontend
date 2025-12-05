/**
 * Tenant Service
 * Servicio de infraestructura para comunicación con API de tenants
 * NO contiene lógica de negocio, solo comunicación HTTP
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

import { TenantEntity, TenantStatus, TenantSettings } from '../domain/model/tenant.entity';
import { environment } from '../../../environments/environment';

const TENANT_API = `${environment.apiBaseUrl}${environment.tenantsEndpointPath}`;

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
  constructor(private readonly http: HttpClient) {}

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
    console.log(`🌐 [TenantService] getById(${id}) - URL: ${TENANT_API}/${id}`);
    
    return this.http.get<TenantResource>(`${TENANT_API}/${id}`).pipe(
      map((resource) => {
        console.log('📦 [TenantService] Response raw:', resource);
        const entity = this.toEntity(resource);
        console.log('📦 [TenantService] Entity mapped:', entity);
        console.log('  → id:', entity.id);
        console.log('  → status:', entity.status);
        console.log('  → subscriptionId:', entity.subscriptionId);
        console.log('  → settings:', entity.settings);
        return entity;
      }),
      catchError((error) => {
        console.error(`❌ [TenantService] Error fetching tenant ${id}:`, error);
        console.error('  → status:', error.status);
        console.error('  → message:', error.message);
        console.error('  → error:', error.error);
        return throwError(() => new Error(`Failed to fetch tenant with id ${id}`));
      })
    );
  }

  /**
   * Obtiene tenant por adminUserId
   * Backend endpoint: GET /tenants/by-admin/{adminUserId}
   */
  getByAdminUserId(adminUserId: string | number): Observable<TenantEntity | null> {
    const url = `${TENANT_API}/by-admin/${adminUserId}`;
    console.log('🌐 [TenantService] GET by admin:', url);
    
    return this.http.get<TenantResource>(url).pipe(
      map((resource) => {
        console.log('✅ [TenantService] Tenant found:', resource);
        return this.toEntity(resource);
      }),
      catchError((error) => {
        console.error(`❌ [TenantService] Error fetching tenant by adminUserId ${adminUserId}:`, error);
        // Si es 404, retornar null en lugar de error
        if (error.status === 404) {
          console.log('ℹ️ [TenantService] No tenant found for admin, returning null');
          return of(null);
        }
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
