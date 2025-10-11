// shared/application/notifications.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type NotificationKind =
  | 'NEW_PATIENT_MESSAGE'
  | 'NEW_DOCTOR_MESSAGE'
  | 'APPOINTMENT'
  | 'LAB_RESULT'
  | 'GENERIC';

export interface NotificationPayload {
  id: string;
  toUserId: string;
  title: string;
  body: string;
  kind: NotificationKind;
  createdAt: string;          // ISO date
  read: boolean;
  // Datos opcionales para deep-link
  data?: {
    threadId?: string;
    messageId?: string;
    route?: string;           // ej: '/doctor/messages' o '/communication/messages'
    [key: string]: unknown;
  };
}

/**
 * Servicio de notificaciones en memoria.
 * - Emite un stream de notificaciones para que la UI se suscriba.
 * - Ofrece utilidades específicas para mensajes paciente/médico.
 * Sustituye la implementación por una llamada HTTP/WebSocket cuando tengas backend.
 */
@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private bus = new Subject<NotificationPayload>();
  /** Stream solo-lectura para la UI */
  readonly notifications$: Observable<NotificationPayload> = this.bus.asObservable();

  /** Envío genérico */
  notifyUser(
    toUserId: string,
    payload: { title: string; body: string; kind?: NotificationKind; data?: NotificationPayload['data'] }
  ): NotificationPayload {
    const notif: NotificationPayload = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      toUserId,
      title: payload.title,
      body: payload.body,
      kind: payload.kind ?? 'GENERIC',
      createdAt: new Date().toISOString(),
      read: false,
      data: payload.data,
    };

    // Publica en el stream (la UI puede pintarlo como toast/badge)
    this.bus.next(notif);

    // Log útil en desarrollo
    // eslint-disable-next-line no-console
    console.log('[NotificationsService] notifyUser', notif);

    return notif;
  }

  /** Notificación cuando un paciente envía un mensaje a su médico */
  notifyDoctorNewMessage(params: { doctorId: string; threadId: string; messageId: string }) {
    return this.notifyUser(params.doctorId, {
      title: 'Nuevo mensaje del paciente',
      body: 'Tienes una nueva consulta para revisar.',
      kind: 'NEW_PATIENT_MESSAGE',
      data: {
        threadId: params.threadId,
        messageId: params.messageId,
        route: '/doctor/messages',
      },
    });
  }

  /** Notificación cuando un médico responde al paciente */
  notifyPatientNewMessage(params: { patientId: string; threadId: string; messageId: string }) {
    return this.notifyUser(params.patientId, {
      title: 'Respuesta del médico',
      body: 'Tu médico respondió a tu consulta.',
      kind: 'NEW_DOCTOR_MESSAGE',
      data: {
        threadId: params.threadId,
        messageId: params.messageId,
        route: '/communication/messages',
      },
    });
  }
}
