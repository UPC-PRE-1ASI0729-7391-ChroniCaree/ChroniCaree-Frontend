import { Message } from './message.entity';

export interface Thread {
  id: string;
  patientId: string;
  doctorId: string;
  subject?: string;             // ⭐ Asunto del thread
  status: 'OPEN' | 'CLOSED';
  lastMessageAt?: string;
  createdAt?: string;
  updatedAt?: string;
  // si tu API embebe mensajes en el thread:
  messages?: Message[];
  hasUrgentMessages?: boolean;  // ⭐ Indica si el thread tiene mensajes urgentes sin leer
  unreadCount?: number;         // ⭐ Cantidad de mensajes sin leer
}
