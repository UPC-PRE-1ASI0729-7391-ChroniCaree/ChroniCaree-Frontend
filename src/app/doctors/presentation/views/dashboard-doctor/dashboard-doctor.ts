
import { Component, OnInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { PdfExportResponse } from '../../../../shared/infrastructure/pdf-export.response';

@Component({
  selector: 'app-dashboard-doctor',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonToggleModule],
  templateUrl: './dashboard-doctor.html',
  styleUrl: './dashboard-doctor.css'
})
export class DashboardDoctor implements OnInit {

  // --- Referencia al área que se exportará ---
  @ViewChild('printArea', { static: false }) printArea!: ElementRef<HTMLElement>;

  // --- Estado de exportación ---
  protected readonly exporting = signal(false);

  // --- Datos de ejemplo (signals) ---
  protected readonly doctorName = signal('Dr. Juan Pérez');
  protected readonly specialty = signal('Cardiología');
  protected readonly todayAppointments = signal(8);
  protected readonly pendingReviews = signal(12);
  protected readonly activePatients = signal(45);

  protected readonly upcomingAppointments = signal([
    { id: 1, patientName: 'María García', time: '09:00', type: 'Consulta de control' },
    { id: 2, patientName: 'Carlos López', time: '10:30', type: 'Primera consulta' },
    { id: 3, patientName: 'Ana Martínez', time: '11:00', type: 'Seguimiento' },
    { id: 4, patientName: 'Pedro Rodríguez', time: '12:00', type: 'Revisión anual' }
  ]);

  protected readonly criticalAlerts = signal([
    { id: 1, patientName: 'Luis Torres', condition: 'Presión arterial elevada', severity: 'high', time: '08:45' },
    { id: 2, patientName: 'Carmen Silva', condition: 'Glucosa fuera de rango', severity: 'medium', time: '08:30' }
  ]);

  // --- Chart data signals ---
  protected readonly rangeDays = signal(7);
  protected readonly gridLines = signal([0, 1, 2, 3, 4]);

  // Datos de glucosa (ejemplo)
  protected readonly glucose = signal([
    { value: 110, date: '2024-01-01' },
    { value: 95, date: '2024-01-02' },
    { value: 105, date: '2024-01-03' },
    { value: 115, date: '2024-01-04' },
    { value: 100, date: '2024-01-05' },
    { value: 108, date: '2024-01-06' },
    { value: 98, date: '2024-01-07' }
  ]);

  // Datos de presión arterial sistólica
  protected readonly systolic = signal([
    { value: 120, date: '2024-01-01' },
    { value: 118, date: '2024-01-02' },
    { value: 122, date: '2024-01-03' },
    { value: 125, date: '2024-01-04' },
    { value: 119, date: '2024-01-05' },
    { value: 121, date: '2024-01-06' },
    { value: 117, date: '2024-01-07' }
  ]);

  // Datos de presión arterial diastólica
  protected readonly diastolic = signal([
    { value: 80, date: '2024-01-01' },
    { value: 78, date: '2024-01-02' },
    { value: 82, date: '2024-01-03' },
    { value: 85, date: '2024-01-04' },
    { value: 79, date: '2024-01-05' },
    { value: 81, date: '2024-01-06' },
    { value: 77, date: '2024-01-07' }
  ]);

  // Datos de SpO2
  protected readonly spo2 = signal([
    { value: 98, date: '2024-01-01' },
    { value: 97, date: '2024-01-02' },
    { value: 99, date: '2024-01-03' },
    { value: 98, date: '2024-01-04' },
    { value: 96, date: '2024-01-05' },
    { value: 98, date: '2024-01-06' },
    { value: 97, date: '2024-01-07' }
  ]);

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('Dashboard Doctor inicializado');
    
    // Verificar autenticación
    const currentUserStr = localStorage.getItem('currentUser');
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    
    if (!currentUserStr || isAuthenticated !== 'true') {
      console.warn('⚠️ Dashboard-Doctor: No hay usuario autenticado');
      this.router.navigate(['/iam/login']);
      return;
    }
    
    try {
      const currentUser = JSON.parse(currentUserStr);
      console.log('✅ Dashboard-Doctor: Usuario autenticado:', currentUser.email);
      
      // Aquí podrías cargar datos específicos del doctor si es necesario
      // Por ejemplo: cargar estadísticas reales del doctor actual
      
    } catch (error) {
      console.error('❌ Dashboard-Doctor: Error parsing currentUser:', error);
      this.router.navigate(['/iam/login']);
      return;
    }
  }

  // --- Acción: exportar PDF del dashboard ---
  async onExportPdf(): Promise<void> {
    if (!this.printArea) return;
    this.exporting.set(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await PdfExportResponse.exportElementToPdf(this.printArea.nativeElement, {
        filename: `dashboard-doctor-${today}.pdf`,
        margin: 8,
        scale: 2
      });
    } finally {
      this.exporting.set(false);
    }
  }

  // --- Chart helper methods ---
  setRange(days: number): void {
    this.rangeDays.set(days);
  }

  pointCx(index: number, total: number): number {
    const width = 280;
    const padding = 20;
    const step = (width - 2 * padding) / Math.max(total - 1, 1);
    return padding + index * step;
  }

  pointCy(value: number, min: number, max: number): number {
    const height = 160;
    const padding = 20;
    const range = max - min;
    const normalized = (value - min) / range;
    return height - padding - normalized * (height - 2 * padding);
  }

  labelMinMax(min: number, max: number): string {
    return `${min} - ${max}`;
  }

  glucosePath(): string {
    const data = this.glucose();
    if (data.length === 0) return '';
    
    const points = data.map((p, i) => {
      const x = this.pointCx(i, data.length);
      const y = this.pointCy(p.value, 50, 220);
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    });
    
    return points.join(' ');
  }

  systolicPath(): string {
    const data = this.systolic();
    if (data.length === 0) return '';
    
    const points = data.map((p, i) => {
      const x = this.pointCx(i, data.length);
      const y = this.pointCy(p.value, 40, 160);
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    });
    
    return points.join(' ');
  }

  diastolicPath(): string {
    const data = this.diastolic();
    if (data.length === 0) return '';
    
    const points = data.map((p, i) => {
      const x = this.pointCx(i, data.length);
      const y = this.pointCy(p.value, 40, 160);
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    });
    
    return points.join(' ');
  }

  spo2Path(): string {
    const data = this.spo2();
    if (data.length === 0) return '';
    
    const points = data.map((p, i) => {
      const x = this.pointCx(i, data.length);
      const y = this.pointCy(p.value, 92, 100);
      return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    });
    
    return points.join(' ');
  }
}
