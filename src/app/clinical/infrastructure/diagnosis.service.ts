import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DiagnosisEntity, DiagnosisStatus, DiagnosisSeverity } from '../domain/model/diagnosis.entity';
import { environment } from '../../../environments/environment';

const DIAGNOSIS_API = `${environment.apiBaseUrl}${environment.diagnosesEndpointPath}`;

/**
 * Diagnosis Resource (DTO para comunicación con API)
 * Note: source field NOT SUPPORTED by backend
 */
export interface DiagnosisResource {
  id: number;
  patientId: number;
  doctorId: number;  // REQUIRED by backend
  diagnosisName: string;
  icd10Code: string;  // REQUIRED by backend
  status: DiagnosisStatus;
  severity: DiagnosisSeverity;  // REQUIRED by backend
  // source: NOT SUPPORTED BY BACKEND - removed
  diagnosisDate: string;
  notes?: string;
  lastReviewDate?: string;
  followUpDate?: string;
  confirmedAt?: string;
  confirmedBy?: number;
}

/**
 * Request para crear un diagnóstico
 * 
 * Backend requirements:
 * - doctorId: REQUIRED (cannot be null)
 * - status: ACTIVE, CONTROLLED, RESOLVED, MONITORING (no PENDING_CONFIRMATION)
 * - severity: LOW, MODERATE, HIGH, CRITICAL
 * - source: NOT SUPPORTED (removed)
 */
export interface CreateDiagnosisRequest {
  patientId: number;
  doctorId: number;  // REQUIRED by backend - cannot be null/omitted
  diagnosisName: string;
  icd10Code: string;  // REQUIRED by backend
  status: DiagnosisStatus;
  severity: DiagnosisSeverity;  // REQUIRED by backend
  diagnosedDate: string;  // Backend expects 'diagnosedDate' YYYY-MM-DD format
  followUpRequired: boolean;  // REQUIRED by backend
  notes?: string;
  treatment?: string;
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
   * Obtiene diagnósticos que necesitan revisión/monitoreo de un paciente
   * Note: PENDING_CONFIRMATION no existe en backend, usamos MONITORING
   */
  getMonitoringDiagnoses(patientId: number): Observable<DiagnosisEntity[]> {
    return this.http.get<DiagnosisResource[]>(
      `${DIAGNOSIS_API}?patientId=${patientId}&status=MONITORING`
    ).pipe(map(resources => resources.map(r => this.toEntity(r))));
  }

  /**
   * Crea un nuevo diagnóstico
   * 
   * Backend REQUIRED fields:
   * - patientId, doctorId, icd10Code, diagnosisName, status, severity, diagnosedDate, followUpRequired
   * 
   * NOTE: source field does NOT exist in backend - do not send it
   */
  create(request: CreateDiagnosisRequest): Observable<DiagnosisEntity> {
    // Build payload with ALL required fields
    const payload: Record<string, any> = {
      patientId: request.patientId,
      doctorId: request.doctorId,  // REQUIRED - backend rejects if null/missing
      icd10Code: request.icd10Code,  // REQUIRED
      diagnosisName: request.diagnosisName,
      status: request.status.toUpperCase(),  // ACTIVE, CONTROLLED, RESOLVED, MONITORING
      severity: request.severity.toUpperCase(),  // LOW, MODERATE, HIGH, CRITICAL
      diagnosedDate: request.diagnosedDate.split('T')[0],  // Backend expects YYYY-MM-DD format
      followUpRequired: request.followUpRequired
    };

    // Optional fields
    if (request.notes) {
      payload['notes'] = request.notes;
    }
    if (request.treatment) {
      payload['treatment'] = request.treatment;
    }
    // NOTE: source field removed - NOT SUPPORTED BY BACKEND

    console.log('📤 [DiagnosisService] Creating diagnosis with payload:', payload);
    console.log('  → URL:', DIAGNOSIS_API);

    return this.http.post<DiagnosisResource>(DIAGNOSIS_API, payload)
      .pipe(
        map(r => {
          console.log('✅ [DiagnosisService] Diagnosis created successfully:', r);
          return this.toEntity(r);
        })
      );
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
      status: 'ACTIVE',  // Backend expects UPPERCASE
      confirmedAt: new Date().toISOString(),
      confirmedBy: request.doctorId,
      lastReviewDate: new Date().toISOString().split('T')[0],
      ...(request.icd10Code && { icd10Code: request.icd10Code }),
      ...(request.severity && { severity: request.severity.toUpperCase() }),  // Backend expects UPPERCASE
      ...(request.notes && { notes: request.notes })
    };

    console.log('📤 [DiagnosisService] Confirming diagnosis with payload:', resource);

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
      resource.doctorId || 0,  // doctorId is required
      resource.icd10Code || '',
      resource.diagnosisName,
      resource.status,
      resource.severity || 'MODERATE',
      resource.diagnosisDate,
      null, // resolvedDate
      resource.notes || '',
      '', // treatment
      false, // followUpRequired
      resource.lastReviewDate || new Date().toISOString(),
      resource.diagnosisDate, // createdAt
      resource.lastReviewDate || resource.diagnosisDate // updatedAt
    );
  }
}
