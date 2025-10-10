import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OnboardingComponent } from '../../../../shared/presentation/components/onboarding/onboarding';
import { NudgePanelComponent } from '../../../../communication/presentation/components/nudge-panel/nudge-panel';
import { MedicationLogComponent } from '../../../../medications/presentation/components/medication-log/medication-log';
import { AlertPanelComponent } from '../../../../alerts/presentation/components/alert-panel/alert-panel';
import { PatientStore } from '../../../application/patient.store';
import { UserStore } from '../../../../iam/application/user.store';
import { SymptomStore } from '../../../../clinical/application/symptom.store';
import { DiagnosisStore } from '../../../../medical-records/application/diagnosis.store';
import { MedicationStore } from '../../../../medications/application/medication.store';
import { AlertStore } from '../../../../alerts/application/alert.store';

@Component({
  selector: 'app-dashboard-patient',
  standalone: true,
  imports: [CommonModule, RouterLink, OnboardingComponent, NudgePanelComponent, MedicationLogComponent, AlertPanelComponent],
  templateUrl: './dashboard-patient.html',
  styleUrl: './dashboard-patient.css'
})
export class DashboardPatient implements OnInit {
  // User data (getters para evitar error de inicialización)
  protected get currentUser() { return this.userStore.currentUser$; }
  protected get currentPatient() { return this.patientStore.selectedPatient$; }
  protected get loading() { return this.patientStore.loading$; }

  // Computed patient info
  protected readonly patientName = computed(() => {
    const patient = this.currentPatient();
    return patient ? `${patient.firstName} ${patient.lastName}` : 'Paciente';
  });

  protected readonly age = computed(() => {
    const patient = this.currentPatient();
    if (!patient?.birthDate) return 0;
    
    const birthDate = new Date(patient.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  });

  protected readonly bmi = computed(() => {
    const patient = this.currentPatient();
    return patient?.bmi?.toFixed(1) || 'N/A';
  });

  protected readonly primaryCondition = computed(() => {
    const diagnoses = this.diagnosisStore.activeDiagnoses();
    if (diagnoses.length === 0) return 'Sin diagnósticos activos';
    
    // Retornar el diagnóstico más severo o el primero
    const criticalDiag = diagnoses.find(d => d.severity === 'critical');
    const highDiag = diagnoses.find(d => d.severity === 'high');
    const primaryDiag = criticalDiag || highDiag || diagnoses[0];
    
    return primaryDiag.diagnosisName;
  });

  // Signos vitales (últimos registrados)
  protected readonly vitalSigns = computed(() => {
    const symptoms = this.symptomStore.symptoms$();
    if (symptoms.length === 0) {
      return {
        heartRate: '--',
        bloodPressure: '--/--',
        temperature: '--',
        oxygen: '--',
        lastUpdate: 'Sin datos'
      };
    }

    // Obtener el síntoma más reciente
    const latest = symptoms[0];
    const updateTime = new Date(latest.timestamp).toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return {
      heartRate: latest.heartRate || '--',
      bloodPressure: latest.bloodPressure || '--/--',
      temperature: latest.temperature || '--',
      oxygen: latest.oxygenSaturation || '--',
      lastUpdate: updateTime
    };
  });

  // Medicamentos (de MedicationStore)
  protected readonly medicationCount = computed(() => {
    return this.medicationStore.medicationCount();
  });

  protected readonly todayMedications = computed(() => {
    const schedule = this.medicationStore.todaySchedule();
    return schedule.slice(0, 3); // Mostrar solo primeros 3 en dashboard
  });

  // Próximas citas (mock data - se integrará con el store real)
  protected readonly upcomingAppointments = signal([
    { 
      id: 1, 
      doctorName: 'Dr. Juan Torres', 
      specialty: 'Cardiología', 
      date: '15 Abril', 
      time: '10:00 AM' 
    },
    { 
      id: 2, 
      doctorName: 'Dra. María López', 
      specialty: 'Endocrinología', 
      date: '18 Abril', 
      time: '15:30 PM' 
    }
  ]);

  // Síntomas recientes (de SymptomStore)
  protected readonly recentSymptoms = computed(() => {
    const symptoms = this.symptomStore.symptoms$();
    return symptoms.slice(0, 3).map(s => ({
      id: s.id,
      symptom: this.getSymptomDescription(s),
      severity: this.getSeverityLevel(s),
      date: this.formatDate(s.timestamp),
      time: this.formatTime(s.timestamp)
    }));
  });

  // Diagnósticos activos
  protected readonly activeDiagnosesCount = computed(() => {
    return this.diagnosisStore.activeDiagnoses().length;
  });

  constructor(
    private patientStore: PatientStore,
    private userStore: UserStore,
    private symptomStore: SymptomStore,
    private diagnosisStore: DiagnosisStore,
    private medicationStore: MedicationStore,
    private alertStore: AlertStore
  ) {}

  ngOnInit(): void {
    console.log('Dashboard Patient inicializado');
    this.loadPatientData();
  }

  /**
   * Carga todos los datos del paciente
   */
  private loadPatientData(): void {
    const user = this.currentUser();
    if (!user) return;

    // Cargar datos del paciente
    this.patientStore.loadAllPatients().subscribe({
      next: (patients) => {
        const patient = patients.find(p => p.userId === user.id);
        if (patient) {
          this.patientStore.loadPatientById(patient.id).subscribe();
        }
      }
    });

    // Cargar síntomas
    this.symptomStore.loadAllSymptoms().subscribe();

    // Cargar diagnósticos
    this.diagnosisStore.loadAllDiagnoses().subscribe();

    // Cargar medicamentos
    this.medicationStore.loadMedicationsByPatient('1').subscribe();

    // Cargar alertas
    this.alertStore.loadAlertsByPatient('1').subscribe();
  }

  /**
   * Obtiene descripción del síntoma
   */
  private getSymptomDescription(symptom: any): string {
    const symptoms = [];
    if (symptom.fatigue && symptom.fatigue > 5) symptoms.push('Fatiga');
    if (symptom.pain && symptom.pain > 5) symptoms.push('Dolor');
    if (symptom.dizziness && symptom.dizziness > 5) symptoms.push('Mareo');
    if (symptom.glucose && symptom.glucose > 140) symptoms.push('Glucosa elevada');
    
    return symptoms.length > 0 ? symptoms.join(', ') : 'Síntomas generales';
  }

  /**
   * Obtiene el nivel de severidad
   */
  private getSeverityLevel(symptom: any): 'low' | 'medium' | 'high' {
    const maxValue = Math.max(
      symptom.fatigue || 0,
      symptom.pain || 0,
      symptom.dizziness || 0
    );

    if (maxValue >= 7) return 'high';
    if (maxValue >= 4) return 'medium';
    return 'low';
  }

  /**
   * Formatea fecha
   */
  private formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }
    
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });
  }

  /**
   * Formatea hora
   */
  private formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
