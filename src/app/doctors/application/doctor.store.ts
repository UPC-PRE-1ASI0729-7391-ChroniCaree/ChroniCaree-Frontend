import { Injectable, signal, WritableSignal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Doctor } from '../domain/model/doctor.entity';
import { DoctorApiEndpoint } from '../infrastructure/doctor-api.endpoint';

@Injectable({
  providedIn: 'root'
})
export class DoctorStore {
  private readonly doctors: WritableSignal<Doctor[]> = signal([]);
  private readonly selectedDoctor: WritableSignal<Doctor | null> = signal(null);
  private readonly loading: WritableSignal<boolean> = signal(false);
  private readonly error: WritableSignal<string | null> = signal(null);

  readonly doctors$ = this.doctors.asReadonly();
  readonly selectedDoctor$ = this.selectedDoctor.asReadonly();
  readonly loading$ = this.loading.asReadonly();
  readonly error$ = this.error.asReadonly();

  constructor(private doctorApi: DoctorApiEndpoint) {}

  loadAllDoctors(): Observable<Doctor[]> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.doctorApi.getAll().pipe(
      tap({
        next: (doctors) => {
          this.doctors.set(doctors);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar doctores');
          this.loading.set(false);
          console.error('Error loading doctors:', err);
        }
      })
    );
  }

  loadDoctorById(id: number): Observable<Doctor> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.doctorApi.getById(id).pipe(
      tap({
        next: (doctor) => {
          this.selectedDoctor.set(doctor);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar doctor');
          this.loading.set(false);
          console.error('Error loading doctor:', err);
        }
      })
    );
  }

  createDoctor(doctor: Doctor): Observable<Doctor> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.doctorApi.create(doctor).pipe(
      tap({
        next: (newDoctor) => {
          this.doctors.update(doctors => [...doctors, newDoctor]);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al crear doctor');
          this.loading.set(false);
          console.error('Error creating doctor:', err);
        }
      })
    );
  }

  updateDoctor(doctor: Doctor): Observable<Doctor> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.doctorApi.update(doctor, doctor.id).pipe(
      tap({
        next: (updatedDoctor) => {
          this.doctors.update(doctors => 
            doctors.map(d => d.id === updatedDoctor.id ? updatedDoctor : d)
          );
          this.selectedDoctor.set(updatedDoctor);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al actualizar doctor');
          this.loading.set(false);
          console.error('Error updating doctor:', err);
        }
      })
    );
  }

  deleteDoctor(id: number): Observable<void> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.doctorApi.delete(id).pipe(
      tap({
        next: () => {
          this.doctors.update(doctors => doctors.filter(d => d.id !== id));
          if (this.selectedDoctor()?.id === id) {
            this.selectedDoctor.set(null);
          }
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al eliminar doctor');
          this.loading.set(false);
          console.error('Error deleting doctor:', err);
        }
      })
    );
  }

  clearError(): void {
    this.error.set(null);
  }

  clearSelection(): void {
    this.selectedDoctor.set(null);
  }
}
