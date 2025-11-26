import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { AppointmentsStore } from '../../../application/appointments.store';
import { UserStore } from '../../../../iam/application/user.store';
import { PatientStore } from '../../../../patients/application/patient.store';
import { AppointmentType, AppointmentStatus } from '../../../domain/model/appointment.entity';

/**
 * Appointment Scheduler Component
 * Permite al paciente agendar una cita con su doctor asignado
 */
@Component({
  standalone: true,
  selector: 'app-appointment-scheduler',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './appointment-scheduler.component.html',
  styleUrls: ['./appointment-scheduler.component.css']
})
export class AppointmentSchedulerComponent implements OnInit {
  private readonly appointmentsStore = inject(AppointmentsStore);
  private readonly userStore = inject(UserStore);
  private readonly patientStore = inject(PatientStore);
  private readonly router = inject(Router);

  // Form fields
  selectedDate = signal('');
  selectedTime = signal('');
  appointmentType = signal<string>(AppointmentType.CONSULTATION);
  notes = signal('');
  submitting = signal(false);

  // Tipos de cita – usamos claves de i18n para la etiqueta
  // Available appointment types (labels via i18n)
  readonly appointmentTypes = [
    { value: AppointmentType.CONSULTATION, labelKey: 'appointments.scheduler.types.consultation' },
    { value: AppointmentType.FOLLOW_UP,    labelKey: 'appointments.scheduler.types.followUp' },
    { value: AppointmentType.EMERGENCY,    labelKey: 'appointments.scheduler.types.emergency' },
    { value: AppointmentType.ROUTINE_CHECK,labelKey: 'appointments.scheduler.types.routine' },
    { value: AppointmentType.LAB_RESULTS,  labelKey: 'appointments.scheduler.types.labResults' }
  ];

  // Horarios disponibles (8am - 6pm)
  readonly timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00'
  ];

  // Validación
  canSubmit = computed(() =>
    this.selectedDate() &&
    this.selectedTime() &&
    this.appointmentType() &&
    !this.submitting()
  );

  // Fecha mínima (hoy)
  minDate = new Date().toISOString().split('T')[0];

  // Fecha máxima (3 meses desde hoy)
  maxDate = computed(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split('T')[0];
  });

  ngOnInit(): void {
    // Fecha por defecto: mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.selectedDate.set(tomorrow.toISOString().split('T')[0]);

    // Cargar paciente actual para obtener doctor asignado
    const currentUser = this.userStore.currentUser$();
    if (currentUser && currentUser.id) {
      this.patientStore.loadAllPatients().subscribe({
        next: (patients) => {
          const patient = patients.find(p => p.userId === currentUser.id);
          if (patient) {
            this.patientStore.loadPatientById(patient.id).subscribe();
          } else {
            console.warn(
              'AppointmentScheduler: no patient entry found for current user',
              currentUser.id
            );
          }
        },
        error: (err) => {
          console.error('AppointmentScheduler: error loading patients', err);
        }
      });
    }
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;

    const currentUser = this.userStore.currentUser$();
    if (!currentUser || !currentUser.id) {
      alert('Usuario no autenticado');
      return;
    }

    const currentPatient = this.patientStore.selectedPatient$();
    if (!currentPatient) {
      alert('Error: No se pudo cargar la información del paciente');
      return;
    }

    if (!currentPatient.assignedDoctorId) {
      alert('⚠️ No tienes un doctor asignado. Por favor contacta al administrador.');
      return;
    }

    const patientId = currentPatient.id;
    const assignedDoctorId = currentPatient.assignedDoctorId;

    console.log(`📅 Agendando cita: Paciente ${patientId} → Doctor ${assignedDoctorId}`);

    this.submitting.set(true);

    try {
      await this.appointmentsStore.createAppointment({
        patientId,
        doctorId: assignedDoctorId,
        date: this.selectedDate(),
        time: this.selectedTime(),
        type: this.appointmentType(),
        status: AppointmentStatus.SCHEDULED,
        notes: this.notes() || undefined
      });

      alert('¡Cita agendada exitosamente! Tu médico recibirá una notificación.');
      this.router.navigate(['/patient/dashboard']);
    } catch (error) {
      console.error('Error al agendar cita:', error);
      alert('Error al agendar la cita. Por favor intenta de nuevo.');
    } finally {
      this.submitting.set(false);
    }
  }

  cancel(): void {
    this.router.navigate(['/patient/dashboard']);
  }
}
