// src/app/doctors/presentation/views/dashboard-doctor/dashboard-doctor.ts
import { Component, OnInit, ViewChild, ElementRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PdfExportService } from '../../../../shared/infrastructure/pdf-export.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

type TimePoint = { date: string; value: number };

@Component({
  selector: 'app-dashboard-doctor',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonToggleModule],
  templateUrl: './dashboard-doctor.html',
  styleUrl: './dashboard-doctor.css'
})
export class DashboardDoctor implements OnInit {
  // Área a exportar
  @ViewChild('printArea', { static: false }) printArea!: ElementRef<HTMLElement>;

  // Estado
  protected readonly exporting = signal(false);

  // Datos básicos (demo)
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

  // ------- Gráficos de evolución (solo frontend) -------
  protected readonly rangeDays = signal<7 | 14 | 30 | 60>(30);

  // Series completas (60 días simulados)
  protected readonly allGlucose  = signal<TimePoint[]>(this.genSeries(60, 110, 25)); // mg/dL
  protected readonly allSystolic = signal<TimePoint[]>(this.genSeries(60, 120, 15)); // mmHg
  protected readonly allDiastolic= signal<TimePoint[]>(this.genSeries(60, 78, 10));  // mmHg
  protected readonly allSpO2     = signal<TimePoint[]>(this.genSeries(60, 97, 2));   // %

  // Filtrado por periodo seleccionado
  protected readonly glucose  = computed(() => this.filterLastDays(this.allGlucose(),  this.rangeDays()));
  protected readonly systolic = computed(() => this.filterLastDays(this.allSystolic(), this.rangeDays()));
  protected readonly diastolic= computed(() => this.filterLastDays(this.allDiastolic(),this.rangeDays()));
  protected readonly spo2     = computed(() => this.filterLastDays(this.allSpO2(),     this.rangeDays()));

  // Dimensiones para el cálculo de paths
  private readonly W = 600;
  private readonly H = 220;
  private readonly padL = 24;
  private readonly padR = 8;
  private readonly padT = 12;
  private readonly padB = 20;

  // Límites Y por métrica (para escalar)
  private readonly Y_GLU = { min: 50, max: 220 };
  private readonly Y_BP  = { min: 40, max: 160 };
  private readonly Y_SPO = { min: 92, max: 100 };

  // Paths de líneas
  protected readonly glucosePath  = computed(() => this.buildPath(this.glucose(),  this.Y_GLU.min, this.Y_GLU.max));
  protected readonly systolicPath = computed(() => this.buildPath(this.systolic(), this.Y_BP.min,  this.Y_BP.max));
  protected readonly diastolicPath= computed(() => this.buildPath(this.diastolic(),this.Y_BP.min,  this.Y_BP.max));
  protected readonly spo2Path     = computed(() => this.buildPath(this.spo2(),     this.Y_SPO.min, this.Y_SPO.max));

  // Líneas de grilla (0–100 => 5 líneas)
  protected readonly gridLines = [0, 25, 50, 75, 100];

  constructor(private pdf: PdfExportService) {}

  ngOnInit(): void {}

  // Exportar PDF
  async onExportPdf(): Promise<void> {
    if (!this.printArea?.nativeElement) return;
    this.exporting.set(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await this.pdf.exportElementToPdf(this.printArea.nativeElement, {
        filename: `dashboard-doctor-${today}.pdf`,
        margin: 12,
        // si tu servicio ya soporta 'mode', déjalo; si no, elimina esta línea:
        mode: 'report',
        organization: 'ChroniCaree'
      } as any);
    } finally {
      this.exporting.set(false);
    }
  }

  // --------- Helpers de gráficos ----------
  protected setRange(days: 7 | 14 | 30 | 60) {
    this.rangeDays.set(days);
  }

  private genSeries(days: number, base: number, spread: number): TimePoint[] {
    const out: TimePoint[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const noise = (Math.random() - 0.5) * spread * 2;
      const value = Math.max(0, Math.round((base + noise) * 10) / 10);
      out.push({ date: d.toISOString().slice(0, 10), value });
    }
    return out;
  }

  private filterLastDays(series: TimePoint[], days: number): TimePoint[] {
    return series.slice(-days);
  }

  private x(i: number, n: number): number {
    if (n <= 1) return this.padL;
    const usableW = this.W - this.padL - this.padR;
    return this.padL + (usableW * i) / (n - 1);
  }

  private y(v: number, minY: number, maxY: number): number {
    const usableH = this.H - this.padT - this.padB;
    const t = (v - minY) / (maxY - minY);
    const clamped = Math.min(1, Math.max(0, t));
    // y crece hacia abajo
    return this.padT + (1 - clamped) * usableH;
  }

  private buildPath(points: TimePoint[], minY: number, maxY: number): string {
    if (!points.length) return '';
    const n = points.length;
    const start = `M ${this.x(0, n)} ${this.y(points[0].value, minY, maxY)}`;
    const segs = points
      .slice(1)
      .map((p, i) => `L ${this.x(i + 1, n)} ${this.y(p.value, minY, maxY)}`)
      .join(' ');
    return `${start} ${segs}`;
  }

  protected pointCx(i: number, total: number) {
    return this.x(i, total);
  }
  protected pointCy(v: number, minY: number, maxY: number) {
    return this.y(v, minY, maxY);
  }

  protected labelMinMax(min: number, max: number) {
    return `${min} — ${max}`;
  }
}
