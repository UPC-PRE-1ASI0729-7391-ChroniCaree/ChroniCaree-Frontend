import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AlertResource } from './alert.resource';
import { AlertStatus } from '../domain/model/alert.entity';
import { BaseApi } from '../../shared/infrastructure/base-api';

@Injectable({
  providedIn: 'root'
})
export class AlertApiEndpoint extends BaseApi {
  private http = inject(HttpClient);
  private readonly resourcePath = '/alerts';

  // Obtiene todas las alertas asociadas a un paciente específico
  getByPatientId(patientId: string): Observable<AlertResource[]> {
    return this.http.get<AlertResource[]>(`${this.baseUrl}${this.resourcePath}?patientId=${patientId}`);
  }

  // Obtiene únicamente las alertas activas de un paciente
  getActiveAlerts(patientId: string): Observable<AlertResource[]> {
    return this.http.get<AlertResource[]>(
      `${this.baseUrl}${this.resourcePath}?patientId=${patientId}&status=${AlertStatus.ACTIVE}`
    );
  }

  // Busca una alerta por su identificador único
  getById(id: string): Observable<AlertResource> {
    return this.http.get<AlertResource>(`${this.baseUrl}${this.resourcePath}/${id}`);
  }

  // Crea una nueva alerta y genera un identificador único
  create(alert: Omit<AlertResource, 'id'>): Observable<AlertResource> {
    return this.http.post<AlertResource>(`${this.baseUrl}${this.resourcePath}`, {
      ...alert,
      id: crypto.randomUUID()
    });
  }

  // Actualiza parcialmente una alerta existente
  update(id: string, alert: Partial<AlertResource>): Observable<AlertResource> {
    return this.http.patch<AlertResource>(`${this.baseUrl}${this.resourcePath}/${id}`, alert);
  }

  // Elimina una alerta según su ID
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${this.resourcePath}/${id}`);
  }

  // Marca una alerta como reconocida por un usuario
  acknowledge(id: string, userId: string, notes?: string): Observable<AlertResource> {
    return this.http.patch<AlertResource>(`${this.baseUrl}${this.resourcePath}/${id}`, {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: userId,
      notes
    });
  }

  // Marca una alerta como resuelta con notas opcionales
  resolve(id: string, notes?: string): Observable<AlertResource> {
    return this.http.patch<AlertResource>(`${this.baseUrl}${this.resourcePath}/${id}`, {
      status: AlertStatus.RESOLVED,
      resolvedAt: new Date().toISOString(),
      notes
    });
  }

  // Marca una alerta como descartada (sin acciones pendientes)
  dismiss(id: string, notes?: string): Observable<AlertResource> {
    return this.http.patch<AlertResource>(`${this.baseUrl}${this.resourcePath}/${id}`, {
      status: AlertStatus.DISMISSED,
      dismissedAt: new Date().toISOString(),
      notes
    });
  }
}
