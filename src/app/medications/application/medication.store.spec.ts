import { TestBed } from '@angular/core/testing';
import { MedicationStore } from './medication.store';
import { MedicationApiEndpoint } from '../infrastructure/medication-api.endpoint';
import { provideHttpClient } from '@angular/common/http';

describe('MedicationStore', () => {
  let store: MedicationStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MedicationStore,
        MedicationApiEndpoint,
        provideHttpClient()
      ]
    });

    store = TestBed.inject(MedicationStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have medications signal', () => {
    expect(store.medications).toBeDefined();
  });

  it('should have loading signal', () => {
    expect(store.loading).toBeDefined();
  });

  it('should have error signal', () => {
    expect(store.error).toBeDefined();
  });

  it('should have active medications computed', () => {
    expect(store.activeMedications).toBeDefined();
  });
});
