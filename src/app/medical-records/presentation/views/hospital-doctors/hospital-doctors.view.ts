import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { HospitalDashboardStore } from '../../../../tenants/application/hospital-dashboard.store';
import { DoctorService } from '../../../../doctors/infrastructure/doctor.service';
import { PatientService } from '../../../../patients/infrastructure/patient.service';

interface Doctor {
  id: number;
  name: string;
  email: string;
  specialty: string;
  licenseNumber: string;
  patients: Patient[];
}

interface Patient {
  id: number;
  name: string;
  age: number;
  condition: string;
}

@Component({
  selector: 'app-hospital-doctors',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatChipsModule,
    MatDialogModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './hospital-doctors.view.html',
  styleUrls: ['./hospital-doctors.view.css']
})
export class HospitalDoctorsView implements OnInit {
  private readonly hospitalStore = inject(HospitalDashboardStore);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly doctorService = inject(DoctorService);
  private readonly patientService = inject(PatientService);
  private readonly translate = inject(TranslateService);

  doctors = signal<Doctor[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  totalDoctors = computed(() => this.doctors().length);
  totalPatients = computed(() =>
    this.doctors().reduce((sum, doctor) => sum + doctor.patients.length, 0)
  );

  ngOnInit() {
    this.loadDoctors();
  }

  private loadDoctors(): void {
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
      this.error.set(this.translate.instant('hospital.doctors.errors.noAuthUser'));
      return;
    }

    const currentUser = JSON.parse(currentUserStr);
    if (!currentUser.tenantId) {
      this.error.set(this.translate.instant('hospital.doctors.errors.noTenant'));
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.doctorService.getByTenantId(currentUser.tenantId).subscribe({
      next: (doctorEntities) => {
        const doctorPromises = doctorEntities.map(doc =>
          new Promise<Doctor>((resolve) => {
            this.patientService.getByAssignedDoctorId(doc.id).subscribe({
              next: (patientEntities) => {
                resolve({
                  id: doc.id,
                  name: doc.fullName,
                  email: `${doc.firstName.toLowerCase()}.${doc.lastName.toLowerCase()}@hospital.com`,
                  specialty: doc.specialty,
                  licenseNumber: doc.licenseNumber,
                  patients: patientEntities.map(p => ({
                    id: p.id,
                    name: p.fullName,
                    age: p.age,
                    condition: this.translate.instant('hospital.doctors.patient.conditionFallback')
                  }))
                });
              },
              error: () => {
                resolve({
                  id: doc.id,
                  name: doc.fullName,
                  email: `${doc.firstName.toLowerCase()}.${doc.lastName.toLowerCase()}@hospital.com`,
                  specialty: doc.specialty,
                  licenseNumber: doc.licenseNumber,
                  patients: []
                });
              }
            });
          })
        );

        Promise.all(doctorPromises).then(doctors => {
          this.doctors.set(doctors);
          this.loading.set(false);
        });
      },
      error: (err) => {
        this.error.set(this.translate.instant('hospital.doctors.errors.loadDoctors'));
        this.loading.set(false);
        console.error('Error loading doctors:', err);
      }
    });
  }

  openAddDoctorDialog() {
    this.router.navigate(['/hospital/doctors/add']);
  }

  viewPatient(patientId: number) {
    this.router.navigate(['/hospital/patients', patientId]);
  }

  editDoctor(doctorId: number) {
    this.router.navigate(['/hospital/doctors', doctorId, 'edit']);
  }

  deleteDoctor(doctorId: number) {
    const doctor = this.doctors().find(d => d.id === doctorId);
    if (!doctor) return;

    const confirmed = confirm(
      this.translate.instant('hospital.doctors.confirm.delete', { name: doctor.name })
    );

    if (!confirmed) return;

    this.loading.set(true);

    this.doctorService.delete(doctorId).subscribe({
      next: () => {
        this.doctors.set(this.doctors().filter(d => d.id !== doctorId));
        this.loading.set(false);
        alert(this.translate.instant('hospital.doctors.snack.deleted', { name: doctor.name }));
      },
      error: (err) => {
        console.error('Error deleting doctor:', err);
        this.loading.set(false);
        alert(this.translate.instant('hospital.doctors.snack.deleteError'));
      }
    });
  }
}
