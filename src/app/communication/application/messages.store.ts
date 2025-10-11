import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { Message } from '../domain/model/message.entity';
import { Thread } from '../domain/model/thread.entity';
import { BaseApi } from '../../shared/infrastructure/base-api';

@Injectable({ providedIn: 'root' })
export class MessagesStore extends BaseApi {
  private http = inject(HttpClient);

  // Estado
  inbox = signal<Thread[]>([]);
  currentThread = signal<(Thread & { messages: Message[] }) | null>(null);
  sending = signal(false);
  closing = signal(false);

  // Computed: Total threads (can be enhanced to count unread when backend supports it)
  totalThreads = computed(() => this.inbox().length);
  
  // ⭐ Computed: Threads con mensajes urgentes sin leer
  urgentThreads = computed(() => 
    this.inbox().filter(t => t.hasUrgentMessages === true)
  );
  
  // ⭐ Computed: Cantidad total de mensajes sin leer
  totalUnreadMessages = computed(() => 
    this.inbox().reduce((sum, t) => sum + (t.unreadCount || 0), 0)
  );

  // Endpoints construidos desde baseUrl heredado de BaseApi
  private get messagesUrl() { return `${this.baseUrl}/messages`; }
  private get uploadsUrl() { return `${this.baseUrl}/uploads`; }
  private get notificationsUrl() { return `${this.baseUrl}/notifications`; }
  private get medicalRecordsUrl() { return `${this.baseUrl}/medical-records/archive`; }

  // ===== QUERIES =====

  loadInbox(role: 'PATIENT' | 'DOCTOR', userId: string) {
    // Para JSON Server simple, obtenemos todos los messages y los filtramos
    this.http
      .get<any[]>(this.messagesUrl)
      .subscribe({
        next: (messages) => {
          console.log('📨 Mensajes recibidos del servidor:', messages);
          
          // Agrupar mensajes por conversación (thread)
          const threadsMap = new Map<string, Thread>();
          
          messages.forEach((msg: any) => {
            // Crear key del thread basado en sender/receiver
            const senderId = msg.senderId?.toString() || '';
            const receiverId = msg.receiverId?.toString() || '';
            
            const key = role === 'PATIENT' 
              ? `patient-${senderId}-doctor-${receiverId}`
              : `patient-${receiverId}-doctor-${senderId}`;
              
            if (!threadsMap.has(key)) {
              threadsMap.set(key, {
                id: key,
                patientId: role === 'PATIENT' ? senderId : receiverId,
                doctorId: role === 'DOCTOR' ? senderId : receiverId,
                subject: msg.subject || 'Sin asunto',
                messages: [],
                status: 'OPEN',
                createdAt: msg.timestamp || new Date().toISOString(),
                updatedAt: msg.timestamp || new Date().toISOString(),
                hasUrgentMessages: false,
                unreadCount: 0
              });
            }
            
            const thread = threadsMap.get(key)!;
            if (!thread.messages) {
              thread.messages = [];
            }
            
            // Convertir el mensaje al formato interno
            const message: Message = {
              id: msg.id?.toString() || '',
              senderRole: msg.senderRole || 'PATIENT',
              senderId: senderId,
              receiverId: receiverId,
              subject: msg.subject || '',
              body: msg.content || msg.body || '',
              attachments: msg.attachments || [],
              isRead: msg.read || false,
              isUrgent: msg.isUrgent || false,
              createdAt: msg.timestamp || new Date().toISOString()
            };
            
            thread.messages.push(message);
            
            // Actualizar urgencia y contador
            if (msg.isUrgent) {
              thread.hasUrgentMessages = true;
            }
            if (!msg.read && receiverId === userId) {
              thread.unreadCount = (thread.unreadCount || 0) + 1;
            }
          });
          
          const threads = Array.from(threadsMap.values());
          console.log(`✅ ${threads.length} threads cargados para ${role} ${userId}`);
          this.inbox.set(threads);
        },
        error: (err) => {
          console.error('❌ Error cargando mensajes:', err);
          this.inbox.set([]);
        }
      });
  }

  openThread(threadId: string) {
    this.http
      .get<Thread & { messages: Message[] }>(`${this.messagesUrl}/threads/${threadId}`)
      .subscribe(t => this.currentThread.set(t));
  }

  // ===== COMMANDS =====

  /**
   * ⭐ Marcar mensaje como leído
   */
  async markAsRead(messageId: string) {
    await firstValueFrom(
      this.http.patch(`${this.messagesUrl}/messages/${messageId}/read`, {})
    );
  }

  /**
   * Crear un nuevo mensaje e iniciar hilo si aplica.
   * Simplificado para JSON Server
   */
  async sendMessage(params: {
    message: Omit<Message, 'id' | 'createdAt' | 'archivedToMedicalRecord'>;
    files?: File[];
  }) {
    try {
      this.sending.set(true);

      // Para JSON Server, simplemente creamos el mensaje
      const payload = {
        senderId: params.message.senderId,
        receiverId: params.message.receiverId,
        senderRole: params.message.senderRole,
        receiverRole: params.message.senderRole === 'PATIENT' ? 'doctor' : 'patient',
        subject: params.message.subject,
        content: params.message.body, // JSON Server usa 'content'
        timestamp: new Date().toISOString(),
        read: false,
        isUrgent: params.message.isUrgent || false,
        attachments: params.message.attachments || []
      };

      console.log('📤 Enviando mensaje:', payload);

      const res = await firstValueFrom(
        this.http.post<any>(this.messagesUrl, payload)
      );

      console.log('✅ Mensaje enviado:', res);

      // Recargar inbox después de enviar
      // Nota: En producción deberías obtener el role y userId del contexto
      return res;
    } catch (error) {
      console.error('❌ Error al enviar mensaje:', error);
      throw error;
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
        this.http.post<Message>(`${this.messagesUrl}/threads/${params.threadId}/reply`, message)
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
        .post(this.notificationsUrl, {
          toUserId: params.receiverPatientId,
          type: 'NEW_DOCTOR_MESSAGE',
          refId: res.id
        })
        .subscribe({});

      // Archivar respuesta en historial clínico del paciente
      this.http
        .post(this.medicalRecordsUrl, {
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
        this.http.patch<Thread>(`${this.messagesUrl}/threads/${threadId}`, { status: 'CLOSED' })
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
        .post(this.notificationsUrl, {
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

