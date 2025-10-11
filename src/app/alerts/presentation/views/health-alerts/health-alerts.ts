import { Component, OnInit, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { AlertStore } from '../../../application/alert.store';
import { Alert, AlertSeverity, AlertStatus } from '../../../domain/model/alert.entity';
import { PatientStore } from '../../../../patients/application/patient.store';
import { UserStore } from '../../../../iam/application/user.store';

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
  private readonly alertStore = inject(AlertStore);
  private readonly patientStore = inject(PatientStore);
  private readonly userStore = inject(UserStore);
  private readonly router = inject(Router);

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
    // Determine current user via UserStore (preferred) or fallback to localStorage
    const currentUser = this.userStore.currentUser$() || (JSON.parse(localStorage.getItem('currentUser') || 'null'));
    if (!currentUser || !currentUser.id) {
      console.error('❌ Health-Alerts: Usuario no autenticado');
      this.router.navigate(['/iam/login']);
      return;
    }

    const userId = currentUser.id;
    console.log(`🔍 Health-Alerts: Usuario actual ID: ${userId}`);

    // Buscar el paciente asociado al usuario actual
    this.patientStore.loadAllPatients().subscribe({
      next: (patients) => {
        const patient = patients.find(p => p.userId === userId);

        if (patient) {
          console.log(`✅ Health-Alerts: Paciente encontrado: ${patient.firstName} ${patient.lastName}, ID: ${patient.id}`);
          
          // ✅ Cargar alertas usando el ID del paciente actual
          this.alertStore.loadAlertsByPatient(patient.id.toString()).subscribe({
            next: () => console.log('✅ Alertas cargadas para paciente', patient.id),
            error: (err) => console.error('❌ Error al cargar alertas:', err)
          });
        } else {
          console.error(`❌ Health-Alerts: No se encontró paciente para userId ${userId}`);
        }
      },
      error: (err) => {
        console.error('❌ Health-Alerts: Error cargando pacientes:', err);
      }
    });


    // React to user changes so alerts reload automatically
    try {
      window.addEventListener('userChanged', (ev: any) => {
        const detailUser = ev?.detail;
        const cur = detailUser || this.userStore.currentUser$();
        const userId = cur?.id;
        if (userId) {
          this.patientStore.loadAllPatients().subscribe({
            next: (patients) => {
              const patient = patients.find(p => p.userId === userId);
              if (patient) {
                this.alertStore.loadAlertsByPatient(patient.id.toString()).subscribe();
              }
            }
          });
        }
      });
    } catch (e) {
      // ignore
    }
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
