import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TenantService } from './tenants/application/tenant.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('ChroniCaree');
  protected readonly hospitalName = signal<string>('');
  protected readonly loading = signal<boolean>(true);
  protected readonly error = signal<string>('');

  constructor(private tenantService: TenantService) {}

  ngOnInit(): void {
    this.loadHospitalData();
  }

  private loadHospitalData(): void {
    this.tenantService.getTenantById(1).subscribe({
      next: (tenant) => {
        this.hospitalName.set(tenant.name);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar datos:', err);
        this.error.set('No se pudo conectar con el servidor');
        this.loading.set(false);
      }
    });
  }
}
