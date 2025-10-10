import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MedicationStore } from '../../../application/medication.store';
import { Medication, MedicationStatus } from '../../../domain/model/medication.entity';

@Component({
  selector: 'app-medication-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    MatTabsModule
  ],
  templateUrl: './medication-history.html',
  styleUrls: ['./medication-history.css']
})
export class MedicationHistoryComponent implements OnInit {
  private readonly medicationStore = inject(MedicationStore);

  // Expose store signals
  medications = this.medicationStore.medications;
  activeMedications = this.medicationStore.activeMedications;
  loading = this.medicationStore.loading;
  adherenceStats = this.medicationStore.adherenceStats;

  // Local state
  selectedTab = signal(0);

  ngOnInit(): void {
    // Load medications if not already loaded
    const patientId = localStorage.getItem('currentPatientId') || 'patient_1';
    if (this.medications().length === 0) {
      this.medicationStore.loadMedicationsByPatient(patientId).subscribe();
    }
  }

  /**
   * Get medication status color
   */
  getStatusColor(status: MedicationStatus): 'primary' | 'accent' | 'warn' | undefined {
    const colors: Record<MedicationStatus, 'primary' | 'accent' | 'warn' | undefined> = {
      [MedicationStatus.ACTIVE]: 'primary',
      [MedicationStatus.TAKEN]: 'accent',
      [MedicationStatus.SCHEDULED]: 'primary',
      [MedicationStatus.MISSED]: 'warn',
      [MedicationStatus.DISCONTINUED]: undefined
    };
    return colors[status];
  }

  /**
   * Get medication status label
   */
  getStatusLabel(status: MedicationStatus): string {
    const labels: Record<MedicationStatus, string> = {
      [MedicationStatus.ACTIVE]: 'Activo',
      [MedicationStatus.TAKEN]: 'Tomado',
      [MedicationStatus.SCHEDULED]: 'Programado',
      [MedicationStatus.MISSED]: 'Omitido',
      [MedicationStatus.DISCONTINUED]: 'Descontinuado'
    };
    return labels[status];
  }

  /**
   * Format date
   */
  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  }

  /**
   * Format time
   */
  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  /**
   * Get adherence color class
   */
  getAdherenceColorClass(rate: number): string {
    if (rate >= 90) return 'excellent';
    if (rate >= 70) return 'good';
    if (rate >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Get medication icon
   */
  getMedicationIcon(medication: Medication): string {
    const icons: Record<string, string> = {
      pill: 'medication',
      capsule: 'medication',
      liquid: 'water_drop',
      injection: 'vaccines',
      inhaler: 'air',
      cream: 'healing',
      drops: 'water_drop',
      patch: 'healing'
    };
    return icons[medication.type] || 'medication';
  }

  /**
   * View medication details
   */
  viewDetails(medication: Medication): void {
    console.log('View details for:', medication);
    // TODO: Open dialog with medication details
  }
}
