import { TestBed } from '@angular/core/testing';
import { AppointmentsStore } from './appointments.store';

describe('AppointmentsStore', () => {
  let store: AppointmentsStore;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(AppointmentsStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should expose upcomingAppointments as array', () => {
    const arr = store.upcomingAppointments();
    expect(Array.isArray(arr)).toBeTrue();
  });
});
