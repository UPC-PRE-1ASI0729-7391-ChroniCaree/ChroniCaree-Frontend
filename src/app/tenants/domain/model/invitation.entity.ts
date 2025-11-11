/**
 * Invitation Entity
 * Representa una invitación para que un doctor se una a un hospital/tenant
 */

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';
export type InvitationRole = 'doctor';

export interface Invitation {
  id: number;
  tenantId: number;
  invitedBy: number;
  email: string;
  role: InvitationRole;
  status: InvitationStatus;
  token: string;
  expiresAt: string;
  createdAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
}

export class InvitationEntity implements Invitation {
  constructor(
    public id: number,
    public tenantId: number,
    public invitedBy: number,
    public email: string,
    public role: InvitationRole,
    public status: InvitationStatus,
    public token: string,
    public expiresAt: string,
    public createdAt: string,
    public acceptedAt?: string,
    public rejectedAt?: string
  ) {}

  /**
   * Verifica si la invitación está pendiente
   */
  get isPending(): boolean {
    return this.status === 'pending';
  }

  /**
   * Verifica si la invitación ha sido aceptada
   */
  get isAccepted(): boolean {
    return this.status === 'accepted';
  }

  /**
   * Verifica si la invitación ha sido rechazada
   */
  get isRejected(): boolean {
    return this.status === 'rejected';
  }

  /**
   * Verifica si la invitación ha expirado
   */
  get isExpired(): boolean {
    if (this.status === 'expired') return true;
    
    const expiryDate = new Date(this.expiresAt);
    const now = new Date();
    return now > expiryDate;
  }

  /**
   * Verifica si la invitación es válida (pendiente y no expirada)
   */
  get isValid(): boolean {
    return this.isPending && !this.isExpired;
  }

  /**
   * Días restantes hasta la expiración
   */
  get daysUntilExpiry(): number {
    const expiryDate = new Date(this.expiresAt);
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Valida la entidad
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.tenantId) errors.push('Tenant ID is required');
    if (!this.invitedBy) errors.push('Inviter user ID is required');
    if (!this.email) errors.push('Email is required');
    if (!this.token) errors.push('Token is required');
    if (!this.expiresAt) errors.push('Expiration date is required');

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (this.email && !emailRegex.test(this.email)) {
      errors.push('Invalid email format');
    }

    return errors;
  }

  /**
   * Verifica si la invitación puede ser aceptada
   */
  canBeAccepted(): string | null {
    if (!this.isPending) {
      return 'Invitation is not pending';
    }
    if (this.isExpired) {
      return 'Invitation has expired';
    }
    return null;
  }
}
