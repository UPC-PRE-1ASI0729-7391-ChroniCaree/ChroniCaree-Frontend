import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessagesStore } from '../../../application/messages.store';

@Component({
  standalone: true,
  selector: 'cc-message-compose',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './message-compose.component.html',
  styleUrls: ['./message-compose.component.css']
})
export class MessageComposeComponent {
  private store = inject(MessagesStore);

  subject = '';
  body = '';
  files = signal<File[]>([]);
  sending = signal(false);

  // Por ahora hardcodeado (puedes traerlo de auth/contexto)
  patientId = 'PATIENT-123';
  doctorId = 'DOCTOR-555';

  canSend = computed(() =>
    !this.sending() &&
    this.subject.trim().length > 0 &&
    this.body.trim().length > 0
  );

  onFiles(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files?.length) return;
    const current = this.files();
    this.files.set([...current, ...Array.from(input.files)]);
    input.value = ''; // limpia para permitir re-selección
  }

  removeFile(index: number) {
    const arr = [...this.files()];
    arr.splice(index, 1);
    this.files.set(arr);
  }

  async send() {
    if (!this.canSend()) return;
    this.sending.set(true);
    try {
      await this.store.sendMessage({
        message: {
          senderRole: 'PATIENT',
          senderId: this.patientId,
          receiverId: this.doctorId,
          subject: this.subject.trim(),
          body: this.body.trim()
        },
        files: this.files()
      });
      // Reset suave
      this.subject = '';
      this.body = '';
      this.files.set([]);
      alert('Mensaje enviado.');
    } finally {
      this.sending.set(false);
    }
  }
}
