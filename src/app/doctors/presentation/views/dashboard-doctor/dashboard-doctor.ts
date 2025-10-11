
import { Component, OnInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
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
}
