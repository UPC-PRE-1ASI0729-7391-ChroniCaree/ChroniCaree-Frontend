import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DiagnosisStore } from '../../../application/diagnosis.store';
import { Diagnosis, DiagnosisStatus, DiagnosisSeverity } from '../../../domain/model/diagnosis.entity';

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
  // Getters para signals del store
  get loading() { return this.diagnosisStore.loading$; }
  get diagnoses() { return this.diagnosisStore.diagnoses$; }
  get activeDiagnoses() { return this.diagnosisStore.activeDiagnoses; }
  get controlledDiagnoses() { return this.diagnosisStore.controlledDiagnoses; }
  get resolvedDiagnoses() { return this.diagnosisStore.resolvedDiagnoses; }

  // Filtro activo
  selectedFilter = signal<'all' | 'active' | 'controlled' | 'resolved'>('all');

  // Diagnósticos filtrados
  filteredDiagnoses = computed(() => {
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
  });

  // Estadísticas
  stats = computed(() => ({
    total: this.diagnoses().length,
    active: this.activeDiagnoses().length,
    controlled: this.controlledDiagnoses().length,
    resolved: this.resolvedDiagnoses().length
  }));

  constructor(
    private diagnosisStore: DiagnosisStore,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDiagnoses();
  }

  private loadDiagnoses(): void {
    this.diagnosisStore.loadAllDiagnoses().subscribe({
      error: (error) => {
        console.error('Error loading diagnoses:', error);
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
