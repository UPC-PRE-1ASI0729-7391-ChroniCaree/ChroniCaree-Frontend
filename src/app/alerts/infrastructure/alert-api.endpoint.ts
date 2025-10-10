import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AlertResource } from './alert.resource';
import { AlertStatus } from '../domain/model/alert.entity';

@Injectable({
  providedIn: 'root'
})
export class AlertApiEndpoint {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/alerts';

  getByPatientId(patientId: string): Observable<AlertResource[]> {
    return this.http.get<AlertResource[]>(`${this.baseUrl}?patientId=${patientId}`);
  }

  getActiveAlerts(patientId: string): Observable<AlertResource[]> {
    return this.http.get<AlertResource[]>(
      `${this.baseUrl}?patientId=${patientId}&status=${AlertStatus.ACTIVE}`
    );
  }

  getById(id: string): Observable<AlertResource> {
    return this.http.get<AlertResource>(`${this.baseUrl}/${id}`);
  }

  create(alert: Omit<AlertResource, 'id'>): Observable<AlertResource> {
    return this.http.post<AlertResource>(this.baseUrl, {
      ...alert,
      id: crypto.randomUUID()
    });
  }

  update(id: string, alert: Partial<AlertResource>): Observable<AlertResource> {
    return this.http.patch<AlertResource>(`${this.baseUrl}/${id}`, alert);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  acknowledge(id: string, userId: string, notes?: string): Observable<AlertResource> {
    return this.http.patch<AlertResource>(`${this.baseUrl}/${id}`, {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: userId,
      notes
    });
  }

  resolve(id: string, notes?: string): Observable<AlertResource> {
    return this.http.patch<AlertResource>(`${this.baseUrl}/${id}`, {
      status: AlertStatus.RESOLVED,
      resolvedAt: new Date().toISOString(),
      notes
    });
  }

  dismiss(id: string, notes?: string): Observable<AlertResource> {
    return this.http.patch<AlertResource>(`${this.baseUrl}/${id}`, {
      status: AlertStatus.DISMISSED,
      dismissedAt: new Date().toISOString(),
      notes
    });
  }
}
