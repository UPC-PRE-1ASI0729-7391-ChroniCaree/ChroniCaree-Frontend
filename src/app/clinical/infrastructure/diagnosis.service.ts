import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DiagnosisEntity, DiagnosisStatus, DiagnosisSeverity, DiagnosisSource } from '../domain/model/diagnosis.entity';
import { environment } from '../../../../environments/environment';

const DIAGNOSIS_API = `${environment.apiBaseUrl}${environment.diagnosesEndpointPath}`;

/**
 * Diagnosis Resource (DTO para comunicación con API)
 */
export interface DiagnosisResource {
  id: number;
  patientId: number;
  doctorId?: number;
  diagnosisName: string;
  icd10Code?: string;
  status: DiagnosisStatus;
  severity?: DiagnosisSeverity;
  source: DiagnosisSource;
  diagnosisDate: string;
  notes?: string;
  lastReviewDate?: string;
  followUpDate?: string;
  confirmedAt?: string;
  confirmedBy?: number;
}

/**
 * Request para crear un diagnóstico
 */
export interface CreateDiagnosisRequest {
  patientId: number;
  doctorId?: number;
  diagnosisName: string;
  icd10Code?: string;
  status: DiagnosisStatus;
  severity?: DiagnosisSeverity;
  source: DiagnosisSource;
  diagnosisDate: string;
  notes?: string;
  followUpDate?: string;
}

/**
 * Request para actualizar un diagnóstico
 */
export interface UpdateDiagnosisRequest {
  diagnosisName?: string;
  icd10Code?: string;
  status?: DiagnosisStatus;
  severity?: DiagnosisSeverity;
  notes?: string;
  lastReviewDate?: string;
  followUpDate?: string;
}

/**
 * Request para confirmar diagnóstico por doctor
 */
export interface ConfirmDiagnosisRequest {
  doctorId: number;
  icd10Code?: string;
  severity?: DiagnosisSeverity;
  notes?: string;
}

/**
 * Servicio de infraestructura para Diagnósticos
 */
@Injectable({
  providedIn: 'root'
})
export class DiagnosisService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene todos los diagnósticos
   */
  getAll(): Observable<DiagnosisEntity[]> {
    return this.http.get<DiagnosisResource[]>(DIAGNOSIS_API)
      .pipe(map(resources => resources.map(r => this.toEntity(r))));
  }

  /**
   * Obtiene un diagnóstico por ID
   */
  getById(id: number): Observable<DiagnosisEntity> {
    return this.http.get<DiagnosisResource>(`${DIAGNOSIS_API}/${id}`)
      .pipe(map(resource => this.toEntity(resource)));
  }

  /**
   * Obtiene todos los diagnósticos de un paciente
   */
  getByPatientId(patientId: number): Observable<DiagnosisEntity[]> {
    return this.http.get<DiagnosisResource[]>(`${DIAGNOSIS_API}?patientId=${patientId}`)
      .pipe(map(resources => resources.map(r => this.toEntity(r))));
  }

  /**
   * Obtiene diagnósticos pendientes de confirmación de un paciente
   */
  getPendingConfirmations(patientId: number): Observable<DiagnosisEntity[]> {
    return this.http.get<DiagnosisResource[]>(
      `${DIAGNOSIS_API}?patientId=${patientId}&status=pending_confirmation&source=patient_reported`
    ).pipe(map(resources => resources.map(r => this.toEntity(r))));
  }

  /**
   * Crea un nuevo diagnóstico
   */
  create(request: CreateDiagnosisRequest): Observable<DiagnosisEntity> {
    const resource: Partial<DiagnosisResource> = {
      ...request,
      lastReviewDate: new Date().toISOString()
    };

    return this.http.post<DiagnosisResource>(DIAGNOSIS_API, resource)
      .pipe(map(r => this.toEntity(r)));
  }

  /**
   * Actualiza un diagnóstico existente
   */
  update(id: number, request: UpdateDiagnosisRequest): Observable<DiagnosisEntity> {
    const resource = {
      ...request,
      lastReviewDate: new Date().toISOString()
    };

    return this.http.patch<DiagnosisResource>(`${DIAGNOSIS_API}/${id}`, resource)
      .pipe(map(r => this.toEntity(r)));
  }

  /**
   * Confirma un diagnóstico reportado por el paciente
   */
  confirmByDoctor(diagnosisId: number, request: ConfirmDiagnosisRequest): Observable<DiagnosisEntity> {
    const resource = {
      doctorId: request.doctorId,
      status: 'active' as DiagnosisStatus,
      source: 'doctor_confirmed' as DiagnosisSource,
      confirmedAt: new Date().toISOString(),
      confirmedBy: request.doctorId,
      lastReviewDate: new Date().toISOString(),
      ...(request.icd10Code && { icd10Code: request.icd10Code }),
      ...(request.severity && { severity: request.severity }),
      ...(request.notes && { notes: request.notes })
    };

    return this.http.patch<DiagnosisResource>(`${DIAGNOSIS_API}/${diagnosisId}`, resource)
      .pipe(map(r => this.toEntity(r)));
  }

  /**
   * Elimina un diagnóstico
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${DIAGNOSIS_API}/${id}`);
  }

  /**
   * Transforma un recurso de API a entidad de dominio
   */
  private toEntity(resource: DiagnosisResource): DiagnosisEntity {
    return new DiagnosisEntity(
      resource.id,
      resource.patientId,
      resource.doctorId || null,
      resource.icd10Code || '',
      resource.diagnosisName,
      resource.status,
      resource.severity || 'moderate',
      resource.diagnosisDate,
      null, // resolvedDate
      resource.notes || '',
      '', // treatment
      false, // followUpRequired
      resource.lastReviewDate || new Date().toISOString(),
      resource.diagnosisDate, // createdAt
      resource.lastReviewDate || resource.diagnosisDate, // updatedAt
      resource.source
    );
  }
}
