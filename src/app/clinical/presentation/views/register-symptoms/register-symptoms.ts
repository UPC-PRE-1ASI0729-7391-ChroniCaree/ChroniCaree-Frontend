import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { TranslateModule } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SymptomStore } from '../../../application/symptom.store';
import { Symptom } from '../../../domain/model/symptom.entity';
import { MedicalRecord } from '../../../../doctors/domain/model/medical-record.entity';
import { SymptomConfirmationDialogComponent } from '../../components/symptom-confirmation-dialog/symptom-confirmation-dialog';
import { PatientStore } from '../../../../patients/application/patient.store';
import { UserStore } from '../../../../iam/application/user.store';
import { MedicalRecordsStore } from '../../../../doctors/application/medical-records.store';
import { AlertStore } from '../../../../alerts/application/alert.store';
import { AlertType, AlertSeverity, AlertStatus } from '../../../../alerts/domain/model/alert.entity';
import { RecordType, ReviewStatus } from '../../../../doctors/domain/model/medical-record.entity';

/**
 * Register Symptoms View - Registro de síntomas diarios
 */
@Component({
  selector: 'app-register-symptoms',
  standalone: true,
  imports: [
  CommonModule,
  ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSliderModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    TranslateModule
  ],
  templateUrl: './register-symptoms.html',
  styleUrl: './register-symptoms.css'
})
export class RegisterSymptomsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly symptomStore = inject(SymptomStore);
  private readonly patientStore = inject(PatientStore);
  private readonly alertStore = inject(AlertStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly medicalRecordsStore = inject(MedicalRecordsStore);
  symptomForm!: FormGroup;

  // Valores de escalas (1-10)
  fatigueValue = signal(5);
  painValue = signal(5);
  dizzinessValue = signal(5);

  // Signal para almacenar el patientId actual
  private readonly currentPatientId = signal<number | null>(null);

  // Expose loading from SymptomStore for template bindings
  readonly loading = this.symptomStore.loading$;

  private readonly userStore = inject(UserStore);
  ngOnInit(): void {
    this.initializeForm();
    this.loadCurrentPatient();

    // React to user changes (login/logout/switch)
    try {
      window.addEventListener('userChanged', (_ev: any) => {
        // reload patient for the new user
        this.loadCurrentPatient();
      });
    } catch (e) {
      // ignore environment without window
    }
  }
  private loadCurrentPatient(): void {
    // Prefer UserStore, fallback to localStorage
    const currentUser = this.userStore.currentUser$() || (JSON.parse(localStorage.getItem('currentUser') || 'null'));
    if (!currentUser || !currentUser.id) {
      console.error('❌ Register-Symptoms: Usuario no autenticado');
      this.router.navigate(['/iam/login']);
      return;
    }

    const userId = currentUser.id;
    console.log(`🔍 Register-Symptoms: Usuario actual ID: ${userId}`);

    this.patientStore.loadAllPatients().subscribe({
      next: (patients) => {
        const patient = patients.find(p => p.userId === userId);
        if (patient) {
          console.log(`✅ Register-Symptoms: Paciente encontrado: ${patient.firstName} ${patient.lastName}, ID: ${patient.id}`);
          this.currentPatientId.set(patient.id);
        } else {
          console.error(`❌ Register-Symptoms: No se encontró paciente para userId ${userId}`);
          this.snackBar.open('❌ Error: No se encontró el perfil del paciente', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
        }
      },
      error: (err) => {
        console.error('❌ Register-Symptoms: Error cargando pacientes:', err);
      }
    });
  }

  private initializeForm(): void {
    this.symptomForm = this.fb.group({
      glucose: [null, [Validators.min(0), Validators.max(600)]],
      bloodPressure: ['', [Validators.pattern(/^\d{2,3}\/\d{2,3}$/)]],
      heartRate: [null, [Validators.min(30), Validators.max(220)]],
      temperature: [null, [Validators.min(34), Validators.max(42)]],
      oxygenSaturation: [null, [Validators.min(0), Validators.max(100)]],
      notes: ['', [Validators.maxLength(500)]]
    });
  }

  onFatigueChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.fatigueValue.set(Number(value));
  }

  onPainChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.painValue.set(Number(value));
  }

  onDizzinessChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.dizzinessValue.set(Number(value));
  }

  formatLabelKey(value: number): string {
    if (value === 1) return 'clinical.scale.veryLow';
    if (value <= 3) return 'clinical.scale.low';
    if (value <= 5) return 'clinical.scale.moderateLevel';
    if (value <= 7) return 'clinical.scale.high';
    return 'clinical.scale.veryHigh';
  }


  onSubmit(): void {
    if (this.symptomForm.valid) {
      // ✅ Verificar que tenemos el patientId del usuario actual
      const patientId = this.currentPatientId();
      if (!patientId) {
        this.snackBar.open('❌ Error: No se pudo identificar al paciente', 'Cerrar', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
        return;
      }

      const formValue = this.symptomForm.value;

      const newSymptom: Symptom = {
        id: 0, // Will be assigned by backend
        patientId: patientId, // ✅ Usando el ID del paciente actual
        glucose: formValue.glucose || undefined,
        bloodPressure: formValue.bloodPressure || undefined,
        heartRate: formValue.heartRate || undefined,
        temperature: formValue.temperature || undefined,
        oxygenSaturation: formValue.oxygenSaturation || undefined,
        fatigue: this.fatigueValue(),
        pain: this.painValue(),
        dizziness: this.dizzinessValue(),
        notes: formValue.notes || undefined,
        timestamp: new Date().toISOString(),
        isEdited: false
      };

      console.log(`✅ Register-Symptoms: Registrando síntoma para paciente ${patientId}`);

      this.symptomStore.createSymptom(newSymptom).subscribe({
        next: (createdSymptom) => {
          // Detectar valores críticos
          const hasCriticalValues = this.detectCriticalValues(newSymptom);

          // Abrir diálogo de confirmación
          this.dialog.open(SymptomConfirmationDialogComponent, {
            width: '600px',
            maxWidth: '95vw',
            disableClose: false,
            data: {
              glucose: newSymptom.glucose,
              bloodPressure: newSymptom.bloodPressure,
              heartRate: newSymptom.heartRate,
              temperature: newSymptom.temperature,
              oxygenSaturation: newSymptom.oxygenSaturation,
              fatigue: newSymptom.fatigue,
              pain: newSymptom.pain,
              dizziness: newSymptom.dizziness,
              notes: newSymptom.notes,
              hasCriticalValues
            }
          });

          // Reset form
          this.symptomForm.reset();
          this.fatigueValue.set(5);
          this.painValue.set(5);
          this.dizzinessValue.set(5);

          // Also create a medical record entry so it appears in the patient's history
          try {
            const mr: Partial<MedicalRecord> = {
              patientId: patientId,
              // doctorId will be set if patient has assignedDoctorId
              type: RecordType.SYMPTOMS,
              date: new Date().toISOString(),
              glucose: newSymptom.glucose,
              bloodPressure: newSymptom.bloodPressure,
              heartRate: newSymptom.heartRate,
              temperature: newSymptom.temperature,
              fatigue: newSymptom.fatigue,
              pain: newSymptom.pain,
              dizziness: newSymptom.dizziness,
              notes: newSymptom.notes,
              reviewStatus: ReviewStatus.PENDING_REVIEW
            };

            // If patient record includes assignedDoctorId, use it
            this.patientStore.loadAllPatients().subscribe({
              next: (patients) => {
                const patientObj = patients.find(p => p.id === patientId);
                if (patientObj && (patientObj as any).assignedDoctorId) {
                  // use bracket notation to satisfy index signature rules
                  (mr as any)['doctorId'] = (patientObj as any).assignedDoctorId;
                }
                this.medicalRecordsStore.createRecord(mr);
              },
              error: () => {
                // still create record without doctor
                this.medicalRecordsStore.createRecord(mr);
              }
            });

          // If critical values detected, create an alert for the patient so it shows in 'Mi Salud'
          if (hasCriticalValues) {
            try {
              const patientIdStr = String(patientId);
              const alertPayload = {
                patientId: patientIdStr,
                type: AlertType.SYMPTOM_SEVERE,
                severity: AlertSeverity.CRITICAL,
                title: 'Alerta: Valores críticos detectados',
                message: 'Se han detectado valores críticos en tu reporte de salud. Por favor contacta a tu médico o acude a emergencias si empeoras.',
                status: AlertStatus.ACTIVE,
                metadata: {
                  symptomId: createdSymptom?.id ?? null,
                  glucose: newSymptom.glucose,
                  bloodPressure: newSymptom.bloodPressure,
                  heartRate: newSymptom.heartRate,
                  temperature: newSymptom.temperature,
                  oxygenSaturation: newSymptom.oxygenSaturation,
                  fatigue: newSymptom.fatigue,
                  pain: newSymptom.pain,
                  dizziness: newSymptom.dizziness
                },
                createdAt: new Date().toISOString()
              } as any;

              this.alertStore.createAlert(alertPayload).subscribe({
                next: (created) => {
                  console.log('Alert created for critical symptom:', created.id);
                },
                error: (err) => {
                  console.error('Error creating alert for critical symptom', err);
                }
              });
            } catch (e) {
              console.warn('Could not create alert for critical symptom', e);
            }
          }
          } catch (e) {
            console.warn('Could not create medical record automatically', e);
          }
        },
        error: (error) => {
          this.snackBar.open('❌ Error al registrar síntomas', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'end',
            verticalPosition: 'top'
          });
          console.error('Error:', error);
        }
      });
    } else {
      this.snackBar.open('⚠️ Por favor, revisa los campos del formulario', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
  }

  /**
   * Detecta si hay valores críticos en los síntomas
   */
  private detectCriticalValues(symptom: Symptom): boolean {
    // Glucosa crítica: < 70 o > 250
    if (symptom.glucose && (symptom.glucose < 70 || symptom.glucose > 250)) {
      return true;
    }

    // Presión arterial crítica: sistólica > 180 o diastólica > 120
    if (symptom.bloodPressure) {
      const [systolic, diastolic] = symptom.bloodPressure.split('/').map(Number);
      if (systolic > 180 || diastolic > 120) {
        return true;
      }
    }

    // Frecuencia cardíaca crítica: < 50 o > 120
    if (symptom.heartRate && (symptom.heartRate < 50 || symptom.heartRate > 120)) {
      return true;
    }

    // Temperatura crítica: < 35 o > 38.5
    if (symptom.temperature && (symptom.temperature < 35 || symptom.temperature > 38.5)) {
      return true;
    }

    // Saturación de oxígeno crítica: < 92
    if (symptom.oxygenSaturation && symptom.oxygenSaturation < 92) {
      return true;
    }

    // Síntomas severos: dolor, fatiga o mareo > 8
    if (symptom.pain && symptom.pain > 8) {
      return true;
    }
    if (symptom.fatigue && symptom.fatigue > 8) {
      return true;
    }
    if (symptom.dizziness && symptom.dizziness > 8) {
      return true;
    }

    // Nueva regla: si el promedio de las 3 escalas (fatigue, pain, dizziness)
    // es mayor a 7, consideramos que hay una situación preocupante y generamos alerta.
    try {
      const f = typeof symptom.fatigue === 'number' ? symptom.fatigue : 0;
      const p = typeof symptom.pain === 'number' ? symptom.pain : 0;
      const d = typeof symptom.dizziness === 'number' ? symptom.dizziness : 0;
      const avg = (f + p + d) / 3;
      if (avg > 7) {
        return true;
      }
    } catch (e) {
      // ignore any unexpected structure
    }

    return false;
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
