import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientOnboardingStore } from '../../../../patients/application/patient-onboarding.store';

interface ConditionOption {
  id: string;
  name: string;
  category: string;
}

@Component({
  selector: 'app-patient-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './patient-onboarding.view.html',
  styleUrls: ['./patient-onboarding.view.css']
})
export class PatientOnboardingView {
  private readonly store = inject(PatientOnboardingStore);
  private readonly fb = inject(FormBuilder);

  // Multi-step form state
  currentStep = signal<number>(1);
  totalSteps = 3;

  // Forms for each step
  personalInfoForm!: FormGroup;
  medicalInfoForm!: FormGroup;
  conditionsForm!: FormGroup;

  // Available conditions
  availableConditions: ConditionOption[] = [
    { id: 'diabetes_type_1', name: 'Diabetes Tipo 1', category: 'endocrine' },
    { id: 'diabetes_type_2', name: 'Diabetes Tipo 2', category: 'endocrine' },
    { id: 'hypertension', name: 'Hipertensión', category: 'cardiovascular' },
    { id: 'hyperlipidemia', name: 'Hiperlipidemia', category: 'cardiovascular' },
    { id: 'asthma', name: 'Asma', category: 'respiratory' },
    { id: 'copd', name: 'EPOC', category: 'respiratory' },
    { id: 'heart_disease', name: 'Enfermedad Cardíaca', category: 'cardiovascular' },
    { id: 'kidney_disease', name: 'Enfermedad Renal', category: 'renal' },
    { id: 'thyroid_disorder', name: 'Trastorno Tiroideo', category: 'endocrine' },
    { id: 'arthritis', name: 'Artritis', category: 'musculoskeletal' },
    { id: 'depression', name: 'Depresión', category: 'mental_health' },
    { id: 'anxiety', name: 'Ansiedad', category: 'mental_health' }
  ];

  selectedConditions = signal<string[]>([]);

  // Loading and messages
  isSubmitting = computed(() => this.store.loading());
  errorMessage = computed(() => this.store.error());
  successMessage = signal<string | null>(null);

  // Progress
  progressPercentage = computed(() => (this.currentStep() / this.totalSteps) * 100);

  constructor() {
    this.initForms();
  }

  initForms(): void {
    this.personalInfoForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      dni: ['', [Validators.required]],
      birthDate: ['', [Validators.required]],
      gender: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      address: ['']
    });

    this.medicalInfoForm = this.fb.group({
      weight: [0, [Validators.min(0)]],
      height: [0, [Validators.min(0)]],
      emergencyContactName: [''],
      emergencyContactRelationship: [''],
      emergencyContactPhone: ['']
    });

    this.conditionsForm = this.fb.group({
      conditions: [[]]
    });
  }

  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.update(step => step + 1);
    }
  }

  prevStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.update(step => step - 1);
    }
  }

  toggleCondition(conditionId: string): void {
    const current = this.selectedConditions();
    if (current.includes(conditionId)) {
      this.selectedConditions.set(current.filter(id => id !== conditionId));
    } else {
      this.selectedConditions.set([...current, conditionId]);
    }
  }

  isConditionSelected(conditionId: string): boolean {
    return this.selectedConditions().includes(conditionId);
  }

  getConditionsByCategory(category: string): ConditionOption[] {
    return this.availableConditions.filter(c => c.category === category);
  }

  onSubmit(): void {
    if (this.personalInfoForm.invalid) {
      this.errorMessage = signal('Por favor complete todos los campos requeridos en información personal');
      return;
    }

    const personalData = this.personalInfoForm.value;
    const medicalData = this.medicalInfoForm.value;
    const conditions = this.selectedConditions();

    const patientData = {
      ...personalData,
      weight: medicalData.weight,
      height: medicalData.height,
      emergencyContact: {
        name: medicalData.emergencyContactName || '',
        relationship: medicalData.emergencyContactRelationship || '',
        phone: medicalData.emergencyContactPhone || ''
      }
    };

    this.store.registerPatientWithConditions(patientData, conditions as any).subscribe({
      next: (result) => {
        if (result.success) {
          this.successMessage.set('¡Paciente registrado exitosamente!');
          setTimeout(() => {
            this.resetForms();
          }, 2000);
        }
      },
      error: (err) => {
        console.error('Error registering patient:', err);
      }
    });
  }

  calculateBMI(weight: number, height: number): number {
    if (weight > 0 && height > 0) {
      return parseFloat((weight / (height * height)).toFixed(1));
    }
    return 0;
  }

  resetForms(): void {
    this.personalInfoForm.reset();
    this.medicalInfoForm.reset();
    this.conditionsForm.reset();
    this.selectedConditions.set([]);
    this.currentStep.set(1);
    this.successMessage.set(null);
  }
}
