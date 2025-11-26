import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TenantStore } from '../../../application/tenant.store';
import { UserStore } from '../../../../iam/application/user.store';

/**
 * Hospital Profile Edit View
 * Permite al administrador del hospital editar su perfil personal y los datos del hospital
 */
@Component({
  selector: 'app-hospital-profile-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './hospital-profile-edit.view.html',
  styleUrls: ['./hospital-profile-edit.view.css']
})
export class HospitalProfileEditView implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly tenantStore = inject(TenantStore);
  private readonly userStore = inject(UserStore);

  loading = signal(false);
  saving = signal(false);

  hospitalForm!: FormGroup;
  adminForm!: FormGroup;

  currentUser: any = null;
  currentTenant: any = null;

  ngOnInit(): void {
    this.loadCurrentUserAndTenant();
    this.initForms();
  }

  private loadCurrentUserAndTenant(): void {
    this.loading.set(true);
    
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
      this.router.navigate(['/iam/login']);
      return;
    }

    this.currentUser = JSON.parse(currentUserStr);

    // Cargar tenant del usuario
    this.tenantStore.loadAllTenants().subscribe({
      next: (tenants) => {
        this.currentTenant = tenants.find(t => t.adminUserId === this.currentUser.id);
        if (this.currentTenant) {
          this.populateForms();
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading tenant:', err);
        this.loading.set(false);
        this.snackBar.open('Error al cargar datos del hospital', 'Cerrar', { duration: 3000 });
      }
    });
  }

  private initForms(): void {
    // Formulario del hospital
    this.hospitalForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{5}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{9,10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      website: ['']
    });

    // Formulario del administrador
    this.adminForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\d{9,10}$/)]],
      position: ['', Validators.required]
    });
  }

  private populateForms(): void {
    if (this.currentTenant) {
      this.hospitalForm.patchValue({
        name: this.currentTenant.name || '',
        address: this.currentTenant.address || '',
        city: this.currentTenant.city || '',
        state: this.currentTenant.state || '',
        zipCode: this.currentTenant.zipCode || '',
        phone: this.currentTenant.phone || '',
        email: this.currentTenant.email || '',
        website: this.currentTenant.website || ''
      });
    }

    if (this.currentUser) {
      this.adminForm.patchValue({
        fullName: this.currentUser.name || '',
        email: this.currentUser.email || '',
        phone: this.currentUser.phone || '',
        position: 'Administrador del Hospital'
      });
    }
  }

  saveHospitalInfo(): void {
    if (this.hospitalForm.invalid) {
      this.snackBar.open('Por favor, completa todos los campos requeridos del hospital', 'Cerrar', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    const hospitalData = {
      ...this.currentTenant,
      name: this.hospitalForm.value.name,
      address: this.hospitalForm.value.address,
      phone: this.hospitalForm.value.phone,
      email: this.hospitalForm.value.email
    };

    this.tenantStore.updateTenant(hospitalData).subscribe({
      next: () => {
        this.saving.set(false);
        this.snackBar.open('✅ Información del hospital actualizada correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error updating hospital:', err);
        this.saving.set(false);
        this.snackBar.open('❌ Error al actualizar información del hospital', 'Cerrar', { duration: 3000 });
      }
    });
  }

  saveAdminProfile(): void {
    if (this.adminForm.invalid) {
      this.snackBar.open('Por favor, completa todos los campos requeridos del perfil', 'Cerrar', { duration: 3000 });
      return;
    }

    this.saving.set(true);
    const userData = {
      ...this.currentUser,
      name: this.adminForm.value.fullName,
      email: this.adminForm.value.email
    };

    this.userStore.updateUser(userData).subscribe({
      next: (updatedUser) => {
        // Actualizar localStorage
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.currentUser = updatedUser;
        
        this.saving.set(false);
        this.snackBar.open('✅ Perfil actualizado correctamente', 'Cerrar', { duration: 3000 });
      },
      error: (err) => {
        console.error('Error updating user:', err);
        this.saving.set(false);
        this.snackBar.open('❌ Error al actualizar perfil', 'Cerrar', { duration: 3000 });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/hospital/dashboard']);
  }
}
