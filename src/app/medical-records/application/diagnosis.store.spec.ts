import { TestBed } from '@angular/core/testing';
import { DiagnosisStore } from './diagnosis.store';
import { DiagnosisApiEndpoint } from '../infrastructure/diagnosis-api.endpoint';
import { provideHttpClient } from '@angular/common/http';

describe('DiagnosisStore', () => {
  let store: DiagnosisStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DiagnosisStore,
        DiagnosisApiEndpoint,
        provideHttpClient()
      ]
    });

    store = TestBed.inject(DiagnosisStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have diagnoses observable', () => {
    expect(store.diagnoses$).toBeDefined();
  });
});
