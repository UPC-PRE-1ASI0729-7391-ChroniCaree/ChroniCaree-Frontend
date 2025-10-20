import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MessagesStore } from '../../../application/messages.store';
import { UserStore } from '../../../../iam/application/user.store';
import { PatientStore } from '../../../../patients/application/patient.store';

@Component({
  standalone: true,
  selector: 'cc-message-compose',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './message-compose.component.html',
  styleUrls: ['./message-compose.component.css']
})
export class MessageComposeComponent implements OnInit {
  private store = inject(MessagesStore);
  private userStore = inject(UserStore);
  private patientStore = inject(PatientStore);
  private router = inject(Router);

  subject = signal('');
  body = signal('');
  files = signal<File[]>([]);
  sending = signal(false);
  isUrgent = signal(false);  // ⭐ Flag de urgencia

  patientId = signal('');
  doctorId = signal('');

  ngOnInit(): void {
    // Obtener datos del usuario actual
    const currentUser = this.userStore.currentUser$();
    if (currentUser) {
      // Cargar pacientes si no están cargados
      const patients = this.patientStore.patients$();
      if (patients.length === 0) {
        this.patientStore.loadAllPatients().subscribe({
          next: () => {
            this.resolvePatientAndDoctor(currentUser.id);
          }
        });
      } else {
        this.resolvePatientAndDoctor(currentUser.id);
      }
    }
  }

  private resolvePatientAndDoctor(userId: number): void {
    const patients = this.patientStore.patients$();
    const patient = patients.find(p => p.userId === userId);
    
    if (patient) {
      this.patientId.set(patient.id.toString());
      this.doctorId.set(patient.assignedDoctorId?.toString() || '');
      
      if (!patient.assignedDoctorId) {
        console.warn('⚠️ Paciente sin médico asignado');
      }
    }
  }

  canSend = computed(() =>
    !this.sending() &&
    this.subject().trim().length > 0 &&
    this.body().trim().length > 0 &&
    this.doctorId().length > 0  // Validar que haya un doctor asignado
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
    if (!this.canSend()) {
      alert('Por favor completa todos los campos y asegúrate de tener un doctor asignado.');
      return;
    }
    
    this.sending.set(true);
    try {
      await this.store.sendMessage({
        message: {
          senderRole: 'PATIENT',
          senderId: this.patientId(),
          receiverId: this.doctorId(),
          subject: this.subject().trim(),
          body: this.body().trim(),
          isUrgent: this.isUrgent()  // ⭐ Incluir flag de urgencia
        },
        files: this.files()
      });
      // Reset suave
      this.subject.set('');
      this.body.set('');
      this.files.set([]);
      this.isUrgent.set(false);  // ⭐ Reset flag
      alert('Mensaje enviado correctamente.');
      // Navegar de vuelta al inbox
      this.router.navigate(['/communication/messages']);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert('Error al enviar el mensaje. Por favor intenta de nuevo.');
    } finally {
      this.sending.set(false);
    }
  }
}
