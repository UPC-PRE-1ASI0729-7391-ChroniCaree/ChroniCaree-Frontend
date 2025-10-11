import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, NgIf, NgForOf } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PatientStore } from '../../../../patients/application/patient.store';
import { MedicalRecordsStore } from '../../../application/medical-records.store';
import { MedicalRecord, RecordType } from '../../../domain/model/medical-record.entity';

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, NgIf, NgForOf, RouterLink],
  templateUrl: './patient-detail.html',
  styleUrls: ['./patient-detail.css']
})
export class DoctorsPatientDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly patientStore = inject(PatientStore);
  private readonly recordsStore = inject(MedicalRecordsStore);

  readonly patient = signal<any | null>(null);
  readonly records = this.recordsStore.records;
  readonly loading = this.recordsStore.loading;
  readonly RecordType = RecordType;

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return;
    const patientId = Number(idParam);

    // Load patient
    this.patientStore.loadPatientById(patientId).subscribe({
      next: (p) => this.patient.set(p),
      error: (err) => console.error('Error loading patient', err)
    });

    // Load medical records for this patient
    this.recordsStore.loadRecordsByPatient(patientId);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES');
  }

  trackById(index: number, item: MedicalRecord) {
    return item?.id;
  }

  calculateAge(birthDate?: string): string {
    if (!birthDate) return 'N/A';
    try {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return String(age);
    } catch (e) {
      return 'N/A';
    }
  }
}
