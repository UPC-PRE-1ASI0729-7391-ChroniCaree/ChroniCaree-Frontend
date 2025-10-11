import { TestBed } from '@angular/core/testing';
import { NudgeStore } from './nudge.store';
import { NudgeApiEndpoint } from '../infrastructure/nudge-api.endpoint';
import { provideHttpClient } from '@angular/common/http';

describe('NudgeStore', () => {
  let store: NudgeStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NudgeStore,
        NudgeApiEndpoint,
        provideHttpClient()
      ]
    });

    store = TestBed.inject(NudgeStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have initial state', () => {
    expect(store.loading$()).toBeDefined();
  });

  it('should have active nudges', () => {
    expect(store.activeNudges).toBeDefined();
  });

  it('should have priority nudges', () => {
    expect(store.priorityNudges).toBeDefined();
  });

  it('should count active nudges', () => {
    expect(store.activeCount).toBeDefined();
  });
});
