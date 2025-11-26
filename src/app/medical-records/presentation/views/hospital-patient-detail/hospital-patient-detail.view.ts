import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { PatientService } from '../../../../patients/infrastructure/patient.service';
import { DoctorService } from '../../../../doctors/infrastructure/doctor.service';
import { PatientEntity } from '../../../../patients/domain/model/patient.entity';
import { DoctorEntity } from '../../../../doctors/domain/model/doctor.entity';
import { environment } from '../../../../../environments/environment';

interface VitalSign {
  type: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  icon: string;
  date: string;
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  prescribedDate: string;
  prescribedBy: string;
}

interface Appointment {
  date: string;
  type: string;
  doctor: string;
  notes: string;
  status: 'completed' | 'scheduled' | 'cancelled';
}

@Component({
  selector: 'app-hospital-patient-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './hospital-patient-detail.view.html',
  styleUrls: ['./hospital-patient-detail.view.css']
})
export class HospitalPatientDetailView implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  private readonly patientService = inject(PatientService);
  private readonly doctorService = inject(DoctorService);
  private readonly baseUrl = environment.apiBaseUrl;

  loading = signal(true);
  patient = signal<PatientEntity | null>(null);
  assignedDoctor = signal<DoctorEntity | null>(null);
  
  // Medical data signals
  vitalSigns = signal<VitalSign[]>([]);
  medications = signal<Medication[]>([]);
  appointments = signal<Appointment[]>([]);

  // Computed properties
  patientAge = computed(() => {
    const p = this.patient();
    return p ? p.age : 0;
  });

  bmiStatus = computed(() => {
    const p = this.patient();
    if (!p) return 'normal';
    const bmi = p.bmi;
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  });

  bmiColor = computed(() => {
    const status = this.bmiStatus();
    switch (status) {
      case 'underweight': return '#f59e0b';
      case 'normal': return '#10b981';
      case 'overweight': return '#f59e0b';
      case 'obese': return '#ef4444';
      default: return '#64748b';
    }
  });

  ngOnInit(): void {
    const patientId = this.route.snapshot.paramMap.get('id');
    if (patientId) {
      this.loadPatientDetails(Number(patientId));
    }
  }

  private loadPatientDetails(patientId: number): void {
    this.loading.set(true);

    this.patientService.getById(patientId).subscribe({
      next: (patient) => {
        this.patient.set(patient);
        
        // Load assigned doctor if exists
        if (patient.assignedDoctorId) {
          this.doctorService.getById(patient.assignedDoctorId).subscribe({
            next: (doctor) => this.assignedDoctor.set(doctor),
            error: (err) => console.error('Error loading doctor:', err)
          });
        }

        // Load medical data from DB
        this.loadVitalSigns(patientId);
        this.loadMedications(patientId);
        this.loadAppointments(patientId);
        
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading patient:', err);
        this.loading.set(false);
      }
    });
  }

  private loadVitalSigns(patientId: number): void {
    // Load latest vital signs from records
    this.http.get<any[]>(`${this.baseUrl}${environment.medicalRecordsEndpointPath}?patientId=${patientId}`).subscribe({
      next: (records) => {
        if (records && records.length > 0) {
          // Get the most recent record with vital signs
          const latestRecord = records
            .filter(r => r.type === 'vital_signs')
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

          if (latestRecord) {
            const vitals: VitalSign[] = [];
            
            if (latestRecord.bloodPressure) {
              vitals.push({
                type: 'Presión Arterial',
                value: latestRecord.bloodPressure,
                unit: 'mmHg',
                status: this.getBloodPressureStatus(latestRecord.bloodPressure),
                icon: 'favorite',
                date: latestRecord.date
              });
            }
            
            if (latestRecord.heartRate) {
              vitals.push({
                type: 'Frecuencia Cardíaca',
                value: latestRecord.heartRate.toString(),
                unit: 'bpm',
                status: latestRecord.heartRate >= 60 && latestRecord.heartRate <= 100 ? 'normal' : 'warning',
                icon: 'monitor_heart',
                date: latestRecord.date
              });
            }
            
            if (latestRecord.temperature) {
              vitals.push({
                type: 'Temperatura',
                value: latestRecord.temperature.toString(),
                unit: '°C',
                status: latestRecord.temperature >= 36 && latestRecord.temperature <= 37.5 ? 'normal' : 'warning',
                icon: 'thermostat',
                date: latestRecord.date
              });
            }
            
            if (latestRecord.glucose) {
              vitals.push({
                type: 'Glucosa',
                value: latestRecord.glucose.toString(),
                unit: 'mg/dL',
                status: latestRecord.glucose >= 70 && latestRecord.glucose <= 140 ? 'normal' : 'warning',
                icon: 'water_drop',
                date: latestRecord.date
              });
            }
            
            this.vitalSigns.set(vitals);
          }
        }
      },
      error: (err) => console.error('Error loading vital signs:', err)
    });
  }

  private getBloodPressureStatus(bp: string): 'normal' | 'warning' | 'critical' {
    const [systolic, diastolic] = bp.split('/').map(Number);
    if (systolic >= 140 || diastolic >= 90) return 'critical';
    if (systolic >= 130 || diastolic >= 85) return 'warning';
    return 'normal';
  }

  private loadMedications(patientId: number): void {
    this.http.get<any[]>(`${this.baseUrl}${environment.medicationsEndpointPath}?patientId=${patientId}`).subscribe({
      next: (medications) => {
        const formattedMeds: Medication[] = medications
          .filter(med => med.status === 'active')
          .map(med => ({
            name: med.name || 'N/A',
            dosage: med.dosage || 'N/A',
            frequency: this.formatFrequency(med.schedule?.frequency) || 'N/A',
            prescribedDate: med.prescribedDate ? new Date(med.prescribedDate).toISOString().split('T')[0] : 'N/A',
            prescribedBy: med.prescribedBy || 'Sin información'
          }));
        this.medications.set(formattedMeds);
      },
      error: (err) => {
        console.error('Error loading medications:', err);
        this.medications.set([]);
      }
    });
  }

  private formatFrequency(frequency: string): string {
    const frequencies: Record<string, string> = {
      'once_daily': 'Una vez al día',
      'twice_daily': 'Dos veces al día',
      'three_times_daily': 'Tres veces al día',
      'four_times_daily': 'Cuatro veces al día',
      'every_8_hours': 'Cada 8 horas',
      'every_12_hours': 'Cada 12 horas'
    };
    return frequencies[frequency] || frequency || 'N/A';
  }

  private loadAppointments(patientId: number): void {
    this.http.get<any[]>(`${this.baseUrl}${environment.appointmentsEndpointPath}?patientId=${patientId}`).subscribe({
      next: (appointments) => {
        const formattedAppointments: Appointment[] = appointments.map(apt => ({
          date: apt.date || 'N/A',
          type: this.formatAppointmentType(apt.type) || 'Consulta',
          doctor: this.assignedDoctor()?.fullName || 'Sin asignar',
          notes: apt.notes || 'Sin notas',
          status: this.normalizeAppointmentStatus(apt.status)
        }));
        
        // Sort by date descending (most recent first)
        formattedAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        this.appointments.set(formattedAppointments);
      },
      error: (err) => {
        console.error('Error loading appointments:', err);
        this.appointments.set([]);
      }
    });
  }

  private normalizeAppointmentStatus(status: string): 'scheduled' | 'completed' | 'cancelled' {
    if (status === 'scheduled') return 'scheduled';
    if (status === 'completed') return 'completed';
    return 'cancelled';
  }

  private formatAppointmentType(type: string): string {
    const types: Record<string, string> = {
      'CONSULTATION': 'Consulta General',
      'FOLLOW_UP': 'Seguimiento',
      'EMERGENCY': 'Emergencia',
      'ROUTINE_CHECKUP': 'Chequeo de Rutina',
      'Chequeo de rutina': 'Chequeo de Rutina',
      'Seguimiento': 'Seguimiento',
      'Emergencia': 'Emergencia'
    };
    return types[type] || type;
  }

  getVitalSignColor(status: string): string {
    switch (status) {
      case 'normal': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#64748b';
    }
  }

  getAppointmentStatusColor(status: string): string {
    switch (status) {
      case 'completed': return '#10b981';
      case 'scheduled': return '#3b82f6';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  }

  getAppointmentStatusLabel(status: string): string {
    switch (status) {
      case 'completed': return 'Completada';
      case 'scheduled': return 'Programada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  }

  goBack(): void {
    this.router.navigate(['/hospital/patients']);
  }

  editPatient(): void {
    const patient = this.patient();
    if (patient) {
      // TODO: Navigate to edit patient view
      console.log('Edit patient:', patient.id);
    }
  }

  scheduleAppointment(): void {
    const patient = this.patient();
    if (patient) {
      // TODO: Navigate to appointment scheduling
      console.log('Schedule appointment for patient:', patient.id);
    }
  }

  prescribeMedication(): void {
    const patient = this.patient();
    if (patient) {
      // TODO: Navigate to medication prescription
      console.log('Prescribe medication for patient:', patient.id);
    }
  }
}
