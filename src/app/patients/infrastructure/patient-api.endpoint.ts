/**
 * Patient API Endpoints
 * Centraliza las URLs del API de pacientes
 */

const BASE_URL = 'http://localhost:3000';
const PATIENT_API = `${BASE_URL}/patients`;

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

  static getByTenantId(tenantId: string | number): string {
    return `${PATIENT_API}?tenantId=${tenantId}`;
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
}
