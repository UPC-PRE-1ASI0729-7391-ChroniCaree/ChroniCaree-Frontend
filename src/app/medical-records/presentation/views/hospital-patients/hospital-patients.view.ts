import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
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
  ],
  templateUrl: './hospital-patients.view.html',
  styleUrls: ['./hospital-patients.view.css']
})
export class HospitalPatientsView implements OnInit {
  private hospitalStore = inject(HospitalDashboardStore);
  private patientService = inject(PatientService);
  private doctorService = inject(DoctorService);

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
  activePatients = computed(() => 
    this.allPatients().filter(p => p.status === 'active').length
  );
  criticalPatients = computed(() => 
    this.allPatients().filter(p => p.status === 'critical').length
  );

  ngOnInit() {
    this.loadPatients();
  }

  private loadPatients(): void {
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

    // Cargar pacientes del hospital (por tenantId)
    this.patientService.getByTenantId(currentUser.tenantId).subscribe({
      next: (patientEntities: PatientEntity[]) => {
        // Para cada paciente, obtener info del doctor asignado
        const patientPromises = patientEntities.map(p => 
          new Promise<Patient>((resolve) => {
            if (p.assignedDoctorId) {
              this.doctorService.getById(p.assignedDoctorId).subscribe({
                next: (doctor: DoctorEntity) => {
                  const patient: Patient = {
                    id: p.id,
                    name: p.fullName,
                    age: p.age,
                    gender: p.gender === 'male' ? 'Masculino' : 'Femenino',
                    condition: 'Ver diagnósticos', // TODO: obtener de diagnoses
                    assignedDoctor: doctor.fullName,
                    doctorSpecialty: doctor.specialty,
                    lastVisit: new Date().toISOString().split('T')[0], // TODO: obtener de appointments
                    status: this.getRandomStatus() // TODO: calcular según condición real
                  };
                  resolve(patient);
                },
                error: () => {
                  // Si falla cargar doctor, paciente sin doctor
                  const patient: Patient = {
                    id: p.id,
                    name: p.fullName,
                    age: p.age,
                    gender: p.gender === 'male' ? 'Masculino' : 'Femenino',
                    condition: 'Ver diagnósticos',
                    assignedDoctor: 'Sin asignar',
                    doctorSpecialty: '-',
                    lastVisit: new Date().toISOString().split('T')[0],
                    status: 'active'
                  };
                  resolve(patient);
                }
              });
            } else {
              // Paciente sin doctor asignado
              const patient: Patient = {
                id: p.id,
                name: p.fullName,
                age: p.age,
                gender: p.gender === 'male' ? 'Masculino' : 'Femenino',
                condition: 'Ver diagnósticos',
                assignedDoctor: 'Sin asignar',
                doctorSpecialty: '-',
                lastVisit: new Date().toISOString().split('T')[0],
                status: 'active'
              };
              resolve(patient);
            }
          })
        );

        Promise.all(patientPromises).then(patients => {
          this.allPatients.set(patients);
          this.loading.set(false);
        });
      },
      error: (err: any) => {
        this.error.set('Error al cargar pacientes del hospital');
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
    console.log('View patient details:', patientId);
    // TODO: Navigate to patient details view
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
      case 'active': return 'Activo';
      case 'monitoring': return 'En Monitoreo';
      case 'critical': return 'Crítico';
      default: return status;
    }
  }
}
