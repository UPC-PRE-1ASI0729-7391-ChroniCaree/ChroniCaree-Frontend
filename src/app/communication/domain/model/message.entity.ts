import { Attachment } from './attachment.entity';

export interface Message {
  id?: string;
  threadId?: string;
  senderRole: 'PATIENT' | 'DOCTOR';
  senderId: string;       // patientId o doctorId
  receiverId: string;     // doctorId o patientId
  body: string;
  subject?: string;       // ← opcional para que no falle si no lo envías
  attachments?: Attachment[];
  createdAt?: string;
  archivedToMedicalRecord?: boolean;
  isUrgent?: boolean;     // ⭐ Marca si el mensaje es urgente
  isRead?: boolean;       // ⭐ Indica si el mensaje fue leído
}
