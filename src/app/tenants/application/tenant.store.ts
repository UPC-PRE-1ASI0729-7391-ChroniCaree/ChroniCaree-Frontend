import { Injectable, signal, WritableSignal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Tenant } from '../domain/model/tenant.entity';
import { TenantApiEndpoint } from '../infrastructure/tenant-api.endpoint';

@Injectable({
  providedIn: 'root'
})
export class TenantStore {
  private readonly tenants: WritableSignal<Tenant[]> = signal([]);
  private readonly selectedTenant: WritableSignal<Tenant | null> = signal(null);
  private readonly loading: WritableSignal<boolean> = signal(false);
  private readonly error: WritableSignal<string | null> = signal(null);

  readonly tenants$ = this.tenants.asReadonly();
  readonly selectedTenant$ = this.selectedTenant.asReadonly();
  readonly loading$ = this.loading.asReadonly();
  readonly error$ = this.error.asReadonly();

  constructor(private tenantApi: TenantApiEndpoint) {}

  loadAllTenants(): Observable<Tenant[]> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.tenantApi.getAll().pipe(
      tap({
        next: (tenants) => {
          this.tenants.set(tenants);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar tenants');
          this.loading.set(false);
          console.error('Error loading tenants:', err);
        }
      })
    );
  }

  loadTenantById(id: number): Observable<Tenant> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.tenantApi.getById(id).pipe(
      tap({
        next: (tenant) => {
          this.selectedTenant.set(tenant);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar tenant');
          this.loading.set(false);
          console.error('Error loading tenant:', err);
        }
      })
    );
  }

  createTenant(tenant: Tenant): Observable<Tenant> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.tenantApi.create(tenant).pipe(
      tap({
        next: (newTenant) => {
          this.tenants.update(tenants => [...tenants, newTenant]);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al crear tenant');
          this.loading.set(false);
          console.error('Error creating tenant:', err);
        }
      })
    );
  }

  updateTenant(tenant: Tenant): Observable<Tenant> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.tenantApi.update(tenant, tenant.id).pipe(
      tap({
        next: (updatedTenant) => {
          this.tenants.update(tenants => 
            tenants.map(t => t.id === updatedTenant.id ? updatedTenant : t)
          );
          this.selectedTenant.set(updatedTenant);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al actualizar tenant');
          this.loading.set(false);
          console.error('Error updating tenant:', err);
        }
      })
    );
  }

  deleteTenant(id: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.tenantApi.delete(id).pipe(
      tap({
        next: () => {
          this.tenants.update(tenants => tenants.filter(t => t.id !== id));
          if (this.selectedTenant()?.id === id) {
            this.selectedTenant.set(null);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al eliminar tenant');
          this.loading.set(false);
          console.error('Error deleting tenant:', err);
        }
      })
    );
  }

  clearError(): void {
    this.error.set(null);
  }

  clearSelection(): void {
    this.selectedTenant.set(null);
  }
}
