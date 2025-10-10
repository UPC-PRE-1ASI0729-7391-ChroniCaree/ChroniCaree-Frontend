import { Injectable, signal, WritableSignal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Diagnosis, DiagnosisStatus } from '../domain/model/diagnosis.entity';
import { DiagnosisApiEndpoint } from '../infrastructure/diagnosis-api.endpoint';

/**
 * Diagnosis Store - Gestión de estado para diagnósticos médicos
 */
@Injectable({
  providedIn: 'root'
})
export class DiagnosisStore {
  private readonly diagnoses: WritableSignal<Diagnosis[]> = signal([]);
  private readonly selectedDiagnosis: WritableSignal<Diagnosis | null> = signal(null);
  private readonly loading: WritableSignal<boolean> = signal(false);
  private readonly error: WritableSignal<string | null> = signal(null);

  readonly diagnoses$ = this.diagnoses.asReadonly();
  readonly selectedDiagnosis$ = this.selectedDiagnosis.asReadonly();
  readonly loading$ = this.loading.asReadonly();
  readonly error$ = this.error.asReadonly();

  // Computed: Diagnósticos activos
  readonly activeDiagnoses = computed(() => 
    this.diagnoses().filter(d => d.status === DiagnosisStatus.ACTIVE)
  );

  // Computed: Diagnósticos controlados
  readonly controlledDiagnoses = computed(() => 
    this.diagnoses().filter(d => d.status === DiagnosisStatus.CONTROLLED)
  );

  // Computed: Diagnósticos resueltos
  readonly resolvedDiagnoses = computed(() => 
    this.diagnoses().filter(d => d.status === DiagnosisStatus.RESOLVED)
  );

  // Computed: Total de diagnósticos activos
  readonly activeDiagnosesCount = computed(() => this.activeDiagnoses().length);

  constructor(private diagnosisApi: DiagnosisApiEndpoint) {}

  /**
   * Carga todos los diagnósticos
   */
  loadAllDiagnoses(): Observable<Diagnosis[]> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.diagnosisApi.getAll().pipe(
      tap({
        next: (diagnoses) => {
          this.diagnoses.set(diagnoses);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar diagnósticos');
          this.loading.set(false);
          console.error('Error loading diagnoses:', err);
        }
      })
    );
  }

  /**
   * Carga un diagnóstico específico por ID
   */
  loadDiagnosisById(id: number): Observable<Diagnosis> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.diagnosisApi.getById(id).pipe(
      tap({
        next: (diagnosis) => {
          this.selectedDiagnosis.set(diagnosis);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar diagnóstico');
          this.loading.set(false);
          console.error('Error loading diagnosis:', err);
        }
      })
    );
  }

  /**
   * Crea un nuevo diagnóstico
   */
  createDiagnosis(diagnosis: Diagnosis): Observable<Diagnosis> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.diagnosisApi.create(diagnosis).pipe(
      tap({
        next: (newDiagnosis) => {
          this.diagnoses.update(diagnoses => [...diagnoses, newDiagnosis]);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al crear diagnóstico');
          this.loading.set(false);
          console.error('Error creating diagnosis:', err);
        }
      })
    );
  }

  /**
   * Actualiza un diagnóstico existente
   */
  updateDiagnosis(diagnosis: Diagnosis): Observable<Diagnosis> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.diagnosisApi.update(diagnosis, diagnosis.id).pipe(
      tap({
        next: (updatedDiagnosis) => {
          this.diagnoses.update(diagnoses => 
            diagnoses.map(d => d.id === updatedDiagnosis.id ? updatedDiagnosis : d)
          );
          this.selectedDiagnosis.set(updatedDiagnosis);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al actualizar diagnóstico');
          this.loading.set(false);
          console.error('Error updating diagnosis:', err);
        }
      })
    );
  }

  /**
   * Elimina un diagnóstico
   */
  deleteDiagnosis(id: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.diagnosisApi.delete(id).pipe(
      tap({
        next: () => {
          this.diagnoses.update(diagnoses => diagnoses.filter(d => d.id !== id));
          if (this.selectedDiagnosis()?.id === id) {
            this.selectedDiagnosis.set(null);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al eliminar diagnóstico');
          this.loading.set(false);
          console.error('Error deleting diagnosis:', err);
        }
      })
    );
  }

  /**
   * Limpia el error actual
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Limpia la selección actual
   */
  clearSelection(): void {
    this.selectedDiagnosis.set(null);
  }
}
