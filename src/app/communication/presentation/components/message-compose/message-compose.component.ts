import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { MessagesStore } from '../../../application/messages.store';
import { UserStore } from '../../../../iam/application/user.store';
import { PatientStore } from '../../../../patients/application/patient.store';
import { AssignedPatientsStore } from '../../../../doctors/application/assigned-patients.store';
import { DoctorApiEndpoint } from '../../../../doctors/infrastructure/doctor-api.endpoint';

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
  private route = inject(ActivatedRoute);
  private assignedPatientsStore = inject(AssignedPatientsStore);
  private doctorApi = inject(DoctorApiEndpoint);

  subject = signal('');
  body = signal('');
  files = signal<File[]>([]);
  sending = signal(false);
  isUrgent = signal(false);  // ⭐ Flag de urgencia

  patientId = signal('');
  doctorId = signal('');
  doctorName = signal('');
  // For doctors: list of assigned patients to choose from
  patientsList = computed(() => this.assignedPatientsStore.patients());
  // current user role inferred from userStore/localStorage (PATIENT | DOCTOR)
  currentRole: 'PATIENT' | 'DOCTOR' | 'UNKNOWN' = 'UNKNOWN';

  ngOnInit(): void {
    // Obtener datos del usuario actual
    const currentUser = this.userStore.currentUser$() || (() => {
      try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); } catch { return null; }
    })();

    if (!currentUser || !currentUser.id) {
      console.warn('MessageCompose: usuario no autenticado');
      return;
    }

    const role = (currentUser.role || '').toString().toUpperCase();
    this.currentRole = role === 'DOCTOR' ? 'DOCTOR' : (role === 'PATIENT' ? 'PATIENT' : 'UNKNOWN');

    if (this.currentRole === 'PATIENT') {
      // Cargar paciente asociado y fijar doctor destino
      const patients = this.patientStore.patients$();
      if (patients.length === 0) {
        this.patientStore.loadAllPatients().subscribe({ next: (ps) => this.resolvePatientAndDoctor(currentUser.id) });
      } else {
        this.resolvePatientAndDoctor(currentUser.id);
      }
    } else if (this.currentRole === 'DOCTOR') {
      // Buscar doctor id por userId y cargar pacientes asignados
      this.doctorApi.getAll().subscribe({ next: (doctors) => {
        const doc = doctors.find((d: any) => d.userId === currentUser.id);
        if (doc) {
          const did = doc.id.toString();
          this.doctorId.set(did);
          this.assignedPatientsStore.loadPatientsByDoctor(doc.id);
          // Si nos pasaron patientId por queryParams (quick message), pre-selecciónalo
          const qp = this.route.snapshot.queryParamMap.get('patientId');
          if (qp) {
            this.patientId.set(qp.toString());
          }
        }
      }, error: (err) => console.error('Error cargando doctores:', err) });
    }
  }

  private resolvePatientAndDoctor(userId: number): void {
    const patients = this.patientStore.patients$();
    const patient = patients.find(p => p.userId === userId);
    
    if (patient) {
      this.patientId.set(patient.userId.toString());
      this.doctorId.set(patient.assignedDoctorId?.toString() || '');

      // If we have a doctor id, fetch doctor's name for display
      if (patient.assignedDoctorId) {
        this.doctorApi.getById(patient.assignedDoctorId).subscribe({
          next: (d: any) => this.doctorName.set(`${d.firstName || ''} ${d.lastName || ''}`.trim()),
          error: () => this.doctorName.set('')
        });
      }
      
      if (!patient.assignedDoctorId) {
        console.warn('⚠️ Paciente sin médico asignado');
      }
    }
  }

  canSend = computed(() => {
    if (this.sending()) return false;
    if (this.subject().trim().length === 0) return false;
    if (this.body().trim().length === 0) return false;
    // If patient, must have doctorId; if doctor, must select patientId
    if (this.currentRole === 'PATIENT') return this.doctorId().length > 0;
    if (this.currentRole === 'DOCTOR') return this.patientId().length > 0;
    // fallback: require both
    return this.doctorId().length > 0 && this.patientId().length > 0;
  });

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
      // Build message according to current role
      const role = this.currentRole === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';
      const senderId = role === 'DOCTOR' ? this.doctorId() : this.patientId();
      const receiverId = role === 'DOCTOR' ? this.patientId() : this.doctorId();

      if (!senderId || !receiverId) {
        alert('Falta destinatario o remitente.');
        return;
      }

      await this.store.sendMessage({
        message: {
          senderRole: role as any,
          senderId: senderId,
          receiverId: receiverId,
          subject: this.subject().trim(),
          body: this.body().trim(),
          isUrgent: this.isUrgent()
        },
        files: this.files()
      });
      // Reset suave
      this.subject.set('');
      this.body.set('');
      this.files.set([]);
      this.isUrgent.set(false);  // ⭐ Reset flag
      alert('Mensaje enviado correctamente.');
      // Navegar de vuelta al inbox según el rol (doctor usa ruta /doctor/messages)
      if (this.currentRole === 'DOCTOR') {
        this.router.navigate(['/doctor/messages']);
      } else {
        this.router.navigate(['/communication/messages']);
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      alert('Error al enviar el mensaje. Por favor intenta de nuevo.');
    } finally {
      this.sending.set(false);
    }
  }
}
