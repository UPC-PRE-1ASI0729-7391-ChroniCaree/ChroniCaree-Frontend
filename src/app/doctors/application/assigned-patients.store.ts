/**
 * Assigned Patients Store
 * Doctors Bounded Context - Application Layer
 * 
 * Store signal-based para gestionar pacientes asignados al doctor
 */
import { Injectable, signal, computed, inject } from '@angular/core';
import { PatientHealthSummary, PatientHealthStatus } from '../domain/model/patient-health-summary.entity';
import { DoctorPatientsApiEndpoint } from '../infrastructure/doctor-patients-api.endpoint';

/**
 * Estado del store
 */
interface StoreState {
  patients: PatientHealthSummary[];
  selectedPatient: PatientHealthSummary | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AssignedPatientsStore {
  private readonly apiEndpoint = inject(DoctorPatientsApiEndpoint);
  
  // Estado principal (signal writable privado)
  private readonly state = signal<StoreState>({
    patients: [],
    selectedPatient: null,
    loading: false,
    error: null
  });
  
  // Cache para prevenir duplicación de llamadas
  private loadingCache = new Map<number, boolean>();
  
  // ============================================
  // SELECTORES PÚBLICOS (computed signals)
  // ============================================
  
  readonly patients = computed(() => this.state().patients);
  readonly selectedPatient = computed(() => this.state().selectedPatient);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  
  // Computed: Pacientes por estado de salud
  readonly criticalPatients = computed(() => 
    this.state().patients.filter(p => p.healthStatus === PatientHealthStatus.CRITICAL)
  );
  
  readonly atRiskPatients = computed(() => 
    this.state().patients.filter(p => p.healthStatus === PatientHealthStatus.AT_RISK)
  );
  
  readonly controlledPatients = computed(() => 
    this.state().patients.filter(p => p.healthStatus === PatientHealthStatus.CONTROLLED)
  );
  
  readonly stablePatients = computed(() => 
    this.state().patients.filter(p => p.healthStatus === PatientHealthStatus.STABLE)
  );
  
  // Computed: Conteos
  readonly totalPatients = computed(() => this.state().patients.length);
  readonly criticalCount = computed(() => this.criticalPatients().length);
  readonly atRiskCount = computed(() => this.atRiskPatients().length);
  
  // Computed: Tiene pacientes críticos
  readonly hasCriticalPatients = computed(() => this.criticalCount() > 0);
  
  // Computed: Resumen de alertas totales
  readonly totalCriticalAlerts = computed(() => 
    this.state().patients.reduce((sum, p) => sum + p.criticalAlertsCount, 0)
  );
  
  readonly totalActiveAlerts = computed(() => 
    this.state().patients.reduce((sum, p) => sum + p.activeAlertsCount, 0)
  );
  
  // ============================================
  // ACCIONES PÚBLICAS
  // ============================================
  
  /**
   * Carga pacientes asignados a un doctor
   */
  loadPatientsByDoctor(doctorId: number): void {
    // Protección contra llamadas duplicadas
    if (this.loadingCache.get(doctorId) || this.state().loading) {
      console.log(`⚠️ [AssignedPatientsStore] Ya hay una carga en progreso para doctor ${doctorId}`);
      return;
    }
    
    this.loadingCache.set(doctorId, true);
    this.setLoading(true);
    
    this.apiEndpoint.getAssignedPatients(doctorId).subscribe({
      next: (patients) => {
        console.log(`✅ [AssignedPatientsStore] ${patients.length} pacientes cargados para doctor ${doctorId}`);
        this.state.update(s => ({
          ...s,
          patients,
          loading: false,
          error: null
        }));
        this.loadingCache.delete(doctorId);
      },
      error: (err) => {
        console.error(`❌ [AssignedPatientsStore] Error cargando pacientes:`, err);
        this.state.update(s => ({
          ...s,
          loading: false,
          error: 'Error al cargar pacientes asignados'
        }));
        this.loadingCache.delete(doctorId);
      }
    });
  }
  
  /**
   * Carga un paciente específico por ID
   */
  loadPatientById(patientId: number): void {
    this.setLoading(true);
    // Prefer the composite health summary endpoint if available for a single patient.
    this.apiEndpoint.getPatientHealthSummaryById(patientId).subscribe({
      next: (patient) => {
        if (patient) {
          console.log(`✅ [AssignedPatientsStore] Paciente ${patientId} cargado`);
          this.state.update(s => ({
            ...s,
            selectedPatient: patient,
            loading: false,
            error: null
          }));
        } else {
          this.state.update(s => ({
            ...s,
            loading: false,
            error: 'Paciente no encontrado'
          }));
        }
      },
      error: (err) => {
        console.error(`❌ [AssignedPatientsStore] Error cargando paciente ${patientId}:`, err);
        this.state.update(s => ({
          ...s,
          loading: false,
          error: 'Error al cargar datos del paciente'
        }));
      }
    });
  }
  
  /**
   * Selecciona un paciente de la lista cargada
   */
  selectPatient(patientId: number): void {
    const patient = this.state().patients.find(p => p.id === patientId);
    if (patient) {
      this.state.update(s => ({
        ...s,
        selectedPatient: patient
      }));
    }
  }
  
  /**
   * Limpia el paciente seleccionado
   */
  clearSelectedPatient(): void {
    this.state.update(s => ({
      ...s,
      selectedPatient: null
    }));
  }
  
  /**
   * Refresca los datos de los pacientes
   */
  refresh(doctorId: number): void {
    this.loadingCache.clear();
    this.loadPatientsByDoctor(doctorId);
  }
  
  /**
   * Limpia el store completamente
   */
  clear(): void {
    this.state.set({
      patients: [],
      selectedPatient: null,
      loading: false,
      error: null
    });
    this.loadingCache.clear();
  }
  
  // ============================================
  // MÉTODOS PRIVADOS
  // ============================================
  
  private setLoading(loading: boolean): void {
    this.state.update(s => ({ ...s, loading }));
  }
}
