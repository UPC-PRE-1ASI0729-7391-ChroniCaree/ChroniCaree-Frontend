import { Injectable, signal, WritableSignal, computed } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Nudge, NudgePriority } from '../domain/model/nudge.entity';
import { NudgeApiEndpoint } from '../infrastructure/nudge-api.endpoint';

/**
 * Nudge Store - Gestión de estado para nudges motivacionales
 * US06: Sistema de nudges motivacionales
 */
@Injectable({
  providedIn: 'root'
})
export class NudgeStore {
  private readonly nudges: WritableSignal<Nudge[]> = signal([]);
  private readonly loading: WritableSignal<boolean> = signal(false);
  private readonly error: WritableSignal<string | null> = signal(null);

  readonly nudges$ = this.nudges.asReadonly();
  readonly loading$ = this.loading.asReadonly();
  readonly error$ = this.error.asReadonly();

  // Computed: Nudges activos (no dismissed y no snoozed)
  readonly activeNudges = computed(() => 
    this.nudges().filter(n => !n.isDismissed && !this.isCurrentlySnoozed(n))
  );

  // Computed: Nudges prioritarios (urgentes y altos)
  readonly priorityNudges = computed(() => 
    this.activeNudges().filter(n => 
      n.priority === NudgePriority.URGENT || n.priority === NudgePriority.HIGH
    )
  );

  // Computed: Contador de nudges activos
  readonly activeCount = computed(() => this.activeNudges().length);

  constructor(private nudgeApi: NudgeApiEndpoint) {}

  /**
   * Carga todos los nudges del paciente
   */
  loadAllNudges(): Observable<Nudge[]> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.nudgeApi.getAll().pipe(
      tap({
        next: (nudges) => {
          this.nudges.set(nudges);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar nudges');
          this.loading.set(false);
          console.error('Error loading nudges:', err);
        }
      })
    );
  }

  /**
   * Crea un nuevo nudge
   */
  createNudge(nudge: Nudge): Observable<Nudge> {
    this.loading.set(true);
    this.error.set(null);
    
    return this.nudgeApi.create(nudge).pipe(
      tap({
        next: (newNudge) => {
          this.nudges.update(nudges => [...nudges, newNudge]);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al crear nudge');
          this.loading.set(false);
          console.error('Error creating nudge:', err);
        }
      })
    );
  }

  /**
   * Marca un nudge como dismissed
   */
  dismissNudge(nudgeId: number): Observable<Nudge> {
    const nudge = this.nudges().find(n => n.id === nudgeId);
    if (!nudge) {
      throw new Error('Nudge not found');
    }

    const updatedNudge = {
      ...nudge,
      isDismissed: true,
      dismissedAt: new Date().toISOString()
    };

    return this.nudgeApi.update(updatedNudge, nudgeId).pipe(
      tap({
        next: (updated) => {
          this.nudges.update(nudges => 
            nudges.map(n => n.id === nudgeId ? updated : n)
          );
        },
        error: (err) => {
          this.error.set('Error al descartar nudge');
          console.error('Error dismissing nudge:', err);
        }
      })
    );
  }

  /**
   * Pospone un nudge por un período de tiempo
   */
  snoozeNudge(nudgeId: number, hours: number): Observable<Nudge> {
    const nudge = this.nudges().find(n => n.id === nudgeId);
    if (!nudge) {
      throw new Error('Nudge not found');
    }

    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + hours);

    const updatedNudge = {
      ...nudge,
      isSnoozed: true,
      snoozeUntil: snoozeUntil.toISOString()
    };

    return this.nudgeApi.update(updatedNudge, nudgeId).pipe(
      tap({
        next: (updated) => {
          this.nudges.update(nudges => 
            nudges.map(n => n.id === nudgeId ? updated : n)
          );
        },
        error: (err) => {
          this.error.set('Error al posponer nudge');
          console.error('Error snoozing nudge:', err);
        }
      })
    );
  }

  /**
   * Verifica si un nudge está actualmente en snooze
   */
  private isCurrentlySnoozed(nudge: Nudge): boolean {
    if (!nudge.isSnoozed || !nudge.snoozeUntil) {
      return false;
    }

    const snoozeUntilDate = new Date(nudge.snoozeUntil);
    const now = new Date();
    return snoozeUntilDate > now;
  }

  /**
   * Limpia el error actual
   */
  clearError(): void {
    this.error.set(null);
  }
}
