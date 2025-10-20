
import { Component, OnInit, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { PdfExportResponse } from '../../../../shared/infrastructure/pdf-export.response';
import {OnboardingComponent} from '../../../../shared/presentation/components/onboarding/onboarding';
import { UserStore } from '../../../../iam/application/user.store';
import { DoctorStore } from '../../../application/doctor.store';
import { AppointmentsStore } from '../../../application/appointments.store';
import { AssignedPatientsStore } from '../../../application/assigned-patients.store';
import { MedicalRecordsStore } from '../../../application/medical-records.store';
import { AlertStore } from '../../../../alerts/application/alert.store';
import { ReviewStatus } from '../../../domain/model/medical-record.entity';

@Component({
  selector: 'app-dashboard-doctor',
  standalone: true,
  imports: [CommonModule, RouterLink,OnboardingComponent, MatCardModule, MatButtonToggleModule, TranslateModule],
  templateUrl: './dashboard-doctor.html',
  styleUrl: './dashboard-doctor.css'
})
export class DashboardDoctor implements OnInit {

  // --- Referencia al área que se exportará ---
  @ViewChild('printArea', { static: false }) printArea!: ElementRef<HTMLElement>;

  // --- Estado de exportación ---
  protected readonly exporting = signal(false);

  // User data
  protected get currentUser() { return this.userStore.currentUser$; }
  protected get currentDoctor() { return this.doctorStore.selectedDoctor$; }
  protected get loading() { return this.doctorStore.loading$; }

  // --- Datos computados del doctor ---
  protected readonly doctorName = computed(() => {
    const doctor = this.currentDoctor();
    return doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Doctor';
  });

  protected readonly specialty = computed(() => {
    const doctor = this.currentDoctor();
    return doctor?.specialty || 'Medicina General';
  });

  // Citas de hoy (filtradas por doctorId y fecha actual)
  protected readonly todayAppointments = computed(() => {
    const doctor = this.currentDoctor();
    if (!doctor) return 0;

    const today = new Date().toISOString().split('T')[0];
    const allAppointments = this.appointmentsStore.upcomingAppointments();
    
    return allAppointments.filter(apt => 
      apt.doctorId === doctor.id && 
      apt.date.startsWith(today)
    ).length;
  });

  // Revisiones pendientes (historiales con reviewStatus = PENDING_REVIEW)
  protected readonly pendingReviews = computed(() => {
    const doctor = this.currentDoctor();
    if (!doctor) return 0;

    const allRecords = this.medicalRecordsStore.records();
    return allRecords.filter(record => 
      record.doctorId === doctor.id && 
      record.reviewStatus === ReviewStatus.PENDING_REVIEW
    ).length;
  });

  // Pacientes activos (asignados a este doctor)
  protected readonly activePatients = computed(() => {
    const patients = this.assignedPatientsStore.patients();
    return patients.length;
  });

  // Próximas citas del día (top 4)
  protected readonly upcomingAppointments = computed(() => {
    const doctor = this.currentDoctor();
    if (!doctor) return [];

    const today = new Date().toISOString().split('T')[0];
    const allAppointments = this.appointmentsStore.upcomingAppointments();
    
    return allAppointments
      .filter(apt => 
        apt.doctorId === doctor.id && 
        apt.date.startsWith(today)
      )
      .slice(0, 4)
      .map(apt => {
        const patient = this.assignedPatientsStore.patients().find(p => p.id === apt.patientId);
        return {
          id: apt.id,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente',
          time: apt.time,
          type: apt.type,
          status: apt.status
        };
      });
  });

  // Alertas críticas (de pacientes asignados)
  protected readonly criticalAlerts = computed(() => {
    const doctor = this.currentDoctor();
    if (!doctor) return [];

    const allAlerts = this.alertStore.criticalAlerts();
    const patientIds = this.assignedPatientsStore.patients().map(p => p.id.toString());
    
    return allAlerts
      .filter(alert => patientIds.includes(alert.patientId))
      .slice(0, 3)
      .map(alert => {
        const patient = this.assignedPatientsStore.patients().find(p => p.id.toString() === alert.patientId);
        return {
          id: alert.id,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente',
          condition: alert.title,
          severity: alert.severity,
          time: this.formatTime(alert.createdAt)
        };
      });
  });

  // Historiales pendientes de revisión (top 5)
  protected readonly pendingRecords = computed(() => {
    const doctor = this.currentDoctor();
    if (!doctor) return [];

    const allRecords = this.medicalRecordsStore.records();
    
    return allRecords
      .filter(record => 
        record.doctorId === doctor.id && 
        record.reviewStatus === ReviewStatus.PENDING_REVIEW
      )
      .slice(0, 5)
      .map(record => {
        const patient = this.assignedPatientsStore.patients().find(p => p.id === record.patientId);
        return {
          id: record.id,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente',
          date: this.formatDate(record.date),
          type: record.type
        };
      });
  });

  // Estadísticas semanales
  protected readonly weeklyStats = computed(() => {
    const doctor = this.currentDoctor();
    if (!doctor) return {
      consultations: 0,
      newPatients: 0,
      avgDuration: '0h'
    };

    const allAppointments = this.appointmentsStore.upcomingAppointments();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weekAppointments = allAppointments.filter(apt => 
      apt.doctorId === doctor.id && 
      new Date(apt.date) >= oneWeekAgo
    );

    return {
      consultations: weekAppointments.filter(apt => apt.status === 'completed').length,
      newPatients: 0, // TODO: implementar cuando PatientHealthSummary tenga createdAt
      avgDuration: '4.5h' // TODO: calcular desde datos reales si disponible
    };
  });

  constructor(
    private router: Router,
    private userStore: UserStore,
    private doctorStore: DoctorStore,
    private appointmentsStore: AppointmentsStore,
    private assignedPatientsStore: AssignedPatientsStore,
    private medicalRecordsStore: MedicalRecordsStore,
    private alertStore: AlertStore
  ) {}

  ngOnInit(): void {
    console.log('Dashboard Doctor inicializado');

    // Verificar autenticación

    let user = this.currentUser();
    
    if (!user) {
      // Fallback: intentar cargar desde localStorage
      const currentUserStr = localStorage.getItem('currentUser');
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      
      if (currentUserStr && isAuthenticated === 'true') {
        try {
          const parsedUser = JSON.parse(currentUserStr);
          user = parsedUser;
          this.userStore.setCurrentUser(parsedUser);
          console.log('✅ Dashboard-Doctor: Usuario cargado desde localStorage:', parsedUser.email);
        } catch (error) {
          console.error('❌ Dashboard-Doctor: Error parsing currentUser:', error);
          this.router.navigate(['/iam/login']);
          return;
        }
      } else {
        console.warn('⚠️ Dashboard-Doctor: No hay usuario autenticado');
        this.router.navigate(['/iam/login']);
        return;
      }
    }
    
    // Cargar datos del doctor autenticado
    if (user) {
      this.loadDoctorData(user.id);
    }
  }

  /**
   * Carga todos los datos del doctor
   */
  private loadDoctorData(userId: number): void {
    // Cargar datos del doctor
    this.doctorStore.loadAllDoctors().subscribe({
      next: (doctors) => {
        const doctor = doctors.find(d => d.userId === userId);
        if (doctor) {
          console.log('✅ Dashboard-Doctor: Doctor encontrado:', doctor.firstName, doctor.lastName, 'ID:', doctor.id);
          this.doctorStore.loadDoctorById(doctor.id).subscribe();
          
          // Cargar pacientes asignados
          this.assignedPatientsStore.loadPatientsByDoctor(doctor.id);
          
          // Cargar citas del doctor
          this.appointmentsStore.loadAppointmentsByDoctor(doctor.id);
          
          // Cargar historiales médicos del doctor
          this.medicalRecordsStore.loadRecordsByDoctor(doctor.id);
          
          // Cargar alertas de todos los pacientes asignados (después de cargar pacientes)
          setTimeout(() => {
            this.assignedPatientsStore.patients().forEach(patient => {
              this.alertStore.loadAlertsByPatient(patient.id.toString()).subscribe();
            });
          }, 500);
        } else {
          console.warn('⚠️ Dashboard-Doctor: No se encontró doctor para userId:', userId);
        }
      }
    });
  }

  /**
   * Formatea fecha
   */
  private formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }
    
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  }

  /**
   * Formatea hora
   */
  private formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  // --- Acción: exportar PDF del dashboard ---
  async onExportPdf(): Promise<void> {
    if (!this.printArea) return;
    this.exporting.set(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await PdfExportResponse.exportElementToPdf(this.printArea.nativeElement, {
        filename: `dashboard-doctor-${today}.pdf`,
        margin: 8,
        scale: 2
      });
    } finally {
      this.exporting.set(false);
    }
  }
}
