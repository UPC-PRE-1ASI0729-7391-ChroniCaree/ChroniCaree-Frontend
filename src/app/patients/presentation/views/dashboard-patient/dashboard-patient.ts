import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { OnboardingComponent } from '../../../../shared/presentation/components/onboarding/onboarding';
import { NudgePanelComponent } from '../../../../shared/presentation/components/nudge-panel/nudge-panel';

@Component({
  selector: 'app-dashboard-patient',
  standalone: true,
  imports: [CommonModule, RouterLink, OnboardingComponent, NudgePanelComponent],
  templateUrl: './dashboard-patient.html',
  styleUrl: './dashboard-patient.css'
})
export class DashboardPatient implements OnInit {
  protected readonly patientName = signal('María García');
  protected readonly age = signal(45);
  protected readonly condition = signal('Hipertensión Arterial');
  
  protected readonly vitalSigns = signal({
    heartRate: 78,
    bloodPressure: '120/80',
    temperature: 36.5,
    oxygen: 98,
    lastUpdate: '10:30 AM'
  });

  protected readonly upcomingAppointments = signal([
    { id: 1, doctorName: 'Dr. Juan Pérez', specialty: 'Cardiología', date: '2024-06-15', time: '10:00' },
    { id: 2, doctorName: 'Dra. Ana López', specialty: 'Nutrición', date: '2024-06-18', time: '15:30' }
  ]);

  protected readonly medications = signal([
    { id: 1, name: 'Losartán', dose: '50mg', schedule: '08:00', taken: true },
    { id: 2, name: 'Aspirina', dose: '100mg', schedule: '14:00', taken: false },
    { id: 3, name: 'Atorvastatina', dose: '20mg', schedule: '20:00', taken: false }
  ]);

  protected readonly recentSymptoms = signal([
    { id: 1, symptom: 'Dolor de cabeza leve', severity: 'low', date: 'Hoy', time: '09:00' },
    { id: 2, symptom: 'Presión elevada', severity: 'medium', date: 'Ayer', time: '18:45' }
  ]);

  ngOnInit(): void {
    console.log('Dashboard Patient inicializado');
  }

  protected takeMedication(medicationId: number): void {
    const meds = this.medications();
    const updated = meds.map(m => 
      m.id === medicationId ? { ...m, taken: true } : m
    );
    this.medications.set(updated);
  }
}
