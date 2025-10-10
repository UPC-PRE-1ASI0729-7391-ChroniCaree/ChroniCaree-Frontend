import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Message } from '../domain/model/message';   // ✅ correcto
import { Thread } from '../domain/model/thread';     // ✅ mover import aquí

@Injectable({ providedIn: 'root' })
export class MessagesApi {
  private http = inject(HttpClient);
  private base = '/api/messages';

  sendMessage(msg: Message): Observable<{ id: string; threadId: string }> {
    return this.http.post<{ id: string; threadId: string }>(`${this.base}`, msg);
  }

  getThread(threadId: string): Observable<Thread & { messages: Message[] }> {
    return this.http.get<Thread & { messages: Message[] }>(`${this.base}/threads/${threadId}`);
  }

  listInbox(role: 'PATIENT' | 'DOCTOR', userId: string): Observable<Thread[]> {
    return this.http.get<Thread[]>(`${this.base}/inbox`, { params: { role, userId } });
  }
}
