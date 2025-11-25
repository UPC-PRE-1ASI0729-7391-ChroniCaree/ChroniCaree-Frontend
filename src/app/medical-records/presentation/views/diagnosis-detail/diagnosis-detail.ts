import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DiagnosisStore } from '../../../application/diagnosis.store';
import { Diagnosis, DiagnosisStatus, DiagnosisSeverity, COMMON_ICD10_CODES } from '../../../domain/model/diagnosis.entity';

/**
 * Diagnosis Detail View - Vista detallada de diagnóstico con edición
 */
@Component({
  selector: 'app-diagnosis-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './diagnosis-detail.html',
  styleUrl: './diagnosis-detail.css'
})
export class DiagnosisDetailComponent implements OnInit {
  private readonly diagnosisStore = inject(DiagnosisStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  // State
  isEditMode = signal<boolean>(false);
  diagnosisForm!: FormGroup;
  diagnosisId = signal<number | null>(null);

  // Getters
  get diagnosis() { return this.diagnosisStore.selectedDiagnosis$; }
  get loading() { return this.diagnosisStore.loading$; }

  // Enums para el template
  readonly DiagnosisStatus = DiagnosisStatus;
  readonly DiagnosisSeverity = DiagnosisSeverity;
  readonly icd10Codes = COMMON_ICD10_CODES;

  // Status options
  readonly statusOptions = [
    { value: DiagnosisStatus.ACTIVE, label: 'Activo', icon: 'error', color: 'status-active' },
    { value: DiagnosisStatus.CONTROLLED, label: 'Controlado', icon: 'check_circle', color: 'status-controlled' },
    { value: DiagnosisStatus.RESOLVED, label: 'Resuelto', icon: 'verified', color: 'status-resolved' },
    { value: DiagnosisStatus.MONITORING, label: 'En Monitoreo', icon: 'visibility', color: 'status-monitoring' }
  ];

  // Severity options
  readonly severityOptions = [
    { value: DiagnosisSeverity.LOW, label: 'Leve', icon: 'info', color: 'severity-low' },
    { value: DiagnosisSeverity.MODERATE, label: 'Moderado', icon: 'warning', color: 'severity-moderate' },
    { value: DiagnosisSeverity.HIGH, label: 'Alto', icon: 'error', color: 'severity-high' },
    { value: DiagnosisSeverity.CRITICAL, label: 'Crítico', icon: 'dangerous', color: 'severity-critical' }
  ];

  // Computed: Obtener info del status actual
  currentStatusInfo = computed(() => {
    const d = this.diagnosis();
    if (!d) return null;
    return this.statusOptions.find(s => s.value === d.status) || null;
  });

  // Computed: Obtener info de severidad actual
  currentSeverityInfo = computed(() => {
    const d = this.diagnosis();
    if (!d) return null;
    return this.severityOptions.find(s => s.value === d.severity) || null;
  });

  ngOnInit(): void {
    // Inicializar formulario
    this.initForm();

    // Obtener ID del diagnóstico desde la ruta
    this.route.params.subscribe(params => {
      const id = +params['id'];
      if (id && !Number.isNaN(id)) {
        this.diagnosisId.set(id);
        this.loadDiagnosis(id);
      } else {
        this.showError('ID de diagnóstico inválido');
        this.goBack();
      }
    });

    // Verificar si viene en modo edición
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'edit') {
        this.enableEditMode();
      }
    });
  }

  private initForm(): void {
    this.diagnosisForm = this.fb.group({
      diagnosisName: ['', Validators.required],
      icd10Code: ['', Validators.required],
      status: ['', Validators.required],
      severity: ['', Validators.required],
      diagnosedDate: ['', Validators.required],
      resolvedDate: [''],
      lastReviewDate: [''],
      treatment: [''],
      notes: [''],
      followUpRequired: [false]
    });

    // Deshabilitar por defecto
    this.diagnosisForm.disable();
  }

  private loadDiagnosis(id: number): void {
    this.diagnosisStore.loadDiagnosisById(id).subscribe({
      next: (diagnosis) => {
        console.log('✅ Diagnóstico cargado:', diagnosis);
        
        // Validar que tenga los campos requeridos
        if (!diagnosis.icd10Code || !diagnosis.severity) {
          console.warn('⚠️ Diagnóstico incompleto detectado');
          this.showError('Este diagnóstico no tiene todos los campos requeridos. Por favor, contacta al administrador.');
          // Aún así poblar el formulario con los datos disponibles
        }
        
        this.populateForm(diagnosis);
      },
      error: (err) => {
        console.error('❌ Error cargando diagnóstico:', err);
        this.showError('No se pudo cargar el diagnóstico');
        this.goBack();
      }
    });
  }

  private populateForm(diagnosis: Diagnosis): void {
    this.diagnosisForm.patchValue({
      diagnosisName: diagnosis.diagnosisName || '',
      icd10Code: diagnosis.icd10Code || '',
      status: diagnosis.status || 'monitoring',
      severity: diagnosis.severity || 'low',
      diagnosedDate: diagnosis.diagnosedDate ? new Date(diagnosis.diagnosedDate) : new Date(),
      resolvedDate: diagnosis.resolvedDate ? new Date(diagnosis.resolvedDate) : null,
      lastReviewDate: diagnosis.lastReviewDate ? new Date(diagnosis.lastReviewDate) : null,
      treatment: diagnosis.treatment || '',
      notes: diagnosis.notes || '',
      followUpRequired: diagnosis.followUpRequired ?? false
    });
  }

  enableEditMode(): void {
    this.isEditMode.set(true);
    this.diagnosisForm.enable();
  }

  cancelEdit(): void {
    this.isEditMode.set(false);
    this.diagnosisForm.disable();
    
    // Restaurar valores originales
    const diagnosis = this.diagnosis();
    if (diagnosis) {
      this.populateForm(diagnosis);
    }
  }

  saveChanges(): void {
    if (this.diagnosisForm.invalid) {
      this.showError('Por favor completa todos los campos requeridos');
      return;
    }

    const diagnosis = this.diagnosis();
    if (!diagnosis) {
      this.showError('No se encontró el diagnóstico');
      return;
    }

    const formValue = this.diagnosisForm.value;
    const updatedDiagnosis: Diagnosis = {
      ...diagnosis,
      diagnosisName: formValue.diagnosisName,
      icd10Code: formValue.icd10Code,
      status: formValue.status,
      severity: formValue.severity,
      diagnosedDate: formValue.diagnosedDate.toISOString(),
      resolvedDate: formValue.resolvedDate ? formValue.resolvedDate.toISOString() : undefined,
      lastReviewDate: new Date().toISOString(), // Actualizar fecha de revisión
      treatment: formValue.treatment,
      notes: formValue.notes,
      followUpRequired: formValue.followUpRequired,
      updatedAt: new Date().toISOString()
    };

    this.diagnosisStore.updateDiagnosis(updatedDiagnosis).subscribe({
      next: () => {
        this.showSuccess('✅ Diagnóstico actualizado exitosamente');
        this.isEditMode.set(false);
        this.diagnosisForm.disable();
        
        // Recargar para mostrar la fecha de actualización
        if (this.diagnosisId()) {
          this.loadDiagnosis(this.diagnosisId()!);
        }
      },
      error: (err) => {
        console.error('❌ Error actualizando diagnóstico:', err);
        this.showError('No se pudo actualizar el diagnóstico');
      }
    });
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateShort(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  }

  getDaysSince(dateString?: string): number {
    if (!dateString) return 0;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  goBack(): void {
    this.router.navigate(['/medical-records/diagnoses']);
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
