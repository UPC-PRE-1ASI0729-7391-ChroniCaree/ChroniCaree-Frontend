import { Component, inject, computed, Signal, WritableSignal, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

import { MessagesStore } from '../../../application/messages.store';
import { Message } from '../../../domain/model/message.entity';
import { Thread } from '../../../domain/model/thread.entity';
import { UserStore } from '../../../../iam/application/user.store';
import { AfterViewInit } from '@angular/core';

type ThreadVM = (Thread & { messages: Message[] }) | null;

@Component({
  standalone: true,
  selector: 'cc-message-thread',
  imports: [CommonModule, FormsModule],
  templateUrl: './message-thread.component.html',
  styleUrls: ['./message-thread.component.css'],
})
export class MessageThreadComponent implements AfterViewInit {
  private route = inject(ActivatedRoute);
  private store = inject(MessagesStore);
  private userStore = inject(UserStore);
  private http = inject(HttpClient);

  /** Cache local de nombres de usuarios por id (para mostrar nombres en las burbujas) */
  senderNames: WritableSignal<Record<string, string>> = signal({});

  // Entrada de respuesta (solo usada cuando el doctor contesta)
  replyText = signal<string>('');

  // ViewModel derivado del store
  vm: Signal<{
    thread: ThreadVM;
    sending: boolean;
    closing: boolean;
    canReply: boolean;
    canClose: boolean;
  }> = computed(() => {
    const t = this.store.currentThread();
    const sending = this.store.sending();
    const closing = this.store.closing();
    // Si el hilo está abierto, habilitamos acciones de respuesta/cierre del doctor
    const canReply = !!t && t.status === 'OPEN';
    const canClose = !!t && t.status === 'OPEN';
    return { thread: t, sending, closing, canReply, canClose };
  });

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return; // nothing to load

    try {
      await this.store.openThread(id);
      const currentUser = this.userStore.currentUser$() as any;
      const viewerId = currentUser ? currentUser.id.toString() : this.resolveUserId();
      // mark messages as read for the viewer
      try { await this.store.markThreadAsRead(id, viewerId); } catch (e) { /* ignore */ }
      // Pre-fetch sender display names for messages in the thread
      const t = this.store.currentThread();
      (t?.messages || []).forEach(m => this.fetchSenderName(m.senderId));
      // ensure we scroll to the bottom after initial load
      this.scrollToBottom();
    } catch (e) {
      // ignore load errors
    }
  }

  ngAfterViewInit(): void {
    // after view init, attempt to scroll (in case messages already present)
    setTimeout(() => this.scrollToBottom(), 50);
  }

  private resolveUserId(): string {
    try { return JSON.parse(localStorage.getItem('currentUser') || 'null')?.id?.toString() || 'ANON'; } catch { return 'ANON'; }
  }

  async sendReply() {
    const t = this.store.currentThread();
    const body = this.replyText().trim();
    if (!t || !body) return;

    // Determine current user role so we send the message with the correct sender
    const currentUser = this.userStore.currentUser$() as any;
    const role = currentUser ? (currentUser.role || '').toUpperCase() : (localStorage.getItem('userRole') || '').toUpperCase();

    if (role === 'DOCTOR') {
      // existing doctor reply flow (keeps server-side doctor-specific endpoints/notifications)
      await this.store.replyToThread({
        threadId: t.id,
        senderDoctorId: t.doctorId,
        receiverPatientId: t.patientId,
        body,
      });
    } else {
      // patient sending: use generic sendMessage so sender is the patient
      try {
        const senderId = currentUser ? currentUser.id?.toString() : this.resolveUserId();
        const receiverId = t.doctorId;
        const res = await this.store.sendMessage({
          message: {
            senderId: senderId,
            receiverId: receiverId,
            senderRole: 'PATIENT',
            subject: t.subject || 'Respuesta',
            body: body,
            attachments: [] as any,
            isRead: false,
            isUrgent: false
          }
        });

        // Append the created message to the current thread in-memory so UI updates immediately
        const cur = this.store.currentThread();
        const createdAt = res.createdAt || res.timestamp || new Date().toISOString();
        const newMsg = {
          id: res.id?.toString() || '',
          threadId: t.id,
          senderRole: 'PATIENT',
          senderId: senderId,
          receiverId: receiverId,
          subject: res.subject || t.subject || 'Respuesta',
          body: res.content || res.body || body,
          attachments: res.attachments || [],
          createdAt: createdAt,
          isRead: false
        } as any;

        if (cur && cur.id === t.id) {
          this.store.currentThread.set({
            ...cur,
            status: 'OPEN',
            lastMessageAt: createdAt,
            messages: [...(cur.messages || []), newMsg]
          });
        }
      } catch (e) {
        // fallthrough -- errors handled in store
      }
    }

    this.replyText.set('');
    // scroll to the bottom to show the new message
    this.scrollToBottom();
  }

  async closeThread() {
    const t = this.store.currentThread();
    if (!t) return;

    await this.store.closeThread(t.id, t.patientId);
  }

  /**
   * Decide si el mensaje fue enviado por el usuario actual.
   * Compara el senderId con el usuario actual (si está disponible en userStore o en localStorage).
   */
  isMine(m: Message): boolean {
    try {
      const current = this.userStore.currentUser$() as any;
      const myId = current ? current.id?.toString() : this.resolveUserId();
      return !!m.senderId && m.senderId.toString() === myId;
    } catch {
      return false;
    }
  }

  /** Devuelve el nombre mostrado para un mensaje (cacheado). */
  senderDisplayName(m: Message): string | null {
    if (!m?.senderId) return null;
    const map = this.senderNames();
    return map[m.senderId?.toString()] || null;
  }

  private fetchSenderName(senderId?: string) {
    if (!senderId) return;
    const id = senderId.toString();
    const map = this.senderNames();
    if (map[id] !== undefined) return; // ya cacheado (incluye empty string)

    // GET /users/:id usando endpoint centralizado
    this.http.get<any>(`${environment.apiBaseUrl}${environment.usersEndpointPath}/${id}`).subscribe({
      next: (u) => {
        const name = u?.name || (u?.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : '') || '';
        const cur = this.senderNames();
        this.senderNames.set({ ...cur, [id]: name });
      },
      error: () => {
        // fallback: cache vacío para evitar reintentos continuos
        const cur = this.senderNames();
        this.senderNames.set({ ...cur, [id]: '' });
      }
    });
  }

  trackByMsgId(_: number, m: Message) {
    return m.id;
  }

  private scrollToBottom() {
    // small timeout to allow DOM to update
    setTimeout(() => {
      try {
        const el = document.querySelector('.chat-container');
        if (el) {
          el.scrollTop = el.scrollHeight;
        }
      } catch (e) {
        // ignore
      }
    }, 80);
  }
}
