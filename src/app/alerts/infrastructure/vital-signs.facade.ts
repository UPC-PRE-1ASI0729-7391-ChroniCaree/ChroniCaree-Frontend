/**
 * Facade para coordinar alertas con signos vitales
 * Detecta valores fuera de rango y genera alertas automáticamente
 */
import { Injectable, inject, computed, signal } from '@angular/core';
import { AlertStore } from '../application/alert.store';
import { 
  Alert, 
  AlertType, 
  AlertSeverity, 
  AlertStatus, 
  VITAL_SIGN_RANGES 
} from '../domain/model/alert.entity';

interface VitalSignMeasurement {
  vitalSign: string;
  value: number;
  unit: string;
  recordedAt: string;
  recordId: string;
}

@Injectable({
  providedIn: 'root'
})
export class VitalSignsFacade {
  private readonly alertStore = inject(AlertStore);
  
  // Señal para tracking de procesamiento
  private processing = signal(false);

  // Computed: alertas activas críticas
  readonly criticalAlerts = this.alertStore.criticalAlerts;

  // Computed: conteo de alertas activas por severidad
  readonly alertCountBySeverity = computed(() => {
    const critical = this.alertStore.criticalCount();
    const high = this.alertStore.highAlerts().length;
    const active = this.alertStore.activeAlerts();
    return {
      critical,
      high,
      medium: active.filter((a: Alert) => a.severity === AlertSeverity.MEDIUM).length,
      low: active.filter((a: Alert) => a.severity === AlertSeverity.LOW).length
    };
  });

  // Computed: total de alertas activas
  readonly totalActiveAlerts = this.alertStore.activeCount;

  /**
   * Analiza un signo vital y genera alerta si está fuera de rango
   */
  checkVitalSign(measurement: VitalSignMeasurement, patientId: string): void {
    if (this.processing()) return;

    const range = VITAL_SIGN_RANGES[measurement.vitalSign];
    if (!range) return;

    const { value, vitalSign, unit, recordedAt, recordId } = measurement;

    // Verificar si está fuera de rango
    if (value < range.minValue || value > range.maxValue) {
      this.processing.set(true);

      const isHigh = value > range.maxValue;
      const severity = this.calculateSeverity(value, range.minValue, range.maxValue);
      
      const alert = this.createVitalSignAlert(
        patientId,
        vitalSign,
        value,
        unit,
        isHigh,
        severity,
        recordedAt,
        recordId,
        range.minValue,
        range.maxValue
      );

      // Crear la alerta en el store
      this.alertStore.createAlert(alert).subscribe({
        next: () => console.log(`Alerta generada: ${vitalSign} fuera de rango`),
        error: (err: any) => console.error('Error al crear alerta:', err),
        complete: () => this.processing.set(false)
      });
    }
  }

  /**
   * Analiza múltiples signos vitales de un registro
   */
  checkMultipleVitalSigns(measurements: VitalSignMeasurement[], patientId: string): void {
    measurements.forEach(measurement => {
      this.checkVitalSign(measurement, patientId);
    });
  }

  /**
   * Calcula severidad basada en qué tan fuera de rango está el valor
   */
  private calculateSeverity(value: number, min: number, max: number): AlertSeverity {
    const range = max - min;
    const deviation = value < min 
      ? ((min - value) / range) 
      : ((value - max) / range);

    if (deviation > 0.5) return AlertSeverity.CRITICAL;
    if (deviation > 0.3) return AlertSeverity.HIGH;
    if (deviation > 0.15) return AlertSeverity.MEDIUM;
    return AlertSeverity.LOW;
  }

  /**
   * Crea alerta de signo vital fuera de rango
   */
  private createVitalSignAlert(
    patientId: string,
    vitalSign: string,
    value: number,
    unit: string,
    isHigh: boolean,
    severity: AlertSeverity,
    recordedAt: string,
    recordId: string,
    minValue: number,
    maxValue: number
  ): Omit<Alert, 'id'> {
    const type = isHigh ? AlertType.VITAL_SIGN_HIGH : AlertType.VITAL_SIGN_LOW;
    const direction = isHigh ? 'alto' : 'bajo';
    const emoji = isHigh ? '⬆️' : '⬇️';
    
    return {
      patientId,
      type,
      severity,
      title: `${vitalSign} ${direction} ${emoji}`,
      message: `Tu ${vitalSign.toLowerCase()} está en ${value} ${unit}, fuera del rango normal (${minValue}-${maxValue} ${unit})`,
      status: AlertStatus.ACTIVE,
      metadata: {
        vitalSign,
        value,
        unit,
        threshold: isHigh ? maxValue : minValue,
        measurement: recordId
      },
      createdAt: new Date().toISOString()
    } as Omit<Alert, 'id'>;
  }
}
