/**
 * Medication Store
 * Signal-based state management for medications
 */

import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, tap, finalize, catchError, of, shareReplay, switchMap } from 'rxjs';
import { MedicationApiEndpoint } from '../infrastructure/medication-api.endpoint';
import { Medication, MedicationLog, MedicationStatus } from '../domain/model/medication.entity';

@Injectable({
  providedIn: 'root'
})
export class MedicationStore {
  private readonly medicationApi = inject(MedicationApiEndpoint);

  // 🛡️ Anti-duplicate protection
  private currentRequest: Observable<Medication[]> | null = null;

  // State signals
  private readonly _medications = signal<Medication[]>([]);
  private readonly _selectedMedication = signal<Medication | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  public readonly medications = this._medications.asReadonly();
  public readonly selectedMedication = this._selectedMedication.asReadonly();
  public readonly loading = this._loading.asReadonly();
  public readonly error = this._error.asReadonly();

  // Computed signals
  public readonly activeMedications = computed(() => 
    this._medications().filter(med => med.isActive)
  );

  public readonly medicationsNeedingRefill = computed(() => 
    this._medications().filter(med => med.needsRefill)
  );

  public readonly todaySchedule = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this._medications()
      .filter(med => med.isActive)
      .flatMap(med => {
        const times = med.schedule?.times || [];
        const logs = med.logs || [];
        return times.map(time => {
          // Normalize scheduledTime (support Date or ISO string)
          const taken = logs.some(log => {
            try {
              const scheduled = log?.scheduledTime instanceof Date ? log.scheduledTime : new Date(log?.scheduledTime);
              if (isNaN(scheduled.getTime())) return false;
              const matchesDate = scheduled.toDateString() === today.toDateString();
              const hour = parseInt((time || '0:00').split(':')[0], 10);
              const matchesHour = scheduled.getHours() === hour;
              return matchesDate && matchesHour && log.status === MedicationStatus.TAKEN;
            } catch (e) {
              return false;
            }
          });

          return {
            medication: med,
            time,
            taken
          };
        });
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  });

  public readonly adherenceStats = computed(() => {
    const meds = this._medications().filter(med => med.isActive);
    if (meds.length === 0) return { average: 100, total: 0, taken: 0 };

    const totalLogs = meds.reduce((sum, med) => sum + med.logs.length, 0);
    const takenLogs = meds.reduce(
      (sum, med) => sum + med.logs.filter(log => log.status === MedicationStatus.TAKEN).length,
      0
    );

    return {
      average: totalLogs > 0 ? Math.round((takenLogs / totalLogs) * 100) : 100,
      total: totalLogs,
      taken: takenLogs
    };
  });

  public readonly medicationCount = computed(() => ({
    total: this._medications().length,
    active: this.activeMedications().length,
    needRefill: this.medicationsNeedingRefill().length
  }));

  /**
   * Load all medications for a patient
   */
  loadMedicationsByPatient(patientId: number): Observable<Medication[]> {
    // 🛡️ Return existing request if in progress
    if (this.currentRequest) {
      return this.currentRequest;
    }

    // 🛡️ Return cached data if available
    if (this._medications().length > 0 && !this._loading()) {
      return new Observable(observer => {
        observer.next(this._medications());
        observer.complete();
      });
    }

    this._loading.set(true);
    this._error.set(null);

    this.currentRequest = this.medicationApi.getByPatientId(patientId).pipe(
      tap(medications => {
        this._medications.set(medications);
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Error loading medications:', error);
        this._error.set('Error al cargar medicamentos');
        this._loading.set(false);
        return of([]);
      }),
      finalize(() => {
        this.currentRequest = null;
      }),
      shareReplay(1)
    );

    return this.currentRequest;
  }

  /**
   * Load active medications only
   */
  loadActiveMedications(patientId: number): Observable<Medication[]> {
    this._loading.set(true);
    this._error.set(null);

    return this.medicationApi.getActiveMedications(patientId).pipe(
      tap(medications => {
        this._medications.set(medications);
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Error loading active medications:', error);
        this._error.set('Error al cargar medicamentos activos');
        this._loading.set(false);
        return of([]);
      })
    );
  }

  /**
   * Get medication by ID
   */
  getMedicationById(id: number): Observable<Medication> {
    // Check if already in state
    const existing = this._medications().find(med => med.id === id);
    if (existing) {
      this._selectedMedication.set(existing);
      return of(existing);
    }

    this._loading.set(true);
    return this.medicationApi.getById(id).pipe(
      tap(medication => {
        this._selectedMedication.set(medication);
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Error loading medication:', error);
        this._error.set('Error al cargar medicamento');
        this._loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Create a new medication
   */
  createMedication(medication: Medication): Observable<Medication> {
    this._loading.set(true);
    this._error.set(null);

    // Fetch all medications to determine the next ID
    return this.medicationApi.getAll().pipe(
      switchMap(allMedications => {
        const maxId = allMedications.reduce((max, m) => Math.max(max, m.id || 0), 0);
        const nextId = maxId + 1;
        
        // Create a new object with the new ID, preserving other properties
        const newMedication = Object.assign(new Medication(), medication, {
          id: nextId,
          sideEffects: medication.sideEffects ?? [],
          contraindications: medication.contraindications ?? []
        });

        return this.medicationApi.create(newMedication);
      }),
      tap(created => {
        this._medications.update(meds => [...meds, created]);
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Error creating medication:', error);
        this._error.set('Error al crear medicamento');
        this._loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Update an existing medication
   */
  updateMedication(id: number, medication: Medication): Observable<Medication> {
    this._loading.set(true);
    this._error.set(null);

    const safeMedication = Object.assign(new Medication(), medication, {
      sideEffects: medication.sideEffects ?? [],
      contraindications: medication.contraindications ?? []
    });

    return this.medicationApi.update(id, safeMedication).pipe(
      tap(updated => {
        this._medications.update(meds =>
          meds.map(med => med.id === id ? updated : med)
        );
        if (this._selectedMedication()?.id === id) {
          this._selectedMedication.set(updated);
        }
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Error updating medication:', error);
        this._error.set('Error al actualizar medicamento');
        this._loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Delete a medication
   */
  deleteMedication(id: number): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.medicationApi.delete(id).pipe(
      tap(() => {
        this._medications.update(meds => meds.filter(med => med.id !== id));
        if (this._selectedMedication()?.id === id) {
          this._selectedMedication.set(null);
        }
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Error deleting medication:', error);
        this._error.set('Error al eliminar medicamento');
        this._loading.set(false);
        throw error;
      })
    );
  }

  /**
   * Log medication as taken
   */
  logMedicationTaken(medicationId: number, scheduledTime: Date, notes?: string): Observable<Medication> {
    const medication = this._medications().find(med => med.id === medicationId);
    if (!medication) {
      this._error.set('Medicamento no encontrado');
      return of(new Medication());
    }

    const log = medication.markAsTaken(scheduledTime, notes);

    return this.medicationApi.logMedication(medicationId, log).pipe(
      tap(updated => {
        this._medications.update(meds =>
          meds.map(med => med.id === medicationId ? updated : med)
        );
      }),
      catchError(error => {
        console.error('Error logging medication:', error);
        this._error.set('Error al registrar medicamento');
        throw error;
      })
    );
  }

  /**
   * Log medication as missed
   */
  logMedicationMissed(medicationId: number, scheduledTime: Date, reason?: string): Observable<Medication> {
    const medication = this._medications().find(med => med.id === medicationId);
    if (!medication) {
      this._error.set('Medicamento no encontrado');
      return of(new Medication());
    }

    const log = medication.markAsMissed(scheduledTime, reason);

    return this.medicationApi.logMedication(medicationId, log).pipe(
      tap(updated => {
        this._medications.update(meds =>
          meds.map(med => med.id === medicationId ? updated : med)
        );
      }),
      catchError(error => {
        console.error('Error logging missed medication:', error);
        this._error.set('Error al registrar medicamento perdido');
        throw error;
      })
    );
  }

  /**
   * Clear selected medication
   */
  clearSelected(): void {
    this._selectedMedication.set(null);
  }

  /**
   * Clear error
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Force reload medications
   */
  forceReload(patientId: number): Observable<Medication[]> {
    this._medications.set([]);
    this.currentRequest = null;
    return this.loadMedicationsByPatient(patientId);
  }
}
