/**
 * Device Entity
 * Representa un dispositivo médico IoT vinculado a un paciente
 */

export type DeviceType = 
  | 'glucometer' 
  | 'blood_pressure' 
  | 'pulse_oximeter' 
  | 'ecg' 
  | 'smart_scale';

export interface Device {
  id: number;
  patientId: number;
  type: DeviceType;
  brand: string;
  model: string;
  lastSync: string;
  isActive: boolean;
  autoSyncEnabled: boolean;
}

export class DeviceEntity implements Device {
  constructor(
    public id: number,
    public patientId: number,
    public type: DeviceType,
    public brand: string,
    public model: string,
    public lastSync: string,
    public isActive: boolean,
    public autoSyncEnabled: boolean
  ) {}

  /**
   * Nombre legible del tipo de dispositivo
   */
  get displayName(): string {
    const names: Record<DeviceType, string> = {
      glucometer: 'Glucómetro',
      blood_pressure: 'Monitor de Presión Arterial',
      pulse_oximeter: 'Oxímetro de Pulso',
      ecg: 'Monitor de ECG',
      smart_scale: 'Báscula Inteligente',
    };
    return names[this.type];
  }

  /**
   * Icono asociado al dispositivo
   */
  get icon(): string {
    const icons: Record<DeviceType, string> = {
      glucometer: 'water_drop',
      blood_pressure: 'favorite',
      pulse_oximeter: 'fingerprint',
      ecg: 'monitor_heart',
      smart_scale: 'scale',
    };
    return icons[this.type];
  }

  /**
   * Verifica si el dispositivo necesita sincronización
   */
  get needsSync(): boolean {
    if (!this.autoSyncEnabled) return false;
    
    const lastSync = new Date(this.lastSync);
    const now = new Date();
    const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
    
    // Necesita sync si pasaron más de 24 horas
    return hoursSinceSync > 24;
  }

  /**
   * Horas desde la última sincronización
   */
  get hoursSinceLastSync(): number {
    const lastSync = new Date(this.lastSync);
    const now = new Date();
    return (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);
  }

  /**
   * Valida la entidad
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.patientId) errors.push('Patient ID is required');
    if (!this.type) errors.push('Device type is required');
    if (!this.brand) errors.push('Brand is required');
    if (!this.model) errors.push('Model is required');

    return errors;
  }
}
