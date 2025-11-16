import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-hospital-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <h1>Mi Perfil (Administrador)</h1>
      <div *ngIf="!loaded">Cargando...</div>
      <form *ngIf="loaded" (submit)="save($event)">
        <label>Nombre</label>
        <input type="text" [(ngModel)]="name" name="name" />

        <label>Email</label>
        <input type="email" [(ngModel)]="email" name="email" />

        <button type="submit">Guardar</button>
        <button type="button" (click)="cancel()">Cancelar</button>
      </form>
    </div>
  `
})
export class HospitalProfileView {
  private router = inject(Router);

  loaded = false;
  name = '';
  email = '';

  constructor() {
    this.load();
  }

  load(): void {
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      try {
        const u = JSON.parse(currentUserStr);
        this.name = u.name || u.fullName || '';
        this.email = u.email || '';
      } catch (e) {
        // ignore
      }
    }
    this.loaded = true;
  }

  save(e: Event): void {
    e.preventDefault();
    try {
      const currentUserStr = localStorage.getItem('currentUser');
      const u = currentUserStr ? JSON.parse(currentUserStr) : {};
      u.name = this.name;
      u.email = this.email;
      localStorage.setItem('currentUser', JSON.stringify(u));
      // simple feedback by navigating back to dashboard
      this.router.navigate(['/hospital/dashboard']);
    } catch (err) {
      console.error('Error saving profile', err);
    }
  }

  cancel(): void {
    this.router.navigate(['/hospital/dashboard']);
  }
}
