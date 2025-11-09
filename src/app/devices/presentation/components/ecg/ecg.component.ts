import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ECGStore } from '../../../application/ecg.store';
import { UserStore } from '../../../../iam/application/user.store';

@Component({
  standalone: true,
  selector: 'cc-ecg',
  imports: [CommonModule],
  template: `
    <div class="ecg-container">
      <header class="header">
        <button class="btn-back" (click)="goBack()">← Volver</button>
        <h1>📈 Monitor ECG</h1>
        <div class="battery">🔋 {{ batteryLevel() }}%</div>
      </header>

      @if (latestReading(); as r) {
        <div class="main-card" [class.warning]="r.rhythm !== 'normal'">
          <div class="ecg-display">
            <div class="rhythm-info">
              <span class="label">Ritmo Cardíaco</span>
              <span class="rhythm-value" [class.abnormal]="r.rhythm !== 'normal'">
                {{ getRhythmLabel(r.rhythm) }}
              </span>
            </div>
            <div class="hr-info">
              <span class="hr-value">{{ r.heartRate }}</span>
              <span class="unit">bpm</span>
            </div>
            <div class="waveform">
              <svg width="100%" height="80" viewBox="0 0 300 80">
                <polyline
                  [attr.points]="getWaveformPoints(r.waveformData)"
                  fill="none"
                  stroke="#2ecc71"
                  stroke-width="2"
                />
              </svg>
            </div>
            @if (r.aiAnalysis) {
              <div class="ai-analysis">
                <span class="ai-icon">🤖</span>
                <span>Confianza: {{ r.aiAnalysis.confidence }}%</span>
                @if (r.aiAnalysis.flags.length > 0) {
                  <div class="flags">{{ r.aiAnalysis.flags.join(', ') }}</div>
                }
              </div>
            }
          </div>
        </div>

        <div class="actions">
          <button class="btn-record" (click)="startRecording()" [disabled]="isRecording()">
            {{ isRecording() ? '⏺️ Grabando...' : '⏺️ Iniciar Grabación' }}
          </button>
          <button class="btn-secondary" (click)="registerSymptom()">📝 Registrar</button>
        </div>

        <div class="history">
          <h2>Historial de Lecturas</h2>
          @for (reading of recentReadings(); track reading.id) {
            <div class="history-item">
              <span>{{ reading.timestamp | date:'dd/MM HH:mm' }}</span>
              <span>{{ reading.heartRate }} bpm</span>
              <span class="rhythm-badge" [class.abnormal]="reading.rhythm !== 'normal'">
                {{ getRhythmLabel(reading.rhythm) }}
              </span>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .ecg-container { max-width: 1000px; margin: 0 auto; padding: 2rem; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .header h1 { margin: 0; }
    .btn-back { background: #3498db; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 8px; cursor: pointer; }
    .main-card { background: linear-gradient(135deg, #fff 0%, #f0e6ff 100%); border-radius: 16px; padding: 2rem; margin-bottom: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .main-card.warning { border: 3px solid #f39c12; }
    .ecg-display { text-align: center; }
    .rhythm-info { margin-bottom: 1rem; }
    .label { font-size: 0.9rem; color: #7f8c8d; display: block; }
    .rhythm-value { font-size: 1.5rem; font-weight: 600; color: #27ae60; }
    .rhythm-value.abnormal { color: #e74c3c; }
    .hr-value { font-size: 3rem; font-weight: 700; color: #2c3e50; }
    .unit { font-size: 1.2rem; color: #7f8c8d; }
    .waveform { margin: 1.5rem 0; background: #f8f9fa; border-radius: 8px; padding: 1rem; }
    .ai-analysis { margin-top: 1rem; padding: 1rem; background: rgba(255,255,255,0.6); border-radius: 8px; font-size: 0.9rem; }
    .flags { margin-top: 0.5rem; color: #e74c3c; font-weight: 600; }
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .btn-record, .btn-secondary { padding: 1rem; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .btn-record { background: #9b59b6; color: white; }
    .btn-record:disabled { background: #95a5a6; cursor: not-allowed; }
    .btn-secondary { background: #ecf0f1; color: #2c3e50; }
    .history { background: white; padding: 1.5rem; border-radius: 12px; }
    .history h2 { margin: 0 0 1rem 0; }
    .history-item { display: flex; justify-content: space-between; padding: 0.75rem; border-bottom: 1px solid #ecf0f1; }
    .rhythm-badge { padding: 0.3rem 0.8rem; border-radius: 12px; font-size: 0.85rem; font-weight: 600; background: #e6f7ed; color: #27ae60; }
    .rhythm-badge.abnormal { background: #ffe6e6; color: #e74c3c; }
  `]
})
export class ECGComponent implements OnInit, OnDestroy {
  private store = inject(ECGStore);
  private userStore = inject(UserStore);
  private router = inject(Router);

  latestReading = this.store.latestReading;
  batteryLevel = this.store.batteryLevel;
  isRecording = this.store.isRecording;
  recentReadings = computed(() => this.store.currentDevice()?.readings.slice(-5).reverse() || []);

  ngOnInit(): void {
    const currentUser = this.userStore.currentUser$();
    const patientId = currentUser ? (currentUser as any).id.toString() : 'PATIENT-123';
    this.store.initializeDevice(patientId);
    this.store.startSimulation();
  }

  ngOnDestroy(): void {
    this.store.stopSimulation();
  }

  startRecording(): void {
    this.store.startRecording();
  }

  registerSymptom(): void {
    const r = this.latestReading();
    if (r) alert(`Registrar con ritmo: ${this.getRhythmLabel(r.rhythm)}`);
  }

  goBack(): void {
    this.router.navigate(['/devices']);
  }

  getRhythmLabel(rhythm: string): string {
    const labels: Record<string, string> = {
      'normal': 'Normal',
      'irregular': 'Irregular',
      'tachycardia': 'Taquicardia',
      'bradycardia': 'Bradicardia',
      'afib': 'Fibrilación Auricular'
    };
    return labels[rhythm] || rhythm;
  }

  getWaveformPoints(data: number[]): string {
    if (!data || data.length === 0) return '';
    const width = 300;
    const height = 80;
    const step = width / data.length;
    return data.map((v, i) => `${i * step},${height / 2 - v * 30}`).join(' ');
  }
}
