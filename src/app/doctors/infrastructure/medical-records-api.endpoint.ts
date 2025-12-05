/**
 * Medical Records API Endpoint
 * Doctors Bounded Context - Infrastructure Layer
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MedicalRecord } from '../domain/model/medical-record.entity';
import { MedicalRecordResource } from './medical-record.resource';
import { MedicalRecordAssembler } from './medical-record.assembler';

interface PatientResource {
  id: number;
  firstName: string;
  lastName: string;
}

@Injectable({
  providedIn: 'root'
})
export class MedicalRecordsApiEndpoint {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly recordsUrl = `${environment.apiBaseUrl}${environment.medicalRecordsEndpointPath}`;
  private readonly patientsUrl = `${environment.apiBaseUrl}${environment.patientsEndpointPath}`;

  /**
   * Obtiene todos los registros médicos de un doctor
   */
  getRecordsByDoctor(doctorId: number): Observable<MedicalRecord[]> {
    return this.http.get<MedicalRecordResource[]>(`${this.recordsUrl}/doctor/${doctorId}`).pipe(
      switchMap(records => {
        if (records.length === 0) {
          return of([]);
        }

        // Obtener nombres de pacientes
        const patientIds = [...new Set(records.map(r => r.patientId))];
        const patientRequests = patientIds.map(id =>
          this.http.get<PatientResource>(`${this.patientsUrl}/${id}`).pipe(
            catchError(() => of(null))
          )
        );

        return forkJoin(patientRequests).pipe(
          map(patients => {
            const validPatients = patients.filter(p => p !== null) as PatientResource[];
            
            return records.map(recordResource => {
              const patient = validPatients.find(p => p.id === recordResource.patientId);
              const record = MedicalRecordAssembler.toDomain(recordResource);
              
              if (patient) {
                record.patientName = `${patient.firstName} ${patient.lastName}`;
              }
              
              return record;
            });
          })
        );
      }),
      catchError(error => {
        console.error('Error fetching medical records:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene registros de un paciente específico
   */
  getRecordsByPatient(patientId: number): Observable<MedicalRecord[]> {
    return this.http.get<MedicalRecordResource[]>(`${this.recordsUrl}/patient/${patientId}`).pipe(
      map(records => records.map(r => MedicalRecordAssembler.toDomain(r))),
      catchError(() => of([]))
    );
  }

  /**
   * Obtiene un registro específico por ID
   */
  getRecordById(recordId: number): Observable<MedicalRecord | null> {
    return this.http.get<MedicalRecordResource>(`${this.recordsUrl}/${recordId}`).pipe(
      map(resource => MedicalRecordAssembler.toDomain(resource)),
      catchError(() => of(null))
    );
  }

  /**
   * Crea un nuevo registro médico
   */
  createRecord(record: Partial<MedicalRecord>): Observable<MedicalRecord> {
    return this.http.post<MedicalRecordResource>(this.recordsUrl, record).pipe(
      map(resource => MedicalRecordAssembler.toDomain(resource))
    );
  }

  /**
   * Actualiza un registro médico
   */
  updateRecord(recordId: number, updates: Partial<MedicalRecord>): Observable<MedicalRecord> {
    return this.http.patch<MedicalRecordResource>(
      `${this.recordsUrl}/${recordId}`,
      updates
    ).pipe(
      map(resource => MedicalRecordAssembler.toDomain(resource))
    );
  }
}
