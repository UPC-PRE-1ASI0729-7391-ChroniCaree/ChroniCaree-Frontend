import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TenantStore } from './tenant.store';

describe('TenantStore', () => {
  let store: TenantStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TenantStore,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    store = TestBed.inject(TenantStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have empty tenants array initially', () => {
    expect(store.tenants$()).toEqual([]);
  });

  it('should have no selected tenant initially', () => {
    expect(store.selectedTenant$()).toBeNull();
  });

  it('should not be loading initially', () => {
    expect(store.loading$()).toBeFalse();
  });

  it('should have no error initially', () => {
    expect(store.error$()).toBeNull();
  });
});
