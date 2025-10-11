import { TestBed } from '@angular/core/testing';
import { MedicalRecordsStore } from './medical-records.store';

describe('MedicalRecordsStore', () => {
  let store: MedicalRecordsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(MedicalRecordsStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should expose records as array', () => {
    const records = store.records();
    expect(Array.isArray(records)).toBeTrue();
  });
});
