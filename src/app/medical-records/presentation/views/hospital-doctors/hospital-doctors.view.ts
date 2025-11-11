import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { HospitalDashboardStore } from '../../../../tenants/application/hospital-dashboard.store';
import { DoctorService } from '../../../../doctors/infrastructure/doctor.service';
import { PatientService } from '../../../../patients/infrastructure/patient.service';
import { DoctorEntity } from '../../../../doctors/domain/model/doctor.entity';
import { PatientEntity } from '../../../../patients/domain/model/patient.entity';

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
  ],
  templateUrl: './hospital-doctors.view.html',
  styleUrls: ['./hospital-doctors.view.css']
})
export class HospitalDoctorsView implements OnInit {
  private hospitalStore = inject(HospitalDashboardStore);
  private dialog = inject(MatDialog);
  private doctorService = inject(DoctorService);
  private patientService = inject(PatientService);

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
      this.error.set('No se encontró usuario autenticado');
      return;
    }

    const currentUser = JSON.parse(currentUserStr);
    if (!currentUser.tenantId) {
      this.error.set('Usuario sin hospital asignado');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    // Cargar doctores del hospital (por tenantId)
    this.doctorService.getByTenantId(currentUser.tenantId).subscribe({
      next: (doctorEntities) => {
        // Para cada doctor, cargar sus pacientes
        const doctorPromises = doctorEntities.map(doc => 
          new Promise<Doctor>((resolve) => {
            this.patientService.getByAssignedDoctorId(doc.id).subscribe({
              next: (patientEntities) => {
                const doctor: Doctor = {
                  id: doc.id,
                  name: doc.fullName,
                  email: `${doc.firstName.toLowerCase()}.${doc.lastName.toLowerCase()}@hospital.com`, // Simulado
                  specialty: doc.specialty,
                  licenseNumber: doc.licenseNumber,
                  patients: patientEntities.map(p => ({
                    id: p.id,
                    name: p.fullName,
                    age: p.age,
                    condition: 'Ver historial' // TODO: obtener de diagnoses
                  }))
                };
                resolve(doctor);
              },
              error: () => {
                // Si falla cargar pacientes, doctor sin pacientes
                const doctor: Doctor = {
                  id: doc.id,
                  name: doc.fullName,
                  email: `${doc.firstName.toLowerCase()}.${doc.lastName.toLowerCase()}@hospital.com`,
                  specialty: doc.specialty,
                  licenseNumber: doc.licenseNumber,
                  patients: []
                };
                resolve(doctor);
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
        this.error.set('Error al cargar doctores del hospital');
        this.loading.set(false);
        console.error('Error loading doctors:', err);
      }
    });
  }

  openAddDoctorDialog() {
    // TODO: Open dialog to add new doctor
    console.log('Opening add doctor dialog...');
    // const dialogRef = this.dialog.open(AddDoctorDialogComponent, {
    //   width: '600px',
    //   data: {}
    // });
    // 
    // dialogRef.afterClosed().subscribe(result => {
    //   if (result) {
    //     // Refresh doctors list
    //   }
    // });
  }

  viewPatient(patientId: number) {
    console.log('View patient:', patientId);
    // TODO: Navigate to patient details
  }

  editDoctor(doctorId: number) {
    console.log('Edit doctor:', doctorId);
    // TODO: Open edit dialog
  }

  deleteDoctor(doctorId: number) {
    console.log('Delete doctor:', doctorId);
    // TODO: Confirm and delete
  }
}
