import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Router, RouterLink } from '@angular/router';
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
import { AppointmentsStore } from '../../../../doctors/application/appointments.store';
import { Appointment } from '../../../../doctors/domain/model/appointment.entity';

@Component({
  selector: 'app-dashboard-patient',
  standalone: true,
  imports: [CommonModule, RouterLink, OnboardingComponent, NudgePanelComponent, MedicationLogComponent, AlertPanelComponent, TranslateModule],
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
    const patient = this.currentPatient();
    if (!patient) return '';

    const allDiagnoses = this.diagnosisStore.activeDiagnoses();
    const diagnoses = allDiagnoses.filter(d => d.patientId === patient.id);

    if (diagnoses.length === 0) return '';

    const criticalDiag = diagnoses.find(d => d.severity === 'critical');
    const highDiag = diagnoses.find(d => d.severity === 'high');
    const primaryDiag = criticalDiag || highDiag || diagnoses[0];

    return primaryDiag.diagnosisName;
  });


  // Signos vitales (últimos registrados)
  protected readonly vitalSigns = computed(() => {
    const patient = this.currentPatient();
    if (!patient) {
      return {
        heartRate: '--',
        bloodPressure: '--/--',
        temperature: '--',
        oxygen: '--',
        lastUpdate: 'Sin datos'
      };
    }

    // Filtrar solo síntomas del paciente actual
    const allSymptoms = this.symptomStore.symptoms$();
    const patientSymptoms = allSymptoms.filter(s => s.patientId === patient.id);

    if (patientSymptoms.length === 0) {
      return {
        heartRate: '--',
        bloodPressure: '--/--',
        temperature: '--',
        oxygen: '--',
        lastUpdate: 'Sin datos'
      };
    }

    // Obtener el síntoma más reciente del paciente
    const latest = patientSymptoms[0];
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

  // Medicamentos (filtrados por paciente actual)
  protected readonly medicationCount = computed(() => {
    const patient = this.currentPatient();
    if (!patient) return 0;

    // ✅ Filtrar solo medicamentos del paciente actual
    const allMedications = this.medicationStore.medications();
    const patientMedications = allMedications.filter(m => m.patientId === patient.id.toString());
    return patientMedications.length;
  });

  protected readonly todayMedications = computed(() => {
    const patient = this.currentPatient();
    if (!patient) return [];

    // ✅ Filtrar solo medicamentos del paciente actual
    const schedule = this.medicationStore.todaySchedule();
    const patientSchedule = schedule.filter(s => s.medication.patientId === patient.id.toString());
    return patientSchedule.slice(0, 3); // Mostrar solo primeros 3 en dashboard
  });

  // Próximas citas (desde AppointmentsStore)
  protected readonly upcomingAppointments = computed(() => {
    const patient = this.currentPatient();
    if (!patient) return [];

    // ✅ Filtrar solo citas del paciente actual
    const allAppointments = this.appointmentsStore.upcomingAppointments();
    const patientAppointments = allAppointments
      .filter((apt: Appointment) => apt.patientId === patient.id)
      .slice(0, 2); // Mostrar solo las 2 próximas en dashboard

    return patientAppointments.map((apt: Appointment) => ({
      id: apt.id,
      doctorName: 'Dr. Asignado', // TODO: obtener nombre del doctor
      specialty: 'Especialidad', // TODO: obtener especialidad
      date: this.formatAppointmentDate(apt.date),
      time: apt.time,
      type: apt.type,
      status: apt.status
    }));
  });

  // Síntomas recientes (de SymptomStore)
  protected readonly recentSymptoms = computed(() => {
    const patient = this.currentPatient();
    if (!patient) return [];

    // Filtrar solo síntomas del paciente actual
    const allSymptoms = this.symptomStore.symptoms$();
    const patientSymptoms = allSymptoms.filter(s => s.patientId === patient.id);

    return patientSymptoms.slice(0, 3).map(s => ({
      id: s.id,
      symptom: this.getSymptomDescription(s),
      severity: this.getSeverityLevel(s),
      date: this.formatDate(s.timestamp),
      time: this.formatTime(s.timestamp)
    }));
  });

  // Diagnósticos activos
  protected readonly activeDiagnosesCount = computed(() => {
    const patient = this.currentPatient();
    if (!patient) return 0;

    // Filtrar solo diagnósticos del paciente actual
    const allDiagnoses = this.diagnosisStore.activeDiagnoses();
    const patientDiagnoses = allDiagnoses.filter(d => d.patientId === patient.id);

    return patientDiagnoses.length;
  });

  constructor(
    private router: Router,
    private patientStore: PatientStore,
    private userStore: UserStore,
    private symptomStore: SymptomStore,
    private diagnosisStore: DiagnosisStore,
    private medicationStore: MedicationStore,
    private alertStore: AlertStore,
    private appointmentsStore: AppointmentsStore
  ) {}

  ngOnInit(): void {
    console.log('Dashboard Patient inicializado');

    // Verificar autenticación usando UserStore (preferred) con fallback a localStorage
    let user = this.currentUser();
    if (!user) {
      const currentUserStr = localStorage.getItem('currentUser');
      const isAuthenticated = localStorage.getItem('isAuthenticated');
      if (currentUserStr && isAuthenticated === 'true') {
        try {
          const parsedUser = JSON.parse(currentUserStr);
          user = parsedUser;
          this.userStore.setCurrentUser(parsedUser);
          console.log('✅ Dashboard-Patient: Usuario cargado desde localStorage:', parsedUser.email);
        } catch (error) {
          console.error('❌ Dashboard-Patient: Error parsing currentUser:', error);
          this.router.navigate(['/iam/login']);
          return;
        }
      } else {
        console.warn('⚠️ Dashboard-Patient: No hay usuario autenticado');
        this.router.navigate(['/iam/login']);
        return;
      }
    }

    // Cargar datos del paciente autenticado
    if (user) {
      this.loadPatientData(user.id);
    }

    // React to user changes (login/logout/switch) to reload patient data without full page refresh
    try {
      window.addEventListener('userChanged', (ev: any) => {
        const detailUser = ev?.detail;
        const userId = detailUser?.id || (this.userStore.currentUser$()?.id);
        if (userId) {
          console.log('Dashboard-Patient: detected user change, reloading patient data for userId', userId);
          this.loadPatientData(userId);
        }
      });
    } catch (e) {
      // ignore in non-browser environments
    }
  }

  /**
   * Carga todos los datos del paciente
   */
  private loadPatientData(userId: number): void {

    // Cargar datos del paciente
    this.patientStore.loadAllPatients().subscribe({
      next: (patients) => {
        const patient = patients.find(p => p.userId === userId);
        if (patient) {
          console.log('✅ Dashboard-Patient: Paciente encontrado:', patient.firstName, patient.lastName, 'ID:', patient.id);
          this.patientStore.loadPatientById(patient.id).subscribe();

          // ✅ Cargar medicamentos del paciente actual (con force reload para limpiar cache)
          this.medicationStore.forceReload(patient.id.toString()).subscribe();

          // Cargar alertas del paciente actual
          this.alertStore.loadAlertsByPatient(patient.id.toString()).subscribe();

          // Cargar síntomas del paciente actual (filtrados)
          this.symptomStore.loadAllSymptoms().subscribe({
            next: (allSymptoms) => {
              // Filtrar solo los síntomas de este paciente
              const patientSymptoms = allSymptoms.filter(s => s.patientId === patient.id);
              console.log(`✅ Dashboard-Patient: ${patientSymptoms.length} síntomas encontrados para paciente ${patient.id}`);
            }
          });

          // Cargar diagnósticos del paciente actual (filtrados)
          this.diagnosisStore.loadAllDiagnoses().subscribe({
            next: (allDiagnoses) => {
              // Filtrar solo los diagnósticos de este paciente
              const patientDiagnoses = allDiagnoses.filter(d => d.patientId === patient.id);
              console.log(`✅ Dashboard-Patient: ${patientDiagnoses.length} diagnósticos encontrados para paciente ${patient.id}`);
            }
          });

          // ✅ Cargar citas del paciente actual
          this.appointmentsStore.loadAppointmentsByPatient(patient.id).subscribe();
        } else {
          console.warn('⚠️ Dashboard-Patient: No se encontró paciente para userId:', userId);
        }
      }
    });
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

  /**
   * Formatea fecha de cita (formato corto: "15 Abril")
   */
  private formatAppointmentDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
  }

  /**
   * trackBy function for ngFor to avoid re-rendering
   */
  protected trackById(index: number, item: { id?: any }) {
    return item?.id ?? index;
  }
}
