import { Injectable, signal, WritableSignal, computed } from '@angular/core';
import { Observable, tap, finalize, shareReplay } from 'rxjs';
import { Nudge, NudgePriority } from '../domain/model/nudge.entity';
import { NudgeApiEndpoint } from '../infrastructure/nudge-api.endpoint';

/**
 * Nudge Store - Gestión de estado para nudges motivacionales
 * US06: Sistema de nudges motivacionales
 * Communication Bounded Context
 */
@Injectable({
  providedIn: 'root'
})
export class NudgeStore {
  private readonly nudges: WritableSignal<Nudge[]> = signal([]);
  private readonly loading: WritableSignal<boolean> = signal(false);
  private readonly error: WritableSignal<string | null> = signal(null);
  
  // Cache de la petición en curso para evitar duplicados
  private currentRequest: Observable<Nudge[]> | null = null;

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
   * Protección anti-bucle infinito:
   * - Si ya hay petición en curso, retorna esa misma petición
   * - Si ya hay datos y no está cargando, retorna datos existentes
   */
  loadAllNudges(): Observable<Nudge[]> {
    // 🛡️ Si ya hay una petición en curso, retornar la misma Observable
    if (this.currentRequest) {
      return this.currentRequest;
    }

    // 🛡️ Si ya hay datos cargados y no está en proceso de carga, retornar datos existentes
    if (this.nudges().length > 0 && !this.loading()) {
      return new Observable(observer => {
        observer.next(this.nudges());
        observer.complete();
      });
    }

    // 🚀 Iniciar nueva carga
    this.loading.set(true);
    this.error.set(null);
    
    // shareReplay(1) asegura que múltiples suscripciones usen la misma petición HTTP
    this.currentRequest = this.nudgeApi.getAll().pipe(
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
      }),
      finalize(() => {
        // Limpiar la referencia cuando termine (éxito o error)
        this.currentRequest = null;
      }),
      shareReplay(1) // Cache la respuesta para múltiples suscriptores
    );

    return this.currentRequest;
  }

  /**
   * Carga nudges filtrados por paciente
   * Similar a loadAllNudges() pero filtra por patientId
   */
  loadNudgesByPatient(patientId: string): Observable<Nudge[]> {
    // 🛡️ Si ya hay una petición en curso, retornar la misma Observable
    if (this.currentRequest) {
      return this.currentRequest;
    }

    // 🚀 Iniciar nueva carga
    this.loading.set(true);
    this.error.set(null);
    
    const patientIdNumber = parseInt(patientId, 10);
    
    // shareReplay(1) asegura que múltiples suscripciones usen la misma petición HTTP
    this.currentRequest = this.nudgeApi.getAll().pipe(
      tap({
        next: (allNudges) => {
          // ✅ Filtrar solo los nudges del paciente actual
          const patientNudges = allNudges.filter(n => n.patientId === patientIdNumber);
          console.log(`✅ NudgeStore: ${patientNudges.length} nudges encontrados para paciente ${patientId}`);
          this.nudges.set(patientNudges);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set('Error al cargar nudges');
          this.loading.set(false);
          console.error('Error loading nudges by patient:', err);
        }
      }),
      finalize(() => {
        // Limpiar la referencia cuando termine (éxito o error)
        this.currentRequest = null;
      }),
      shareReplay(1) // Cache la respuesta para múltiples suscriptores
    );

    return this.currentRequest;
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
   * Fuerza una recarga de los nudges (ignora cache)
   */
  forceReload(): Observable<Nudge[]> {
    this.nudges.set([]);
    this.currentRequest = null;
    return this.loadAllNudges();
  }

  /**
   * Limpia el error actual
   */
  clearError(): void {
    this.error.set(null);
  }
}
