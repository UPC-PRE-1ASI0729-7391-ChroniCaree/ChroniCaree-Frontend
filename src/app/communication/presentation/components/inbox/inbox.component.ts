import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterModule, Router } from '@angular/router';
import { MessagesStore } from '../../../application/messages.store';
import { Thread } from '../../../domain/model/thread.entity';
import { UserStore } from '../../../../iam/application/user.store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

type ThreadVM = {
  id: string;
  subject: string;
  participantsCount: number;
  lastSnippet: string;
  lastMessageAt: Date | string | null;
  status?: string;
  hasUrgentMessages?: boolean;
  unreadCount?: number;
  previews?: Array<{ body: string; senderRole: string; createdAt?: string; senderId?: string }>;
};

@Component({
  standalone: true,
  selector: 'cc-inbox',
  imports: [CommonModule, NgIf, NgFor, RouterModule, RouterLink, TranslateModule],
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.css'],
})
export class InboxComponent implements OnInit {
  public readonly store = inject(MessagesStore);
  private readonly route = inject(ActivatedRoute);
  private readonly userStore = inject(UserStore);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslateService);

  expanded = new Set<string>();

  hasDetail = computed(() => {
    const ct = !!this.store.currentThread();
    const rid = !!this.route.snapshot.paramMap.get('id') || !!this.route.snapshot.firstChild?.paramMap.get('id');
    return ct || rid;
  });

  role: 'PATIENT' | 'DOCTOR' = 'PATIENT';
  userId = '';

  ngOnInit(): void {
    const currentUser = this.userStore.currentUser$();
    if (currentUser) {
      this.role = currentUser.role === 'doctor' ? 'DOCTOR' : 'PATIENT';
      this.userId = currentUser.id.toString();
    } else {
      const routeRole =
        (this.route.snapshot.data['role'] as 'patient' | 'doctor' | undefined) ??
        (this.route.parent?.snapshot.data['role'] as 'patient' | 'doctor' | undefined) ??
        'patient';

      this.role = routeRole === 'doctor' ? 'DOCTOR' : 'PATIENT';
      this.userId = this.resolveUserId(this.role);
    }

    this.store.loadInbox(this.role, this.userId);
  }

  get threads(): Thread[] {
    return this.store.inbox();
  }

  get threadsVM(): ThreadVM[] {
    const threads = this.store.inbox() || [];
    return threads.map((t: any) => {
      const messages = Array.isArray(t.messages) ? t.messages : [];
      const previews = messages
        .slice(-4)
        .map((m: any) => ({
          body: m.body || m.content || '',
          senderRole: m.senderRole,
          createdAt: m.createdAt,
          senderId: m.senderId
        }));

      const lastMsg = messages.length ? messages[messages.length - 1] : null;

      return {
        id: t.id || t.threadId || 'unknown',
        subject: t.subject || this.i18n.instant('messages.inbox.noSubject'),
        participantsCount: 2,
        lastSnippet: lastMsg?.body ?? lastMsg?.content ?? '',
        lastMessageAt: t.updatedAt || t.createdAt || lastMsg?.createdAt || null,
        status: t.status || 'OPEN',
        hasUrgentMessages: !!t.hasUrgentMessages,
        unreadCount: t.unreadCount || 0,
        previews
      } as ThreadVM;
    });
  }

  trackByVmId = (_: number, t: ThreadVM) => t.id;

  openThread(id: string) {
    try { this.store.openThread(id); } catch { /* noop */ }
  }

  navigateToThread(id: string) {
    this.router.navigate(['/communication/messages', 'thread', id]);
    try { void this.openAndMark(id); } catch { /* noop */ }
  }

  async openAndMark(id: string) {
    try { await this.store.openThread(id); } catch { /* ignore */ }
    try { await this.store.markThreadAsRead(id, this.userId); } catch { /* ignore */ }
  }

  toggleExpand(id: string) {
    if (this.expanded.has(id)) this.expanded.delete(id);
    else this.expanded.add(id);
  }

  getVisiblePreviews(t: ThreadVM) {
    if (!t.previews || t.previews.length === 0) return [];
    return this.expanded.has(t.id) ? t.previews : t.previews.slice(-4);
  }

  getPatientId(t: ThreadVM): string | undefined {
    if ((t as any).patientId) return (t as any).patientId;

    if ((t as any).participants && Array.isArray((t as any).participants)) {
      const p = (t as any).participants.find((x: any) => x.role === 'PATIENT');
      if (p) return p.id;
    }

    if (t.id && typeof t.id === 'string' && t.id.startsWith('patient-')) {
      const parts = t.id.split('-');
      if (parts.length >= 2) return parts[1];
    }

    return undefined;
  }

  getPatientName(t: ThreadVM): string {
    const patientId = this.getPatientId(t);
    return patientId
      ? this.i18n.instant('messages.inbox.patientId', { id: patientId })
      : this.i18n.instant('messages.inbox.patient');
  }

  getLastSender(t: ThreadVM): string {
    if (!t.previews || t.previews.length === 0) return '';

    const lastMsg = t.previews.at(-1);
    if (!lastMsg) return '';

    if (lastMsg.senderId === this.userId) {
      return this.i18n.instant('messages.sender.you');
    }

    return lastMsg.senderRole === 'PATIENT'
      ? this.i18n.instant('messages.sender.patient')
      : this.i18n.instant('messages.sender.doctor');
  }

  private resolveUserId(role: 'PATIENT' | 'DOCTOR'): string {
    return role === 'DOCTOR' ? 'DOCTOR-555' : 'PATIENT-123';
  }
}
