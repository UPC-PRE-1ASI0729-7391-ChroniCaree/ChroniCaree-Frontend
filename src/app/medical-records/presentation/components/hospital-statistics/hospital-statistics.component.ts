import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hospital-statistics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="statistics-view">
      <h2>Estadísticas del Hospital</h2>
      <p class="description">
        Visualice métricas clave: citas realizadas, pacientes atendidos, ingresos,
        <br>y otros indicadores de desempeño del hospital.
      </p>
      <div class="coming-soon">
        <span class="material-icons">bar_chart</span>
        <p>Dashboard de estadísticas en desarrollo</p>
      </div>
    </div>
  `,
  styles: [`
    .statistics-view {
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
export class HospitalStatisticsComponent {}
