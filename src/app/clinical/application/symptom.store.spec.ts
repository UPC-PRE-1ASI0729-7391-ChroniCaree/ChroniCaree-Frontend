import { TestBed } from '@angular/core/testing';
import { SymptomStore } from './symptom.store';

describe('SymptomStore', () => {
  let store: SymptomStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(SymptomStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have default state values', () => {
    const symptoms = store.symptoms$();
    expect(Array.isArray(symptoms)).toBeTrue();
  });
});
