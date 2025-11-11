/**
 * Patient Service
 * Servicio de infraestructura para comunicación con API de pacientes
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { PatientEntity, EmergencyContact } from '../domain/model/patient.entity';

const BASE_URL = 'http://localhost:3000';
const PATIENT_API = `${BASE_URL}/patients`;

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene un paciente por ID
   */
  getById(id: string | number): Observable<PatientEntity> {
    return this.http.get<any>(`${PATIENT_API}/${id}`).pipe(
      map((resource) => this.toEntity(resource)),
      catchError((error) => {
        console.error(`Error fetching patient ${id}:`, error);
        return throwError(() => new Error(`Failed to fetch patient with id ${id}`));
      })
    );
  }

  /**
   * Actualiza la suscripción de un paciente
   */
  updateSubscription(
    patientId: string | number,
    subscriptionId: number | null
  ): Observable<PatientEntity> {
    const payload = { subscriptionId };
    return this.http.patch<any>(`${PATIENT_API}/${patientId}`, payload).pipe(
      map((resource) => this.toEntity(resource)),
      catchError((error) => {
        console.error(`Error updating subscription for patient ${patientId}:`, error);
        return throwError(() => new Error(`Failed to update subscription for patient ${patientId}`));
      })
    );
  }

  /**
   * Actualiza el doctor asignado de un paciente
   */
  updateAssignedDoctor(
    patientId: string | number,
    doctorId: string | number | null
  ): Observable<PatientEntity> {
    const payload = { assignedDoctorId: doctorId };
    return this.http.patch<any>(`${PATIENT_API}/${patientId}`, payload).pipe(
      map((resource) => this.toEntity(resource)),
      catchError((error) => {
        console.error(`Error updating assigned doctor for patient ${patientId}:`, error);
        return throwError(() => new Error(`Failed to update assigned doctor for patient ${patientId}`));
      })
    );
  }

  /**
   * Obtiene todos los pacientes asignados a un doctor
   */
  getByAssignedDoctorId(doctorId: string | number): Observable<PatientEntity[]> {
    return this.http.get<any[]>(`${PATIENT_API}?assignedDoctorId=${doctorId}`).pipe(
      map((resources) => resources.map(r => this.toEntity(r))),
      catchError((error) => {
        console.error(`Error fetching patients for doctor ${doctorId}:`, error);
        return throwError(() => new Error(`Failed to fetch patients for doctor ${doctorId}`));
      })
    );
  }

  /**
   * Obtiene todos los pacientes de un tenant (hospital)
   */
  getByTenantId(tenantId: string | number): Observable<PatientEntity[]> {
    return this.http.get<any[]>(`${PATIENT_API}?tenantId=${tenantId}`).pipe(
      map((resources) => resources.map(r => this.toEntity(r))),
      catchError((error) => {
        console.error(`Error fetching patients for tenant ${tenantId}:`, error);
        return throwError(() => new Error(`Failed to fetch patients for tenant ${tenantId}`));
      })
    );
  }

  /**
   * Obtiene todos los pacientes
   */
  getAll(): Observable<PatientEntity[]> {
    return this.http.get<any[]>(PATIENT_API).pipe(
      map((resources) => resources.map(r => this.toEntity(r))),
      catchError((error) => {
        console.error('Error fetching all patients:', error);
        return throwError(() => new Error('Failed to fetch all patients'));
      })
    );
  }

  /**
   * Crea un nuevo paciente
   */
  create(request: any): Observable<PatientEntity> {
    return this.http.post<any>(PATIENT_API, request).pipe(
      map((resource) => this.toEntity(resource)),
      catchError((error) => {
        console.error('Error creating patient:', error);
        return throwError(() => new Error('Failed to create patient'));
      })
    );
  }

  /**
   * Actualiza un paciente existente
   */
  update(patient: any, id: number): Observable<PatientEntity> {
    return this.http.put<any>(`${PATIENT_API}/${id}`, patient).pipe(
      map((resource) => this.toEntity(resource)),
      catchError((error) => {
        console.error(`Error updating patient ${id}:`, error);
        return throwError(() => new Error(`Failed to update patient ${id}`));
      })
    );
  }

  /**
   * Elimina un paciente
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${PATIENT_API}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error deleting patient ${id}:`, error);
        return throwError(() => new Error(`Failed to delete patient ${id}`));
      })
    );
  }

  /**
   * Convierte un recurso del API a PatientEntity
   */
  private toEntity(resource: any): PatientEntity {
    const emergencyContact: EmergencyContact = {
      name: resource.emergencyContact?.name || '',
      relationship: resource.emergencyContact?.relationship || '',
      phone: resource.emergencyContact?.phone || '',
    };

    return new PatientEntity(
      resource.id,
      resource.userId,
      resource.assignedDoctorId,
      resource.tenantId,
      resource.subscriptionId,
      resource.firstName,
      resource.lastName,
      resource.dni,
      resource.birthDate,
      resource.gender,
      resource.phone,
      resource.address,
      resource.weight,
      resource.height,
      resource.bmi,
      emergencyContact
    );
  }
}
