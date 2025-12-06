/**
 * Doctor Patients API Endpoint
 * Doctors Bounded Context - Infrastructure Layer
 * 
 * Maneja las peticiones HTTP para obtener pacientes asignados al doctor
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { PatientHealthSummary, PatientHealthStatus } from '../domain/model/patient-health-summary.entity';

/**
 * Resource interfaces (DTOs from API)
 */
interface PatientResource {
  id: number;
  userId: number;
  assignedDoctorId: number;
  tenantId: number | null;
  subscriptionId: number;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  address: string;
  weight: number;
  height: number;
  bmi: number;
}

interface AlertResource {
  id: string;
  patientId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  createdAt: string;
}

interface MedicationResource {
  id: string;
  patientId: string;
  status: string;
}

interface DiagnosisResource {
  id: number;
  patientId: number;
  status: string;
}

interface SymptomResource {
  id: number;
  patientId: number;
  glucose?: number;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  oxygenSaturation?: number;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorPatientsApiEndpoint extends BaseApi {
  private readonly http = inject(HttpClient);

  /**
   * Obtiene todos los pacientes asignados a un doctor específico
   * Incluye métricas de salud calculadas (alertas, medicamentos, diagnósticos)
   */
  getAssignedPatients(doctorId: number): Observable<PatientHealthSummary[]> {
    // Try server-side filtering by assignedDoctorId first. If the backend supports
    // `GET /patients?assignedDoctorId={doctorId}` this will avoid fetching the whole
    // patients collection on the client. If the endpoint returns all patients (no filter),
    // fallback to client-side filtering.
    return this.http.get<PatientResource[]>(`${this.baseUrl}/patients?assignedDoctorId=${doctorId}`).pipe(
      map(patients => Array.isArray(patients) ? patients.filter(p => p.assignedDoctorId === doctorId) : []),
      switchMap(assignedPatients => {
        if (assignedPatients.length === 0) {
          return of([]);
        }

        // Para cada paciente, obtener sus métricas de salud preferentemente via el
        // endpoint compuesto `/patients/{id}/health-summary` si está disponible.
        const patientsWithHealth$: Observable<PatientHealthSummary | null>[] = assignedPatients.map(patient =>
          this.getPatientHealthSummaryById(patient.id)
        );

        // forkJoin returns (PatientHealthSummary | null)[] because getPatientHealthSummaryById
        // resolves to PatientHealthSummary | null on failure or unsupported composite endpoint.
        // We must filter out nulls and return PatientHealthSummary[] to match the method signature.
        // Helper to narrow (T | null | undefined)[] to T[]
        const filterNotNull = <T,>(items: (T | null | undefined)[]): T[] => items.filter((v): v is T => v != null);

        return forkJoin(patientsWithHealth$).pipe(
          map(results => filterNotNull(results)),
          // In case of network error while fetching health summaries, return empty list
          catchError(err => {
            console.error('Error fetching health summaries for patients:', err);
            return of([] as PatientHealthSummary[]);
          })
        );
      }),
      catchError(error => {
        console.error('Error fetching assigned patients:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene un paciente específico con todos sus datos de salud
   */
  getPatientById(patientId: number): Observable<PatientHealthSummary | null> {
    return this.http.get<PatientResource>(`${this.baseUrl}/patients/${patientId}`).pipe(
      switchMap(patient => this.enrichPatientWithHealthData(patient)),
      catchError(error => {
        console.error('Error fetching patient:', error);
        return of(null);
      })
    );
  }

  /**
   * Obtiene resumen de salud para un paciente, preferiblemente via el endpoint
   * compuesto /patients/{id}/health-summary si el backend lo implementa.
   * Si el recurso no existe (404) o el servidor no soporta el endpoint, se
   * intenta obtener los datos a través de `enrichPatientWithHealthData`.
   */
  getPatientHealthSummaryById(patientId: number | string): Observable<PatientHealthSummary | null> {
    const pid = String(patientId);
    // Attempt composite endpoint first
    return this.http.get<PatientHealthSummary>(`${this.baseUrl}/patients/${pid}/health-summary`).pipe(
      catchError(err => {
        // If composite endpoint not present, fallback to manual enrichment
        if (err?.status === 404) {
          // fallback to old strategy: fetch patient then enrich
          return this.getPatientById(Number(pid));
        }
        console.error('Error fetching patient health summary:', err);
        return of(null);
      })
    );
  }

  /**
   * Enriquece los datos del paciente con métricas de salud
   * Obtiene alertas, medicamentos, diagnósticos y signos vitales recientes
   */
  private enrichPatientWithHealthData(patient: PatientResource): Observable<PatientHealthSummary> {
    const patientId = patient.id.toString();
    const page = 0;
    const limit = 100;

    // Peticiones paralelas para obtener todos los datos
    return forkJoin({
      alerts: this.http.get<AlertResource[]>(`${this.baseUrl}/alerts?patientId=${patientId}&page=${page}&limit=${limit}`).pipe(
        map(alerts => alerts || []),
        catchError(() => of([]))
      ),
      medications: this.http.get<MedicationResource[]>(`${this.baseUrl}/medications?patientId=${patientId}&page=${page}&limit=${limit}`).pipe(
        map(meds => meds || []),
        catchError(() => of([]))
      ),
      diagnoses: this.http.get<DiagnosisResource[]>(`${this.baseUrl}/diagnoses?patientId=${patientId}&page=${page}&limit=${limit}`).pipe(
        map(diags => diags || []),
        catchError(() => of([]))
      ),
      symptoms: this.http.get<SymptomResource[]>(`${this.baseUrl}/symptoms?patientId=${patientId}&page=${page}&limit=${limit}`).pipe(
        map(symptoms => symptoms || []),
        catchError(() => of([]))
      )
    }).pipe(
      map(({ alerts, medications, diagnoses, symptoms }) => {
        // Calcular métricas
        const activeAlerts = alerts.filter(a => String(a.status).toLowerCase() === 'active');
        const criticalAlerts = activeAlerts.filter(a => {
          const sev = String(a.severity || '').toLowerCase();
          return sev === 'critical' || sev === 'high';
        });
        const activeMedications = medications.filter(m => String(m.status).toLowerCase() === 'active');
        const activeDiagnoses = diagnoses.filter(d => {
          const s = String(d.status || '').toLowerCase();
          return s === 'active' || s === 'controlled';
        });

        // Determinar estado de salud
        const healthStatus = this.calculateHealthStatus(criticalAlerts.length, activeAlerts.length);

        // Obtener signos vitales más recientes
        const latestSymptom = symptoms.length > 0 
          ? symptoms.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]
          : null;

        // Construir el summary
        const summary: PatientHealthSummary = {
          id: patient.id,
          userId: patient.userId,
          assignedDoctorId: patient.assignedDoctorId,
          firstName: patient.firstName,
          lastName: patient.lastName,
          dni: patient.dni,
          birthDate: patient.birthDate,
          gender: patient.gender,
          phone: patient.phone,
          healthStatus,
          criticalAlertsCount: criticalAlerts.length,
          activeAlertsCount: activeAlerts.length,
          activeMedicationsCount: activeMedications.length,
          activeDiagnosesCount: activeDiagnoses.length,
          lastVitalSigns: latestSymptom ? {
            glucose: latestSymptom.glucose,
            bloodPressure: latestSymptom.bloodPressure,
            heartRate: latestSymptom.heartRate,
            temperature: latestSymptom.temperature,
            oxygenSaturation: latestSymptom.oxygenSaturation,
            recordedAt: latestSymptom.timestamp
          } : undefined,
          assignedSince: '2025-01-15T00:00:00Z', // origin: sample placeholder, consider reading assignment date from a dedicated resource
          tenantId: patient.tenantId,
          hospitalName: patient.tenantId ? 'Hospital Central' : undefined // NOTE: replace with tenant lookup when available
        };

        return summary;
      })
    );
  }

  /**
   * Calcula el estado de salud general del paciente basado en alertas
   */
  private calculateHealthStatus(criticalCount: number, activeCount: number): PatientHealthStatus {
    if (criticalCount > 0) {
      return PatientHealthStatus.CRITICAL;
    }
    if (activeCount >= 3) {
      return PatientHealthStatus.AT_RISK;
    }
    if (activeCount > 0) {
      return PatientHealthStatus.CONTROLLED;
    }
    return PatientHealthStatus.STABLE;
  }
}
