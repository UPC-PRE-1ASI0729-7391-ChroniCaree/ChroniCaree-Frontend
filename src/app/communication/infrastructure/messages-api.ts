import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Message } from '../domain/model/message.entity';
import { Thread } from '../domain/model/thread.entity';

@Injectable({ providedIn: 'root' })
export class MessagesApi {
  private http = inject(HttpClient);
  private base = '/api/messages';

  /**
   * Crear un nuevo mensaje iniciando hilo (paciente -> doctor).
   */
  sendMessage(msg: Message): Observable<{ id: string; threadId: string }> {
    return this.http.post<{ id: string; threadId: string }>(`${this.base}`, msg);
  }

  /**
   * Responder dentro de un hilo existente (doctor -> paciente).
   * Si tu backend usa otro path, ajústalo aquí.
   */
  reply(params: {
    threadId: string;
    message: Omit<Message, 'id' | 'createdAt' | 'archivedToMedicalRecord'>;
  }): Observable<Message> {
    return this.http.post<Message>(
      `${this.base}/threads/${params.threadId}/reply`,
      params.message
    );
  }

  /**
   * Cerrar un hilo como resuelto.
   */
  closeThread(threadId: string): Observable<Thread> {
    return this.http.patch<Thread>(`${this.base}/threads/${threadId}`, {
      status: 'CLOSED'
    });
  }

  /**
   * Obtener un hilo con sus mensajes.
   */
  getThread(threadId: string): Observable<Thread & { messages: Message[] }> {
    return this.http.get<Thread & { messages: Message[] }>(
      `${this.base}/threads/${threadId}`
    );
  }

  /**
   * Listar bandeja de entrada por rol e id de usuario.
   */
  listInbox(role: 'PATIENT' | 'DOCTOR', userId: string): Observable<Thread[]> {
    return this.http.get<Thread[]>(`${this.base}/inbox`, {
      params: { role, userId }
    });
  }
}
