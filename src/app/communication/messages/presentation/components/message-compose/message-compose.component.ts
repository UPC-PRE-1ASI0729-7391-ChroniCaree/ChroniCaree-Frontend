import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessagesStore } from '../../../application/messages.store';

@Component({
  standalone: true,
  selector: 'cc-message-compose',
  imports: [CommonModule, FormsModule],
  templateUrl: './message-compose.component.html',
  styleUrls: ['./message-compose.component.css']
})
export class MessageComposeComponent {
  private store = inject(MessagesStore);

  subject = '';
  body = '';
  files = signal<File[]>([]);
  patientId = 'PATIENT-123';
  doctorId = 'DOCTOR-555';

  onFiles(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (input.files?.length) this.files.set(Array.from(input.files));
  }

  async send() {
    await this.store.sendMessage({
      message: {
        senderRole: 'PATIENT',
        senderId: this.patientId,
        receiverId: this.doctorId,
        subject: this.subject,   // ahora es válido
        body: this.body
      },
      files: this.files()
    });
    this.subject = '';
    this.body = '';
    this.files.set([]);
    alert('Mensaje enviado.');
  }
}
