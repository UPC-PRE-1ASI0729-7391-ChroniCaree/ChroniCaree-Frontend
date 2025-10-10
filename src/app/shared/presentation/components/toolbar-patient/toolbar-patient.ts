import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { UserStore } from '../../../../iam/application/user.store';
import { NudgeStore } from '../../../../communication/application/nudge.store';
import { MedicationReminderFacade } from '../../../../medications/infrastructure/medication-reminder.facade';

@Component({
  selector: 'app-toolbar-patient',
  standalone: true,
  imports: [CommonModule, RouterLink, MatBadgeModule],
  templateUrl: './toolbar-patient.html',
  styleUrls: ['./toolbar-patient.css']
})
export class ToolbarPatientComponent implements OnInit {
  // Total nudges count (from NudgeStore + MedicationFacade)
  readonly totalNotifications = computed(() => {
    const nudgesCount = this.nudgeStore.activeCount();
    const medicationReminders = this.medicationFacade.overdueCount();
    return nudgesCount + medicationReminders;
  });

  get activeNudgesCount() {
    return this.nudgeStore.activeCount;
  }

  constructor(
    private router: Router,
    public userStore: UserStore,
    private nudgeStore: NudgeStore,
    private medicationFacade: MedicationReminderFacade
  ) {}

  ngOnInit(): void {
    // Cargar nudges al iniciar
    this.nudgeStore.loadAllNudges().subscribe();
  }

  get currentUser() {
    return this.userStore.currentUser$();
  }

  logout(): void {
    // Clear localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userRole');
    
    // Clear user store
    this.userStore.setCurrentUser(null);
    
    // Navigate to login
    this.router.navigate(['/iam/login']);
  }
}
