import { TestBed } from '@angular/core/testing';
import { AlertStore } from './alert.store';
import { AlertApiEndpoint } from '../infrastructure/alert-api.endpoint';
import { of } from 'rxjs';
import { AlertStatus, AlertSeverity, AlertType } from '../domain/model/alert.entity';

describe('AlertStore', () => {
  let store: AlertStore;
  let apiEndpoint: jasmine.SpyObj<AlertApiEndpoint>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('AlertApiEndpoint', [
      'getByPatientId',
      'getActiveAlerts',
      'create',
      'acknowledgeAlert',
      'resolve',
      'dismiss'
    ]);

    TestBed.configureTestingModule({
      providers: [
        AlertStore,
        { provide: AlertApiEndpoint, useValue: apiSpy }
      ]
    });

    store = TestBed.inject(AlertStore);
    apiEndpoint = TestBed.inject(AlertApiEndpoint) as jasmine.SpyObj<AlertApiEndpoint>;
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  it('should have initial empty state', () => {
    expect(store.alerts()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  });

  it('should load alerts by patient', (done) => {
    const mockAlerts = [
      {
        id: '1',
        patientId: 'patient1',
        type: AlertType.VITAL_SIGN_HIGH,
        severity: AlertSeverity.HIGH,
        title: 'Test Alert',
        message: 'Test message',
        status: AlertStatus.ACTIVE,
        metadata: {},
        createdAt: new Date().toISOString()
      }
    ];

    apiEndpoint.getByPatientId.and.returnValue(of(mockAlerts));

    store.loadAlertsByPatient('patient1').subscribe(() => {
      expect(store.alerts().length).toBe(1);
      expect(store.loading()).toBe(false);
      done();
    });
  });

  it('should filter active alerts', () => {
    expect(store.activeAlerts()).toEqual([]);
  });

  it('should filter critical alerts', () => {
    expect(store.criticalAlerts()).toEqual([]);
  });

  it('should count active alerts', () => {
    expect(store.activeCount()).toBe(0);
  });

  it('should count critical alerts', () => {
    expect(store.criticalCount()).toBe(0);
  });
});
