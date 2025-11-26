import { Component, inject, computed, Signal, WritableSignal, signal, OnInit, effect } from '@angular/core';
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
import { DoctorApiEndpoint } from '../../../../doctors/infrastructure/doctor-api.endpoint';

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
  private doctorApi = inject(DoctorApiEndpoint);

  /** Cache local de nombres de usuarios por id (para mostrar nombres en las burbujas) */
  senderNames: WritableSignal<Record<string, string>> = signal({});
  /** Cache local de nombres de doctores por id */
  doctorNames: WritableSignal<Record<string, string>> = signal({});

  // Entrada de respuesta (solo usada cuando el doctor contesta)
  replyText = signal<string>('');
  
  // ID del doctor actual (si el usuario es doctor)
  doctorId = signal<string | null>(null);

  // Trackear cantidad de mensajes para detectar nuevos
  private previousMessageCount = 0;

  /**
   * Determina si la vista actual es del paciente
   */
  isPatientView(): boolean {
    try {
      const current = this.userStore.currentUser$() as any;
      const role = current ? (current.role || '').toUpperCase() : (localStorage.getItem('userRole') || '').toUpperCase();
      return role === 'PATIENT';
    } catch {
      return false;
    }
  }

  /**
   * Obtiene la inicial para el avatar
   */
  getAvatarInitial(thread: ThreadVM): string {
    if (!thread) return '?';
    const isPatient = this.isPatientView();
    // Si soy paciente, mostrar inicial del doctor, y viceversa
    return isPatient ? 'Dr' : 'P';
  }

  /**
   * Obtiene el título del chat (nombre del interlocutor)
   */
  getChatTitle(thread: ThreadVM): string {
    if (!thread) return 'Chat';
    const isPatient = this.isPatientView();
    if (isPatient) {
      return this.doctorNames()[thread.doctorId] || 'Doctor Asignado';
    } else {
      return this.senderNames()[thread.patientId] || 'Paciente';
    }
  }

  /**
   * Maneja el evento de tecla Enter para enviar mensaje
   */
  handleKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendReply();
    }
  }

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

  constructor() {
    // Efecto para detectar nuevos mensajes y hacer scroll automático
    effect(() => {
      const thread = this.store.currentThread();
      if (thread && thread.messages) {
        const currentCount = thread.messages.length;
        
        // Si hay nuevos mensajes (más que antes), hacer scroll y actualizar nombres
        if (currentCount > this.previousMessageCount && this.previousMessageCount > 0) {
          // Nuevos mensajes detectados
          const newMessages = thread.messages.slice(this.previousMessageCount);
          newMessages.forEach(m => this.fetchSenderName(m.senderId, m.senderRole));
          
          // Scroll automático solo si el usuario está cerca del final
          this.scrollToBottomIfNearEnd();
        } else if (this.previousMessageCount === 0 && currentCount > 0) {
          // Primera carga, hacer scroll completo
          this.scrollToBottom();
        }
        
        this.previousMessageCount = currentCount;
      } else {
        this.previousMessageCount = 0;
      }
    });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return; // nothing to load

    try {
      // 1. Cargar datos del usuario actual y determinar si es doctor
      const currentUser = this.userStore.currentUser$() as any;
      const role = currentUser ? (currentUser.role || '').toUpperCase() : (localStorage.getItem('userRole') || '').toUpperCase();
      const userId = currentUser ? currentUser.id.toString() : this.resolveUserId();

      if (role === 'DOCTOR') {
        // Buscar el perfil de doctor para obtener su ID de dominio (doctorId)
        this.doctorApi.getAll().subscribe({
          next: (doctors) => {
            const doc = doctors.find((d: any) => d.userId?.toString() === userId);
            if (doc) {
              this.doctorId.set(doc.id.toString());
            }
          }
        });
      }

      // 2. Abrir el hilo
      await this.store.openThread(id);
      
      // 3. Marcar como leído
      // El viewerId para marcar como leído es el userId (identidad) o el doctorId (dominio)
      // El store maneja la lógica, pero aquí pasamos el userId principal por ahora
      try { await this.store.markThreadAsRead(id, userId); } catch (e) { /* ignore */ }
      
      // 4. Pre-fetch nombres
      const t = this.store.currentThread();
      if (t) {
        // Fetch interlocutor name for title
        if (this.isPatientView()) {
          this.fetchSenderName(t.doctorId, 'DOCTOR');
        } else {
          this.fetchSenderName(t.patientId, 'PATIENT');
        }
        
        // Fetch names for messages
        (t.messages || []).forEach(m => this.fetchSenderName(m.senderId, m.senderRole));
      }
      
      // 5. Scroll al final
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
      // Usar el doctorId resuelto si está disponible, sino intentar usar el userId (fallback)
      const senderId = this.doctorId() || currentUser?.id?.toString() || this.resolveUserId();
      
      await this.store.replyToThread({
        threadId: t.id,
        senderDoctorId: senderId,
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
      const myDoctorId = this.doctorId();
      
      const senderId = m.senderId?.toString();
      return !!senderId && (senderId === myId || (!!myDoctorId && senderId === myDoctorId));
    } catch {
      return false;
    }
  }

  /** Devuelve el nombre mostrado para un mensaje (cacheado). */
  senderDisplayName(m: Message): string | null {
    if (!m?.senderId) return null;
    const id = m.senderId.toString();
    
    if (m.senderRole === 'DOCTOR') {
      return this.doctorNames()[id] || null;
    } else {
      return this.senderNames()[id] || null;
    }
  }

  private fetchSenderName(senderId?: string, role: 'PATIENT' | 'DOCTOR' = 'PATIENT') {
    if (!senderId) return;
    const id = senderId.toString();
    
    if (role === 'DOCTOR') {
      const map = this.doctorNames();
      if (map[id] !== undefined) return;
      
      this.doctorApi.getById(Number(id)).subscribe({
        next: (d: any) => {
          const name = d ? `${d.firstName || ''} ${d.lastName || ''}`.trim() : 'Doctor';
          this.doctorNames.set({ ...this.doctorNames(), [id]: name });
        },
        error: () => {
          this.doctorNames.set({ ...this.doctorNames(), [id]: 'Doctor' });
        }
      });
    } else {
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

  /**
   * Hace scroll solo si el usuario está cerca del final del chat
   * (para no interrumpir si está leyendo mensajes anteriores)
   */
  private scrollToBottomIfNearEnd() {
    setTimeout(() => {
      try {
        const el = document.querySelector('.chat-container') as HTMLElement;
        if (el) {
          const threshold = 100; // píxeles desde el final
          const isNearEnd = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
          
          if (isNearEnd) {
            el.scrollTop = el.scrollHeight;
          }
        }
      } catch (e) {
        // ignore
      }
    }, 100);
  }
}
