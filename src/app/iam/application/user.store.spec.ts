import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { UserStore } from './user.store';

describe('UserStore', () => {
  let store: UserStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserStore,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    store = TestBed.inject(UserStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have empty users array initially', () => {
    expect(store.users$()).toEqual([]);
  });

  it('should have no selected user initially', () => {
    expect(store.selectedUser$()).toBeNull();
  });

  it('should have no current user initially', () => {
    expect(store.currentUser$()).toBeNull();
  });

  it('should not be loading initially', () => {
    expect(store.loading$()).toBeFalse();
  });

  it('should have no error initially', () => {
    expect(store.error$()).toBeNull();
  });
});
