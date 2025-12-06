import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { PatientEntity, EmergencyContact } from '../domain/model/patient.entity';

const PATIENT_API = `${environment.apiBaseUrl}${environment.patientsEndpointPath}`;

@Injectable({
  providedIn: 'root',
})
export class PatientService {
  constructor(private readonly http: HttpClient) {}

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

  getByUserId(userId: string | number): Observable<PatientEntity | null> {
    return this.http.get<any[]>(`${PATIENT_API}?userId=${userId}`).pipe(
      map((resources) => resources.length > 0 ? this.toEntity(resources[0]) : null),
      catchError((error) => {
        console.error(`Error fetching patient for user ${userId}:`, error);
        return throwError(() => new Error(`Failed to fetch patient for user ${userId}`));
      })
    );
  }

  /**
   * Obtiene pacientes de un tenant
   * Backend endpoint: GET /patients/by-tenant/{tenantId}
   */
  getByTenantId(tenantId: string | number): Observable<PatientEntity[]> {
    return this.http.get<any>(`${PATIENT_API}/by-tenant/${tenantId}`).pipe(
      map((response) => {
        // Manejar caso donde backend retorna objeto en vez de array
        let resources: any[];
        if (Array.isArray(response)) {
          resources = response;
        } else if (response && typeof response === 'object') {
          // Si es un objeto, puede ser { data: [...] } o similar
          resources = response.data || response.content || response.patients || [];
          if (!Array.isArray(resources)) {
            console.warn('[PatientService] Unexpected response format, wrapping in array:', response);
            resources = [response];
          }
        } else {
          resources = [];
        }
        console.log(`📦 [PatientService] getByTenantId(${tenantId}) - Found ${resources.length} patients`);
        return resources.map(r => this.toEntity(r));
      }),
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
    return this.http.get<any>(PATIENT_API).pipe(
      map((response) => {
        // Manejar caso donde backend retorna objeto en vez de array
        let resources: any[];
        if (Array.isArray(response)) {
          resources = response;
        } else if (response && typeof response === 'object') {
          resources = response.data || response.content || response.patients || [];
          if (!Array.isArray(resources)) {
            resources = [response];
          }
        } else {
          resources = [];
        }
        return resources.map(r => this.toEntity(r));
      }),
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
    console.log('📤 [PatientService] Creating patient - URL:', PATIENT_API, 'payload:', request);
    return this.http.post<any>(PATIENT_API, request).pipe(
      map((resource) => this.toEntity(resource)),
      catchError((error) => {
        console.error('❌ [PatientService] Error creating patient:', error);
        try {
          // Print server response body if available
          console.error('  → Status:', error?.status);
          console.error('  → Message:', error?.message);
          console.error('  → Body:', error?.error);
        } catch (e) {
          console.error('  → Could not log full error body:', e);
        }
        return throwError(() => error);
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
   * Asigna un doctor a un paciente
   * Backend endpoint: PUT /patients/{patientId}/assign-doctor
   */
  assignDoctor(patientId: number, doctorId: number): Observable<PatientEntity> {
    const url = `${PATIENT_API}/${patientId}/assign-doctor`;
    console.log(`🌐 [PatientService] assignDoctor - URL: ${url}, doctorId: ${doctorId}`);
    
    return this.http.put<any>(url, { doctorId }).pipe(
      map((resource) => {
        console.log('✅ [PatientService] Doctor assigned:', resource);
        return this.toEntity(resource);
      }),
      catchError((error) => {
        console.error(`Error assigning doctor to patient ${patientId}:`, error);
        return throwError(() => new Error(`Failed to assign doctor to patient ${patientId}`));
      })
    );
  }

  /**
   * Desasigna el doctor de un paciente
   * Backend endpoint: DELETE /patients/{patientId}/assign-doctor
   */
  unassignDoctor(patientId: number): Observable<PatientEntity> {
    const url = `${PATIENT_API}/${patientId}/assign-doctor`;
    console.log(`🌐 [PatientService] unassignDoctor - URL: ${url}`);
    
    return this.http.delete<any>(url).pipe(
      map((resource) => {
        console.log('✅ [PatientService] Doctor unassigned:', resource);
        return this.toEntity(resource);
      }),
      catchError((error) => {
        console.error(`Error unassigning doctor from patient ${patientId}:`, error);
        return throwError(() => new Error(`Failed to unassign doctor from patient ${patientId}`));
      })
    );
  }

  /**
   * Extrae el valor de un campo que puede ser string o Value Object
   * Backend puede devolver: "12345678" o { "value": "12345678" }
   */
  private extractValue(field: any): string {
    if (field === null || field === undefined) return '';
    if (typeof field === 'string') return field;
    if (typeof field === 'object' && 'value' in field) return field.value;
    return String(field);
  }

  /**
   * Convierte un recurso del API a PatientEntity
   * Maneja tanto formato plano como Value Objects del backend
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
      resource.firstName || '',
      resource.lastName || '',
      this.extractValue(resource.dni),
      resource.birthDate,
      resource.gender,
      this.extractValue(resource.phone),
      resource.address || '',
      resource.weight,
      resource.height,
      resource.bmi,
      emergencyContact
    );
  }
}
