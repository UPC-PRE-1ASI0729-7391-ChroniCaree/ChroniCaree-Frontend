import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { AlertStore } from '../../../application/alert.store';
import { Alert, AlertSeverity } from '../../../domain/model/alert.entity';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-alert-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatChipsModule,
    RouterLink
  ],
  templateUrl: './alert-panel.html',
  styleUrl: './alert-panel.css'
})
export class AlertPanelComponent {
  @Input() maxItems: number = 3;

  readonly alertStore = inject(AlertStore);

  // Computed: alertas críticas limitadas
  readonly topAlerts = computed(() => {
    const critical = this.alertStore.criticalAlerts();
    const high = this.alertStore.highAlerts();
    const combined = [...critical, ...high];
    return combined.slice(0, this.maxItems);
  });

  readonly hasMoreAlerts = computed(() => {
    const critical = this.alertStore.criticalAlerts();
    const high = this.alertStore.highAlerts();
    return (critical.length + high.length) > this.maxItems;
  });

  readonly criticalCount = computed(() => this.alertStore.criticalCount());
  readonly loading = computed(() => this.alertStore.loading());

  /**
   * Reconoce una alerta
   */
  acknowledgeAlert(alert: Alert): void {
    this.alertStore.acknowledgeAlert(alert.id, 'current-user', 'Reconocido desde dashboard')
      .subscribe({
        next: () => console.log('Alerta reconocida'),
        error: (err: any) => console.error('Error al reconocer alerta:', err)
      });
  }

  /**
   * Descarta una alerta
   */
  dismissAlert(alert: Alert): void {
    this.alertStore.dismissAlert(alert.id, 'Descartado desde dashboard')
      .subscribe({
        next: () => console.log('Alerta descartada'),
        error: (err: any) => console.error('Error al descartar alerta:', err)
      });
  }

  /**
   * Helper para formato de tiempo
   */
  getTimeAgo(alert: Alert): string {
    return alert.timeSinceCreated;
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
}
