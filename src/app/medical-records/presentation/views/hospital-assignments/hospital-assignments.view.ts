import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatChipsModule } from '@angular/material/chips';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HospitalDashboardStore } from '../../../../tenants/application/hospital-dashboard.store';
import { DoctorService } from '../../../../doctors/infrastructure/doctor.service';
import { PatientService } from '../../../../patients/infrastructure/patient.service';
import { DoctorEntity } from '../../../../doctors/domain/model/doctor.entity';
import { PatientEntity } from '../../../../patients/domain/model/patient.entity';

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  patientCount: number;
}

interface Patient {
  id: number;
  name: string;
  age: number;
  condition: string;
  doctorId: number | null;
}

@Component({
  selector: 'app-hospital-assignments',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatCardModule,
    MatTooltipModule,
    TranslateModule,
  ],
  templateUrl: './hospital-assignments.view.html',
  styleUrls: ['./hospital-assignments.view.css']
})
export class HospitalAssignmentsView implements OnInit {
  private readonly hospitalStore = inject(HospitalDashboardStore);
  private readonly doctorService = inject(DoctorService);
  private readonly patientService = inject(PatientService);
  private readonly translate = inject(TranslateService);

  doctors = signal<Doctor[]>([]);
  patients = signal<Patient[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  unassignedPatients = computed(() =>
    this.patients().filter(p => p.doctorId === null)
  );

  assignedPatients = computed(() =>
    this.patients().filter(p => p.doctorId !== null)
  );

  ngOnInit() {
    this.loadData();
  }

  private setErrorKey(key: string): void {
    this.error.set(this.translate.instant(key));
  }

  private loadData(): void {
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
      this.setErrorKey('hospitalAssignments.errors.noAuthUser');
      return;
    }

    const currentUser = JSON.parse(currentUserStr);
    if (!currentUser.tenantId) {
      this.setErrorKey('hospitalAssignments.errors.noTenant');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.doctorService.getByTenantId(currentUser.tenantId).subscribe({
      next: (doctorEntities: DoctorEntity[]) => {
        const doctorPromises = doctorEntities.map(doc =>
          new Promise<Doctor>((resolve) => {
            this.patientService.getByAssignedDoctorId(doc.id).subscribe({
              next: (patients: PatientEntity[]) => {
                resolve({
                  id: doc.id,
                  name: doc.fullName,
                  specialty: doc.specialty,
                  patientCount: patients.length
                });
              },
              error: () => {
                resolve({
                  id: doc.id,
                  name: doc.fullName,
                  specialty: doc.specialty,
                  patientCount: 0
                });
              }
            });
          })
        );

        Promise.all(doctorPromises).then(doctors => {
          this.doctors.set(doctors);
        });

        this.patientService.getByTenantId(currentUser.tenantId).subscribe({
          next: (patientEntities: PatientEntity[]) => {
            const patients: Patient[] = patientEntities.map(p => ({
              id: p.id,
              name: p.fullName,
              age: p.age,
              condition: this.translate.instant('hospitalAssignments.patient.conditionFallback'),
              doctorId: p.assignedDoctorId
            }));
            this.patients.set(patients);
            this.loading.set(false);
          },
          error: () => {
            this.setErrorKey('hospitalAssignments.errors.loadPatients');
            this.loading.set(false);
          }
        });
      },
      error: () => {
        this.setErrorKey('hospitalAssignments.errors.loadDoctors');
        this.loading.set(false);
      }
    });
  }

  assignPatientToDoctor(patientId: number, doctorId: number) {

    // Usar el endpoint PUT /patients/{id}/assign-doctor (no PATCH)
    this.patientService.assignDoctor(patientId, doctorId).subscribe({
      next: () => {
        this.patients.update(patients =>
          patients.map(p =>
            p.id === patientId ? { ...p, doctorId } : p
          )
        );

        this.doctors.update(doctors =>
          doctors.map(d =>
            d.id === doctorId
              ? { ...d, patientCount: d.patientCount + 1 }
              : d
          )
        );
      },
      error: () => {
        this.setErrorKey('hospitalAssignments.errors.assign');
      }
    });
  }

  unassignPatient(patientId: number) {
    const patient = this.patients().find(p => p.id === patientId);
    if (!patient || !patient.doctorId) return;

    const oldDoctorId = patient.doctorId;

    this.patientService.updateAssignedDoctor(patientId, null).subscribe({
      next: () => {
        this.patients.update(patients =>
          patients.map(p =>
            p.id === patientId ? { ...p, doctorId: null } : p
          )
        );

        this.doctors.update(doctors =>
          doctors.map(d =>
            d.id === oldDoctorId
              ? { ...d, patientCount: Math.max(0, d.patientCount - 1) }
              : d
          )
        );
      },
      error: () => {
        this.setErrorKey('hospitalAssignments.errors.unassign');
      }
    });
  }

  getDoctorName(doctorId: number): string {
    return this.doctors().find(d => d.id === doctorId)?.name || '';
  }

  getDoctorSpecialty(doctorId: number): string {
    return this.doctors().find(d => d.id === doctorId)?.specialty || '';
  }

  getPatientsByDoctor(doctorId: number): Patient[] {
    return this.patients().filter(p => p.doctorId === doctorId);
  }
}
