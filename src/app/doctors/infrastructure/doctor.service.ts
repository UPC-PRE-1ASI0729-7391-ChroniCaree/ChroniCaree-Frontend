/**
 * Doctor Service
 * Servicio de infraestructura para comunicación con API de doctores
 * NO contiene lógica de negocio, solo comunicación HTTP
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { DoctorEntity, Education } from '../domain/model/doctor.entity';
import { environment } from '../../../environments/environment';

const DOCTOR_API = `${environment.apiBaseUrl}${environment.doctorsEndpointPath}`;

export interface DoctorResource {
  id: number;
  userId: number;
  tenantId: number | null;
  isIndependent: boolean;
  firstName: string;
  lastName: string;
  dni: string;
  specialty: string;
  licenseNumber: string;
  phone: string;
  isVerified: boolean;
  acceptingPatients: boolean;
  consultationFee: number;
  languages: string[];
  education: Education[];
  joinedAt: string;
}

export interface CreateDoctorRequest {
  userId: number;
  tenantId?: number | null;
  isIndependent?: boolean;
  firstName: string;
  lastName: string;
  dni: string;
  specialty: string;
  licenseNumber: string;
  phone: string;
  consultationFee?: number;
  languages?: string[];
  education?: Education[];
}

export interface UpdateDoctorRequest {
  isVerified?: boolean;
  acceptingPatients?: boolean;
  consultationFee?: number;
  phone?: string;
  languages?: string[];
  education?: Education[];
}

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los doctores
   */
  getAll(): Observable<DoctorEntity[]> {
    return this.http.get<DoctorResource[]>(DOCTOR_API).pipe(
      map((resources) => resources.map((r) => this.toEntity(r))),
      catchError((error) => {
        console.error('Error fetching doctors:', error);
        return throwError(() => new Error('Failed to fetch doctors'));
      })
    );
  }

  /**
   * Obtiene un doctor por ID
   */
  getById(id: string | number): Observable<DoctorEntity> {
    return this.http.get<DoctorResource>(`${DOCTOR_API}/${id}`).pipe(
      map((resource) => this.toEntity(resource)),
      catchError((error) => {
        console.error(`Error fetching doctor ${id}:`, error);
        return throwError(() => new Error(`Failed to fetch doctor with id ${id}`));
      })
    );
  }

  /**
   * Obtiene doctores de un tenant
   * Backend endpoint: GET /doctors/by-tenant/{tenantId}
   */
  getByTenantId(tenantId: string | number): Observable<DoctorEntity[]> {
    const url = `${DOCTOR_API}/by-tenant/${tenantId}`;
    console.log(`🌐 [DoctorService] getByTenantId(${tenantId}) - URL: ${url}`);
    
    return this.http.get<DoctorResource[]>(url).pipe(
      map((resources) => {
        console.log('📦 [DoctorService] Response raw:', resources);
        const entities = resources.map((r) => this.toEntity(r));
        console.log('📦 [DoctorService] Entities mapped:', entities.length, 'doctors');
        return entities;
      }),
      catchError((error) => {
        console.error(`❌ [DoctorService] getByTenantId(${tenantId}) error:`, error);
        console.error('  → status:', error.status);
        console.error('  → error:', error.error);
        return throwError(() => new Error(`Failed to fetch doctors for tenant ${tenantId}`));
      })
    );
  }

  /**
   * Cuenta cuántos doctores tiene un tenant
   * Backend endpoint: GET /doctors/by-tenant/{tenantId}
   */
  countByTenantId(tenantId: string | number): Observable<number> {
    const url = `${DOCTOR_API}/by-tenant/${tenantId}`;
    console.log(`🌐 [DoctorService] countByTenantId(${tenantId}) - URL: ${url}`);
    
    return this.http.get<DoctorResource[]>(url).pipe(
      map((resources) => {
        console.log('📦 [DoctorService] countByTenantId result:', resources.length, 'doctors');
        return resources.length;
      }),
      catchError((error) => {
        console.error(`❌ [DoctorService] countByTenantId error:`, error);
        return throwError(() => new Error(`Failed to count doctors for tenant ${tenantId}`));
      })
    );
  }

  /**
   * Obtiene doctores independientes
   */
  getIndependentDoctors(): Observable<DoctorEntity[]> {
    return this.http.get<DoctorResource[]>(`${DOCTOR_API}?isIndependent=true`).pipe(
      map((resources) => resources.map((r) => this.toEntity(r))),
      catchError((error) => {
        console.error('Error fetching independent doctors:', error);
        return throwError(() => new Error('Failed to fetch independent doctors'));
      })
    );
  }

  /**
   * Obtiene doctor por userId
   */
  getByUserId(userId: string | number): Observable<DoctorEntity | null> {
    return this.http.get<DoctorResource[]>(`${DOCTOR_API}?userId=${userId}`).pipe(
      map((resources) => {
        if (resources.length === 0) return null;
        return this.toEntity(resources[0]);
      }),
      catchError((error) => {
        console.error(`Error fetching doctor by userId ${userId}:`, error);
        return throwError(() => new Error(`Failed to fetch doctor with userId ${userId}`));
      })
    );
  }

  /**
   * Crea un nuevo doctor
   * El backend espera: userId, tenantId, firstName, lastName, dni, specialty, licenseNumber, phone
   */
  create(request: CreateDoctorRequest): Observable<DoctorEntity> {
    // Payload simplificado para el backend
    const payload = {
      userId: request.userId,
      tenantId: request.tenantId ?? null,
      firstName: request.firstName,
      lastName: request.lastName,
      dni: request.dni || 'N/A',
      specialty: request.specialty,
      licenseNumber: request.licenseNumber,
      phone: request.phone || '',
    };

    console.log('📤 [DoctorService] Creating doctor with payload:', payload);
    console.log('  → URL:', DOCTOR_API);

    return this.http.post<DoctorResource>(DOCTOR_API, payload).pipe(
      map((resource) => {
        console.log('✅ [DoctorService] Doctor created successfully:', resource);
        return this.toEntity(resource);
      }),
      catchError((error) => {
        console.error('❌ [DoctorService] Error creating doctor:', error);
        console.error('  → Status:', error.status);
        console.error('  → Error body:', error.error);
        return throwError(() => new Error('Failed to create doctor'));
      })
    );
  }

  /**
   * Actualiza un doctor
   */
  update(id: string | number, request: UpdateDoctorRequest): Observable<DoctorEntity> {
    return this.http.patch<DoctorResource>(`${DOCTOR_API}/${id}`, request).pipe(
      map((resource) => this.toEntity(resource)),
      catchError((error) => {
        console.error(`Error updating doctor ${id}:`, error);
        return throwError(() => new Error(`Failed to update doctor ${id}`));
      })
    );
  }

  /**
   * Elimina un doctor
   */
  delete(id: string | number): Observable<void> {
    return this.http.delete<void>(`${DOCTOR_API}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error deleting doctor ${id}:`, error);
        return throwError(() => new Error(`Failed to delete doctor ${id}`));
      })
    );
  }

  /**
   * Convierte DoctorResource a DoctorEntity
   */
  private toEntity(resource: DoctorResource): DoctorEntity {
    return new DoctorEntity(
      resource.id,
      resource.userId,
      resource.tenantId,
      resource.isIndependent,
      resource.firstName,
      resource.lastName,
      resource.dni,
      resource.specialty,
      resource.licenseNumber,
      resource.phone,
      resource.isVerified,
      resource.acceptingPatients,
      resource.consultationFee,
      resource.languages,
      resource.education,
      resource.joinedAt
    );
  }
}
