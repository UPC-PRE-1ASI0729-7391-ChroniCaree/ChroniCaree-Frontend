import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, shareReplay, tap, catchError, of, map } from 'rxjs';
import { Alert, AlertStatus, AlertSeverity } from '../domain/model/alert.entity';
import { AlertApiEndpoint } from '../infrastructure/alert-api.endpoint';
import { AlertAssembler } from '../infrastructure/alert.assembler';
import { AlertResource } from '../infrastructure/alert.resource';

interface StoreState {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AlertStore {
  private apiEndpoint = inject(AlertApiEndpoint);

  // Estado principal
  private state = signal<StoreState>({
    alerts: [],
    loading: false,
    error: null
  });

  // Cache para prevenir duplicación
  private currentRequest: Observable<AlertResource[]> | null = null;

  // Selectores readonly
  readonly alerts = computed(() => this.state().alerts);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);

  // Computed: alertas activas
  readonly activeAlerts = computed(() => {
    return this.state().alerts.filter(alert => alert.status === AlertStatus.ACTIVE);
  });

  // Computed: alertas por severidad
  readonly criticalAlerts = computed(() => {
    return this.activeAlerts().filter(alert => alert.severity === AlertSeverity.CRITICAL);
  });

  readonly highAlerts = computed(() => {
    return this.activeAlerts().filter(alert => alert.severity === AlertSeverity.HIGH);
  });

  // Computed: conteos
  readonly activeCount = computed(() => this.activeAlerts().length);
  readonly criticalCount = computed(() => this.criticalAlerts().length);

  // Computed: alertas reconocidas
  readonly acknowledgedAlerts = computed(() => {
    return this.state().alerts.filter(alert => alert.status === AlertStatus.ACKNOWLEDGED);
  });

  // Computed: alertas resueltas
  readonly resolvedAlerts = computed(() => {
    return this.state().alerts.filter(alert => alert.status === AlertStatus.RESOLVED);
  });

  /**
   * Carga alertas por paciente
   */
  loadAlertsByPatient(patientId: string): Observable<Alert[]> {
    // Si ya hay una petición en curso, retornarla
    if (this.currentRequest) {
      return this.currentRequest.pipe(
        map(resources => {
          const alerts = AlertAssembler.toEntityArray(resources);
          this.state.update(state => ({ ...state, alerts }));
          return alerts;
        })
      );
    }

    // Si ya hay datos cargados para este paciente, retornarlos
    if (this.state().alerts.length > 0) {
      return of(this.state().alerts);
    }

    this.state.update(state => ({ ...state, loading: true, error: null }));

    this.currentRequest = this.apiEndpoint.getByPatientId(patientId).pipe(
      shareReplay(1)
    );

    return this.currentRequest.pipe(
      map(resources => {
        const alerts = AlertAssembler.toEntityArray(resources);
        this.state.update(state => ({
          ...state,
          alerts,
          loading: false
        }));
        this.currentRequest = null;
        return alerts;
      }),
      catchError(error => {
        this.state.update(state => ({
          ...state,
          loading: false,
          error: error.message
        }));
        this.currentRequest = null;
        return of([]);
      })
    );
  }

  /**
   * Carga solo alertas activas
   */
  loadActiveAlerts(patientId: string): Observable<Alert[]> {
    this.state.update(state => ({ ...state, loading: true, error: null }));

    return this.apiEndpoint.getActiveAlerts(patientId).pipe(
      map(resources => {
        const alerts = AlertAssembler.toEntityArray(resources);
        this.state.update(state => ({
          ...state,
          alerts,
          loading: false
        }));
        return alerts;
      }),
      catchError(error => {
        this.state.update(state => ({
          ...state,
          loading: false,
          error: error.message
        }));
        return of([]);
      })
    );
  }

  /**
   * Crea nueva alerta
   */
  createAlert(alert: Omit<Alert, 'id'>): Observable<Alert> {
    const resource = AlertAssembler.toResource(alert as Alert);
    const { id, ...resourceWithoutId } = resource;

    return this.apiEndpoint.create(resourceWithoutId).pipe(
      map(created => {
        const newAlert = AlertAssembler.toEntity(created);
        this.state.update(state => ({
          ...state,
          alerts: [newAlert, ...state.alerts]
        }));
        return newAlert;
      })
    );
  }

  /**
   * Reconoce una alerta
   */
  acknowledgeAlert(alertId: string, userId: string, notes?: string): Observable<Alert> {
    return this.apiEndpoint.acknowledge(alertId, userId, notes).pipe(
      map(updated => {
        const updatedAlert = AlertAssembler.toEntity(updated);
        this.state.update(state => ({
          ...state,
          alerts: state.alerts.map(a => 
            a.id === alertId ? updatedAlert : a
          )
        }));
        return updatedAlert;
      })
    );
  }

  /**
   * Resuelve una alerta
   */
  resolveAlert(alertId: string, notes?: string): Observable<Alert> {
    return this.apiEndpoint.resolve(alertId, notes).pipe(
      map(updated => {
        const updatedAlert = AlertAssembler.toEntity(updated);
        this.state.update(state => ({
          ...state,
          alerts: state.alerts.map(a => 
            a.id === alertId ? updatedAlert : a
          )
        }));
        return updatedAlert;
      })
    );
  }

  /**
   * Descarta una alerta
   */
  dismissAlert(alertId: string, notes?: string): Observable<Alert> {
    return this.apiEndpoint.dismiss(alertId, notes).pipe(
      map(updated => {
        const updatedAlert = AlertAssembler.toEntity(updated);
        this.state.update(state => ({
          ...state,
          alerts: state.alerts.map(a => 
            a.id === alertId ? updatedAlert : a
          )
        }));
        return updatedAlert;
      })
    );
  }

  /**
   * Elimina una alerta
   */
  deleteAlert(alertId: string): Observable<void> {
    return this.apiEndpoint.delete(alertId).pipe(
      tap(() => {
        this.state.update(state => ({
          ...state,
          alerts: state.alerts.filter(a => a.id !== alertId)
        }));
      })
    );
  }
}
