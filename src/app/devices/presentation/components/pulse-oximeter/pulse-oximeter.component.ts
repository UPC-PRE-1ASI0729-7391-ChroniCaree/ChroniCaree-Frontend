import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PulseOximeterStore } from '../../../application/pulse-oximeter.store';
import { UserStore } from '../../../../iam/application/user.store';

@Component({
  standalone: true,
  selector: 'cc-pulse-oximeter',
  imports: [CommonModule],
  template: `
    <div class="oximeter-container">
      <header class="header">
        <button class="btn-back" (click)="goBack()">← Volver</button>
        <h1>🫁 Oxímetro de Pulso</h1>
        <div class="battery">🔋 {{ batteryLevel() }}%</div>
      </header>

      @if (latestReading(); as r) {
        <div class="main-card" [class.alert]="r.oxygenSaturation < 95">
          <div class="spo2-display">
            <div class="label">SpO₂</div>
            <div class="value">{{ r.oxygenSaturation }}<span class="unit">%</span></div>
            <div class="status" [class.low]="r.oxygenSaturation < 95">
              {{ r.oxygenSaturation < 90 ? 'Crítico' : r.oxygenSaturation < 95 ? 'Bajo' : 'Normal' }}
            </div>
          </div>
          <div class="hr-display">
            <div class="label">Pulso</div>
            <div class="value">{{ r.heartRate }}<span class="unit">bpm</span></div>
          </div>
          <div class="pi-display" *ngIf="r.perfusionIndex">
            <div class="label">Índice de Perfusión</div>
            <div class="value">{{ r.perfusionIndex }}<span class="unit">%</span></div>
          </div>
        </div>

        <div class="actions">
          <button class="btn-primary" (click)="refreshData()">🔄 Actualizar</button>
          <button class="btn-secondary" (click)="registerSymptom()">📝 Registrar</button>
        </div>

        <div class="history">
          <h2>Historial Reciente</h2>
          <table>
            <thead><tr><th>Hora</th><th>SpO₂</th><th>Pulso</th><th>PI</th></tr></thead>
            <tbody>
              @for (reading of recentReadings(); track reading.id) {
                <tr>
                  <td>{{ reading.timestamp | date:'HH:mm' }}</td>
                  <td>{{ reading.oxygenSaturation }}%</td>
                  <td>{{ reading.heartRate }}</td>
                  <td>{{ reading.perfusionIndex || '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .oximeter-container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header h1 { margin: 0; }
    .btn-back { background: #3498db; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; }
    .main-card { background: linear-gradient(135deg, #fff 0%, #e6f7ff 100%); border-radius: 16px; padding: 2rem; margin-bottom: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.08); display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1.5rem; }
    .main-card.alert { border: 3px solid #e74c3c; }
    .spo2-display, .hr-display, .pi-display { text-align: center; }
    .label { font-size: 0.9rem; color: #7f8c8d; margin-bottom: 0.5rem; }
    .value { font-size: 3rem; font-weight: 700; color: #2c3e50; }
    .unit { font-size: 1.2rem; color: #7f8c8d; font-weight: 400; }
    .status { margin-top: 0.5rem; font-weight: 600; color: #27ae60; }
    .status.low { color: #e74c3c; }
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .btn-primary, .btn-secondary { padding: 1rem; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #2ecc71; color: white; }
    .btn-secondary { background: #ecf0f1; color: #2c3e50; }
    .history { background: white; padding: 1.5rem; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .history h2 { margin: 0 0 1rem 0; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 0.75rem; background: #ecf0f1; }
    td { padding: 0.75rem; border-bottom: 1px solid #ecf0f1; }
  `]
})
export class PulseOximeterComponent implements OnInit, OnDestroy {
  private store = inject(PulseOximeterStore);
  private userStore = inject(UserStore);
  private router = inject(Router);

  latestReading = this.store.latestReading;
  batteryLevel = this.store.batteryLevel;
  recentReadings = computed(() => this.store.currentDevice()?.readings.slice(-10).reverse() || []);

  ngOnInit(): void {
    const currentUser = this.userStore.currentUser$();
    const patientId = currentUser ? (currentUser as any).id.toString() : 'PATIENT-123';
    this.store.initializeDevice(patientId);
    this.store.startSimulation();
  }

  ngOnDestroy(): void {
    this.store.stopSimulation();
  }

  refreshData(): void {
    this.store.manualReading();
  }

  registerSymptom(): void {
    const r = this.latestReading();
    if (r) alert(`Registrar con SpO₂: ${r.oxygenSaturation}%`);
  }

  goBack(): void {
    this.router.navigate(['/devices']);
  }
}
