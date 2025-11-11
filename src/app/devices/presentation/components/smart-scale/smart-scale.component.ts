import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SmartScaleStore } from '../../../application/smart-scale.store';
import { UserStore } from '../../../../iam/application/user.store';

@Component({
  standalone: true,
  selector: 'cc-smart-scale',
  imports: [CommonModule],
  template: `
    <div class="scale-container">
      <header class="header">
        <button class="btn-back" (click)="goBack()">← Volver</button>
        <h1>⚖️ Báscula Inteligente</h1>
        <div class="battery">🔋 {{ batteryLevel() }}%</div>
      </header>

      @if (latestReading(); as r) {
        <div class="main-card">
          <div class="weight-display">
            <div class="weight-value">{{ r.weight }}<span class="unit">kg</span></div>
            <div class="bmi">IMC: {{ r.bmi }} · {{ getBMICategory(r.bmi) }}</div>
          </div>

          <div class="composition-grid">
            <div class="comp-item">
              <span class="comp-icon">💪</span>
              <span class="comp-label">Grasa Corporal</span>
              <span class="comp-value">{{ r.bodyFatPercentage || '—' }}%</span>
            </div>
            <div class="comp-item">
              <span class="comp-icon">🦴</span>
              <span class="comp-label">Masa Muscular</span>
              <span class="comp-value">{{ r.muscleMass || '—' }} kg</span>
            </div>
            <div class="comp-item">
              <span class="comp-icon">💧</span>
              <span class="comp-label">Agua Corporal</span>
              <span class="comp-value">{{ r.waterPercentage || '—' }}%</span>
            </div>
            <div class="comp-item">
              <span class="comp-icon">🫀</span>
              <span class="comp-label">Grasa Visceral</span>
              <span class="comp-value">{{ r.visceralFat || '—' }}</span>
            </div>
          </div>

          <div class="trend">
            <span>Tendencia: {{ getWeightTrend() }}</span>
          </div>
        </div>

        <div class="actions">
          <button class="btn-primary" (click)="refreshData()">🔄 Pesar Ahora</button>
          <button class="btn-secondary" (click)="registerSymptom()">📝 Registrar</button>
        </div>

        <div class="history">
          <h2>Historial de Peso</h2>
          @for (reading of recentReadings(); track reading.id) {
            <div class="history-item">
              <span>{{ reading.timestamp | date:'dd/MM' }}</span>
              <span class="weight">{{ reading.weight }} kg</span>
              <span>IMC: {{ reading.bmi }}</span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .scale-container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header h1 { margin: 0; }
    .btn-back { background: #3498db; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; }
    .main-card { background: linear-gradient(135deg, #fff 0%, #fff3e0 100%); border-radius: 16px; padding: 2rem; margin-bottom: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .weight-display { text-align: center; margin-bottom: 2rem; }
    .weight-value { font-size: 4rem; font-weight: 700; color: #2c3e50; }
    .unit { font-size: 1.5rem; color: #7f8c8d; font-weight: 400; }
    .bmi { font-size: 1.2rem; color: #7f8c8d; margin-top: 0.5rem; }
    .composition-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem; }
    .comp-item { background: rgba(255,255,255,0.7); padding: 1rem; border-radius: 10px; text-align: center; }
    .comp-icon { font-size: 2rem; display: block; margin-bottom: 0.3rem; }
    .comp-label { display: block; font-size: 0.85rem; color: #7f8c8d; margin-bottom: 0.3rem; }
    .comp-value { display: block; font-size: 1.3rem; font-weight: 600; color: #2c3e50; }
    .trend { text-align: center; padding: 1rem; background: rgba(255,255,255,0.6); border-radius: 8px; font-weight: 600; }
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .btn-primary, .btn-secondary { padding: 1rem; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .btn-primary { background: #f39c12; color: white; }
    .btn-secondary { background: #ecf0f1; color: #2c3e50; }
    .history { background: white; padding: 1.5rem; border-radius: 12px; }
    .history h2 { margin: 0 0 1rem 0; }
    .history-item { display: flex; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid #ecf0f1; }
    .weight { font-weight: 600; color: #2c3e50; }
  `]
})
export class SmartScaleComponent implements OnInit, OnDestroy {
  private store = inject(SmartScaleStore);
  private userStore = inject(UserStore);
  private router = inject(Router);

  latestReading = this.store.latestReading;
  batteryLevel = this.store.batteryLevel;
  recentReadings = computed(() => this.store.currentDevice()?.readings.slice(-10).reverse() || []);

  ngOnInit(): void {
    const currentUser = this.userStore.currentUser$();
    const patientId = currentUser ? (currentUser as any).id.toString() : 'PATIENT-123';
    this.store.initializeDevice(patientId, 170); // Default height 170cm
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
    if (r) alert(`Registrar con peso: ${r.weight} kg, IMC: ${r.bmi}`);
  }

  goBack(): void {
    this.router.navigate(['/devices']);
  }

  getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Bajo peso';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Sobrepeso';
    return 'Obesidad';
  }

  getWeightTrend(): string {
    const device = this.store.currentDevice();
    if (!device || device.readings.length < 2) return 'Insuficientes datos';
    
    const recent = device.readings.slice(-5);
    const firstWeight = recent[0].weight;
    const lastWeight = recent[recent.length - 1].weight;
    const diff = lastWeight - firstWeight;
    
    if (diff > 1) return '↗️ En aumento';
    if (diff < -1) return '↘️ En disminución';
    return '➡️ Estable';
  }
}
