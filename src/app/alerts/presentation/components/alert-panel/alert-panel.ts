import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
  import { MatChipsModule } from '@angular/material/chips';
  import { NudgeStore } from '../../../../communication/application/nudge.store';
  import { Nudge, NudgePriority } from '../../../../communication/domain/model/nudge.entity';
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

  readonly nudgeStore = inject(NudgeStore);

  readonly topAlerts = computed(() => {
    const priorityNudges = this.nudgeStore.priorityNudges();
    const activeNudges = this.nudgeStore.activeNudges();

    // Combinar sin duplicados, priorizando los de mayor prioridad
    const combined: Nudge[] = [
      ...priorityNudges,
      ...activeNudges.filter((n: Nudge) => !priorityNudges.some((p: Nudge) => p.id === n.id))
    ];

    return combined.slice(0, this.maxItems).map((n: Nudge) => {
      const severity = this.mapPriorityToSeverity(n.priority);
      return {
        id: String(n.id),
        severity,
        typeIcon: n.icon || 'notifications',
        title: n.title,
        message: n.message,
        createdAt: n.createdAt,
        timeSinceCreated: this.getTimeAgoFrom(n.createdAt)
      };
    });
  });

  readonly hasMoreAlerts = computed(() => this.nudgeStore.activeCount() > this.maxItems);
  readonly criticalCount = computed(() => this.nudgeStore.priorityNudges().length);
  readonly loading = computed(() => this.nudgeStore.loading$());

  /**
   * Reconoce una alerta
   */
  // Acknowledge -> map to dismissing the nudge (no ack concept in nudges)
  acknowledgeAlert(alert: any): void {
    const id = Number(alert.id);
    if (Number.isNaN(id)) return console.error('Invalid nudge id', alert?.id);
    this.nudgeStore.dismissNudge(id).subscribe({
      next: () => console.log('Recordatorio descartado (acknowledged)'),
      error: (err: any) => console.error('Error al descartar recordatorio:', err)
    });
  }

  /**
   * Descarta una alerta
   */
  dismissAlert(alert: any): void {
    const id = Number(alert.id);
    if (Number.isNaN(id)) return console.error('Invalid nudge id', alert?.id);
    this.nudgeStore.dismissNudge(id).subscribe({
      next: () => console.log('Recordatorio descartado'),
      error: (err: any) => console.error('Error al descartar recordatorio:', err)
    });
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
    const created = new Date(iso).getTime();
    if (Number.isNaN(created)) return '';
    const diffMs = Date.now() - created;
    const diffMins = Math.floor(diffMs / (60 * 1000));
    if (diffMins < 1) return 'Hace unos segundos';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays} d`;
  }

  private mapPriorityToSeverity(priority: NudgePriority): string {
    switch (priority) {
      case NudgePriority.URGENT:
        return 'critical';
      case NudgePriority.HIGH:
        return 'high';
      case NudgePriority.MEDIUM:
        return 'medium';
      default:
        return 'low';
    }
  }
}
