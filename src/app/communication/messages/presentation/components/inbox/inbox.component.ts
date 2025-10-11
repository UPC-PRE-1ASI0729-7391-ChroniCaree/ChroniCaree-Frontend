import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterOutlet } from '@angular/router';

import { MessagesStore } from '../../../application/messages.store';
import { Thread } from '../../../../domain/model/thread.entity';

type ThreadVM = {
  id: string;
  subject: string;
  participantsCount: number;
  lastSnippet: string;
  lastMessageAt: Date | string | null;
  status?: string; // 'OPEN' | 'CLOSED' | etc.
};

@Component({
  standalone: true,
  selector: 'cc-inbox',
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.css'],
})
export class InboxComponent implements OnInit {
  private readonly store = inject(MessagesStore);
  private readonly route = inject(ActivatedRoute);

  role: 'PATIENT' | 'DOCTOR' = 'PATIENT';
  userId = '';

  ngOnInit(): void {
    const routeRole =
      (this.route.snapshot.data['role'] as 'patient' | 'doctor' | undefined) ??
      (this.route.parent?.snapshot.data['role'] as 'patient' | 'doctor' | undefined) ??
      'patient';

    this.role = routeRole === 'doctor' ? 'DOCTOR' : 'PATIENT';
    this.userId = this.resolveUserId(this.role);

    this.store.loadInbox(this.role, this.userId);
  }

  // Threads originales (por si los necesitas en otro sitio)
  get threads(): Thread[] {
    return this.store.inbox();
  }

  // ViewModel seguro para la plantilla
  get threadsVM(): ThreadVM[] {
    const raw = (this.store.inbox() as unknown[]) ?? [];
    return raw.map((t: any): ThreadVM => {
      const subject: string = t.subject ?? t.title ?? '(Sin asunto)';
      const messages: any[] = Array.isArray(t.messages) ? t.messages : [];
      const lastMsg = messages.length ? messages[messages.length - 1] : null;

      const lastMessageAt: Date | string | null =
        t.lastMessageAt ?? lastMsg?.createdAt ?? t.updatedAt ?? t.createdAt ?? null;

      const lastSnippet: string = t.lastSnippet ?? lastMsg?.body ?? '';

      const participantsArray =
        t.participants ?? t.members ?? t.recipients ?? [];
      const participantsCount = Array.isArray(participantsArray)
        ? participantsArray.length
        : 2; // fallback razonable

      const status: string | undefined =
        t.status ?? (t.closed ? 'CLOSED' : 'OPEN');

      const id: string =
        t.id ?? t.threadId ?? cryptoRandomId();

      return {
        id,
        subject,
        participantsCount,
        lastSnippet,
        lastMessageAt,
        status,
      };
    });
  }

  trackByVmId = (_: number, t: ThreadVM) => t.id;

  private resolveUserId(role: 'PATIENT' | 'DOCTOR'): string {
    return role === 'DOCTOR' ? 'DOCTOR-555' : 'PATIENT-123';
  }
}

// Pequeño helper para IDs si el backend no envía uno
function cryptoRandomId(): string {
  try {
    // navegador moderno
    return crypto.randomUUID();
  } catch {
    // fallback
    return 'tmp-' + Math.random().toString(36).slice(2, 10);
  }
}
