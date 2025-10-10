import { Component, inject, signal, OnInit, computed, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MedicationStore } from '../../../application/medication.store';
import { Medication, MedicationStatus } from '../../../domain/model/medication.entity';

@Component({
  selector: 'app-medication-log',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './medication-log.html',
  styleUrls: ['./medication-log.css']
})
export class MedicationLogComponent implements OnInit {
  private readonly medicationStore = inject(MedicationStore);
  private readonly snackBar = inject(MatSnackBar);

  // Input: Limit number of items to show (for dashboard preview)
  @Input() maxItems: number = 100; // Default show all

  // Expose store signals with limit
  todaySchedule = computed(() => {
    const schedule = this.medicationStore.todaySchedule();
    return this.maxItems ? schedule.slice(0, this.maxItems) : schedule;
  });
  
  loading = this.medicationStore.loading;
  adherenceStats = this.medicationStore.adherenceStats;
  medicationCount = this.medicationStore.medicationCount;

  // Local state
  processingMedId = signal<string | null>(null);

  ngOnInit(): void {
    // Data already loaded by dashboard or parent component
  }

  /**
   * Mark medication as taken
   */
  async markAsTaken(medication: Medication, time: string): Promise<void> {
    this.processingMedId.set(medication.id);

    const scheduledTime = this.parseScheduledTime(time);

    this.medicationStore.logMedicationTaken(medication.id, scheduledTime).subscribe({
      next: () => {
        this.snackBar.open('✅ Medicamento registrado como tomado', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.processingMedId.set(null);
      },
      error: (error) => {
        console.error('Error marking medication as taken:', error);
        this.snackBar.open('❌ Error al registrar medicamento', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.processingMedId.set(null);
      }
    });
  }

  /**
   * Mark medication as missed
   */
  async markAsMissed(medication: Medication, time: string): Promise<void> {
    this.processingMedId.set(medication.id);

    const scheduledTime = this.parseScheduledTime(time);

    this.medicationStore.logMedicationMissed(medication.id, scheduledTime, 'Omitido por el usuario').subscribe({
      next: () => {
        this.snackBar.open('📝 Medicamento marcado como omitido', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.processingMedId.set(null);
      },
      error: (error) => {
        console.error('Error marking medication as missed:', error);
        this.snackBar.open('❌ Error al marcar medicamento', 'Cerrar', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        this.processingMedId.set(null);
      }
    });
  }

  /**
   * Parse scheduled time string to Date
   */
  private parseScheduledTime(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Get medication type icon
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
   * Get adherence color
   */
  getAdherenceColor(rate: number): string {
    if (rate >= 90) return 'success';
    if (rate >= 70) return 'warn';
    return 'error';
  }

  /**
   * Check if time is past
   */
  isTimePast(time: string): boolean {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);
    return now > scheduled;
  }
}
