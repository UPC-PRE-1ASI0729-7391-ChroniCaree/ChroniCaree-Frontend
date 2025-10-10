import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NudgePanelComponent } from '../../components/nudge-panel/nudge-panel';
import { NudgeStore } from '../../../application/nudge.store';

/**
 * Nudges Page Component
 * Página dedicada para ver todos los recordatorios/nudges
 * Communication Bounded Context
 */
@Component({
  selector: 'app-nudges-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    NudgePanelComponent
  ],
  templateUrl: './nudges-page.html',
  styleUrls: ['./nudges-page.css']
})
export class NudgesPageComponent implements OnInit {
  get activeCount() {
    return this.nudgeStore.activeCount;
  }

  get loading() {
    return this.nudgeStore.loading$;
  }

  constructor(private nudgeStore: NudgeStore) {}

  ngOnInit(): void {
    // El store ya maneja la protección contra llamadas duplicadas
    // Si ya hay datos, no hace nada. Si no hay, carga.
    this.nudgeStore.loadAllNudges().subscribe();
  }
}
