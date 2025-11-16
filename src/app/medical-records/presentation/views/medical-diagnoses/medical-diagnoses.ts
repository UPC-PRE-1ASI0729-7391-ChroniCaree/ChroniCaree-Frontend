import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DiagnosisStore } from '../../../application/diagnosis.store';
import { MedicalRecordsStore } from '../../../../doctors/application/medical-records.store';
import { Diagnosis, DiagnosisStatus, DiagnosisSeverity } from '../../../domain/model/diagnosis.entity';
import { RecordType } from '../../../../doctors/domain/model/medical-record.entity';
import { PatientStore } from '../../../../patients/application/patient.store';

/**
 * Medical Diagnoses View - US21: Gestión de diagnósticos médicos
 */
@Component({
  selector: 'app-medical-diagnoses',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './medical-diagnoses.html',
  styleUrl: './medical-diagnoses.css'
})
export class MedicalDiagnosesComponent implements OnInit {
  private readonly diagnosisStore = inject(DiagnosisStore);
  private readonly medicalRecordsStore = inject(MedicalRecordsStore);
  private readonly patientStore = inject(PatientStore);
  private readonly router = inject(Router);

  // Getters para signals del store
  get loading() { return this.diagnosisStore.loading$; }
  get diagnoses() { return this.diagnosisStore.diagnoses$; }
  get activeDiagnoses() { return this.diagnosisStore.activeDiagnoses; }
  get controlledDiagnoses() { return this.diagnosisStore.controlledDiagnoses; }
  get resolvedDiagnoses() { return this.diagnosisStore.resolvedDiagnoses; }

  // Filtro activo
  selectedFilter = signal<'all' | 'active' | 'controlled' | 'resolved'>('all');

  // Diagnósticos filtrados (ahora por paciente actual)
  filteredDiagnoses = computed(() => {
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) return [];

    const currentUser = JSON.parse(currentUserStr);
    const currentPatient = this.patientStore.patients$().find(p => p.userId === currentUser.id);
    if (!currentPatient) return [];

    // When filter is 'all' include both diagnoses and symptom records mapped to a diagnosis-like shape
    if (this.selectedFilter() === 'all') {
      // Map medical records (symptoms) into a lightweight diagnosis-shaped object
      const records = this.medicalRecordsStore.records().filter(r => r.patientId === currentPatient.id);
      const mappedRecords = records.map((r) => ({
        id: -(r.id || Math.floor(Math.random() * 1000000)), // negative id to avoid clashes
        patientId: r.patientId,
        diagnosisName: r.type === undefined ? 'Registro Médico' : (r.type === RecordType.SYMPTOMS ? 'Registro de Síntomas' : 'Registro Médico'),
        icd10Code: '',
        diagnosedDate: (r as any).date || new Date().toISOString(),
        severity: DiagnosisSeverity.LOW,
        status: DiagnosisStatus.MONITORING,
        notes: (r as any).notes || undefined,
        isFromMedicalRecord: true
      } as unknown as Diagnosis));

      const diagnoses = this.diagnoses().filter(d => d.patientId === currentPatient.id);
      return [...mappedRecords, ...diagnoses];
    }

    // For other filters, only return diagnoses (keep existing behavior)
    const diagnoses = (() => {
      switch (this.selectedFilter()) {
        case 'active':
          return this.activeDiagnoses();
        case 'controlled':
          return this.controlledDiagnoses();
        case 'resolved':
          return this.resolvedDiagnoses();
        default:
          return this.diagnoses();
      }
    })();

    return diagnoses.filter(d => d.patientId === currentPatient.id);
  });

  // Estadísticas (ahora filtradas por paciente actual)
  stats = computed(() => {
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) return { total: 0, active: 0, controlled: 0, resolved: 0 };

    const currentUser = JSON.parse(currentUserStr);
    const currentPatient = this.patientStore.patients$().find(p => p.userId === currentUser.id);
    
    if (!currentPatient) return { total: 0, active: 0, controlled: 0, resolved: 0 };

    // Include medical records count in the total so the patient sees symptom entries as part of history
    const patientDiagnoses = this.diagnoses().filter(d => d.patientId === currentPatient.id);
    const patientRecords = this.medicalRecordsStore.records().filter(r => r.patientId === currentPatient.id);
    const active = this.activeDiagnoses().filter(d => d.patientId === currentPatient.id);
    const controlled = this.controlledDiagnoses().filter(d => d.patientId === currentPatient.id);
    const resolved = this.resolvedDiagnoses().filter(d => d.patientId === currentPatient.id);

    return {
      total: patientDiagnoses.length + patientRecords.length,
      active: active.length,
      controlled: controlled.length,
      resolved: resolved.length
    };
  });

  ngOnInit(): void {
    // Verificar autenticación
    const currentUserStr = localStorage.getItem('currentUser');
    const isAuthenticated = localStorage.getItem('isAuthenticated');

    if (!currentUserStr || isAuthenticated !== 'true') {
      console.error('❌ Medical-Diagnoses: Usuario no autenticado');
      this.router.navigate(['/iam/login']);
      return;
    }

    const currentUser = JSON.parse(currentUserStr);
    const userId = currentUser.id;

    console.log(`🔍 Medical-Diagnoses: Usuario actual ID: ${userId}`);

    // Primero cargar pacientes para obtener el patientId
    this.patientStore.loadAllPatients().subscribe({
      next: (patients) => {
        const patient = patients.find(p => p.userId === userId);

        if (patient) {
          console.log(`✅ Medical-Diagnoses: Paciente encontrado: ${patient.firstName} ${patient.lastName}, ID: ${patient.id}`);
          
          // Cargar diagnósticos (se filtrarán en el computed)
          this.diagnosisStore.loadAllDiagnoses().subscribe({
            next: () => console.log('✅ Diagnósticos cargados (se filtrarán por paciente)'),
            error: (error) => console.error('❌ Error loading diagnoses:', error)
          });

          // Cargar registros médicos del paciente (p. ej., registros de síntomas)
          this.medicalRecordsStore.loadRecordsByPatient(patient.id);
        } else {
          console.error(`❌ Medical-Diagnoses: No se encontró paciente para userId ${userId}`);
        }
      },
      error: (err) => {
        console.error('❌ Medical-Diagnoses: Error cargando pacientes:', err);
      }
    });
  }

  setFilter(filter: 'all' | 'active' | 'controlled' | 'resolved'): void {
    this.selectedFilter.set(filter);
  }

  viewDiagnosisDetails(diagnosis: Diagnosis): void {
    // Navigate to diagnosis details (to be implemented)
    console.log('View diagnosis details:', diagnosis);
  }

  getStatusLabel(status: DiagnosisStatus): string {
    const labels: Record<DiagnosisStatus, string> = {
      [DiagnosisStatus.ACTIVE]: 'Activo',
      [DiagnosisStatus.CONTROLLED]: 'Controlado',
      [DiagnosisStatus.RESOLVED]: 'Resuelto',
      [DiagnosisStatus.MONITORING]: 'En Monitoreo'
    };
    return labels[status] || status;
  }

  getStatusColor(status: DiagnosisStatus): string {
    const colors: Record<DiagnosisStatus, string> = {
      [DiagnosisStatus.ACTIVE]: 'status-active',
      [DiagnosisStatus.CONTROLLED]: 'status-controlled',
      [DiagnosisStatus.RESOLVED]: 'status-resolved',
      [DiagnosisStatus.MONITORING]: 'status-monitoring'
    };
    return colors[status] || '';
  }

  getSeverityLabel(severity: DiagnosisSeverity): string {
    const labels: Record<DiagnosisSeverity, string> = {
      [DiagnosisSeverity.LOW]: 'Leve',
      [DiagnosisSeverity.MODERATE]: 'Moderado',
      [DiagnosisSeverity.HIGH]: 'Alto',
      [DiagnosisSeverity.CRITICAL]: 'Crítico'
    };
    return labels[severity] || severity;
  }

  getSeverityColor(severity: DiagnosisSeverity): string {
    const colors: Record<DiagnosisSeverity, string> = {
      [DiagnosisSeverity.LOW]: 'severity-low',
      [DiagnosisSeverity.MODERATE]: 'severity-moderate',
      [DiagnosisSeverity.HIGH]: 'severity-high',
      [DiagnosisSeverity.CRITICAL]: 'severity-critical'
    };
    return colors[severity] || '';
  }

  getSeverityIcon(severity: DiagnosisSeverity): string {
    const icons: Record<DiagnosisSeverity, string> = {
      [DiagnosisSeverity.LOW]: 'info',
      [DiagnosisSeverity.MODERATE]: 'warning',
      [DiagnosisSeverity.HIGH]: 'error',
      [DiagnosisSeverity.CRITICAL]: 'dangerous'
    };
    return icons[severity] || 'info';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  getDaysSinceDiagnosis(dateString: string): number {
    const diagnosedDate = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - diagnosedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  goBack(): void {
    this.router.navigate(['/patient/dashboard']);
  }
}
