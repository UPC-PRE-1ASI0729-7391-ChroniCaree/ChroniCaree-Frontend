import { Injectable, signal, WritableSignal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Patient } from '../domain/model/patient.entity';
import { PatientApiEndpoint } from '../infrastructure/patient-api.endpoint';

@Injectable({
  providedIn: 'root'
})
export class PatientStore {
  private readonly patients: WritableSignal<Patient[]> = signal([]);
  private readonly selectedPatient: WritableSignal<Patient | null> = signal(null);
  private readonly loading: WritableSignal<boolean> = signal(false);
  private readonly error: WritableSignal<string | null> = signal(null);

  readonly patients$ = this.patients.asReadonly();
  readonly selectedPatient$ = this.selectedPatient.asReadonly();
  readonly loading$ = this.loading.asReadonly();
  readonly error$ = this.error.asReadonly();

  constructor(private patientApi: PatientApiEndpoint) {}

  loadAllPatients(): Observable<Patient[]> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.patientApi.getAll().pipe(
      tap({
        next: (patients) => {
          this.patients.set(patients);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar pacientes');
          this.loading.set(false);
          console.error('Error loading patients:', err);
        }
      })
    );
  }

  loadPatientById(id: number): Observable<Patient> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.patientApi.getById(id).pipe(
      tap({
        next: (patient) => {
          this.selectedPatient.set(patient);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar paciente');
          this.loading.set(false);
          console.error('Error loading patient:', err);
        }
      })
    );
  }

  createPatient(patient: Patient): Observable<Patient> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.patientApi.create(patient).pipe(
      tap({
        next: (newPatient) => {
          this.patients.update(patients => [...patients, newPatient]);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al crear paciente');
          this.loading.set(false);
          console.error('Error creating patient:', err);
        }
      })
    );
  }

  updatePatient(patient: Patient): Observable<Patient> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.patientApi.update(patient, patient.id).pipe(
      tap({
        next: (updatedPatient) => {
          this.patients.update(patients => 
            patients.map(p => p.id === updatedPatient.id ? updatedPatient : p)
          );
          this.selectedPatient.set(updatedPatient);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al actualizar paciente');
          this.loading.set(false);
          console.error('Error updating patient:', err);
        }
      })
    );
  }

  deletePatient(id: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.patientApi.delete(id).pipe(
      tap({
        next: () => {
          this.patients.update(patients => patients.filter(p => p.id !== id));
          if (this.selectedPatient()?.id === id) {
            this.selectedPatient.set(null);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al eliminar paciente');
          this.loading.set(false);
          console.error('Error deleting patient:', err);
        }
      })
    );
  }

  clearError(): void {
    this.error.set(null);
  }

  clearSelection(): void {
    this.selectedPatient.set(null);
  }
}
