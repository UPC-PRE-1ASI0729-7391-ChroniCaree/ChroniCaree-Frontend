import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DoctorStore } from './doctor.store';

describe('DoctorStore', () => {
  let store: DoctorStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DoctorStore,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    store = TestBed.inject(DoctorStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have empty doctors array initially', () => {
    expect(store.doctors$()).toEqual([]);
  });

  it('should have no selected doctor initially', () => {
    expect(store.selectedDoctor$()).toBeNull();
  });

  it('should not be loading initially', () => {
    expect(store.loading$()).toBeFalse();
  });

  it('should have no error initially', () => {
    expect(store.error$()).toBeNull();
  });
});
