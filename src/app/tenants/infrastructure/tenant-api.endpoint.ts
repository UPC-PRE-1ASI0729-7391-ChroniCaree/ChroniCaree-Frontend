import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { BaseResponse } from '../../shared/infrastructure/base-response';
import { Tenant } from '../domain/model/tenant.entity';
import { TenantResource } from './tenant.resource';
import { TenantAssembler } from './tenant.assembler';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TenantApiEndpoint extends BaseApiEndpoint<Tenant, TenantResource, BaseResponse, TenantAssembler> {
  private readonly tenantUrl = `${environment.apiBaseUrl}${environment.tenantsEndpointPath}`;
  
  constructor(http: HttpClient) {
    super(http, `${environment.apiBaseUrl}${environment.tenantsEndpointPath}`, new TenantAssembler());
    console.log('🏥 [TenantAPI] Endpoint initialized:', `${environment.apiBaseUrl}${environment.tenantsEndpointPath}`);
  }

  /**
   * Obtener tenant por ID del admin
   * Backend endpoint: GET /tenants/by-admin/{adminUserId}
   */
  getByAdminId(adminUserId: number): Observable<Tenant> {
    const url = `${this.tenantUrl}/by-admin/${adminUserId}`;
    console.log('🌐 [TenantAPI] GET by admin:', url);
    
    return this.http.get<TenantResource>(url).pipe(
      map(resource => this.assembler.toEntityFromResource(resource)),
      tap({
        next: (tenant) => {
          console.log('✅ [TenantAPI] Tenant by admin found:', tenant);
        },
        error: (error) => {
          console.error('❌ [TenantAPI] Get by admin failed:', error);
        }
      })
    );
  }

  override create(tenant: Tenant): Observable<Tenant> {
    const endpoint = `${environment.apiBaseUrl}${environment.tenantsEndpointPath}`;
    console.log('🌐 [TenantAPI] POST', endpoint);
    console.log('📦 [TenantAPI] Request body:', tenant);
    
    return super.create(tenant).pipe(
      tap({
        next: (response) => {
          console.log('✅ [TenantAPI] Response received:', response);
        },
        error: (error) => {
          console.error('❌ [TenantAPI] Request failed');
          console.error('Status:', error.status);
          console.error('Error:', error);
        }
      })
    );
  }
}
