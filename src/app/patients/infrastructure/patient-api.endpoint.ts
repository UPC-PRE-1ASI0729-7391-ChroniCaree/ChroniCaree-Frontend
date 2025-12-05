/**
 * Patient API Endpoints
 * Centraliza las URLs del API de pacientes
 */

import { environment } from '../../../environments/environment';

const PATIENT_API = `${environment.apiBaseUrl}${environment.patientsEndpointPath}`;

export class PatientApiEndpoint {
  static getAll(): string {
    return PATIENT_API;
  }

  static getById(id: string | number): string {
    return `${PATIENT_API}/${id}`;
  }

  static getByUserId(userId: string | number): string {
    return `${PATIENT_API}?userId=${userId}`;
  }

  static getByDoctorId(doctorId: string | number): string {
    return `${PATIENT_API}?assignedDoctorId=${doctorId}`;
  }

  /**
   * Obtener pacientes por tenant (hospital)
   * Backend endpoint: GET /patients/by-tenant/{tenantId}
   */
  static getByTenantId(tenantId: string | number): string {
    return `${PATIENT_API}/by-tenant/${tenantId}`;
  }

  static create(): string {
    return PATIENT_API;
  }

  static update(id: string | number): string {
    return `${PATIENT_API}/${id}`;
  }

  static delete(id: string | number): string {
    return `${PATIENT_API}/${id}`;
  }

  /**
   * Asignar doctor a paciente
   * Backend endpoint: PUT /patients/{patientId}/assign-doctor
   */
  static assignDoctor(patientId: string | number): string {
    return `${PATIENT_API}/${patientId}/assign-doctor`;
  }

  /**
   * Desasignar doctor de paciente
   * Backend endpoint: DELETE /patients/{patientId}/assign-doctor
   */
  static unassignDoctor(patientId: string | number): string {
    return `${PATIENT_API}/${patientId}/assign-doctor`;
  }
}
