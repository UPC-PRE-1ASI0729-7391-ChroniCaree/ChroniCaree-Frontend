import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { InvitationEntity, InvitationStatus, InvitationRole } from '../domain/model/invitation.entity';
import { environment } from '../../../../environments/environment';

const INVITATION_API = `${environment.apiBaseUrl}/invitations`;

/**
 * Invitation Resource (DTO para comunicación con API)
 */
export interface InvitationResource {
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

/**
 * Request para crear una invitación
 */
export interface CreateInvitationRequest {
  tenantId: number;
  invitedBy: number;
  email: string;
  role: InvitationRole;
  expiresInDays?: number;
}

/**
 * Request para aceptar una invitación
 */
export interface AcceptInvitationRequest {
  token: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  specialty: string;
  phone?: string;
}

/**
 * Servicio de infraestructura para Invitaciones
 */
@Injectable({
  providedIn: 'root'
})
export class InvitationService {
  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las invitaciones
   */
  getAll(): Observable<InvitationEntity[]> {
    return this.http.get<InvitationResource[]>(INVITATION_API)
      .pipe(map(resources => resources.map(r => this.toEntity(r))));
  }

  /**
   * Obtiene una invitación por ID
   */
  getById(id: number): Observable<InvitationEntity> {
    return this.http.get<InvitationResource>(`${INVITATION_API}/${id}`)
      .pipe(map(resource => this.toEntity(resource)));
  }

  /**
   * Obtiene una invitación por token
   */
  getByToken(token: string): Observable<InvitationEntity | null> {
    return this.http.get<InvitationResource[]>(`${INVITATION_API}?token=${token}`)
      .pipe(
        map(resources => {
          if (resources.length === 0) return null;
          return this.toEntity(resources[0]);
        })
      );
  }

  /**
   * Obtiene todas las invitaciones de un tenant
   */
  getByTenantId(tenantId: number): Observable<InvitationEntity[]> {
    return this.http.get<InvitationResource[]>(`${INVITATION_API}?tenantId=${tenantId}`)
      .pipe(map(resources => resources.map(r => this.toEntity(r))));
  }

  /**
   * Obtiene invitaciones pendientes de un tenant
   */
  getPendingByTenantId(tenantId: number): Observable<InvitationEntity[]> {
    return this.http.get<InvitationResource[]>(`${INVITATION_API}?tenantId=${tenantId}&status=pending`)
      .pipe(map(resources => resources.map(r => this.toEntity(r))));
  }

  /**
   * Crea una nueva invitación
   */
  create(request: CreateInvitationRequest): Observable<InvitationEntity> {
    const expiresInDays = request.expiresInDays ?? 7;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiresInDays);

    const resource: Partial<InvitationResource> = {
      tenantId: request.tenantId,
      invitedBy: request.invitedBy,
      email: request.email,
      role: request.role,
      status: 'pending',
      token: this.generateToken(),
      expiresAt: expiryDate.toISOString(),
      createdAt: new Date().toISOString()
    };

    return this.http.post<InvitationResource>(INVITATION_API, resource)
      .pipe(map(r => this.toEntity(r)));
  }

  /**
   * Acepta una invitación
   * Nota: Este método solo marca la invitación como aceptada.
   * La creación del doctor debe hacerse en el store que orquesta el proceso.
   */
  accept(invitationId: number): Observable<InvitationEntity> {
    const resource = {
      status: 'accepted' as InvitationStatus,
      acceptedAt: new Date().toISOString()
    };

    return this.http.patch<InvitationResource>(`${INVITATION_API}/${invitationId}`, resource)
      .pipe(map(r => this.toEntity(r)));
  }

  /**
   * Rechaza una invitación
   */
  reject(invitationId: number): Observable<InvitationEntity> {
    const resource = {
      status: 'rejected' as InvitationStatus,
      rejectedAt: new Date().toISOString()
    };

    return this.http.patch<InvitationResource>(`${INVITATION_API}/${invitationId}`, resource)
      .pipe(map(r => this.toEntity(r)));
  }

  /**
   * Marca una invitación como expirada
   */
  expire(invitationId: number): Observable<InvitationEntity> {
    const resource = {
      status: 'expired' as InvitationStatus
    };

    return this.http.patch<InvitationResource>(`${INVITATION_API}/${invitationId}`, resource)
      .pipe(map(r => this.toEntity(r)));
  }

  /**
   * Elimina una invitación
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${INVITATION_API}/${id}`);
  }

  /**
   * Genera un token único para la invitación
   */
  private generateToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  /**
   * Transforma un recurso de API a entidad de dominio
   */
  private toEntity(resource: InvitationResource): InvitationEntity {
    return new InvitationEntity(
      resource.id,
      resource.tenantId,
      resource.invitedBy,
      resource.email,
      resource.role,
      resource.status,
      resource.token,
      resource.expiresAt,
      resource.createdAt,
      resource.acceptedAt,
      resource.rejectedAt
    );
  }
}
