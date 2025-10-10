import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NudgeStore } from '../../../application/nudge.store';
import { Nudge, NudgePriority } from '../../../domain/model/nudge.entity';

/**
 * Nudge Panel Component
 * US06: Sistema de nudges motivacionales
 * Muestra mensajes motivacionales y recordatorios al paciente
 */
@Component({
  selector: 'app-nudge-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './nudge-panel.html',
  styleUrls: ['./nudge-panel.css']
})
export class NudgePanelComponent implements OnInit {
  // Signals del store (usando getters para evitar error de inicialización)
  get activeNudges() { return this.nudgeStore.activeNudges; }
  get priorityNudges() { return this.nudgeStore.priorityNudges; }
  get loading() { return this.nudgeStore.loading$; }
  get activeCount() { return this.nudgeStore.activeCount; }

  // Enum para template
  readonly NudgePriority = NudgePriority;

  constructor(
    private nudgeStore: NudgeStore,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadNudges();
  }

  /**
   * Carga los nudges del paciente
   */
  private loadNudges(): void {
    this.nudgeStore.loadAllNudges().subscribe();
  }

  /**
   * Maneja el click en un nudge con acción
   */
  onNudgeAction(nudge: Nudge): void {
    if (nudge.actionRoute) {
      this.router.navigate([nudge.actionRoute]);
      this.dismissNudge(nudge.id);
    }
  }

  /**
   * Descarta un nudge
   */
  dismissNudge(nudgeId: number): void {
    this.nudgeStore.dismissNudge(nudgeId).subscribe({
      next: () => {
        this.snackBar.open('Nudge descartado', 'OK', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Error al descartar nudge', 'OK', { duration: 3000 });
      }
    });
  }

  /**
   * Pospone un nudge por 1 hora
   */
  snoozeNudge(nudgeId: number, event: Event): void {
    event.stopPropagation(); // Evita que se active la acción principal
    
    this.nudgeStore.snoozeNudge(nudgeId, 1).subscribe({
      next: () => {
        this.snackBar.open('Recordatorio pospuesto por 1 hora', 'OK', { duration: 2000 });
      },
      error: () => {
        this.snackBar.open('Error al posponer nudge', 'OK', { duration: 3000 });
      }
    });
  }

  /**
   * Obtiene la clase CSS según la prioridad
   */
  getPriorityClass(priority: NudgePriority): string {
    switch (priority) {
      case NudgePriority.URGENT:
        return 'priority-urgent';
      case NudgePriority.HIGH:
        return 'priority-high';
      case NudgePriority.MEDIUM:
        return 'priority-medium';
      case NudgePriority.LOW:
        return 'priority-low';
      default:
        return '';
    }
  }

  /**
   * Obtiene el color del icono según la prioridad
   */
  getIconColor(priority: NudgePriority): string {
    switch (priority) {
      case NudgePriority.URGENT:
        return 'warn';
      case NudgePriority.HIGH:
        return 'warn';
      case NudgePriority.MEDIUM:
        return 'primary';
      case NudgePriority.LOW:
        return 'accent';
      default:
        return 'primary';
    }
  }
}
