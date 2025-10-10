/**
 * Patients List View
 * Doctors Bounded Context - Presentation Layer
 * 
 * Vista de lista de pacientes asignados al doctor
 */
import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AssignedPatientsStore } from '../../../application/assigned-patients.store';
import { PatientHealthStatus } from '../../../domain/model/patient-health-summary.entity';

@Component({
  selector: 'app-patients-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './patients-list.html',
  styleUrl: './patients-list.css'
})
export class PatientsListComponent implements OnInit {
  private readonly patientsStore = inject(AssignedPatientsStore);
  
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
  
  // Doctor ID from localStorage
  private getDoctorId(): number | null {
    const doctorStr = localStorage.getItem('doctor');
    if (doctorStr) {
      const doctor = JSON.parse(doctorStr);
      return doctor.id || null;
    }
    return null;
  }
  
  ngOnInit(): void {
    const doctorId = this.getDoctorId();
    if (doctorId) {
      console.log(`🔄 Loading patients for doctor ${doctorId}`);
      this.patientsStore.loadPatientsByDoctor(doctorId);
    } else {
      console.error('❌ No doctor ID found');
    }
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
    const doctorId = this.getDoctorId();
    if (doctorId) {
      this.patientsStore.refresh(doctorId);
    }
  }
}
