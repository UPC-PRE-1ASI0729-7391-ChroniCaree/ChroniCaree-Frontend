import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { AlertStore } from '../../../application/alert.store';
import { Alert, AlertSeverity, AlertStatus } from '../../../domain/model/alert.entity';

@Component({
  selector: 'app-health-alerts',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatBadgeModule
  ],
  templateUrl: './health-alerts.html',
  styleUrl: './health-alerts.css'
})
export class HealthAlertsComponent implements OnInit {
  constructor(private alertStore: AlertStore) {}

  readonly alerts = computed(() => this.alertStore.alerts());
  readonly activeAlerts = computed(() => this.alertStore.activeAlerts());
  readonly criticalAlerts = computed(() => this.alertStore.criticalAlerts());
  readonly acknowledgedAlerts = computed(() => this.alertStore.acknowledgedAlerts());
  readonly resolvedAlerts = computed(() => this.alertStore.resolvedAlerts());
  readonly loading = computed(() => this.alertStore.loading());

  // Stats
  readonly stats = computed(() => {
    const active = this.activeAlerts();
    return {
      critical: active.filter(a => a.severity === AlertSeverity.CRITICAL).length,
      high: active.filter(a => a.severity === AlertSeverity.HIGH).length,
      medium: active.filter(a => a.severity === AlertSeverity.MEDIUM).length,
      low: active.filter(a => a.severity === AlertSeverity.LOW).length,
      total: active.length
    };
  });

  ngOnInit(): void {
    this.alertStore.loadAlertsByPatient('1').subscribe({
      next: () => console.log('Alertas cargadas'),
      error: (err) => console.error('Error al cargar alertas:', err)
    });
  }

  /**
   * Reconoce una alerta
   */
  acknowledgeAlert(alert: Alert): void {
    this.alertStore.acknowledgeAlert(alert.id, 'current-user', 'Reconocido').subscribe({
      next: () => console.log('Alerta reconocida'),
      error: (err) => console.error('Error:', err)
    });
  }

  /**
   * Resuelve una alerta
   */
  resolveAlert(alert: Alert): void {
    this.alertStore.resolveAlert(alert.id, 'Resuelto').subscribe({
      next: () => console.log('Alerta resuelta'),
      error: (err) => console.error('Error:', err)
    });
  }

  /**
   * Descarta una alerta
   */
  dismissAlert(alert: Alert): void {
    this.alertStore.dismissAlert(alert.id, 'Descartado').subscribe({
      next: () => console.log('Alerta descartada'),
      error: (err) => console.error('Error:', err)
    });
  }

  /**
   * Helper para clase CSS de severidad
   */
  getSeverityClass(severity: AlertSeverity): string {
    const classes: Record<AlertSeverity, string> = {
      [AlertSeverity.LOW]: 'severity-low',
      [AlertSeverity.MEDIUM]: 'severity-medium',
      [AlertSeverity.HIGH]: 'severity-high',
      [AlertSeverity.CRITICAL]: 'severity-critical'
    };
    return classes[severity];
  }

  /**
   * Helper para etiqueta de severidad
   */
  getSeverityLabel(severity: AlertSeverity): string {
    const labels: Record<AlertSeverity, string> = {
      [AlertSeverity.LOW]: 'Baja',
      [AlertSeverity.MEDIUM]: 'Media',
      [AlertSeverity.HIGH]: 'Alta',
      [AlertSeverity.CRITICAL]: 'Crítica'
    };
    return labels[severity];
  }

  /**
   * Helper para formato de tiempo
   */
  getTimeAgo(alert: Alert): string {
    return alert.timeSinceCreated;
  }
}
