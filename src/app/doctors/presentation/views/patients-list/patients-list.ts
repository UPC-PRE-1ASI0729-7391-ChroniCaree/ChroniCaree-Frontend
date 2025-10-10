/**
 * Patients List View
 * Doctors Bounded Context - Presentation Layer
 * 
 * Vista de lista de pacientes asignados al doctor
 */
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AssignedPatientsStore } from '../../../application/assigned-patients.store';
import { PatientHealthStatus } from '../../../domain/model/patient-health-summary.entity';
import { DoctorApiEndpoint } from '../../../infrastructure/doctor-api.endpoint';
import { RequestPatientModalComponent } from '../../components/request-patient-modal/request-patient-modal';

@Component({
  selector: 'app-patients-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RequestPatientModalComponent],
  templateUrl: './patients-list.html',
  styleUrl: './patients-list.css'
})
export class PatientsListComponent implements OnInit {
  private readonly patientsStore = inject(AssignedPatientsStore);
  private readonly doctorApi = inject(DoctorApiEndpoint);
  
  // Exponer el enum para el template
  readonly PatientHealthStatus = PatientHealthStatus;
  
  // Signals del store
  readonly patients = this.patientsStore.patients;
  readonly loading = this.patientsStore.loading;
  readonly error = this.patientsStore.error;
  
  // Stats computados
  readonly totalPatients = this.patientsStore.totalPatients;
  readonly criticalCount = this.patientsStore.criticalCount;
  readonly atRiskCount = this.patientsStore.atRiskCount;
  readonly totalCriticalAlerts = this.patientsStore.totalCriticalAlerts;
  
  // Doctor ID signal (lo obtenemos del API)
  private readonly doctorId = signal<number | null>(null);
  
  // Modal state
  readonly showModal = signal(false);
  
  ngOnInit(): void {
    // Obtener el usuario actual del localStorage
    const currentUserStr = localStorage.getItem('currentUser');
    
    if (!currentUserStr) {
      console.error('❌ No user found in localStorage');
      return;
    }
    
    const currentUser = JSON.parse(currentUserStr);
    const userId = currentUser.id;
    
    console.log(`🔍 Current user ID: ${userId}, looking for associated doctor...`);
    
    // Buscar el doctor asociado a este userId
    this.doctorApi.getAll().subscribe({
      next: (doctors) => {
        const doctor = doctors.find(d => d.userId === userId);
        
        if (doctor) {
          console.log(`✅ Doctor found: ID ${doctor.id}, Name: ${doctor.firstName} ${doctor.lastName}`);
          this.doctorId.set(doctor.id);
          this.patientsStore.loadPatientsByDoctor(doctor.id);
        } else {
          console.error(`❌ No doctor found for userId ${userId}`);
        }
      },
      error: (err) => {
        console.error('❌ Error fetching doctors:', err);
      }
    });
    
    // Listen for patient assignment events
    window.addEventListener('patient-assigned', () => {
      const currentDoctorId = this.doctorId();
      if (currentDoctorId) {
        this.patientsStore.refresh(currentDoctorId);
      }
    });
    
    // Listen for modal close events
    window.addEventListener('close-modal', () => {
      this.showModal.set(false);
    });
  }
  
  /**
   * Abre el modal de solicitud de paciente
   */
  openRequestModal(): void {
    this.showModal.set(true);
  }
  
  /**
   * Obtiene la clase CSS según el estado de salud
   */
  getHealthStatusClass(status: PatientHealthStatus): string {
    switch (status) {
      case PatientHealthStatus.CRITICAL:
        return 'status-critical';
      case PatientHealthStatus.AT_RISK:
        return 'status-at-risk';
      case PatientHealthStatus.CONTROLLED:
        return 'status-controlled';
      case PatientHealthStatus.STABLE:
        return 'status-stable';
      default:
        return '';
    }
  }
  
  /**
   * Obtiene el texto del badge según el estado
   */
  getHealthStatusText(status: PatientHealthStatus): string {
    switch (status) {
      case PatientHealthStatus.CRITICAL:
        return '🔴 Crítico';
      case PatientHealthStatus.AT_RISK:
        return '🟡 En Riesgo';
      case PatientHealthStatus.CONTROLLED:
        return '🔵 Controlado';
      case PatientHealthStatus.STABLE:
        return '🟢 Estable';
      default:
        return '';
    }
  }
  
  /**
   * Formatea la fecha
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  /**
   * Calcula la edad del paciente
   */
  calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
  
  /**
   * Refresca la lista de pacientes
   */
  refresh(): void {
    const currentDoctorId = this.doctorId();
    if (currentDoctorId) {
      this.patientsStore.refresh(currentDoctorId);
    }
  }
}
