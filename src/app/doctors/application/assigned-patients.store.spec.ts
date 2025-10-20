import { TestBed } from '@angular/core/testing';
import { AssignedPatientsStore } from './assigned-patients.store';

describe('AssignedPatientsStore', () => {
  let store: AssignedPatientsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(AssignedPatientsStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should return array from patients()', () => {
    const patients = store.patients();
    expect(Array.isArray(patients)).toBeTrue();
  });
});
