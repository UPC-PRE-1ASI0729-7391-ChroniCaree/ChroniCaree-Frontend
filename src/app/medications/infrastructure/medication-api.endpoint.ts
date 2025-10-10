/**
 * Medication API Endpoint
 * Handles HTTP requests for medications
 */

import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MedicationResource, MedicationLogResource } from './medication.resource';
import { Medication, MedicationLog } from '../domain/model/medication.entity';
import { MedicationAssembler } from './medication.assembler';
import { BaseApi } from '../../shared/infrastructure/base-api';

@Injectable({
  providedIn: 'root'
})
export class MedicationApiEndpoint extends BaseApi {
  private readonly http = inject(HttpClient);
  private readonly resourcePath = '/medications';

  /**
   * Get all medications for a patient
   */
  getByPatientId(patientId: string): Observable<Medication[]> {
    return this.http
      .get<MedicationResource[]>(`${this.baseUrl}${this.resourcePath}?patientId=${patientId}`)
      .pipe(
        map(resources => MedicationAssembler.toDomainList(resources))
      );
  }

  /**
   * Get active medications for a patient
   */
  getActiveMedications(patientId: string): Observable<Medication[]> {
    return this.http
      .get<MedicationResource[]>(
        `${this.baseUrl}${this.resourcePath}?patientId=${patientId}&status=active`
      )
      .pipe(
        map(resources => MedicationAssembler.toDomainList(resources))
      );
  }

  /**
   * Get a single medication by ID
   */
  getById(id: string): Observable<Medication> {
    return this.http
      .get<MedicationResource>(`${this.baseUrl}${this.resourcePath}/${id}`)
      .pipe(
        map(resource => MedicationAssembler.toDomain(resource))
      );
  }

  /**
   * Create a new medication
   */
  create(medication: Medication): Observable<Medication> {
    const resource = MedicationAssembler.toResource(medication);
    return this.http
      .post<MedicationResource>(`${this.baseUrl}${this.resourcePath}`, resource)
      .pipe(
        map(resource => MedicationAssembler.toDomain(resource))
      );
  }

  /**
   * Update an existing medication
   */
  update(id: string, medication: Medication): Observable<Medication> {
    const resource = MedicationAssembler.toResource(medication);
    return this.http
      .put<MedicationResource>(`${this.baseUrl}${this.resourcePath}/${id}`, resource)
      .pipe(
        map(resource => MedicationAssembler.toDomain(resource))
      );
  }

  /**
   * Delete a medication
   */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}${this.resourcePath}/${id}`);
  }

  /**
   * Log medication taken
   */
  logMedication(medicationId: string, log: MedicationLog): Observable<Medication> {
    return this.http
      .post<MedicationResource>(
        `${this.baseUrl}${this.resourcePath}/${medicationId}/logs`,
        log
      )
      .pipe(
        map(resource => MedicationAssembler.toDomain(resource))
      );
  }

  /**
   * Get medication logs for a specific date range
   */
  getLogsByDateRange(
    patientId: string,
    startDate: Date,
    endDate: Date
  ): Observable<MedicationLog[]> {
    const start = startDate.toISOString();
    const end = endDate.toISOString();
    return this.http
      .get<MedicationLogResource[]>(
        `${this.baseUrl}${this.resourcePath}/logs?patientId=${patientId}&startDate=${start}&endDate=${end}`
      )
      .pipe(
        map(resources => resources.map(r => ({
          id: r.id,
          medicationId: r.medicationId,
          scheduledTime: new Date(r.scheduledTime),
          actualTime: r.actualTime ? new Date(r.actualTime) : undefined,
          status: r.status,
          notes: r.notes,
          sideEffects: r.sideEffects,
          skippedReason: r.skippedReason,
          createdAt: new Date(r.createdAt)
        })))
      );
  }
}
