/**
 * Medication Reminder Facade
 * Coordinates medication reminders with communication bounded context (nudges)
 * Pattern: Facade - Simplifies interaction between bounded contexts
 * US05: Recordatorios de medicación
 */

import { Injectable, inject, computed } from '@angular/core';
import { MedicationStore } from '../application/medication.store';
import { Medication } from '../domain/model/medication.entity';
import { Nudge, NudgeType, NudgePriority } from '../../communication/domain/model/nudge.entity';

@Injectable({
  providedIn: 'root'
})
export class MedicationReminderFacade {
  private readonly medicationStore = inject(MedicationStore);

  /**
   * Generate medication reminder nudges
   * Creates reminders for upcoming doses (within next 30 minutes)
   */
  readonly reminders = computed(() => {
    const medications = this.medicationStore.activeMedications();
    const patientId = 1; // TODO: Get from auth context
    return this.generateReminders(medications, patientId);
  });

  /**
   * Get overdue medications count
   */
  readonly overdueCount = computed(() => {
    const medications = this.medicationStore.activeMedications();
    return this.calculateOverdueCount(medications);
  });

  /**
   * Get upcoming medications (next 2 hours)
   */
  readonly upcoming = computed(() => {
    const medications = this.medicationStore.activeMedications();
    return this.getUpcoming(medications);
  });

  /**
   * Generate reminders from medications
   */
  private generateReminders(medications: Medication[], patientId: number): Nudge[] {
    const reminders: Nudge[] = [];
    const now = new Date();
    const thirtyMinutesLater = new Date(now.getTime() + 30 * 60 * 1000);

    medications.forEach(medication => {
      medication.schedule.times.forEach((time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);

        // Check if this dose is due within the next 30 minutes
        if (scheduledTime >= now && scheduledTime <= thirtyMinutesLater) {
          const alreadyTaken = this.isTakenToday(medication, hours);

          if (!alreadyTaken) {
            reminders.push(this.createReminderNudge(medication, time, patientId));
          }
        }
      });
    });

    return reminders;
  }

  /**
   * Calculate overdue medications count
   */
  private calculateOverdueCount(medications: Medication[]): number {
    let count = 0;
    const now = new Date();

    medications.forEach(medication => {
      medication.schedule.times.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);

        const alreadyTaken = this.isTakenToday(medication, hours);

        if (!alreadyTaken && now > scheduledTime) {
          count++;
        }
      });
    });

    return count;
  }

  /**
   * Get upcoming medications (next 2 hours)
   */
  private getUpcoming(medications: Medication[]): Array<{medication: Medication, time: string}> {
    const upcoming: Array<{medication: Medication, time: string}> = [];
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    medications.forEach(medication => {
      medication.schedule.times.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);

        if (scheduledTime >= now && scheduledTime <= twoHoursLater) {
          const alreadyTaken = this.isTakenToday(medication, hours);

          if (!alreadyTaken) {
            upcoming.push({ medication, time });
          }
        }
      });
    });

    return upcoming.sort((a, b) => a.time.localeCompare(b.time));
  }

  /**
   * Check if medication was taken today at specified hour
   */
  private isTakenToday(medication: Medication, hour: number): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return medication.logs.some(log => {
      const logDate = new Date(log.scheduledTime);
      return (
        logDate.toDateString() === today.toDateString() &&
        logDate.getHours() === hour &&
        log.status === 'taken'
      );
    });
  }

  /**
   * Create a reminder nudge for a specific medication dose
   */
  private createReminderNudge(medication: Medication, time: string, patientId: number): Nudge {
    const timeFormatted = this.formatTime(time);
    
    return {
      id: this.generateNudgeId(medication.id, time),
      patientId,
      type: NudgeType.MEDICATION_REMINDER,
      priority: NudgePriority.URGENT,
      title: '💊 ¡Hora de tu medicamento!',
      message: `Es hora de tomar ${medication.name} (${medication.dosage}) a las ${timeFormatted}`,
      actionLabel: 'Registrar toma',
      actionRoute: '/patient/dashboard',
      icon: 'medication',
      isDismissed: false,
      isSnoozed: false,
      snoozeUntil: undefined,
      createdAt: new Date().toISOString(),
      dismissedAt: undefined
    };
  }

  /**
   * Generate unique nudge ID based on medication and time
   */
  private generateNudgeId(medicationId: string, time: string): number {
    const hash = `${medicationId}_${time}_${new Date().toDateString()}`;
    return Math.abs(hash.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0));
  }

  /**
   * Format time string to human-readable format
   */
  private formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }
}
