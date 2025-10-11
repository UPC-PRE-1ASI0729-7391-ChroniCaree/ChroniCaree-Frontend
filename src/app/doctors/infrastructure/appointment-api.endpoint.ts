/**
 * Appointment API Endpoint
 * Doctors Bounded Context - Infrastructure Layer
 * 
 * Endpoint para gestionar citas médicas
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Appointment } from '../domain/model/appointment.entity';
import { AppointmentResource } from './appointment.resource';
import { AppointmentAssembler } from './appointment.assembler';

interface PatientResource {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  phone: string;
}

interface UserResource {
  id: number;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentApiEndpoint {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  /**
   * Obtiene todas las citas de un doctor con datos enriquecidos del paciente
   */
  getAppointmentsByDoctor(doctorId: number): Observable<Appointment[]> {
    return this.http.get<AppointmentResource[]>(`${this.baseUrl}/appointments`).pipe(
      map(appointments => appointments.filter(apt => apt.doctorId === doctorId)),
      switchMap(appointments => {
        if (appointments.length === 0) {
          return of([]);
        }

        // Obtener datos de pacientes
        const patientIds = [...new Set(appointments.map(apt => apt.patientId))];
        const patientRequests = patientIds.map(id =>
          this.http.get<PatientResource>(`${this.baseUrl}/patients/${id}`).pipe(
            catchError(() => of(null))
          )
        );

        return forkJoin(patientRequests).pipe(
          switchMap(patients => {
            const validPatients = patients.filter(p => p !== null) as PatientResource[];
            
            // Obtener emails de usuarios
            const userIds = validPatients.map(p => p.userId);
            const userRequests = userIds.map(userId =>
              this.http.get<UserResource>(`${this.baseUrl}/users/${userId}`).pipe(
                catchError(() => of(null))
              )
            );

            return forkJoin(userRequests.length > 0 ? userRequests : [of(null)]).pipe(
              map(users => {
                const validUsers = (users.filter(u => u !== null) as UserResource[]);
                
                return appointments.map(aptResource => {
                  const patient = validPatients.find(p => p.id === aptResource.patientId);
                  const user = patient ? validUsers.find(u => u.id === patient.userId) : null;
                  
                  const appointment = AppointmentAssembler.toDomain(aptResource);
                  
                  if (patient) {
                    appointment.patientName = `${patient.firstName} ${patient.lastName}`;
                    appointment.patientPhone = patient.phone;
                    appointment.patientEmail = user?.email;
                  }
                  
                  return appointment;
                });
              })
            );
          })
        );
      }),
      catchError(error => {
        console.error('Error fetching appointments:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene una cita específica por ID
   */
  getAppointmentById(appointmentId: number): Observable<Appointment | null> {
    return this.http.get<AppointmentResource>(`${this.baseUrl}/appointments/${appointmentId}`).pipe(
      map(resource => AppointmentAssembler.toDomain(resource)),
      catchError(() => of(null))
    );
  }

  /**
   * ⭐ Obtiene todas las citas de un paciente
   */
  getAppointmentsByPatient(patientId: number): Observable<Appointment[]> {
    return this.http.get<AppointmentResource[]>(`${this.baseUrl}/appointments`).pipe(
      map(appointments => appointments.filter(apt => apt.patientId === patientId)),
      map(appointments => appointments.map(resource => AppointmentAssembler.toDomain(resource))),
      catchError(error => {
        console.error('Error fetching patient appointments:', error);
        return of([]);
      })
    );
  }

  /**
   * ⭐ Crea una nueva cita
   */
  create(appointmentData: Omit<Appointment, 'id'>): Observable<Appointment> {
    const resource = AppointmentAssembler.toResource(appointmentData as Appointment);
    return this.http.post<AppointmentResource>(`${this.baseUrl}/appointments`, resource).pipe(
      map(resource => AppointmentAssembler.toDomain(resource))
    );
  }

  /**
   * Actualiza el estado de una cita
   */
  updateAppointmentStatus(appointmentId: number, status: string): Observable<Appointment> {
    return this.http.patch<AppointmentResource>(
      `${this.baseUrl}/appointments/${appointmentId}`,
      { status }
    ).pipe(
      map(resource => AppointmentAssembler.toDomain(resource))
    );
  }

  /**
   * Actualiza las notas de una cita
   */
  updateAppointmentNotes(appointmentId: number, notes: string): Observable<Appointment> {
    return this.http.patch<AppointmentResource>(
      `${this.baseUrl}/appointments/${appointmentId}`,
      { notes }
    ).pipe(
      map(resource => AppointmentAssembler.toDomain(resource))
    );
  }
}
