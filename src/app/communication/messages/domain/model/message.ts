import { Attachment } from './attachment';

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
}
