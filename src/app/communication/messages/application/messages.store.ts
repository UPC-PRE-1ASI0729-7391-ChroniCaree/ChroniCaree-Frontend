import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { Message } from '../../domain/model/message.entity';
import { Thread } from '../../domain/model/thread.entity';

@Injectable({ providedIn: 'root' })
export class MessagesStore {
  private http = inject(HttpClient);

  // Estado
  inbox = signal<Thread[]>([]);
  currentThread = signal<(Thread & { messages: Message[] }) | null>(null);
  sending = signal(false);
  closing = signal(false);

  // Endpoints base (ajusta a tu backend real)
  private base = '/api/messages';
  private uploadBase = '/api/uploads';
  private notifications = '/api/notifications';
  private medrecArchive = '/api/medical-records/archive';

  // ===== QUERIES =====

  loadInbox(role: 'PATIENT' | 'DOCTOR', userId: string) {
    this.http
      .get<Thread[]>(`${this.base}/inbox`, { params: { role, userId } })
      .subscribe(ts => this.inbox.set(ts));
  }

  openThread(threadId: string) {
    this.http
      .get<Thread & { messages: Message[] }>(`${this.base}/threads/${threadId}`)
      .subscribe(t => this.currentThread.set(t));
  }

  // ===== COMMANDS =====

  /**
   * Crear un nuevo mensaje e iniciar hilo si aplica.
   */
  async sendMessage(params: {
    message: Omit<Message, 'id' | 'createdAt' | 'archivedToMedicalRecord'>;
    files?: File[];
  }) {
    try {
      this.sending.set(true);

      // 1) Subir adjuntos si hay
      let attachments: Message['attachments'] = [];
      if (params.files?.length) {
        const uploadPromises = params.files.map(f => {
          const fd = new FormData();
          fd.append('file', f);
          return firstValueFrom(
            this.http.post<{ url: string; fileName: string; mimeType: string }>(
              this.uploadBase,
              fd
            )
          );
        });

        const results = await Promise.all(uploadPromises);
        attachments = results.map(r => ({
          fileName: r.fileName,
          mimeType: r.mimeType,
          url: r.url
        }));
      }

      // 2) Enviar mensaje
      const payload: Message = { ...params.message, attachments };
      const res = await firstValueFrom(
        this.http.post<{ id: string; threadId: string }>(this.base, payload)
      );

      // 3) Notificar receptor
      this.http
        .post(this.notifications, {
          toUserId: params.message.receiverId,
          type:
            params.message.senderRole === 'PATIENT'
              ? 'NEW_PATIENT_MESSAGE'
              : 'NEW_DOCTOR_MESSAGE',
          refId: res.id
        })
        .subscribe({});

      // 4) Archivar en historial clínico
      const patientId =
        params.message.senderRole === 'PATIENT'
          ? params.message.senderId
          : params.message.receiverId;

      this.http
        .post(this.medrecArchive, {
          patientId,
          kind: 'MESSAGE',
          refId: res.id
        })
        .subscribe({});

      return res;
    } finally {
      this.sending.set(false);
    }
  }

  /**
   * Responder dentro de un hilo existente como doctor.
   * Usa el mismo modelo de Message, pero el servidor asigna id y createdAt.
   */
  async replyToThread(params: {
    threadId: string;
    senderDoctorId: string;
    receiverPatientId: string;
    body: string;
  }) {
    try {
      this.sending.set(true);

      const message: Omit<Message, 'id' | 'createdAt' | 'archivedToMedicalRecord'> = {
        senderRole: 'DOCTOR',
        senderId: params.senderDoctorId,
        receiverId: params.receiverPatientId,
        subject: 'Respuesta del médico',
        body: params.body,
        attachments: []
      };

      const res = await firstValueFrom(
        this.http.post<Message>(`${this.base}/threads/${params.threadId}/reply`, message)
      );

      // Actualizar hilo abierto en memoria
      const cur = this.currentThread();
      if (cur && cur.id === params.threadId) {
        this.currentThread.set({
          ...cur,
          status: 'OPEN',
          lastMessageAt: res.createdAt ?? new Date().toISOString(),
          messages: [...cur.messages, res]
        });
      }

      // Notificar al paciente
      this.http
        .post(this.notifications, {
          toUserId: params.receiverPatientId,
          type: 'NEW_DOCTOR_MESSAGE',
          refId: res.id
        })
        .subscribe({});

      // Archivar respuesta en historial clínico del paciente
      this.http
        .post(this.medrecArchive, {
          patientId: params.receiverPatientId,
          kind: 'MESSAGE',
          refId: res.id
        })
        .subscribe({});

      return res;
    } finally {
      this.sending.set(false);
    }
  }

  /**
   * Cerrar un hilo como resuelto.
   */
  async closeThread(threadId: string, patientIdToNotify: string) {
    try {
      this.closing.set(true);

      const updated = await firstValueFrom(
        this.http.patch<Thread>(`${this.base}/threads/${threadId}`, { status: 'CLOSED' })
      );

      // Actualizar hilo abierto en memoria, conservando mensajes
      const cur = this.currentThread();
      if (cur && cur.id === threadId) {
        this.currentThread.set({
          ...cur,
          status: 'CLOSED',
          lastMessageAt: updated.lastMessageAt ?? new Date().toISOString()
        });
      }

      // Notificar al paciente que el hilo se cerró
      this.http
        .post(this.notifications, {
          toUserId: patientIdToNotify,
          type: 'THREAD_CLOSED',
          refId: threadId
        })
        .subscribe({});

      return updated;
    } finally {
      this.closing.set(false);
    }
  }
}

