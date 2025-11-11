import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-doctor-patient-assignment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="assignment-view">
      <h2>Vinculación Doctor-Paciente</h2>
      <p class="description">
        Aquí podrá vincular doctores con pacientes mediante una interfaz drag-and-drop.
        <br>Las validaciones incluyen verificación de planes de suscripción y disponibilidad.
      </p>
      <div class="coming-soon">
        <span class="material-icons">construction</span>
        <p>Funcionalidad en desarrollo</p>
      </div>
    </div>
  `,
  styles: [`
    .assignment-view {
      h2 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1a202c;
        margin-bottom: 1rem;
      }
      
      .description {
        color: #718096;
        margin-bottom: 2rem;
        line-height: 1.6;
      }
      
      .coming-soon {
        text-align: center;
        padding: 4rem 2rem;
        
        .material-icons {
          font-size: 4rem;
          color: #cbd5e0;
          margin-bottom: 1rem;
        }
        
        p {
          color: #4a5568;
          font-size: 1.125rem;
        }
      }
    }
  `]
})
export class DoctorPatientAssignmentComponent {}
