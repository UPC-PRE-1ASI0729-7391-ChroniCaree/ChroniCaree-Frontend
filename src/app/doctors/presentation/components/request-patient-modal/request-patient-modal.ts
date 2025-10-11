/**
 * Request Patient Modal Component
 * Doctors Bounded Context - Presentation Layer
 * 
 * Modal para que el doctor solicite asignación de pacientes disponibles
 */
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface AvailablePatient {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  subscriptionId: number;
  hasActiveSubscription: boolean;
}

@Component({
  selector: 'app-request-patient-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './request-patient-modal.html',
  styleUrl: './request-patient-modal.css'
})
export class RequestPatientModalComponent implements OnInit {
  private readonly http = inject(HttpClient);
  
  readonly availablePatients = signal<AvailablePatient[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly selectedPatientId = signal<number | null>(null);
  readonly requesting = signal(false);
  
  // Computed: Paciente seleccionado
  readonly selectedPatient = computed(() => {
    const id = this.selectedPatientId();
    return this.availablePatients().find(p => p.id === id) || null;
  });
  
  ngOnInit(): void {
    this.loadAvailablePatients();
  }
  
  /**
   * Carga pacientes sin doctor asignado
   */
  loadAvailablePatients(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.http.get<any[]>(`${environment.apiBaseUrl}/patients`).subscribe({
      next: (patients) => {
        // Filtrar solo pacientes sin doctor asignado
        const available = patients.filter(p => !p.assignedDoctorId || p.assignedDoctorId === null);
        
        this.availablePatients.set(available.map(p => ({
          id: p.id,
          userId: p.userId,
          firstName: p.firstName,
          lastName: p.lastName,
          dni: p.dni,
          birthDate: p.birthDate,
          gender: p.gender,
          phone: p.phone,
          subscriptionId: p.subscriptionId,
          hasActiveSubscription: !!p.subscriptionId
        })));
        
        this.loading.set(false);
        console.log(`✅ Found ${available.length} available patients`);
      },
      error: (err) => {
        console.error('❌ Error loading available patients:', err);
        this.error.set('Error al cargar pacientes disponibles');
        this.loading.set(false);
      }
    });
  }
  
  /**
   * Selecciona un paciente
   */
  selectPatient(patientId: number): void {
    this.selectedPatientId.set(patientId);
  }
  
  /**
   * Calcula la edad del paciente
   */
  calculateAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
  
  /**
   * Solicita la asignación del paciente seleccionado
   */
  requestPatient(): void {
    const patientId = this.selectedPatientId();
    if (!patientId) {
      return;
    }
    
    this.requesting.set(true);
    
    // Obtener doctor ID desde localStorage
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
      alert('Error: No se encontró usuario autenticado');
      this.requesting.set(false);
      return;
    }
    
    const currentUser = JSON.parse(currentUserStr);
    const userId = currentUser.id;
    
    // Primero obtener el doctor ID
    this.http.get<any[]>(`${environment.apiBaseUrl}/doctors`).subscribe({
      next: (doctors) => {
        const doctor = doctors.find(d => d.userId === userId);
        
        if (!doctor) {
          alert('Error: No se encontró perfil de doctor');
          this.requesting.set(false);
          return;
        }
        
        // Actualizar el paciente con assignedDoctorId
        this.http.patch(`${environment.apiBaseUrl}/patients/${patientId}`, {
          assignedDoctorId: doctor.id
        }).subscribe({
          next: () => {
            console.log(`✅ Patient ${patientId} assigned to doctor ${doctor.id}`);
            this.requesting.set(false);
            
            // Emitir evento para cerrar modal y recargar
            window.dispatchEvent(new CustomEvent('patient-assigned'));
            this.close();
          },
          error: (err) => {
            console.error('❌ Error assigning patient:', err);
            alert('Error al asignar paciente. Intenta de nuevo.');
            this.requesting.set(false);
          }
        });
      },
      error: (err) => {
        console.error('❌ Error fetching doctors:', err);
        alert('Error al obtener información del doctor');
        this.requesting.set(false);
      }
    });
  }
  
  /**
   * Cierra el modal
   */
  close(): void {
    window.dispatchEvent(new CustomEvent('close-modal'));
  }
}
