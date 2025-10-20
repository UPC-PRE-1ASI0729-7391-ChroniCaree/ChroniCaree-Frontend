import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-scheduler.component.html',
  styleUrls: ['./appointment-scheduler.component.css']
})
export class AppointmentSchedulerComponent implements OnInit {
  private appointmentsStore = inject(AppointmentsStore);
  private userStore = inject(UserStore);
  private patientStore = inject(PatientStore);
  private router = inject(Router);

  // Form fields
  selectedDate = signal('');
  selectedTime = signal('');
  appointmentType = signal<string>(AppointmentType.CONSULTATION);
  notes = signal('');
  submitting = signal(false);

  // Available appointment types
  readonly appointmentTypes = [
    { value: AppointmentType.CONSULTATION, label: 'Consulta de control' },
    { value: AppointmentType.FOLLOW_UP, label: 'Seguimiento' },
    { value: AppointmentType.EMERGENCY, label: 'Emergencia' },
    { value: AppointmentType.ROUTINE_CHECK, label: 'Chequeo de rutina' },
    { value: AppointmentType.LAB_RESULTS, label: 'Resultados de laboratorio' }
  ];

  // Available time slots (8am - 6pm)
  readonly timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00'
  ];

  // Validation
  canSubmit = computed(() => 
    this.selectedDate() && 
    this.selectedTime() && 
    this.appointmentType() &&
    !this.submitting()
  );

  // Minimum date (today)
  minDate = new Date().toISOString().split('T')[0];
  
  // Maximum date (3 months from now)
  maxDate = computed(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 3);
    return date.toISOString().split('T')[0];
  });

  ngOnInit(): void {
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.selectedDate.set(tomorrow.toISOString().split('T')[0]);

    // Load current patient data to get assigned doctor
    // Note: users and patients are separate resources. We must find the patient
    // record whose `userId` matches the logged in user's id, then load that
    // patient by its `id`. Previously the code requested /patients/:userId
    // which produced 404 when patient.id !== user.id.
    const currentUser = this.userStore.currentUser$();
    if (currentUser && currentUser.id) {
      // Try to locate a patient that references this user
      this.patientStore.loadAllPatients().subscribe({
        next: (patients) => {
          const patient = patients.find(p => p.userId === currentUser.id);
          if (patient) {
            // Now load the patient by the patient.id so the API path is correct
            this.patientStore.loadPatientById(patient.id).subscribe();
          } else {
            console.warn('AppointmentScheduler: no patient entry found for current user', currentUser.id);
          }
        },
        error: (err) => {
          console.error('AppointmentScheduler: error loading patients', err);
        }
      });
    }
  }

  async submit() {
    if (!this.canSubmit()) return;

    const currentUser = this.userStore.currentUser$();
    if (!currentUser || !currentUser.id) {
      alert('Usuario no autenticado');
      return;
    }

    // Get patient info to find assigned doctor
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
      this.router.navigate(['/patient/citas']);
    } catch (error) {
      console.error('Error al agendar cita:', error);
      alert('Error al agendar la cita. Por favor intenta de nuevo.');
    } finally {
      this.submitting.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/patient/dashboard']);
  }
}
