import { Component, inject, computed, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { MessagesStore } from '../../../application/messages.store';
import { Message } from '../../../domain/model/message.entity';
import { Thread } from '../../../domain/model/thread.entity';

type ThreadVM = (Thread & { messages: Message[] }) | null;

@Component({
  standalone: true,
  selector: 'cc-message-thread',
  imports: [CommonModule, FormsModule],
  templateUrl: './message-thread.component.html',
  styleUrls: ['./message-thread.component.css'],
})
export class MessageThreadComponent {
  private route = inject(ActivatedRoute);
  private store = inject(MessagesStore);

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

  constructor() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.store.openThread(id);
  }

  async sendReply() {
    const t = this.store.currentThread();
    const body = this.replyText().trim();
    if (!t || !body) return;

    await this.store.replyToThread({
      threadId: t.id,
      senderDoctorId: t.doctorId,
      receiverPatientId: t.patientId,
      body,
    });

    this.replyText.set('');
  }

  async closeThread() {
    const t = this.store.currentThread();
    if (!t) return;

    await this.store.closeThread(t.id, t.patientId);
  }

  trackByMsgId(_: number, m: Message) {
    return m.id;
  }
}
