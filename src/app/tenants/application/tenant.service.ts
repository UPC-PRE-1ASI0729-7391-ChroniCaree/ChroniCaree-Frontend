import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Tenant } from '../domain/model/tenant.entity';
import { TenantApiEndpoint } from '../infrastructure/tenant-api.endpoint';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  constructor(private tenantApi: TenantApiEndpoint) {}

  getAllTenants(): Observable<Tenant[]> {
    return this.tenantApi.getAll();
  }

  getTenantById(id: number): Observable<Tenant> {
    return this.tenantApi.getById(id);
  }
}
