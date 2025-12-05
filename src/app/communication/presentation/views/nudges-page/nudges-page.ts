import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { NudgePanelComponent } from '../../components/nudge-panel/nudge-panel';
import { NudgeStore } from '../../../application/nudge.store';
import { PatientStore } from '../../../../patients/application/patient.store';
import { NudgePriority, NudgeType } from '../../../domain/model/nudge.entity';

/**
 * Nudges Page Component
 * Página dedicada para ver todos los recordatorios/nudges
 * Communication Bounded Context
 */
@Component({
  selector: 'app-nudges-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TranslateModule,
    NudgePanelComponent
  ],
  templateUrl: './nudges-page.html',
  styleUrls: ['./nudges-page.css']
})
export class NudgesPageComponent implements OnInit {
  private readonly nudgeStore = inject(NudgeStore);
  private readonly patientStore = inject(PatientStore);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);


  readonly NudgePriority = NudgePriority;

  showCreateForm = false;
  createTitle = '';
  createMessage = '';
  createPriority: NudgePriority = NudgePriority.MEDIUM;
  private currentPatientId: number | null = null;

  get activeCount() {
    return this.nudgeStore.activeCount;
  }

  get loading() {
    return this.nudgeStore.loading$;
  }

  ngOnInit(): void {
    const currentUserStr = localStorage.getItem('currentUser');
    const isAuthenticated = localStorage.getItem('isAuthenticated');

    if (!currentUserStr || isAuthenticated !== 'true') {
      this.router.navigate(['/iam/login']);
      return;
    }

    const currentUser = JSON.parse(currentUserStr);
    const userId = currentUser.id;

    this.patientStore.loadAllPatients().subscribe({
      next: (patients) => {
        const patient = patients.find(p => p.userId === userId);

        if (patient) {
          this.currentPatientId = patient.id;

          this.nudgeStore.loadNudgesByPatient(patient.id.toString()).subscribe({
            next: () => {},
            error: () => {}
          });
        }
      },
      error: () => {}
    });
  }

  /** Crea un nuevo recordatorio/nudge usando NudgeStore */
  createNudge(): void {
    if (!this.currentPatientId) return;

    const title =
      (this.createTitle || '').trim() || this.translate.instant('nudgesPage.defaults.quickTitle');

    const message =
      (this.createMessage || '').trim() || this.translate.instant('nudgesPage.defaults.quickMessage');


    const actionLabel = this.translate.instant('common.view');

    const payload = {
      patientId: this.currentPatientId,
      type: NudgeType.MEDICATION_REMINDER,
      priority: this.createPriority,
      title,
      message,
      actionLabel,
      actionRoute: '/patient/dashboard',
      icon: 'notifications'
    } as any;

    this.nudgeStore.createNudge(payload).subscribe({
      next: () => {
        this.createTitle = '';
        this.createMessage = '';
        this.showCreateForm = false;
      },
      error: () => {}
    });
  }


  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;

    if (!this.showCreateForm) {
      this.createTitle = '';
      this.createMessage = '';
      this.createPriority = NudgePriority.MEDIUM;
    }
  }
}
