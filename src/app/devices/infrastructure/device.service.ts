import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DeviceEntity, DeviceType } from '../domain/model/device.entity';
import { environment } from '../../../environments/environment';

const DEVICE_API = `${environment.apiBaseUrl}/devices`;

/**
 * Device Resource (DTO para comunicación con API)
 */
export interface DeviceResource {
  id: number;
  patientId: number;
  type: DeviceType;
  brand: string;
  model: string;
  serialNumber?: string;
  registeredAt: string;
  lastSync?: string;
  autoSyncEnabled: boolean;
  status: string;
}

/**
 * Request para vincular un dispositivo
 */
export interface LinkDeviceRequest {
  patientId: number;
  type: DeviceType;
  brand: string;
  model: string;
  serialNumber?: string;
  autoSyncEnabled?: boolean;
}

/**
 * Lectura simulada de dispositivo
 */
export interface SimulatedReading {
  deviceId: number;
  deviceType: DeviceType;
  timestamp: string;
  data: Record<string, any>;
}

/**
 * Servicio de infraestructura para Dispositivos IoT
 */
@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los dispositivos
   */
  getAll(): Observable<DeviceEntity[]> {
    return this.http.get<DeviceResource[]>(DEVICE_API)
      .pipe(map(resources => resources.map(r => this.toEntity(r))));
  }

  /**
   * Obtiene un dispositivo por ID
   */
  getById(id: number): Observable<DeviceEntity> {
    return this.http.get<DeviceResource>(`${DEVICE_API}/${id}`)
      .pipe(map(resource => this.toEntity(resource)));
  }

  /**
   * Obtiene todos los dispositivos de un paciente
   */
  getByPatientId(patientId: number): Observable<DeviceEntity[]> {
    return this.http.get<DeviceResource[]>(`${DEVICE_API}?patientId=${patientId}`)
      .pipe(map(resources => resources.map(r => this.toEntity(r))));
  }

  /**
   * Vincula un nuevo dispositivo a un paciente
   */
  linkDevice(request: LinkDeviceRequest): Observable<DeviceEntity> {
    const resource: Partial<DeviceResource> = {
      ...request,
      registeredAt: new Date().toISOString(),
      lastSync: new Date().toISOString(),
      autoSyncEnabled: request.autoSyncEnabled ?? true,
      status: 'active'
    };

    return this.http.post<DeviceResource>(DEVICE_API, resource)
      .pipe(map(r => this.toEntity(r)));
  }

  /**
   * Desvincula un dispositivo
   */
  unlinkDevice(deviceId: number): Observable<void> {
    return this.http.delete<void>(`${DEVICE_API}/${deviceId}`);
  }

  /**
   * Actualiza el estado de sincronización de un dispositivo
   */
  updateSyncStatus(deviceId: number): Observable<DeviceEntity> {
    const resource = {
      lastSync: new Date().toISOString()
    };

    return this.http.patch<DeviceResource>(`${DEVICE_API}/${deviceId}`, resource)
      .pipe(map(r => this.toEntity(r)));
  }

  /**
   * Simula una lectura de dispositivo
   */
  simulateReading(deviceId: number): Observable<SimulatedReading> {
    return this.getById(deviceId).pipe(
      map(device => {
        const timestamp = new Date().toISOString();
        let data: Record<string, any> = {};

        switch (device.type) {
          case 'glucometer':
            data = {
              glucose: Math.floor(Math.random() * (180 - 70) + 70),
              unit: 'mg/dL',
              mealContext: ['fasting', 'before_meal', 'after_meal'][Math.floor(Math.random() * 3)]
            };
            break;
          case 'blood_pressure':
            data = {
              systolic: Math.floor(Math.random() * (140 - 90) + 90),
              diastolic: Math.floor(Math.random() * (90 - 60) + 60),
              pulse: Math.floor(Math.random() * (100 - 60) + 60),
              unit: 'mmHg'
            };
            break;
          case 'pulse_oximeter':
            data = {
              oxygenSaturation: Math.floor(Math.random() * (100 - 90) + 90),
              pulse: Math.floor(Math.random() * (100 - 60) + 60),
              perfusionIndex: (Math.random() * 10).toFixed(1)
            };
            break;
          case 'ecg':
            data = {
              heartRate: Math.floor(Math.random() * (100 - 60) + 60),
              rhythm: ['normal', 'irregular'][Math.floor(Math.random() * 2)],
              qrsWidth: Math.floor(Math.random() * (120 - 80) + 80),
              qtInterval: Math.floor(Math.random() * (450 - 350) + 350)
            };
            break;
          case 'smart_scale':
            data = {
              weight: (Math.random() * (100 - 50) + 50).toFixed(1),
              bmi: (Math.random() * (30 - 18) + 18).toFixed(1),
              bodyFatPercentage: (Math.random() * (35 - 15) + 15).toFixed(1),
              muscleMass: (Math.random() * (40 - 25) + 25).toFixed(1),
              unit: 'kg'
            };
            break;
        }

        // Actualizar lastSync del dispositivo
        this.updateSyncStatus(deviceId).subscribe();

        return {
          deviceId: device.id,
          deviceType: device.type,
          timestamp,
          data
        };
      })
    );
  }

  /**
   * Elimina un dispositivo
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${DEVICE_API}/${id}`);
  }

  /**
   * Transforma un recurso de API a entidad de dominio
   */
  private toEntity(resource: DeviceResource): DeviceEntity {
    return new DeviceEntity(
      resource.id,
      resource.patientId,
      resource.type,
      resource.brand,
      resource.model,
      resource.lastSync || new Date().toISOString(),
      resource.status === 'active',
      resource.autoSyncEnabled
    );
  }
}
