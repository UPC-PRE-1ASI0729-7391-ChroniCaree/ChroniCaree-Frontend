import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

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

  // Polling para actualización en tiempo real
  private pollingSubscription?: Subscription;
  private currentRole?: 'PATIENT' | 'DOCTOR';
  private currentUserId?: string;

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

  /**
   * Vista preparada para la UI (lista de hilos con snippet y fecha legible).
   * Evita que la UI tenga que lidiar con campos opcionales.
   */
  inboxView = computed(() => this.inbox().map(t => ({
    id: t.id,
    subject: t.subject || 'Sin asunto',
    lastSnippet: (t.messages && t.messages.length) ? (t.messages[t.messages.length - 1].body || '').slice(0, 120) : '',
    lastAt: t.updatedAt || t.createdAt || '',
    unreadCount: t.unreadCount || 0,
    hasUrgentMessages: !!t.hasUrgentMessages,
    patientId: t.patientId,
    doctorId: t.doctorId
  })) as Array<{
    id: string;
    subject: string;
    lastSnippet: string;
    lastAt: string;
    unreadCount: number;
    hasUrgentMessages: boolean;
    patientId: string;
    doctorId: string;
  }>);

  // Endpoints construidos desde baseUrl heredado de BaseApi
  private get messagesUrl() { return `${this.baseUrl}/messages`; }
  private get uploadsUrl() { return `${this.baseUrl}/uploads`; }
  private get notificationsUrl() { return `${this.baseUrl}/notifications`; }
  private get medicalRecordsUrl() { return `${this.baseUrl}/medical-records/archive`; }

  // ===== QUERIES =====

  /**
   * Carga el inbox y actualiza los threads desde los mensajes del servidor
   * Ahora verifica assignedDoctorId del paciente para asociación correcta
   */
  private async processMessages(messages: any[], role: 'PATIENT' | 'DOCTOR', userId: string): Promise<Thread[]> {
    // Cargar datos de pacientes y doctores para verificar relaciones
    let patients: any[] = [];
    let doctors: any[] = [];
    try {
      const [patientsData, doctorsData] = await Promise.all([
        firstValueFrom(this.http.get<any[]>(`${this.baseUrl}/patients`)),
        firstValueFrom(this.http.get<any[]>(`${this.baseUrl}/doctors`))
      ]);
      patients = patientsData;
      doctors = doctorsData;
    } catch (e) {
      console.warn('No se pudieron cargar datos auxiliares:', e);
    }

    // Resolver ID de doctor si el usuario actual es doctor
    let currentDoctorId = '';
    if (role === 'DOCTOR') {
      const doc = doctors.find(d => d.userId?.toString() === userId);
      if (doc) currentDoctorId = doc.id.toString();
    }

    // Filtrar mensajes según el rol
    const participantMessages = messages.filter((msg: any) => {
      const senderId = msg.senderId?.toString() || '';
      const receiverId = msg.receiverId?.toString() || '';
      
      if (role === 'PATIENT') {
        // Paciente: ve sus mensajes enviados y recibidos
        return senderId === userId || receiverId === userId;
      } else {
        // Doctor: ve mensajes de sus pacientes asignados
        const senderPatient = patients.find(p => p.userId?.toString() === senderId);
        const receiverPatient = patients.find(p => p.userId?.toString() === receiverId);
        
        // Comparar con el ID de doctor real (currentDoctorId)
        const isSenderMyPatient = senderPatient?.assignedDoctorId?.toString() === currentDoctorId;
        const isReceiverMyPatient = receiverPatient?.assignedDoctorId?.toString() === currentDoctorId;
        
        // El doctor está involucrado si el mensaje va dirigido a su userId O a su doctorId
        const isDoctorInvolved = senderId === userId || receiverId === userId ||
                                 (currentDoctorId && (senderId === currentDoctorId || receiverId === currentDoctorId));
        
        return isDoctorInvolved || isSenderMyPatient || isReceiverMyPatient;
      }
    });

    // Agrupar mensajes por conversación (thread)
    const threadsMap = new Map<string, Thread>();

    participantMessages.forEach((msg: any) => {
      const senderId = msg.senderId?.toString() || '';
      const receiverId = msg.receiverId?.toString() || '';

      // Determinar patientId y doctorId en el thread
      const isSenderPatient = (msg.senderRole || '').toUpperCase() === 'PATIENT';
      let patientId = isSenderPatient ? senderId : receiverId;
      let doctorId = isSenderPatient ? receiverId : senderId;

      // Verificar y corregir con assignedDoctorId si existe
      const patientData = patients.find(p => p.userId?.toString() === patientId);
      if (patientData?.assignedDoctorId) {
        doctorId = patientData.assignedDoctorId.toString();
      }

      const key = `patient-${patientId}-doctor-${doctorId}`;

      if (!threadsMap.has(key)) {
        threadsMap.set(key, {
          id: key,
          patientId: patientId,
          doctorId: doctorId,
          subject: msg.subject || 'Sin asunto',
          messages: [],
          status: 'OPEN',
          createdAt: msg.timestamp || new Date().toISOString(),
          updatedAt: msg.timestamp || new Date().toISOString(),
          hasUrgentMessages: false,
          unreadCount: 0
        });
      }

      // Asegurarnos de que TS sepa que el thread tiene messages y timestamps
      const thread = threadsMap.get(key)! as Thread & { messages: Message[]; createdAt: string; updatedAt: string };

      // Normalizar createdAt como string seguro
      const createdAt = msg.timestamp || new Date().toISOString();

      const message: Message = {
        id: msg.id?.toString() || '',
        senderRole: (msg.senderRole || 'PATIENT') as Message['senderRole'],
        senderId: senderId,
        receiverId: receiverId,
        subject: msg.subject || '',
        body: msg.content || msg.body || '',
        attachments: msg.attachments || [],
        isRead: !!msg.read,
        isUrgent: !!msg.isUrgent,
        createdAt: createdAt
      };

      // Garantizar array de mensajes antes de push
      thread.messages = thread.messages || [];
      thread.messages.push(message);

      if (message.isUrgent) {
        thread.hasUrgentMessages = true;
      }
      // contar sólo mensajes no leídos dirigidos al usuario actual (o su doctorId)
      const isRecipient = message.receiverId === userId || (currentDoctorId && message.receiverId === currentDoctorId);
      if (!message.isRead && isRecipient) {
        thread.unreadCount = (thread.unreadCount || 0) + 1;
      }
      // mantener updatedAt con la fecha más reciente
      thread.updatedAt = (createdAt > (thread.updatedAt || '')) ? createdAt : (thread.updatedAt || createdAt);
    });

    // Ordenar mensajes dentro de cada thread por fecha
    threadsMap.forEach(thread => {
      if (thread.messages && Array.isArray(thread.messages)) {
        thread.messages.sort((a, b) => {
          const dateA = a.createdAt || '';
          const dateB = b.createdAt || '';
          return dateA.localeCompare(dateB);
        });
      }
    });

    return Array.from(threadsMap.values()).sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }

  async loadInbox(role: 'PATIENT' | 'DOCTOR', userId: string) {
    // Guardar role y userId para el polling
    this.currentRole = role;
    this.currentUserId = userId;

    try {
      const messages = await firstValueFrom(this.http.get<any[]>(this.messagesUrl));
      console.log('📨 Mensajes recibidos del servidor:', messages);
      const threads = await this.processMessages(messages, role, userId);
      console.log(`✅ ${threads.length} threads cargados para ${role} ${userId}`);
      this.inbox.set(threads);

      // Actualizar thread actual si está abierto
      this.updateCurrentThreadIfOpen(threads);
      
      // Iniciar polling automático cada 5 segundos
      this.startPolling();
    } catch (err) {
      console.error('❌ Error cargando mensajes:', err);
      this.inbox.set([]);
    }
  }

  /**
   * Actualiza el thread actual si está abierto y hay cambios
   */
  private updateCurrentThreadIfOpen(threads: Thread[]) {
    const current = this.currentThread();
    if (!current) return;

    const updatedThread = threads.find(t => t.id === current.id);
    if (updatedThread) {
      // Comparar cantidad de mensajes para detectar nuevos
      const currentMsgCount = (current.messages || []).length;
      const updatedMsgCount = ((updatedThread as any).messages || []).length;

      if (updatedMsgCount > currentMsgCount) {
        // Hay nuevos mensajes, actualizar el thread actual
        const updatedThreadWithMessages = {
          ...updatedThread,
          messages: (updatedThread as any).messages || []
        } as Thread & { messages: Message[] };
        this.currentThread.set(updatedThreadWithMessages);
        console.log('🔄 Thread actualizado con nuevos mensajes');
      } else {
        // Actualizar otros campos (unreadCount, status, etc.) sin cambiar mensajes
        this.currentThread.set({
          ...current,
          unreadCount: updatedThread.unreadCount,
          hasUrgentMessages: updatedThread.hasUrgentMessages,
          status: updatedThread.status,
          updatedAt: updatedThread.updatedAt
        });
      }
    }
  }

  /**
   * Inicia el polling automático para actualizar mensajes cada 5 segundos
   */
  private startPolling() {
    // Detener polling anterior si existe
    this.stopPolling();

    if (!this.currentRole || !this.currentUserId) return;

    // Polling cada 5 segundos
    this.pollingSubscription = interval(5000)
      .pipe(
        switchMap(() => this.http.get<any[]>(this.messagesUrl))
      )
      .subscribe({
        next: async (messages) => {
          const threads = await this.processMessages(messages, this.currentRole!, this.currentUserId!);
          const previousThreads = this.inbox();
          
          // Solo actualizar si hay cambios (comparar cantidad de threads o mensajes)
          const hasChanges = this.hasInboxChanges(previousThreads, threads);
          if (hasChanges) {
            console.log('🔄 Actualizando inbox por polling...');
            this.inbox.set(threads);
            this.updateCurrentThreadIfOpen(threads);
          }
        },
        error: (err) => {
          // Silenciar errores de polling para no spamear la consola
          console.debug('⚠️ Error en polling (ignorado):', err);
        }
      });
  }

  /**
   * Detiene el polling automático
   */
  stopPolling() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  /**
   * Compara si hay cambios entre dos listas de threads
   */
  private hasInboxChanges(previous: Thread[], current: Thread[]): boolean {
    if (previous.length !== current.length) return true;

    // Comparar por ID de thread y cantidad de mensajes
    for (const currentThread of current) {
      const prevThread = previous.find(t => t.id === currentThread.id);
      if (!prevThread) return true;

      const prevMsgCount = ((prevThread as any).messages || []).length;
      const currMsgCount = ((currentThread as any).messages || []).length;
      if (prevMsgCount !== currMsgCount) return true;

      // Comparar updatedAt
      if (prevThread.updatedAt !== currentThread.updatedAt) return true;
    }

    return false;
  }

  async openThread(threadId: string) {
    try {
      const t = await firstValueFrom(this.http.get<Thread & { messages: Message[] }>(`${this.messagesUrl}/threads/${threadId}`));
      this.currentThread.set(t);
      return t;
    } catch (e) {
      // Fallback: try to build from inbox messages if threads endpoint not available
      const fromInbox = (this.inbox() || []).find(th => th.id === threadId);
      if (fromInbox) {
        // ensure messages array exists
        const t: Thread & { messages: Message[] } = { ...fromInbox, messages: (fromInbox as any).messages || [] } as any;
        this.currentThread.set(t);
        return t;
      }
      // rethrow to let caller handle
      throw e;
    }
  }

  /**
   * Limpia recursos cuando el store se destruye (opcional, pero buena práctica)
   */
  ngOnDestroy() {
    this.stopPolling();
  }

  /**
   * Marca como leídos los mensajes de un hilo para un usuario (viewerId).
   * Intenta usar el endpoint de patch por mensaje y actualiza en memoria.
   */
  async markThreadAsRead(threadId: string, viewerId: string) {
    // Si no tenemos el hilo cargado, intentar cargarlo primero (sincrónico via subscribe)
    if (!this.currentThread() || this.currentThread()?.id !== threadId) {
      await firstValueFrom(this.http.get<Thread & { messages: Message[] }>(`${this.messagesUrl}/threads/${threadId}`)
        .pipe());
      // NOTE: we don't set it here because openThread sets it via subscribe normally.
    }

    const cur = this.currentThread();
    if (!cur) return;

    const unreadMsgs = (cur.messages || []).filter(m => !m.isRead && m.receiverId === viewerId);
    if (!unreadMsgs.length) return;

    // Patch each message as read (fire-and-forget) and update in-memory message flags
    unreadMsgs.forEach(m => {
      // Best-effort, ignore errors
      this.http.patch(`${this.messagesUrl}/messages/${m.id}/read`, {}).subscribe({
        next: () => {
          // update in-memory
          m.isRead = true;
        },
        error: () => { /* ignore */ }
      });
    });

    // Recompute unreadCount for the current thread in memory
    const updatedMessages = cur.messages?.map(m => ({ ...m }));
    const updatedUnread = (updatedMessages || []).filter(m => !m.isRead && m.receiverId === viewerId).length;
    this.currentThread.set({ ...cur, messages: updatedMessages || [], unreadCount: updatedUnread });
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

      // Recargar inbox para el remitente (siempre que tengamos senderRole/senderId)
      try {
        const senderRole = (params.message.senderRole || 'PATIENT').toUpperCase() as 'PATIENT' | 'DOCTOR';
        let senderId = params.message.senderId?.toString();

        // Fix: If we are a doctor, ensure we use the User ID (stored in currentUserId) 
        // instead of the Doctor ID which might be passed in params.
        if (senderRole === 'DOCTOR' && this.currentRole === 'DOCTOR' && this.currentUserId) {
          senderId = this.currentUserId;
        }

        if (senderId) {
          // reload inbox so UI updates immediately
          this.loadInbox(senderRole, senderId);
        }
      } catch (e) {
        // ignore reload errors
      }

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
      // Construir mensaje y adjuntar threadId para backends simples
      const messagePayload = {
        threadId: params.threadId,
        senderRole: 'DOCTOR',
        senderId: params.senderDoctorId,
        receiverId: params.receiverPatientId,
        subject: 'Respuesta del médico',
        content: params.body,
        timestamp: new Date().toISOString(),
        read: false,
        isUrgent: false,
        attachments: []
      };

      // Intentamos escribir en el endpoint de mensajes genérico (más compatible con JSON Server)
      const res = await firstValueFrom(this.http.post<any>(this.messagesUrl, messagePayload));

      // Actualizar hilo abierto en memoria agregando el nuevo mensaje
      const cur = this.currentThread();
      const createdAt = res.createdAt || res.timestamp || new Date().toISOString();
      const newMsg: Message = {
        id: res.id?.toString() || '',
        threadId: params.threadId,
        senderRole: 'DOCTOR',
        senderId: params.senderDoctorId,
        receiverId: params.receiverPatientId,
        subject: res.subject || 'Respuesta del médico',
        body: res.content || res.body || params.body,
        attachments: res.attachments || [],
        createdAt: createdAt,
        isRead: false,
      };

      if (cur && cur.id === params.threadId) {
        this.currentThread.set({
          ...cur,
          status: 'OPEN',
          lastMessageAt: createdAt,
          messages: [...(cur.messages || []), newMsg]
        });
      }

      // Notificar al paciente (intento no bloqueante)
      this.http.post(this.notificationsUrl, {
        toUserId: params.receiverPatientId,
        type: 'NEW_DOCTOR_MESSAGE',
        refId: res.id
      }).subscribe({});

      // Archivar respuesta en historial clínico del paciente (no bloqueante)
      this.http.post(this.medicalRecordsUrl, {
        patientId: params.receiverPatientId,
        kind: 'MESSAGE',
        refId: res.id
      }).subscribe({});

      // Recargar inbox del doctor y del paciente para reflejar cambios
      try { 
        // Fix: Use stored currentUserId if we are the doctor sending this, to avoid ID mismatch (DoctorID vs UserID)
        const doctorUserId = (this.currentRole === 'DOCTOR' && this.currentUserId) ? this.currentUserId : params.senderDoctorId;
        this.loadInbox('DOCTOR', doctorUserId); 
      } catch {}
      try { this.loadInbox('PATIENT', params.receiverPatientId); } catch {}

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

