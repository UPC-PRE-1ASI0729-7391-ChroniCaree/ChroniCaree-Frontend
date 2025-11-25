import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MedicalRecordsStore } from '../../../../doctors/application/medical-records.store';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule
  ],
  templateUrl: './medical-record-detail.html',
  styleUrls: ['./medical-record-detail.css'],
})
export class MedicalRecordDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly recordsStore = inject(MedicalRecordsStore);
  private readonly router = inject(Router);

  recordId = 0;
  record$ = this.recordsStore.selectedRecord;
  loading$ = computed(() => !this.record$());

  ngOnInit(): void {
    this.recordId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.recordId) {
      this.recordsStore.selectRecord(this.recordId);
    } else {
      console.error('❌ No se proporcionó ID de registro');
      this.goBack();
    }
  }

  getRecordTypeLabel(type?: string): string {
    const labels: Record<string, string> = {
      'vital_signs': 'Signos Vitales',
      'symptoms': 'Síntomas',
      'consultation': 'Consulta Médica',
      'lab_results': 'Resultados de Laboratorio'
    };
    return labels[type || ''] || 'Registro Médico';
  }

  getRecordTypeIcon(type?: string): string {
    const icons: Record<string, string> = {
      'vital_signs': 'monitor_heart',
      'symptoms': 'healing',
      'consultation': 'medical_services',
      'lab_results': 'science'
    };
    return icons[type || ''] || 'description';
  }

  getReviewStatusColor(status?: string): string {
    const colors: Record<string, string> = {
      'reviewed': 'reviewed',
      'pending': 'pending',
      'flagged': 'flagged'
    };
    return colors[status || ''] || 'pending';
  }

  getReviewStatusLabel(status?: string): string {
    const labels: Record<string, string> = {
      'reviewed': 'Revisado',
      'pending': 'Pendiente',
      'flagged': 'Marcado'
    };
    return labels[status || ''] || 'Sin revisar';
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  goBack(): void {
    this.router.navigate(['/medical-records/diagnoses']);
  }
}
