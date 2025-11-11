import { Injectable, signal, computed } from '@angular/core';
import { Observable, throwError, forkJoin } from 'rxjs';
import { switchMap, tap, catchError, map } from 'rxjs/operators';
import { DeviceService, LinkDeviceRequest, SimulatedReading } from '../../devices/infrastructure/device.service';
import { PatientService } from '../../patients/infrastructure/patient.service';
import { SubscriptionService } from '../../subscriptions/infrastructure/subscription.service';
import { DeviceEntity, DeviceType } from '../../devices/domain/model/device.entity';

/**
 * Request para vincular dispositivo
 */
export interface LinkDeviceToPatientRequest {
  patientId: number;
  deviceType: DeviceType;
  brand: string;
  model: string;
  serialNumber?: string;
  autoSyncEnabled?: boolean;
}

/**
 * Resultado de operaciones de dispositivos
 */
export interface DeviceManagementResult {
  success: boolean;
  message: string;
  device?: DeviceEntity;
  reading?: SimulatedReading;
}

/**
 * Store para Gestión de Dispositivos IoT
 * Orquesta vinculación/desvinculación de dispositivos y simulación de lecturas
 */
@Injectable({
  providedIn: 'root'
})
export class DeviceManagementStore {
  // Estado reactivo
  private _devices = signal<DeviceEntity[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _lastReading = signal<SimulatedReading | null>(null);

  // Getters computados
  readonly devices = computed(() => this._devices());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly lastReading = computed(() => this._lastReading());
  readonly devicesNeedingSync = computed(() => 
    this._devices().filter(d => d.needsSync)
  );

  // Tipos de dispositivos disponibles
  readonly availableDeviceTypes = [
    { type: 'glucometer' as DeviceType, name: 'Glucómetro', icon: 'water_drop' },
    { type: 'blood_pressure' as DeviceType, name: 'Monitor de Presión Arterial', icon: 'favorite' },
    { type: 'pulse_oximeter' as DeviceType, name: 'Oxímetro de Pulso', icon: 'fingerprint' },
    { type: 'ecg' as DeviceType, name: 'Electrocardiograma (ECG)', icon: 'monitor_heart' },
    { type: 'smart_scale' as DeviceType, name: 'Báscula Inteligente', icon: 'scale' }
  ];

  constructor(
    private deviceService: DeviceService,
    private patientService: PatientService,
    private subscriptionService: SubscriptionService
  ) {}

  /**
   * Obtiene los dispositivos de un paciente
   */
  getPatientDevices(patientId: number): Observable<DeviceManagementResult> {
    this._loading.set(true);
    this._error.set(null);

    return this.deviceService.getByPatientId(patientId).pipe(
      tap(devices => {
        this._devices.set(devices);
        this._loading.set(false);
      }),
      map(devices => ({
        success: true,
        message: `${devices.length} dispositivo(s) encontrado(s)`,
      })),
      catchError(error => {
        this._loading.set(false);
        this._error.set(error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Vincula un dispositivo a un paciente
   */
  linkDevice(request: LinkDeviceToPatientRequest): Observable<DeviceManagementResult> {
    this._loading.set(true);
    this._error.set(null);

    // Paso 1: Validar que el paciente tenga suscripción
    return this.patientService.getById(request.patientId).pipe(
      switchMap(patient => {
        if (!patient.subscriptionId) {
          return throwError(() => new Error(
            'Los pacientes con plan gratuito no pueden vincular dispositivos IoT. ' +
            'Por favor, actualice a un plan premium o familiar.'
          ));
        }

        // Paso 2: Verificar el plan de suscripción
        return this.subscriptionService.getById(patient.subscriptionId).pipe(
          switchMap(subscription => {
            // Validar que la suscripción esté activa
            if (!subscription.isActive) {
              return throwError(() => new Error(
                'No se pueden vincular dispositivos con suscripción inactiva'
              ));
            }

            // Obtener plan para validar tipo
            return this.subscriptionService.getPlanById(subscription.planId).pipe(
              switchMap(plan => {
                if (!plan) {
                  return throwError(() => new Error('Plan de suscripción no encontrado'));
                }

                // Validar que no sea plan free
                if (plan.name.toLowerCase() === 'free' || plan.name.toLowerCase().includes('gratuito')) {
                  return throwError(() => new Error(
                    'El plan gratuito no permite dispositivos IoT. ' +
                    'Por favor, actualice a un plan premium o familiar.'
                  ));
                }

                // Paso 3: Vincular el dispositivo
                const linkRequest: LinkDeviceRequest = {
                  patientId: request.patientId,
                  type: request.deviceType,
                  brand: request.brand,
                  model: request.model,
                  serialNumber: request.serialNumber,
                  autoSyncEnabled: request.autoSyncEnabled ?? true
                };

                return this.deviceService.linkDevice(linkRequest);
              })
            );
          })
        );
      }),
      tap(device => {
        // Agregar dispositivo a la lista
        this._devices.update(devices => [...devices, device]);
        this._loading.set(false);
      }),
      map(device => ({
        success: true,
        message: `Dispositivo ${device.displayName} vinculado exitosamente`,
        device
      })),
      catchError(error => {
        this._loading.set(false);
        this._error.set(error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Desvincula un dispositivo
   */
  unlinkDevice(deviceId: number): Observable<DeviceManagementResult> {
    this._loading.set(true);
    this._error.set(null);

    return this.deviceService.unlinkDevice(deviceId).pipe(
      tap(() => {
        // Remover dispositivo de la lista
        this._devices.update(devices => devices.filter(d => d.id !== deviceId));
        this._loading.set(false);
      }),
      map(() => ({
        success: true,
        message: 'Dispositivo desvinculado exitosamente'
      })),
      catchError(error => {
        this._loading.set(false);
        this._error.set(error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Simula una lectura de dispositivo
   */
  simulateReading(deviceId: number): Observable<DeviceManagementResult> {
    this._loading.set(true);
    this._error.set(null);

    return this.deviceService.simulateReading(deviceId).pipe(
      tap(reading => {
        this._lastReading.set(reading);
        
        // Actualizar el dispositivo en la lista (lastSync actualizado)
        this.deviceService.getById(deviceId).subscribe(updatedDevice => {
          this._devices.update(devices => 
            devices.map(d => d.id === deviceId ? updatedDevice : d)
          );
        });

        this._loading.set(false);
      }),
      map(reading => ({
        success: true,
        message: 'Lectura simulada exitosamente',
        reading
      })),
      catchError(error => {
        this._loading.set(false);
        this._error.set(error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Sincroniza todos los dispositivos de un paciente
   */
  syncAllDevices(patientId: number): Observable<DeviceManagementResult> {
    this._loading.set(true);
    this._error.set(null);

    return this.deviceService.getByPatientId(patientId).pipe(
      switchMap(devices => {
        if (devices.length === 0) {
          return throwError(() => new Error('No hay dispositivos para sincronizar'));
        }

        // Actualizar sync status de todos los dispositivos
        const syncObservables = devices.map(device => 
          this.deviceService.updateSyncStatus(device.id)
        );

        return forkJoin(syncObservables);
      }),
      tap(devices => {
        this._devices.set(devices);
        this._loading.set(false);
      }),
      map(devices => ({
        success: true,
        message: `${devices.length} dispositivo(s) sincronizado(s)`
      })),
      catchError(error => {
        this._loading.set(false);
        this._error.set(error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Limpia el estado
   */
  clear(): void {
    this._devices.set([]);
    this._loading.set(false);
    this._error.set(null);
    this._lastReading.set(null);
  }
}
