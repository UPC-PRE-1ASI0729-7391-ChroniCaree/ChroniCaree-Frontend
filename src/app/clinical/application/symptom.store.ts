import { Injectable, signal, WritableSignal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Symptom } from '../domain/model/symptom.entity';
import { SymptomApiEndpoint } from '../infrastructure/symptom-api.endpoint';

/**
 * Symptom Store - Gestión de estado para síntomas
 * Registro de síntomas diarios
 */
@Injectable({
  providedIn: 'root'
})
export class SymptomStore {
  private readonly symptoms: WritableSignal<Symptom[]> = signal([]);
  private readonly selectedSymptom: WritableSignal<Symptom | null> = signal(null);
  private readonly loading: WritableSignal<boolean> = signal(false);
  private readonly error: WritableSignal<string | null> = signal(null);

  readonly symptoms$ = this.symptoms.asReadonly();
  readonly selectedSymptom$ = this.selectedSymptom.asReadonly();
  readonly loading$ = this.loading.asReadonly();
  readonly error$ = this.error.asReadonly();

  constructor(private symptomApi: SymptomApiEndpoint) {}

  /**
   * Carga todos los síntomas
   */
  loadAllSymptoms(): Observable<Symptom[]> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.symptomApi.getAll().pipe(
      tap({
        next: (symptoms) => {
          this.symptoms.set(symptoms);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar síntomas');
          this.loading.set(false);
          console.error('Error loading symptoms:', err);
        }
      })
    );
  }

  /**
   * Carga un síntoma específico por ID
   */
  loadSymptomById(id: number): Observable<Symptom> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.symptomApi.getById(id).pipe(
      tap({
        next: (symptom) => {
          this.selectedSymptom.set(symptom);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar síntoma');
          this.loading.set(false);
          console.error('Error loading symptom:', err);
        }
      })
    );
  }

  /**
   * Crea un nuevo registro de síntomas
   */
  createSymptom(symptom: Symptom): Observable<Symptom> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.symptomApi.create(symptom).pipe(
      tap({
        next: (newSymptom) => {
          this.symptoms.update(symptoms => [...symptoms, newSymptom]);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al crear síntoma');
          this.loading.set(false);
          console.error('Error creating symptom:', err);
        }
      })
    );
  }

  /**
   * Actualiza un síntoma existente (US03: Editar síntomas previos)
   */
  updateSymptom(symptom: Symptom): Observable<Symptom> {
    this.loading.set(true);
    this.error.set(null);
    
    // Marcar como editado
    const updatedSymptom = {
      ...symptom,
      isEdited: true,
      editedAt: new Date().toISOString()
    };
    
    return this.symptomApi.update(updatedSymptom, symptom.id).pipe(
      tap({
        next: (updated) => {
          this.symptoms.update(symptoms => 
            symptoms.map(s => s.id === updated.id ? updated : s)
          );
          this.selectedSymptom.set(updated);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al actualizar síntoma');
          this.loading.set(false);
          console.error('Error updating symptom:', err);
        }
      })
    );
  }

  /**
   * Elimina un síntoma
   */
  deleteSymptom(id: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.symptomApi.delete(id).pipe(
      tap({
        next: () => {
          this.symptoms.update(symptoms => symptoms.filter(s => s.id !== id));
          if (this.selectedSymptom()?.id === id) {
            this.selectedSymptom.set(null);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al eliminar síntoma');
          this.loading.set(false);
          console.error('Error deleting symptom:', err);
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
    this.selectedSymptom.set(null);
  }
}
