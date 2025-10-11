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

  getByPatientId(patientId: string): Observable<AlertResource[]> {
    return this.http.get<AlertResource[]>(`${this.baseUrl}${this.resourcePath}?patientId=${patientId}`);
  }

  getActiveAlerts(patientId: string): Observable<AlertResource[]> {
    return this.http.get<AlertResource[]>(
      `${this.baseUrl}${this.resourcePath}?patientId=${patientId}&status=${AlertStatus.ACTIVE}`
    );
  }

  getById(id: string): Observable<AlertResource> {
    return this.http.get<AlertResource>(`${this.baseUrl}${this.resourcePath}/${id}`);
  }

  create(alert: Omit<AlertResource, 'id'>): Observable<AlertResource> {
    return this.http.post<AlertResource>(`${this.baseUrl}${this.resourcePath}`, {
      ...alert,
      id: crypto.randomUUID()
    });
  }

  update(id: string, alert: Partial<AlertResource>): Observable<AlertResource> {
    return this.http.patch<AlertResource>(`${this.baseUrl}${this.resourcePath}/${id}`, alert);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${this.resourcePath}/${id}`);
  }

  acknowledge(id: string, userId: string, notes?: string): Observable<AlertResource> {
    return this.http.patch<AlertResource>(`${this.baseUrl}${this.resourcePath}/${id}`, {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: userId,
      notes
    });
  }

  resolve(id: string, notes?: string): Observable<AlertResource> {
    return this.http.patch<AlertResource>(`${this.baseUrl}${this.resourcePath}/${id}`, {
      status: AlertStatus.RESOLVED,
      resolvedAt: new Date().toISOString(),
      notes
    });
  }

  dismiss(id: string, notes?: string): Observable<AlertResource> {
    return this.http.patch<AlertResource>(`${this.baseUrl}${this.resourcePath}/${id}`, {
      status: AlertStatus.DISMISSED,
      dismissedAt: new Date().toISOString(),
      notes
    });
  }
}
