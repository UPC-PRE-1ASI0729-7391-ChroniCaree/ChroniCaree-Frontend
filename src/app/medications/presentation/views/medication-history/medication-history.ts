import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatExpansionModule,
    MatDividerModule,
    MatListModule,
    MatChipsModule,
    MatTooltipModule,
    MatTabsModule,
    MatDialogModule,
    MatSnackBarModule,
    TranslateModule
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
  private readonly translate = inject(TranslateService);

  // ✅ Signal para almacenar el patientId actual (number)
  private readonly currentPatientId = signal<number | null>(null);

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
    const currentUser =
      this.userStore.currentUser$() ||
      JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!currentUser || !currentUser.id) {
      console.error('❌ Medication-History: Usuario no autenticado');
      this.router.navigate(['/iam/login']);
      return;
    }

    const userId = currentUser.id;
    console.log(`🔍 Medication-History: Usuario actual ID: ${userId}`);

    // Buscar el paciente asociado al usuario actual
    this.patientStore.loadAllPatients().subscribe({
      next: patients => {
        const patient = patients.find(p => p.userId === userId);
        if (patient) {
          console.log(
            `✅ Medication-History: Paciente encontrado: ${patient.firstName} ${patient.lastName}, ID: ${patient.id}`
          );
          const patientId = Number(patient.id);
          this.currentPatientId.set(patientId);

          // ✅ Cargar medicamentos del paciente actual (con force reload)
          this.medicationStore.forceReload(patientId).subscribe({
            next: medications => {
              console.log(
                `✅ Medication-History: ${medications.length} medicamentos cargados para paciente ${patient.id}`
              );
            },
            error: err => console.error('❌ Error cargando medicamentos:', err)
          });
        } else {
          console.error(
            `❌ Medication-History: No se encontró paciente para userId ${userId}`
          );
        }
      },
      error: err => {
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
          console.log(
            'Medication-History: userChanged detected, reloading patient data for userId',
            userId
          );
          this.patientStore.loadAllPatients().subscribe({
            next: patients => {
              const patient = patients.find(p => p.userId === userId);
              if (patient) {
                const patientId = Number(patient.id);
                this.currentPatientId.set(patientId);
                this.medicationStore.forceReload(patientId).subscribe();
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
   * Get medication status label (i18n)
   */
  getStatusLabel(status: MedicationStatus): string {
    const keyMap: Record<MedicationStatus, string> = {
      [MedicationStatus.ACTIVE]: 'medications.history.status.active',
      [MedicationStatus.TAKEN]: 'medications.history.status.taken',
      [MedicationStatus.SCHEDULED]: 'medications.history.status.scheduled',
      [MedicationStatus.MISSED]: 'medications.history.status.missed',
      [MedicationStatus.DISCONTINUED]: 'medications.history.status.discontinued'
    };
    // Guard against undefined/null status and missing keys
    const defaultKey = 'medications.history.status.unknown';
    const key = status ? keyMap[status] ?? defaultKey : defaultKey;
    try {
      return this.translate.instant(key);
    } catch (e) {
      // Fallback to a safe human readable string if Translate service fails
      return 'Desconocido';
    }
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
   * Add medication (opens the same edit dialog in create mode)
   */
  addMedication(): void {
    const patientId = this.currentPatientId();
    if (!patientId) {
      this.snackBar.open('No se pudo identificar al paciente', 'Cerrar', { duration: 3000 });
      return;
    }

    const blank = new Medication({ patientId });

    const dialogRef = this.dialog.open(MedicationEditDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { medication: blank },
      disableClose: false,
      autoFocus: true
    });

    dialogRef.afterClosed().subscribe((success: boolean) => {
      if (success) {
        // reload medications for patient
        this.medicationStore.forceReload(patientId).subscribe();
        this.snackBar.open('Medicación agregada', 'Cerrar', { duration: 2500 });
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

  /**
   * Quick create medication from the right-side panel (simple UX)
   */
  quickCreateMedication(name: string, dosage: string): void {
    const patientId = this.currentPatientId();
    if (!patientId) {
      this.snackBar.open('No se pudo identificar al paciente', 'Cerrar', { duration: 3000 });
      return;
    }
    if (!name || !dosage) {
      this.snackBar.open('Por favor completa nombre y dosificación', 'Cerrar', { duration: 2500 });
      return;
    }

    const med = new Medication({
      patientId,
      name,
      dosage,
      createdAt: new Date(),
      updatedAt: new Date(),
      sideEffects: [],
      contraindications: []
    });

    this.medicationStore.createMedication(med).subscribe({
      next: () => {
        this.snackBar.open('Medicación creada', 'Cerrar', { duration: 2500 });
        this.medicationStore.forceReload(patientId).subscribe();
      },
      error: err => {
        console.error('Error creating medication', err);
        this.snackBar.open('Error al crear medicación', 'Cerrar', { duration: 3000 });
      }
    });
  }
}
