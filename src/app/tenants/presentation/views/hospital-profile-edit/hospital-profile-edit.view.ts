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
import { TranslateModule, TranslateService } from '@ngx-translate/core';

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
    MatProgressSpinnerModule,

    TranslateModule
  ],
  templateUrl: './hospital-profile-edit.view.html',
  styleUrls: ['./hospital-profile-edit.view.css']
})
export class HospitalProfileEditView implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);
  private readonly tenantStore = inject(TenantStore);
  private readonly userStore = inject(UserStore);

  loading = signal(false);
  savingHospital = signal(false);
  savingAdmin = signal(false);

  hospitalForm!: FormGroup;
  adminForm!: FormGroup;

  currentUser: any = null;
  currentTenant: any = null;

  ngOnInit(): void {
    this.initForms();
    this.loadCurrentUserAndTenant();
  }

  private initForms(): void {
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

    this.adminForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\d{9,10}$/)]],
      position: ['', Validators.required]
    });
  }

  private loadCurrentUserAndTenant(): void {
    this.loading.set(true);

    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) {
      this.loading.set(false);
      this.router.navigate(['/iam/login']);
      return;
    }

    this.currentUser = JSON.parse(currentUserStr);

    this.tenantStore.loadAllTenants().subscribe({
      next: (tenants) => {

        const tenantId = this.currentUser?.tenantId;
        if (tenantId) {
          this.currentTenant = tenants.find(t => t.id === tenantId) ?? null;
        }
        if (!this.currentTenant) {
          this.currentTenant = tenants.find(t => t.adminUserId === this.currentUser.id) ?? null;
        }

        if (this.currentTenant) {
          this.populateForms();
        } else {
          this.snackBar.open(
            this.translate.instant('hospital.profileEdit.snack.noTenant'),
            this.translate.instant('common.close'),
            { duration: 3000 }
          );
        }

        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading tenant:', err);
        this.loading.set(false);
        this.snackBar.open(
          this.translate.instant('hospital.profileEdit.snack.loadError'),
          this.translate.instant('common.close'),
          { duration: 3000 }
        );
      }
    });
  }

  private populateForms(): void {
    if (this.currentTenant) {
      this.hospitalForm.patchValue({
        name: this.currentTenant.name ?? '',
        address: this.currentTenant.address ?? '',
        city: this.currentTenant.city ?? '',
        state: this.currentTenant.state ?? '',
        zipCode: this.currentTenant.zipCode ?? '',
        phone: this.currentTenant.phone ?? '',
        email: this.currentTenant.email ?? '',
        website: this.currentTenant.website ?? ''
      });
    }

    if (this.currentUser) {
      this.adminForm.patchValue({
        fullName: this.currentUser.name ?? '',
        email: this.currentUser.email ?? '',
        phone: this.currentUser.phone ?? '',
        position: this.currentUser.position ?? this.translate.instant('hospital.profileEdit.defaults.position')
      });
    }
  }

  saveHospitalInfo(): void {
    if (this.hospitalForm.invalid) {
      this.snackBar.open(
        this.translate.instant('hospital.profileEdit.snack.hospitalInvalid'),
        this.translate.instant('common.close'),
        { duration: 3000 }
      );
      return;
    }

    if (!this.currentTenant?.id) {
      this.snackBar.open(
        this.translate.instant('hospital.profileEdit.snack.noTenant'),
        this.translate.instant('common.close'),
        { duration: 3000 }
      );
      return;
    }

    this.savingHospital.set(true);

    const hospitalData = {
      ...this.currentTenant,
      ...this.hospitalForm.value
    };

    this.tenantStore.updateTenant(hospitalData).subscribe({
      next: () => {
        this.savingHospital.set(false);
        this.snackBar.open(
          this.translate.instant('hospital.profileEdit.snack.hospitalSaved'),
          this.translate.instant('common.close'),
          { duration: 3000 }
        );
      },
      error: (err) => {
        console.error('Error updating hospital:', err);
        this.savingHospital.set(false);
        this.snackBar.open(
          this.translate.instant('hospital.profileEdit.snack.hospitalSaveError'),
          this.translate.instant('common.close'),
          { duration: 3000 }
        );
      }
    });
  }

  saveAdminProfile(): void {
    if (this.adminForm.invalid) {
      this.snackBar.open(
        this.translate.instant('hospital.profileEdit.snack.adminInvalid'),
        this.translate.instant('common.close'),
        { duration: 3000 }
      );
      return;
    }

    if (!this.currentUser?.id) {
      this.router.navigate(['/iam/login']);
      return;
    }

    this.savingAdmin.set(true);

    const userData = {
      ...this.currentUser,
      name: this.adminForm.value.fullName,
      email: this.adminForm.value.email,
      phone: this.adminForm.value.phone,
      position: this.adminForm.value.position
    };

    this.userStore.updateUser(userData).subscribe({
      next: (updatedUser) => {
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        this.currentUser = updatedUser;

        this.savingAdmin.set(false);
        this.snackBar.open(
          this.translate.instant('hospital.profileEdit.snack.adminSaved'),
          this.translate.instant('common.close'),
          { duration: 3000 }
        );
      },
      error: (err) => {
        console.error('Error updating user:', err);
        this.savingAdmin.set(false);
        this.snackBar.open(
          this.translate.instant('hospital.profileEdit.snack.adminSaveError'),
          this.translate.instant('common.close'),
          { duration: 3000 }
        );
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/hospital/dashboard']);
  }
}
