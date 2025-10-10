export interface Attachment {
  id?: string;
  fileName: string;
  mimeType: string;
  url?: string;         // URL accesible para el médico
  sizeBytes?: number;
}
