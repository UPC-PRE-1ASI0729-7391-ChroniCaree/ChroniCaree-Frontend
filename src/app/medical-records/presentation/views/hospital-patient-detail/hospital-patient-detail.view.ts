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

import { TranslateModule } from '@ngx-translate/core';

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
    MatDividerModule,
    TranslateModule,
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

  vitalSigns = signal<VitalSign[]>([]);
  medications = signal<Medication[]>([]);
  appointments = signal<Appointment[]>([]);

  patientAge = computed(() => this.patient()?.age ?? 0);

  bmiStatus = computed(() => {
    const bmi = this.patient()?.bmi;
    if (typeof bmi !== 'number') return 'normal';
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
    if (patientId) this.loadPatientDetails(Number(patientId));
  }

  private loadPatientDetails(patientId: number): void {
    this.loading.set(true);

    this.patientService.getById(patientId).subscribe({
      next: (patient) => {
        this.patient.set(patient);

        if (patient.assignedDoctorId) {
          this.doctorService.getById(patient.assignedDoctorId).subscribe({
            next: (doctor) => this.assignedDoctor.set(doctor),
            error: (err) => console.error('Error loading doctor:', err)
          });
        } else {
          this.assignedDoctor.set(null);
        }

        this.loadVitalSigns(patientId);
        this.loadMedications(patientId);
        this.loadAppointments(patientId);

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading patient:', err);
        this.patient.set(null);
        this.loading.set(false);
      }
    });
  }

  private loadVitalSigns(patientId: number): void {
    this.http.get<any[]>(
      `${this.baseUrl}${environment.medicalRecordsEndpointPath}?patientId=${patientId}`
    ).subscribe({
      next: (records) => {
        if (!records?.length) return;

        const latestRecord = records
          .filter(r => r.type === 'vital_signs')
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

        if (!latestRecord) return;

        const vitals: VitalSign[] = [];

        if (latestRecord.bloodPressure) {
          vitals.push({
            type: 'hospital.patientDetail.vitals.types.bloodPressure',
            value: latestRecord.bloodPressure,
            unit: 'mmHg',
            status: this.getBloodPressureStatus(latestRecord.bloodPressure),
            icon: 'favorite',
            date: latestRecord.date
          });
        }

        if (latestRecord.heartRate) {
          vitals.push({
            type: 'hospital.patientDetail.vitals.types.heartRate',
            value: String(latestRecord.heartRate),
            unit: 'bpm',
            status: latestRecord.heartRate >= 60 && latestRecord.heartRate <= 100 ? 'normal' : 'warning',
            icon: 'monitor_heart',
            date: latestRecord.date
          });
        }

        if (latestRecord.temperature) {
          vitals.push({
            type: 'hospital.patientDetail.vitals.types.temperature',
            value: String(latestRecord.temperature),
            unit: '°C',
            status: latestRecord.temperature >= 36 && latestRecord.temperature <= 37.5 ? 'normal' : 'warning',
            icon: 'thermostat',
            date: latestRecord.date
          });
        }

        if (latestRecord.glucose) {
          vitals.push({
            type: 'hospital.patientDetail.vitals.types.glucose',
            value: String(latestRecord.glucose),
            unit: 'mg/dL',
            status: latestRecord.glucose >= 70 && latestRecord.glucose <= 140 ? 'normal' : 'warning',
            icon: 'water_drop',
            date: latestRecord.date
          });
        }

        this.vitalSigns.set(vitals);
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
    this.http.get<any[]>(
      `${this.baseUrl}${environment.medicationsEndpointPath}?patientId=${patientId}`
    ).subscribe({
      next: (meds) => {
        const formatted: Medication[] = (meds ?? [])
          .filter(med => med.status === 'active')
          .map(med => ({
            name: med.name || 'N/A',
            dosage: med.dosage || 'N/A',
            frequency: this.frequencyKey(med.schedule?.frequency),
            prescribedDate: med.prescribedDate ? med.prescribedDate : new Date().toISOString(),
            prescribedBy: med.prescribedBy || 'N/A'
          }));

        this.medications.set(formatted);
      },
      error: (err) => {
        console.error('Error loading medications:', err);
        this.medications.set([]);
      }
    });
  }

  private frequencyKey(freq: string): string {
    const map: Record<string, string> = {
      once_daily: 'hospital.patientDetail.medications.frequencies.once_daily',
      twice_daily: 'hospital.patientDetail.medications.frequencies.twice_daily',
      three_times_daily: 'hospital.patientDetail.medications.frequencies.three_times_daily',
      four_times_daily: 'hospital.patientDetail.medications.frequencies.four_times_daily',
      every_8_hours: 'hospital.patientDetail.medications.frequencies.every_8_hours',
      every_12_hours: 'hospital.patientDetail.medications.frequencies.every_12_hours'
    };
    return map[freq] || 'hospital.patientDetail.medications.frequencies.unknown';
  }

  private loadAppointments(patientId: number): void {
    this.http.get<any[]>(
      `${this.baseUrl}${environment.appointmentsEndpointPath}?patientId=${patientId}`
    ).subscribe({
      next: (apts) => {
        const formatted: Appointment[] = (apts ?? []).map(apt => ({
          date: apt.date || new Date().toISOString(),
          type: this.appointmentTypeKey(apt.type),
          doctor: this.assignedDoctor()?.fullName || '—',
          notes: apt.notes || '—',
          status: this.normalizeAppointmentStatus(apt.status)
        }));

        formatted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.appointments.set(formatted);
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

  private appointmentTypeKey(type: string): string {
    const map: Record<string, string> = {
      CONSULTATION: 'hospital.patientDetail.appointments.types.consultation',
      FOLLOW_UP: 'hospital.patientDetail.appointments.types.followUp',
      EMERGENCY: 'hospital.patientDetail.appointments.types.emergency',
      ROUTINE_CHECKUP: 'hospital.patientDetail.appointments.types.routineCheck'
    };
    return map[type] || 'hospital.patientDetail.appointments.types.consultation';
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
      case 'completed': return 'hospital.patientDetail.appointments.status.completed';
      case 'scheduled': return 'hospital.patientDetail.appointments.status.scheduled';
      case 'cancelled': return 'hospital.patientDetail.appointments.status.cancelled';
      default: return 'hospital.patientDetail.appointments.status.cancelled';
    }
  }

  goBack(): void {
    this.router.navigate(['/hospital/patients']);
  }

  editPatient(): void {
    const p = this.patient();
    if (p) console.log('Edit patient:', p.id);
  }

  scheduleAppointment(): void {
    const p = this.patient();
    if (p) console.log('Schedule appointment for patient:', p.id);
  }
}
