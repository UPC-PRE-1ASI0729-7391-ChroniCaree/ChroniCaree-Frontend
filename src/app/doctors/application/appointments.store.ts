/**
 * Appointments Store
 * Doctors Bounded Context - Application Layer
 * 
 * Store signal-based para gestionar citas del doctor
 */
import { Injectable, signal, computed, inject } from '@angular/core';
import { tap } from 'rxjs';
import { Appointment, AppointmentStatus } from '../domain/model/appointment.entity';
import { AppointmentApiEndpoint } from '../infrastructure/appointment-api.endpoint';

interface StoreState {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  loading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentsStore {
  private readonly apiEndpoint = inject(AppointmentApiEndpoint);
  
  private readonly state = signal<StoreState>({
    appointments: [],
    selectedAppointment: null,
    loading: false,
    error: null
  });
  
  // Selectores públicos
  readonly appointments = computed(() => this.state().appointments);
  readonly selectedAppointment = computed(() => this.state().selectedAppointment);
  readonly loading = computed(() => this.state().loading);
  readonly error = computed(() => this.state().error);
  
  // Computed: Citas por estado
  readonly scheduledAppointments = computed(() =>
    this.state().appointments.filter(a => a.status === AppointmentStatus.SCHEDULED)
  );
  
  readonly confirmedAppointments = computed(() =>
    this.state().appointments.filter(a => a.status === AppointmentStatus.CONFIRMED)
  );
  
  readonly completedAppointments = computed(() =>
    this.state().appointments.filter(a => a.status === AppointmentStatus.COMPLETED)
  );
  
  readonly cancelledAppointments = computed(() =>
    this.state().appointments.filter(a => a.status === AppointmentStatus.CANCELLED)
  );
  
  // Computed: Citas de hoy
  readonly todayAppointments = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.state().appointments.filter(a => a.date === today);
  });
  
  // Computed: Próximas citas
  readonly upcomingAppointments = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.state().appointments
      .filter(a => a.date >= today && a.status !== AppointmentStatus.CANCELLED)
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
  });
  
  // Computed: Conteos
  readonly totalAppointments = computed(() => this.state().appointments.length);
  readonly todayCount = computed(() => this.todayAppointments().length);
  readonly upcomingCount = computed(() => this.upcomingAppointments().length);
  
  /**
   * ⭐ Crea una nueva cita
   */
  async createAppointment(appointmentData: Omit<Appointment, 'id'>): Promise<Appointment> {
    this.setLoading(true);
    
    try {
      const created = await this.apiEndpoint.create(appointmentData).toPromise();
      
      if (created) {
        console.log(`✅ [AppointmentsStore] Nueva cita creada: ${created.id}`);
        this.state.update(s => ({
          ...s,
          appointments: [...s.appointments, created],
          loading: false,
          error: null
        }));
        
        return created;
      }
      
      throw new Error('No se pudo crear la cita');
    } catch (err) {
      console.error(`❌ [AppointmentsStore] Error creando cita:`, err);
      this.state.update(s => ({
        ...s,
        loading: false,
        error: 'Error al crear cita'
      }));
      throw err;
    }
  }

  /**
   * Carga citas de un doctor
   */
  loadAppointmentsByDoctor(doctorId: number): void {
    this.setLoading(true);
    
    this.apiEndpoint.getAppointmentsByDoctor(doctorId).subscribe({
      next: (appointments) => {
        console.log(`✅ [AppointmentsStore] ${appointments.length} citas cargadas para doctor ${doctorId}`);
        this.state.update(s => ({
          ...s,
          appointments,
          loading: false,
          error: null
        }));
      },
      error: (err) => {
        console.error(`❌ [AppointmentsStore] Error cargando citas:`, err);
        this.state.update(s => ({
          ...s,
          loading: false,
          error: 'Error al cargar citas'
        }));
      }
    });
  }

  /**
   * ⭐ Carga citas de un paciente
   */
  loadAppointmentsByPatient(patientId: number) {
    this.setLoading(true);
    
    return this.apiEndpoint.getAppointmentsByPatient(patientId).pipe(
      tap({
        next: (appointments: Appointment[]) => {
          console.log(`✅ [AppointmentsStore] ${appointments.length} citas cargadas para paciente ${patientId}`);
          this.state.update(s => ({
            ...s,
            appointments,
            loading: false,
            error: null
          }));
        },
        error: (err: any) => {
          console.error(`❌ [AppointmentsStore] Error cargando citas del paciente:`, err);
          this.state.update(s => ({
            ...s,
            loading: false,
            error: 'Error al cargar citas'
          }));
        }
      })
    );
  }
  
  /**
   * Actualiza el estado de una cita
   */
  updateAppointmentStatus(appointmentId: number, status: string): void {
    this.apiEndpoint.updateAppointmentStatus(appointmentId, status).subscribe({
      next: (updated) => {
        console.log(`✅ [AppointmentsStore] Cita ${appointmentId} actualizada a ${status}`);
        this.state.update(s => ({
          ...s,
          appointments: s.appointments.map(a => a.id === appointmentId ? updated : a)
        }));
      },
      error: (err) => {
        console.error(`❌ [AppointmentsStore] Error actualizando cita:`, err);
      }
    });
  }
  
  /**
   * Actualiza las notas de una cita
   */
  updateAppointmentNotes(appointmentId: number, notes: string): void {
    this.apiEndpoint.updateAppointmentNotes(appointmentId, notes).subscribe({
      next: (updated) => {
        console.log(`✅ [AppointmentsStore] Notas de cita ${appointmentId} actualizadas`);
        this.state.update(s => ({
          ...s,
          appointments: s.appointments.map(a => a.id === appointmentId ? updated : a)
        }));
      },
      error: (err) => {
        console.error(`❌ [AppointmentsStore] Error actualizando notas:`, err);
      }
    });
  }
  
  /**
   * Selecciona una cita
   */
  selectAppointment(appointmentId: number): void {
    const appointment = this.state().appointments.find(a => a.id === appointmentId);
    if (appointment) {
      this.state.update(s => ({ ...s, selectedAppointment: appointment }));
    }
  }
  
  /**
   * Limpia la cita seleccionada
   */
  clearSelectedAppointment(): void {
    this.state.update(s => ({ ...s, selectedAppointment: null }));
  }
  
  /**
   * Refresca las citas
   */
  refresh(doctorId: number): void {
    this.loadAppointmentsByDoctor(doctorId);
  }
  
  /**
   * Limpia el store
   */
  clear(): void {
    this.state.set({
      appointments: [],
      selectedAppointment: null,
      loading: false,
      error: null
    });
  }
  
  private setLoading(loading: boolean): void {
    this.state.update(s => ({ ...s, loading }));
  }
}
