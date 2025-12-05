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
    MatIconModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatChipsModule,
    MatCardModule,
    FormsModule,
  ],
  templateUrl: './hospital-assignments.view.html',
  styleUrls: ['./hospital-assignments.view.css']
})
export class HospitalAssignmentsView implements OnInit {
  private hospitalStore = inject(HospitalDashboardStore);
  private doctorService = inject(DoctorService);
  private patientService = inject(PatientService);

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

  private loadData(): void {
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

    // Cargar doctores y pacientes del hospital en paralelo
    this.doctorService.getByTenantId(currentUser.tenantId).subscribe({
      next: (doctorEntities: DoctorEntity[]) => {
        // Procesar doctores
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

        // Cargar pacientes del hospital
        this.patientService.getByTenantId(currentUser.tenantId).subscribe({
          next: (patientEntities: PatientEntity[]) => {
            const patients: Patient[] = patientEntities.map(p => ({
              id: p.id,
              name: p.fullName,
              age: p.age,
              condition: 'Ver diagnósticos', // TODO: obtener de diagnoses
              doctorId: p.assignedDoctorId
            }));
            this.patients.set(patients);
            this.loading.set(false);
          },
          error: (err: any) => {
            this.error.set('Error al cargar pacientes');
            this.loading.set(false);
            console.error('Error loading patients:', err);
          }
        });
      },
      error: (err: any) => {
        this.error.set('Error al cargar doctores del hospital');
        this.loading.set(false);
        console.error('Error loading doctors:', err);
      }
    });
  }

  assignPatientToDoctor(patientId: number, doctorId: number) {
    // Usar el endpoint PUT /patients/{id}/assign-doctor (no PATCH)
    this.patientService.assignDoctor(patientId, doctorId).subscribe({
      next: () => {
        // Update local state
        this.patients.update(patients => 
          patients.map(p => 
            p.id === patientId ? { ...p, doctorId } : p
          )
        );

        // Update doctor patient count
        this.doctors.update(doctors => 
          doctors.map(d => 
            d.id === doctorId 
              ? { ...d, patientCount: d.patientCount + 1 }
              : d
          )
        );

        console.log(`✅ Paciente ${patientId} asignado al doctor ${doctorId}`);
      },
      error: (err: any) => {
        console.error('Error asignando paciente:', err);
        this.error.set('Error al asignar paciente al doctor');
      }
    });
  }

  unassignPatient(patientId: number) {
    const patient = this.patients().find(p => p.id === patientId);
    if (!patient || !patient.doctorId) return;

    const oldDoctorId = patient.doctorId;

    // Actualizar en el backend
    this.patientService.updateAssignedDoctor(patientId, null).subscribe({
      next: () => {
        // Update local state
        this.patients.update(patients => 
          patients.map(p => 
            p.id === patientId ? { ...p, doctorId: null } : p
          )
        );

        // Update doctor patient count
        this.doctors.update(doctors => 
          doctors.map(d => 
            d.id === oldDoctorId 
              ? { ...d, patientCount: Math.max(0, d.patientCount - 1) }
              : d
          )
        );

        console.log(`✅ Paciente ${patientId} desasignado del doctor ${oldDoctorId}`);
      },
      error: (err: any) => {
        console.error('Error desasignando paciente:', err);
        this.error.set('Error al desasignar paciente');
      }
    });
  }

  getDoctorName(doctorId: number): string {
    return this.doctors().find(d => d.id === doctorId)?.name || 'Sin asignar';
  }

  getDoctorSpecialty(doctorId: number): string {
    return this.doctors().find(d => d.id === doctorId)?.specialty || '';
  }

  getPatientsByDoctor(doctorId: number): Patient[] {
    return this.patients().filter(p => p.doctorId === doctorId);
  }
}
