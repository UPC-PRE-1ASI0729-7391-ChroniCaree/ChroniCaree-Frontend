import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { HospitalDashboardStore } from '../../../../tenants/application/hospital-dashboard.store';
import { PatientService } from '../../../../patients/infrastructure/patient.service';
import { DoctorService } from '../../../../doctors/infrastructure/doctor.service';
import { PatientEntity } from '../../../../patients/domain/model/patient.entity';
import { DoctorEntity } from '../../../../doctors/domain/model/doctor.entity';

interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  condition: string;
  assignedDoctor: string;
  doctorSpecialty: string;
  lastVisit: string;
  status: 'active' | 'monitoring' | 'critical';
}

@Component({
  selector: 'app-hospital-patients',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    TranslateModule,
  ],
  templateUrl: './hospital-patients.view.html',
  styleUrls: ['./hospital-patients.view.css']
})
export class HospitalPatientsView implements OnInit {
  private readonly router = inject(Router);
  private readonly hospitalStore = inject(HospitalDashboardStore);
  private readonly patientService = inject(PatientService);
  private readonly doctorService = inject(DoctorService);
  private readonly translate = inject(TranslateService);

  // Labels for comparison in template (so icon male/female works with i18n)
  readonly genderMaleLabel = this.translate.instant('hospital.patients.genders.male');
  readonly genderFemaleLabel = this.translate.instant('hospital.patients.genders.female');

  searchTerm = signal('');
  allPatients = signal<Patient[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  filteredPatients = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.allPatients();

    return this.allPatients().filter(patient =>
      patient.name.toLowerCase().includes(term) ||
      patient.condition.toLowerCase().includes(term) ||
      patient.assignedDoctor.toLowerCase().includes(term)
    );
  });

  totalPatients = computed(() => this.allPatients().length);
  activePatients = computed(() => this.allPatients().filter(p => p.status === 'active').length);
  criticalPatients = computed(() => this.allPatients().filter(p => p.status === 'critical').length);

  ngOnInit() {
    // Keep gender labels updated when language changes
    this.translate.onLangChange.subscribe(() => {
      (this as any).genderMaleLabel = this.translate.instant('hospital.patients.genders.male');
      (this as any).genderFemaleLabel = this.translate.instant('hospital.patients.genders.female');
    });

    this.loadPatients();
  }

  private loadPatients(): void {
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
      this.error.set(this.translate.instant('hospital.patients.errors.noAuthUser'));
      return;
    }

    const currentUser = JSON.parse(currentUserStr);
    if (!currentUser.tenantId) {
      this.error.set(this.translate.instant('hospital.patients.errors.noTenant'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.patientService.getByTenantId(currentUser.tenantId).subscribe({
      next: (patientEntities: PatientEntity[]) => {
        const patientPromises = patientEntities.map(p =>
          new Promise<Patient>((resolve) => {
            const basePatient = {
              id: p.id,
              name: p.fullName,
              age: p.age,
              gender: p.gender === 'male'
                ? this.translate.instant('hospital.patients.genders.male')
                : this.translate.instant('hospital.patients.genders.female'),
              condition: this.translate.instant('hospital.patients.defaults.condition'),
              lastVisit: new Date().toISOString().split('T')[0],
              status: this.getRandomStatus()
            };

            if (p.assignedDoctorId) {
              this.doctorService.getById(p.assignedDoctorId).subscribe({
                next: (doctor: DoctorEntity) => {
                  resolve({
                    ...basePatient,
                    assignedDoctor: doctor.fullName,
                    doctorSpecialty: doctor.specialty,
                  });
                },
                error: () => {
                  resolve({
                    ...basePatient,
                    assignedDoctor: this.translate.instant('hospital.patients.defaults.unassigned'),
                    doctorSpecialty: '-',
                    status: 'active'
                  });
                }
              });
            } else {
              resolve({
                ...basePatient,
                assignedDoctor: this.translate.instant('hospital.patients.defaults.unassigned'),
                doctorSpecialty: '-',
                status: 'active'
              });
            }
          })
        );

        Promise.all(patientPromises).then(patients => {
          this.allPatients.set(patients);
          this.loading.set(false);
        });
      },
      error: (err: any) => {
        this.error.set(this.translate.instant('hospital.patients.errors.loadPatients'));
        this.loading.set(false);
        console.error('Error loading patients:', err);
      }
    });
  }

  private getRandomStatus(): 'active' | 'monitoring' | 'critical' {
    const statuses: ('active' | 'monitoring' | 'critical')[] = ['active', 'monitoring', 'critical'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  viewPatientDetails(patientId: number) {
    this.router.navigate(['/hospital/patients', patientId]);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return '#10b981';
      case 'monitoring': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#64748b';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return this.translate.instant('hospital.patients.statuses.active');
      case 'monitoring': return this.translate.instant('hospital.patients.statuses.monitoring');
      case 'critical': return this.translate.instant('hospital.patients.statuses.critical');
      default: return status;
    }
  }
}
