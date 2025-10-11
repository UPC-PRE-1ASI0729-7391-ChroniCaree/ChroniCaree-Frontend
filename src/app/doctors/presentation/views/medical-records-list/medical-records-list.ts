/**
 * Medical Records List View
 * Doctors Bounded Context - Presentation Layer
 */
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MedicalRecordsStore } from '../../../application/medical-records.store';
import { RecordType } from '../../../domain/model/medical-record.entity';
import { DoctorApiEndpoint } from '../../../infrastructure/doctor-api.endpoint';

@Component({
  selector: 'app-medical-records-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medical-records-list.html',
  styleUrl: './medical-records-list.css'
})
export class MedicalRecordsListComponent implements OnInit {
  private readonly recordsStore = inject(MedicalRecordsStore);
  private readonly doctorApi = inject(DoctorApiEndpoint);
  
  readonly RecordType = RecordType;
  
  readonly records = this.recordsStore.records;
  readonly loading = this.recordsStore.loading;
  readonly error = this.recordsStore.error;
  
  readonly vitalSignsRecords = this.recordsStore.vitalSignsRecords;
  readonly symptomsRecords = this.recordsStore.symptomsRecords;
  readonly consultationRecords = this.recordsStore.consultationRecords;
  readonly totalRecords = this.recordsStore.totalRecords;
  
  private readonly doctorId = signal<number | null>(null);
  readonly selectedTab = signal<'all' | 'vital_signs' | 'symptoms' | 'consultation'>('all');
  
  ngOnInit(): void {
    this.loadDoctorAndRecords();
  }
  
  private loadDoctorAndRecords(): void {
    const currentUserStr = localStorage.getItem('currentUser');
    
    if (!currentUserStr) {
      console.error('❌ No user found in localStorage');
      return;
    }
    
    const currentUser = JSON.parse(currentUserStr);
    const userId = currentUser.id;
    
    this.doctorApi.getAll().subscribe({
      next: (doctors) => {
        const doctor = doctors.find(d => d.userId === userId);
        
        if (doctor) {
          console.log(`✅ Doctor found: ID ${doctor.id}`);
          this.doctorId.set(doctor.id);
          this.recordsStore.loadRecordsByDoctor(doctor.id);
        } else {
          console.error(`❌ No doctor found for userId ${userId}`);
        }
      },
      error: (err) => console.error('❌ Error fetching doctors:', err)
    });
  }
  
  setTab(tab: 'all' | 'vital_signs' | 'symptoms' | 'consultation'): void {
    this.selectedTab.set(tab);
  }
  
  getFilteredRecords() {
    switch (this.selectedTab()) {
      case 'vital_signs': return this.vitalSignsRecords();
      case 'symptoms': return this.symptomsRecords();
      case 'consultation': return this.consultationRecords();
      default: return this.records();
    }
  }
  
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  getRecordTypeLabel(type: RecordType): string {
    switch (type) {
      case RecordType.VITAL_SIGNS: return '🩺 Signos Vitales';
      case RecordType.SYMPTOMS: return '🤒 Síntomas';
      case RecordType.CONSULTATION: return '👨‍⚕️ Consulta';
      default: return type;
    }
  }
  
  refresh(): void {
    const currentDoctorId = this.doctorId();
    if (currentDoctorId) {
      this.recordsStore.refresh(currentDoctorId);
    }
  }
}
