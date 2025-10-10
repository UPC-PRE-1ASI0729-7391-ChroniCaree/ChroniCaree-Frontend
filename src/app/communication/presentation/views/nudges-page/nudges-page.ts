import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NudgePanelComponent } from '../../components/nudge-panel/nudge-panel';
import { NudgeStore } from '../../../application/nudge.store';
import { PatientStore } from '../../../../patients/application/patient.store';

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
    RouterLink,
    MatButtonModule,
    MatIconModule,
    NudgePanelComponent
  ],
  templateUrl: './nudges-page.html',
  styleUrls: ['./nudges-page.css']
})
export class NudgesPageComponent implements OnInit {
  private readonly nudgeStore = inject(NudgeStore);
  private readonly patientStore = inject(PatientStore);
  private readonly router = inject(Router);

  get activeCount() {
    return this.nudgeStore.activeCount;
  }

  get loading() {
    return this.nudgeStore.loading$;
  }

  ngOnInit(): void {
    // ✅ Verificar autenticación y cargar nudges filtrados por paciente
    const currentUserStr = localStorage.getItem('currentUser');
    const isAuthenticated = localStorage.getItem('isAuthenticated');

    if (!currentUserStr || isAuthenticated !== 'true') {
      console.error('❌ Nudges-Page: Usuario no autenticado');
      this.router.navigate(['/iam/login']);
      return;
    }

    const currentUser = JSON.parse(currentUserStr);
    const userId = currentUser.id;

    console.log(`🔍 Nudges-Page: Usuario actual ID: ${userId}`);

    // Buscar el paciente asociado al usuario actual
    this.patientStore.loadAllPatients().subscribe({
      next: (patients) => {
        const patient = patients.find(p => p.userId === userId);

        if (patient) {
          console.log(`✅ Nudges-Page: Paciente encontrado: ${patient.firstName} ${patient.lastName}, ID: ${patient.id}`);
          
          // ✅ Cargar nudges usando el patientId
          this.nudgeStore.loadNudgesByPatient(patient.id.toString()).subscribe({
            next: () => console.log('✅ Nudges cargados para página'),
            error: (err: any) => console.error('❌ Error cargando nudges:', err)
          });
        } else {
          console.error(`❌ Nudges-Page: No se encontró paciente para userId ${userId}`);
        }
      },
      error: (err: any) => {
        console.error('❌ Nudges-Page: Error cargando pacientes:', err);
      }
    });
  }
}
