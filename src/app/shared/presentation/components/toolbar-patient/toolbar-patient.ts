import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { UserStore } from '../../../../iam/application/user.store';
import { NudgeStore } from '../../../../communication/application/nudge.store';
import { MedicationReminderFacade } from '../../../../medications/infrastructure/medication-reminder.facade';
import { PatientStore } from '../../../../patients/application/patient.store';
import { MessagesStore } from '../../../../communication/application/messages.store';

@Component({
  selector: 'app-toolbar-patient',
  standalone: true,
  imports: [CommonModule, RouterLink, MatBadgeModule],
  templateUrl: './toolbar-patient.html',
  styleUrls: ['./toolbar-patient.css']
})
export class ToolbarPatientComponent implements OnInit {
  private readonly router = inject(Router);
  public readonly userStore = inject(UserStore);
  private readonly nudgeStore = inject(NudgeStore);
  private readonly medicationFacade = inject(MedicationReminderFacade);
  private readonly patientStore = inject(PatientStore);
  readonly messagesStore = inject(MessagesStore);

  // Total nudges count (from NudgeStore + MedicationFacade)
  readonly totalNotifications = computed(() => {
    const nudgesCount = this.nudgeStore.activeCount();
    const medicationReminders = this.medicationFacade.overdueCount();
    return nudgesCount + medicationReminders;
  });

  get activeNudgesCount() {
    return this.nudgeStore.activeCount;
  }

  ngOnInit(): void {
    // ✅ Cargar nudges y mensajes filtrados por paciente actual
    const currentUser = this.userStore.currentUser$();
    if (!currentUser || !currentUser.id) {
      console.error('❌ Toolbar-Patient: Usuario no autenticado');
      return;
    }

    // Buscar el paciente asociado al usuario actual
    this.patientStore.loadAllPatients().subscribe({
      next: (patients) => {
        const patient = patients.find(p => p.userId === currentUser.id);

        if (patient) {
          console.log(`✅ Toolbar-Patient: Cargando datos para paciente ${patient.id}`);
          
          // ✅ Cargar nudges usando el patientId
          this.nudgeStore.loadNudgesByPatient(patient.id.toString()).subscribe({
            next: () => console.log('✅ Nudges cargados para toolbar'),
            error: (err) => console.error('❌ Error cargando nudges:', err)
          });

          // ⭐ Cargar mensajes del paciente
          console.log(`✅ Toolbar-Patient: Cargando mensajes para paciente ID: ${patient.id}`);
          this.messagesStore.loadInbox('PATIENT', patient.id.toString());
        } else {
          console.error(`❌ Toolbar-Patient: No se encontró paciente para userId ${currentUser.id}`);
        }
      },
      error: (err) => {
        console.error('❌ Toolbar-Patient: Error cargando pacientes:', err);
      }
    });

    // Listen for user changes so toolbar reloads patient-specific data without page refresh
    try {
      window.addEventListener('userChanged', (ev: any) => {
        const detailUser = ev?.detail;
        const current = detailUser || this.userStore.currentUser$();
        if (!current || !current.id) return;

        this.patientStore.loadAllPatients().subscribe({
          next: (patients) => {
            const patient = patients.find(p => p.userId === current.id);
            if (patient) {
              this.nudgeStore.loadNudgesByPatient(patient.id.toString()).subscribe({ next: () => {}, error: () => {} });
              this.messagesStore.loadInbox('PATIENT', patient.id.toString());
            }
          }
        });
      });
    } catch (e) {
      // ignore if window not available
    }
  }

  get currentUser() {
    return this.userStore.currentUser$();
  }

  logout(): void {
    // Clear user store and localStorage
    this.userStore.clearCurrentUser();
    
    // Navigate to login
    this.router.navigate(['/iam/login']);
  }
}
