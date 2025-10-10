import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Message } from '../domain/model/message';
import { Thread } from '../domain/model/thread';

@Injectable({ providedIn: 'root' })
export class MessagesStore {
  private http = inject(HttpClient);

  // señales de estado
  inbox = signal<Thread[]>([]);
  currentThread = signal<(Thread & { messages: Message[] }) | null>(null);
  sending = signal(false);

  // === API BASES (ajusta a tu backend real) ===
  private base = '/api/messages';
  private uploadBase = '/api/uploads';
  private notifications = '/api/notifications';
  private medrecArchive = '/api/medical-records/archive';

  // === QUERIES ===
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

  // === COMMANDS ===
  async sendMessage(params: {
    message: Omit<Message, 'id' | 'createdAt' | 'archivedToMedicalRecord'>;
    files?: File[];
  }) {
    try {
      this.sending.set(true);

      // 1) Subir adjuntos si hay
      let attachments: Message['attachments'] = [];
      if (params.files?.length) {
        const ups = params.files.map(f => {
          const fd = new FormData();
          fd.append('file', f);
          return this.http.post<{ url: string; fileName: string; mimeType: string }>(this.uploadBase, fd);
        });

        const results = await Promise.all(ups.map(obs => obs.toPromise()));
        attachments = results.map(r => ({
          fileName: r!.fileName,
          mimeType: r!.mimeType,
          url: r!.url
        }));
      }

      // 2) Enviar mensaje
      const payload: Message = { ...params.message, attachments };
      const res = await this.http.post<{ id: string; threadId: string }>(this.base, payload).toPromise();

      // 3) Notificar receptor (fire-and-forget)
      this.http.post(this.notifications, {
        toUserId: params.message.receiverId,
        type: params.message.senderRole === 'PATIENT' ? 'NEW_PATIENT_MESSAGE' : 'NEW_DOCTOR_MESSAGE',
        refId: res?.id
      }).subscribe({});

      // 4) Archivar en historial clínico (fire-and-forget)
      const patientId =
        params.message.senderRole === 'PATIENT' ? params.message.senderId : params.message.receiverId;

      this.http.post(this.medrecArchive, {
        patientId,
        kind: 'MESSAGE',
        refId: res?.id
      }).subscribe({});

      return res;
    } finally {
      this.sending.set(false);
    }
  }
}
