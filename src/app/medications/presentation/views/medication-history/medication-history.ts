import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MedicationStore } from '../../../application/medication.store';
import { PatientStore } from '../../../../patients/application/patient.store';
import { Medication, MedicationStatus } from '../../../domain/model/medication.entity';
import { MedicationEditDialogComponent } from '../../components/medication-edit-dialog/medication-edit-dialog';
import { MedicationDeleteDialogComponent } from '../../components/medication-delete-dialog/medication-delete-dialog';
import { UserStore } from '../../../../iam/application/user.store';

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
    MatTabsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  templateUrl: './medication-history.html',
  styleUrls: ['./medication-history.css']
})
export class MedicationHistoryComponent implements OnInit {
  private readonly medicationStore = inject(MedicationStore);
  private readonly patientStore = inject(PatientStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly userStore = inject(UserStore);

  // ✅ Signal para almacenar el patientId actual (string porque así está en db.json)
  private readonly currentPatientId = signal<string | null>(null);

  // ✅ Computed signals que filtran por paciente actual
  medications = computed((): Medication[] => {
    const patientId = this.currentPatientId();
    if (!patientId) return [];
    return this.medicationStore.medications().filter(m => m.patientId === patientId);
  });
  
  // Expose loading and activeMedications for template bindings
  loading = this.medicationStore.loading;
  activeMedications = this.medicationStore.activeMedications;
  
  // ✅ Adherence stats filtrado por paciente
  adherenceStats = computed(() => {
    const patientId = this.currentPatientId();
    if (!patientId) return { taken: 0, missed: 0, rate: 0 };
    
    const allMeds = this.medicationStore.medications().filter(m => m.patientId === patientId);
    const taken = allMeds.filter(m => m.status === MedicationStatus.TAKEN).length;
    const missed = allMeds.filter(m => m.status === MedicationStatus.MISSED).length;
    const total = taken + missed;
    
    return {
      taken,
      missed,
      rate: total > 0 ? Math.round((taken / total) * 100) : 0
    };
  });

  // Local state
  selectedTab = signal(0);

  ngOnInit(): void {
    // Determine current user via UserStore or fallback to localStorage
    const currentUser = this.userStore.currentUser$() || (JSON.parse(localStorage.getItem('currentUser') || 'null'));
    if (!currentUser || !currentUser.id) {
      console.error('❌ Medication-History: Usuario no autenticado');
      this.router.navigate(['/iam/login']);
      return;
    }

    const userId = currentUser.id;
    console.log(`🔍 Medication-History: Usuario actual ID: ${userId}`);

    // Buscar el paciente asociado al usuario actual
    this.patientStore.loadAllPatients().subscribe({
      next: (patients) => {
        const patient = patients.find(p => p.userId === userId);
        if (patient) {
          console.log(`✅ Medication-History: Paciente encontrado: ${patient.firstName} ${patient.lastName}, ID: ${patient.id}`);
          const patientIdStr = patient.id.toString();
          this.currentPatientId.set(patientIdStr);

          // ✅ Cargar medicamentos del paciente actual (con force reload)
          this.medicationStore.forceReload(patientIdStr).subscribe({
            next: (medications) => {
              console.log(`✅ Medication-History: ${medications.length} medicamentos cargados para paciente ${patient.id}`);
            },
            error: (err) => console.error('❌ Error cargando medicamentos:', err)
          });
        } else {
          console.error(`❌ Medication-History: No se encontró paciente para userId ${userId}`);
        }
      },
      error: (err) => {
        console.error('❌ Medication-History: Error cargando pacientes:', err);
      }
    });

    // React to user changes (login/logout/switch)
    try {
      window.addEventListener('userChanged', (ev: any) => {
        const detailUser = ev?.detail;
        const cur = detailUser || this.userStore.currentUser$();
        const userId = cur?.id;
        if (userId) {
          console.log('Medication-History: userChanged detected, reloading patient data for userId', userId);
          this.patientStore.loadAllPatients().subscribe({
            next: (patients) => {
              const patient = patients.find(p => p.userId === userId);
              if (patient) {
                const patientIdStr = patient.id.toString();
                this.currentPatientId.set(patientIdStr);
                this.medicationStore.forceReload(patientIdStr).subscribe();
              }
            }
          });
        }
      });
    } catch (e) {
      // ignore
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

  /**
   * Edit medication
   */
  editMedication(medication: Medication): void {
    const dialogRef = this.dialog.open(MedicationEditDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { medication },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) {
        // ✅ Reload medications usando el patientId actual
        const patientId = this.currentPatientId();
        if (patientId) {
          this.medicationStore.forceReload(patientId).subscribe();
        }
      }
    });
  }

  /**
   * Delete medication
   */
  deleteMedication(medication: Medication): void {
    const dialogRef = this.dialog.open(MedicationDeleteDialogComponent, {
      width: '550px',
      maxWidth: '95vw',
      data: { medication },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) {
        // ✅ Reload medications usando el patientId actual
        const patientId = this.currentPatientId();
        if (patientId) {
          this.medicationStore.forceReload(patientId).subscribe();
        }
      }
    });
  }
}
