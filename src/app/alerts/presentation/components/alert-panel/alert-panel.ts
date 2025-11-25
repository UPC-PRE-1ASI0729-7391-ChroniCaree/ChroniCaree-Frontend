import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { NudgeStore } from '../../../communication/application/nudge.store';
import { Nudge, NudgePriority } from '../../../communication/domain/model/nudge.entity';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

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
    TranslateModule,
    RouterLink
  ],
  templateUrl: './alert-panel.html',
  styleUrl: './alert-panel.css'
})
export class AlertPanelComponent {
  @Input() maxItems: number = 3;

  // Usaremos NudgeStore como fuente de 'recordatorios' para este panel
  readonly nudgeStore = inject(NudgeStore);

  // Mapear nudges prioritarios/activos a una estructura que el template espera (compatibilidad)
  readonly topAlerts = computed(() => {
    const priorityNudges = this.nudgeStore.priorityNudges();
    const activeNudges = this.nudgeStore.activeNudges();

    // Combinar sin duplicados, priorizando los de mayor prioridad
    const combined: Nudge[] = [
      ...priorityNudges,
      ...activeNudges.filter(n => !priorityNudges.some(p => p.id === n.id))
    ];

    return combined.slice(0, this.maxItems).map(n => ({
      id: String(n.id),
      severity: n.priority === NudgePriority.URGENT ? 'critical' : n.priority === NudgePriority.HIGH ? 'high' : n.priority === NudgePriority.MEDIUM ? 'medium' : 'low',
      typeIcon: n.icon || 'notifications',
      title: n.title,
      message: n.message,
      createdAt: n.createdAt,
      timeSinceCreated: this.getTimeAgoFrom(n.createdAt)
    }));
  });

  readonly hasMoreAlerts = computed(() => this.nudgeStore.activeCount() > this.maxItems);
  readonly criticalCount = computed(() => this.nudgeStore.priorityNudges().length);
  readonly loading = computed(() => this.nudgeStore.loading$());

  /**
   * Reconoce una alerta
   */
  // Acknowledge -> map to dismissing the nudge (no ack concept in nudges)
  acknowledgeAlert(alert: any): void {
    try {
      const id = Number(alert.id);
      this.nudgeStore.dismissNudge(id).subscribe({
        next: () => console.log('Recordatorio descartado (acknowledged)'),
        error: (err: any) => console.error('Error al descartar recordatorio:', err)
      });
    } catch (e) {
      console.error('Error parsing id for acknowledge:', e);
    }
  }

  /**
   * Descarta una alerta
   */
  dismissAlert(alert: any): void {
    try {
      const id = Number(alert.id);
      this.nudgeStore.dismissNudge(id).subscribe({
        next: () => console.log('Recordatorio descartado'),
        error: (err: any) => console.error('Error al descartar recordatorio:', err)
      });
    } catch (e) {
      console.error('Error parsing id for dismiss:', e);
    }
  }

  /**
   * Helper para formato de tiempo
   */
  getTimeAgo(alert: any): string {
    return alert.timeSinceCreated || alert.createdAt || '';
  }

  /**
   * Helper para clase CSS de severidad
   */
  getSeverityClass(severity: string): string {
    const classes: Record<string, string> = {
      low: 'severity-low',
      medium: 'severity-medium',
      high: 'severity-high',
      critical: 'severity-critical'
    };
    return classes[severity] || '';
  }

  /**
   * Helper para etiqueta de severidad
   */
  getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      low: 'Baja',
      medium: 'Media',
      high: 'Alta',
      critical: 'Crítica'
    };
    return labels[severity] || '';
  }

  /**
   * Devuelve un texto legible desde un ISO date
   */
  private getTimeAgoFrom(iso: string): string {
    try {
      const created = new Date(iso).getTime();
      const diffMs = Date.now() - created;
      const diffMins = Math.floor(diffMs / (60 * 1000));
      if (diffMins < 1) return 'Hace unos segundos';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Hace ${diffHours} h`;
      const diffDays = Math.floor(diffHours / 24);
      return `Hace ${diffDays} d`;
    } catch (e) {
      return '';
    }
  }
}
