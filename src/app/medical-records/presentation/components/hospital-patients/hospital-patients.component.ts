import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientService } from '../../../../patients/infrastructure/patient.service';
import { DoctorService } from '../../../../doctors/infrastructure/doctor.service';
import { SubscriptionService } from '../../../../subscriptions/infrastructure/subscription.service';

interface PatientView {
  id: number;
  fullName: string;
  age: number;
  gender: string;
  assignedDoctorName: string | null;
  subscriptionPlan: string;
  conditions: string[];
  lastVisit?: string;
}

interface FilterOptions {
  doctorId: number | null;
  subscriptionStatus: string;
  searchTerm: string;
}

@Component({
  selector: 'app-hospital-patients',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hospital-patients.component.html',
  styleUrls: ['./hospital-patients.component.css']
})
export class HospitalPatientsComponent implements OnInit {
  private readonly patientService = inject(PatientService);
  private readonly doctorService = inject(DoctorService);
  private readonly subscriptionService = inject(SubscriptionService);

  patients = signal<PatientView[]>([]);
  filteredPatients = computed(() => {
    let result = this.patients();
    const filters = this.filters();

    if (filters.searchTerm) {
      result = result.filter(p => 
        p.fullName.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    if (filters.subscriptionStatus && filters.subscriptionStatus !== 'all') {
      result = result.filter(p => p.subscriptionPlan.toLowerCase() === filters.subscriptionStatus);
    }

    return result;
  });

  filters = signal<FilterOptions>({
    doctorId: null,
    subscriptionStatus: 'all',
    searchTerm: ''
  });

  isLoading = signal<boolean>(false);

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.isLoading.set(true);
    const tenantId = 1; // TODO: Get from auth

    // TODO: Implement proper filtering by tenantId
    // For now showing placeholder data
    setTimeout(() => {
      const mockPatients: PatientView[] = [
        {
          id: 1,
          fullName: 'Ana Rodríguez',
          age: 45,
          gender: 'Femenino',
          assignedDoctorName: 'Dr. Juan Torres',
          subscriptionPlan: 'Premium',
          conditions: ['Diabetes tipo 2', 'Hipertensión'],
          lastVisit: '2025-10-10'
        }
      ];
      this.patients.set(mockPatients);
      this.isLoading.set(false);
    }, 500);
  }

  updateFilters(updates: Partial<FilterOptions>): void {
    this.filters.update(current => ({ ...current, ...updates }));
  }

  assignDoctor(patientId: number): void {
    // TODO: Navigate to assignment view
    console.log('Assign doctor to patient:', patientId);
  }

  viewPatientDetails(patientId: number): void {
    // TODO: Navigate to patient details
    console.log('View patient:', patientId);
  }
}
