/**
 * Patient Resource (DTO)
 * Representa el formato de datos raw del API
 */

export interface EmergencyContactResource {
  name: string;
  relationship: string;
  phone: string;
}

export interface PatientResource {
  id: number;
  userId: number;
  assignedDoctorId: number | null;
  tenantId: number | null;
  subscriptionId: number | null;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  address: string;
  weight: number;
  height: number;
  bmi: number;
  emergencyContact: EmergencyContactResource;
}

export interface CreatePatientRequest {
  userId: number;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  address: string;
  weight?: number;
  height?: number;
  emergencyContact?: EmergencyContactResource;
}

export interface UpdatePatientRequest {
  assignedDoctorId?: number | null;
  subscriptionId?: number | null;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  weight?: number;
  height?: number;
  emergencyContact?: EmergencyContactResource;
}
