import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MessagesStore } from '../../../application/messages.store';
import { UserStore } from '../../../../iam/application/user.store';
import { PatientStore } from '../../../../patients/application/patient.store';
import { AssignedPatientsStore } from '../../../../doctors/application/assigned-patients.store';
import { DoctorApiEndpoint } from '../../../../doctors/infrastructure/doctor-api.endpoint';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  standalone: true,
  selector: 'cc-message-compose',
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  templateUrl: './message-compose.component.html',
  styleUrls: ['./message-compose.component.css']
})
export class MessageComposeComponent implements OnInit {
  private store = inject(MessagesStore);
  private userStore = inject(UserStore);
  private patientStore = inject(PatientStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private assignedPatientsStore = inject(AssignedPatientsStore);
  private doctorApi = inject(DoctorApiEndpoint);
  private i18n = inject(TranslateService);

  subject = signal('');
  body = signal('');
  files = signal<File[]>([]);
  sending = signal(false);
  isUrgent = signal(false);

  patientId = signal('');
  doctorId = signal('');
  doctorName = signal('');

  patientsList = computed(() => this.assignedPatientsStore.patients());
  currentRole: 'PATIENT' | 'DOCTOR' | 'UNKNOWN' = 'UNKNOWN';

  ngOnInit(): void {
    const currentUser = this.userStore.currentUser$() || (() => {
      try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); }
      catch { return null; }
    })();

    if (!currentUser || !currentUser.id) {
      console.warn('MessageCompose: usuario no autenticado');
      return;
    }

    const role = (currentUser.role || '').toString().toUpperCase();
    this.currentRole = role === 'DOCTOR' ? 'DOCTOR' : (role === 'PATIENT' ? 'PATIENT' : 'UNKNOWN');

    if (this.currentRole === 'PATIENT') {
      const patients = this.patientStore.patients$();
      if (patients.length === 0) {
        this.patientStore.loadAllPatients().subscribe({ next: () => this.resolvePatientAndDoctor(currentUser.id) });
      } else {
        this.resolvePatientAndDoctor(currentUser.id);
      }
    } else if (this.currentRole === 'DOCTOR') {
      this.doctorApi.getAll().subscribe({
        next: (doctors) => {
          const doc = doctors.find((d: any) => d.userId === currentUser.id);
          if (doc) {
            const did = doc.id.toString();
            this.doctorId.set(did);
            this.assignedPatientsStore.loadPatientsByDoctor(doc.id);

            const qp = this.route.snapshot.queryParamMap.get('patientId');
            if (qp) this.patientId.set(qp.toString());
          }
        },
        error: (err) => console.error('Error cargando doctores:', err)
      });
    }
  }

  private resolvePatientAndDoctor(userId: number): void {
    const patients = this.patientStore.patients$();
    const patient = patients.find(p => p.userId === userId);

    if (patient) {
      this.patientId.set(patient.userId.toString());
      this.doctorId.set(patient.assignedDoctorId?.toString() || '');

      if (patient.assignedDoctorId) {
        this.doctorApi.getById(patient.assignedDoctorId).subscribe({
          next: (d: any) => this.doctorName.set(`${d.firstName || ''} ${d.lastName || ''}`.trim()),
          error: () => this.doctorName.set('')
        });
      } else {
        console.warn('⚠️ Paciente sin médico asignado');
      }
    }
  }

  canSend = computed(() => {
    if (this.sending()) return false;
    if (this.subject().trim().length === 0) return false;
    if (this.body().trim().length === 0) return false;

    if (this.currentRole === 'PATIENT') return this.doctorId().length > 0;
    if (this.currentRole === 'DOCTOR') return this.patientId().length > 0;

    return this.doctorId().length > 0 && this.patientId().length > 0;
  });

  onFiles(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files?.length) return;
    const current = this.files();
    this.files.set([...current, ...Array.from(input.files)]);
    input.value = '';
  }

  removeFile(index: number) {
    const arr = [...this.files()];
    arr.splice(index, 1);
    this.files.set(arr);
  }

  async send() {
    if (!this.canSend()) {
      alert(this.i18n.instant('messages.compose.alerts.fillAll'));
      return;
    }

    this.sending.set(true);
    try {
      const role = this.currentRole === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';
      const senderId = role === 'DOCTOR' ? this.doctorId() : this.patientId();
      const receiverId = role === 'DOCTOR' ? this.patientId() : this.doctorId();

      if (!senderId || !receiverId) {
        alert(this.i18n.instant('messages.compose.alerts.missingRecipient'));
        return;
      }

      await this.store.sendMessage({
        message: {
          senderRole: role as any,
          senderId,
          receiverId,
          subject: this.subject().trim(),
          body: this.body().trim(),
          isUrgent: this.isUrgent()
        },
        files: this.files()
      });

      this.subject.set('');
      this.body.set('');
      this.files.set([]);
      this.isUrgent.set(false);

      alert(this.i18n.instant('messages.compose.alerts.sentOk'));

      if (this.currentRole === 'DOCTOR') this.router.navigate(['/doctor/messages']);
      else this.router.navigate(['/communication/messages']);

    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert(this.i18n.instant('messages.compose.alerts.sendError'));
    } finally {
      this.sending.set(false);
    }
  }
}
