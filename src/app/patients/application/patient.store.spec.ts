import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PatientStore } from './patient.store';

describe('PatientStore', () => {
  let store: PatientStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        PatientStore,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    store = TestBed.inject(PatientStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have empty patients array initially', () => {
    expect(store.patients$()).toEqual([]);
  });

  it('should have no selected patient initially', () => {
    expect(store.selectedPatient$()).toBeNull();
  });

  it('should not be loading initially', () => {
    expect(store.loading$()).toBeFalse();
  });

  it('should have no error initially', () => {
    expect(store.error$()).toBeNull();
  });
});
