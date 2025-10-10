import { Message } from './message';

export interface Thread {
  id: string;
  patientId: string;
  doctorId: string;
  status: 'OPEN' | 'CLOSED';
  lastMessageAt?: string;
  // si tu API embebe mensajes en el thread:
  messages?: Message[];
}
