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
    return this.http.get<PatientResource[]>(`${this.baseUrl}/patients`).pipe(
      map(patients => patients.filter(p => p.assignedDoctorId === doctorId)),
      switchMap(assignedPatients => {
        if (assignedPatients.length === 0) {
          return of([]);
        }

        // Para cada paciente, obtener sus métricas de salud
        const patientsWithHealth$ = assignedPatients.map(patient =>
          this.enrichPatientWithHealthData(patient)
        );

        return forkJoin(patientsWithHealth$);
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
   * Enriquece los datos del paciente con métricas de salud
   * Obtiene alertas, medicamentos, diagnósticos y signos vitales recientes
   */
  private enrichPatientWithHealthData(patient: PatientResource): Observable<PatientHealthSummary> {
    const patientId = patient.id.toString();

    // Peticiones paralelas para obtener todos los datos
    return forkJoin({
      alerts: this.http.get<AlertResource[]>(`${this.baseUrl}/alerts`).pipe(
        map(alerts => alerts.filter(a => a.patientId === patientId)),
        catchError(() => of([]))
      ),
      medications: this.http.get<MedicationResource[]>(`${this.baseUrl}/medications`).pipe(
        map(meds => meds.filter(m => m.patientId === patientId)),
        catchError(() => of([]))
      ),
      diagnoses: this.http.get<DiagnosisResource[]>(`${this.baseUrl}/diagnoses`).pipe(
        map(diags => diags.filter(d => d.patientId === patient.id)),
        catchError(() => of([]))
      ),
      symptoms: this.http.get<SymptomResource[]>(`${this.baseUrl}/symptoms`).pipe(
        map(symptoms => symptoms.filter(s => s.patientId === patient.id)),
        catchError(() => of([]))
      )
    }).pipe(
      map(({ alerts, medications, diagnoses, symptoms }) => {
        // Calcular métricas
        const activeAlerts = alerts.filter(a => a.status === 'active');
        const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical' || a.severity === 'high');
        const activeMedications = medications.filter(m => m.status === 'active');
        const activeDiagnoses = diagnoses.filter(d => d.status === 'active' || d.status === 'controlled');

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
          assignedSince: '2025-01-15T00:00:00Z', // TODO: obtener de una tabla de asignaciones
          tenantId: patient.tenantId,
          hospitalName: patient.tenantId ? 'Hospital Central' : undefined // TODO: join con tenants
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
