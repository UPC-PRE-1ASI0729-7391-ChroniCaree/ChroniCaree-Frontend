/**
 * Appointments List View
 * Doctors Bounded Context - Presentation Layer
 * 
 * Vista de lista de citas del doctor
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentsStore } from '../../../application/appointments.store';
import { AppointmentStatus } from '../../../domain/model/appointment.entity';
import { DoctorApiEndpoint } from '../../../infrastructure/doctor-api.endpoint';

@Component({
  selector: 'app-appointments-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appointments-list.html',
  styleUrl: './appointments-list.css'
})
export class AppointmentsListComponent implements OnInit {
  private readonly appointmentsStore = inject(AppointmentsStore);
  private readonly doctorApi = inject(DoctorApiEndpoint);
  
  readonly AppointmentStatus = AppointmentStatus;
  
  readonly appointments = this.appointmentsStore.appointments;
  readonly loading = this.appointmentsStore.loading;
  readonly error = this.appointmentsStore.error;
  
  readonly todayAppointments = this.appointmentsStore.todayAppointments;
  readonly upcomingAppointments = this.appointmentsStore.upcomingAppointments;
  readonly scheduledAppointments = this.appointmentsStore.scheduledAppointments;
  readonly completedAppointments = this.appointmentsStore.completedAppointments;
  
  readonly todayCount = this.appointmentsStore.todayCount;
  readonly upcomingCount = this.appointmentsStore.upcomingCount;
  readonly totalAppointments = this.appointmentsStore.totalAppointments;
  
  private readonly doctorId = signal<number | null>(null);
  readonly selectedTab = signal<'upcoming' | 'today' | 'all' | 'completed'>('upcoming');
  
  ngOnInit(): void {
    this.loadDoctorAndAppointments();
  }
  
  /**
   * Carga el doctor actual desde localStorage y sus citas
   */
  private loadDoctorAndAppointments(): void {
    const currentUserStr = localStorage.getItem('currentUser');
    
    if (!currentUserStr) {
      console.error('❌ No user found in localStorage');
      return;
    }
    
    const currentUser = JSON.parse(currentUserStr);
    const userId = currentUser.id;
    
    console.log(`🔍 Current user ID: ${userId}, looking for associated doctor...`);
    
    this.doctorApi.getAll().subscribe({
      next: (doctors) => {
        const doctor = doctors.find(d => d.userId === userId);
        
        if (doctor) {
          console.log(`✅ Doctor found: ID ${doctor.id}, Name: ${doctor.firstName} ${doctor.lastName}`);
          this.doctorId.set(doctor.id);
          this.appointmentsStore.loadAppointmentsByDoctor(doctor.id);
        } else {
          console.error(`❌ No doctor found for userId ${userId}`);
        }
      },
      error: (err) => {
        console.error('❌ Error fetching doctors:', err);
      }
    });
  }
  
  /**
   * Cambia la pestaña activa
   */
  setTab(tab: 'upcoming' | 'today' | 'all' | 'completed'): void {
    this.selectedTab.set(tab);
  }
  
  /**
   * Obtiene las citas filtradas según la pestaña activa
   */
  getFilteredAppointments() {
    switch (this.selectedTab()) {
      case 'today':
        return this.todayAppointments();
      case 'upcoming':
        return this.upcomingAppointments();
      case 'completed':
        return this.completedAppointments();
      case 'all':
      default:
        return this.appointments();
    }
  }
  
  /**
   * Actualiza el estado de una cita
   */
  updateStatus(appointmentId: number, status: string): void {
    this.appointmentsStore.updateAppointmentStatus(appointmentId, status);
  }
  
  /**
   * Formatea la fecha
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  /**
   * Formatea la hora
   */
  formatTime(timeString: string): string {
    return timeString;
  }
  
  /**
   * Obtiene la clase CSS del estado
   */
  getStatusClass(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return 'status-scheduled';
      case AppointmentStatus.CONFIRMED:
        return 'status-confirmed';
      case AppointmentStatus.IN_PROGRESS:
        return 'status-in-progress';
      case AppointmentStatus.COMPLETED:
        return 'status-completed';
      case AppointmentStatus.CANCELLED:
        return 'status-cancelled';
      case AppointmentStatus.NO_SHOW:
        return 'status-no-show';
      default:
        return '';
    }
  }
  
  /**
   * Obtiene el texto del estado
   */
  getStatusText(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.SCHEDULED:
        return '📅 Programada';
      case AppointmentStatus.CONFIRMED:
        return '✅ Confirmada';
      case AppointmentStatus.IN_PROGRESS:
        return '⏳ En Progreso';
      case AppointmentStatus.COMPLETED:
        return '✔️ Completada';
      case AppointmentStatus.CANCELLED:
        return '❌ Cancelada';
      case AppointmentStatus.NO_SHOW:
        return '🚫 No Asistió';
      default:
        return status;
    }
  }
  
  /**
   * Verifica si la cita es de hoy
   */
  isToday(dateString: string): boolean {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  }
  
  /**
   * Refresca la lista
   */
  refresh(): void {
    const currentDoctorId = this.doctorId();
    if (currentDoctorId) {
      this.appointmentsStore.refresh(currentDoctorId);
    }
  }
}
