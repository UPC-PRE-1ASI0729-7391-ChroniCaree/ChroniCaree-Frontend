import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { UserStore } from '../application/user.store';
import { PatientStore } from '../../patients/application/patient.store';
import { TenantStore } from '../../tenants/application/tenant.store';
import { SubscriptionService } from '../../subscriptions/infrastructure/subscription.service';
import { PaymentStore } from '../../payments/application/payment.store';
import { UserEntity } from '../domain/model/user.entity';
import { PatientEntity } from '../../patients/domain/model/patient.entity';
import { TenantEntity } from '../../tenants/domain/model/tenant.entity';

export interface PatientRegistrationData {
  // User data
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  
  // Patient data
  dni: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  address: string;
  
  // Subscription data (optional during initial registration)
  planId?: string | null;
}

export interface HospitalRegistrationData {
  // User data
  email: string;
  password: string;
  adminName: string;
  
  // Hospital data
  hospitalName: string;
  address: string;
  phone: string;
  
  // Subscription data
  planId: string;
}

export interface RegistrationResult {
  user: any; // UserEntity or User (from stores)
  profile: any; // PatientEntity or TenantEntity
  subscriptionId?: number;
  requiresPayment: boolean;
  dashboardRoute: string;
}

/**
 * Facade for handling complete registration flow with subscription
 * Implements business logic for creating user + profile + subscription
 */
@Injectable({
  providedIn: 'root'
})
export class RegistrationFacade {
  private userStore = inject(UserStore);
  private patientStore = inject(PatientStore);
  private tenantStore = inject(TenantStore);
  private subscriptionService = inject(SubscriptionService);
  private paymentStore = inject(PaymentStore);

  /**
   * Register patient with complete flow: User → Patient → Subscription
   */
  registerPatient(data: PatientRegistrationData): Observable<RegistrationResult> {
    // Step 1: Create user
    const newUser = {
      id: Date.now(),
      email: data.email,
      role: 'patient' as const,
      name: `${data.firstName} ${data.lastName}`,
      password: data.password,
      isVerified: false,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      tenantId: null
    };

    return this.userStore.createUser(newUser).pipe(
      switchMap((user) => {
        // Step 2: Create patient profile
        const newPatient = {
          id: Date.now(),
          userId: user.id,
          assignedDoctorId: null,
          tenantId: null,
          subscriptionId: null,
          firstName: data.firstName,
          lastName: data.lastName,
          dni: data.dni,
          birthDate: data.birthDate,
          gender: data.gender,
          phone: data.phone,
          address: data.address,
          weight: 0,
          height: 0,
          bmi: 0,
          emergencyContact: {
            name: '',
            relationship: '',
            phone: ''
          }
        };

        return this.patientStore.createPatient(newPatient).pipe(
          switchMap((patient) => {
            // Step 3: If a planId was provided, get plan details; otherwise skip and return result
            if (data.planId) {
              return this.subscriptionService.getPlanById(data.planId).pipe(
                switchMap((plan) => {
                  if (!plan) {
                    throw new Error('Plan no encontrado');
                  }

                  // Do NOT create the subscription here if the plan requires payment.
                  // Instead, return the created user and patient and indicate whether payment is required.
                  return this.patientStore.updatePatient(patient).pipe(
                    map(() => ({
                      user,
                      profile: patient,
                      requiresPayment: plan.price > 0,
                      dashboardRoute: '/patient/dashboard'
                    }))
                  );
                })
              );
            }

            // No plan selected during registration: update patient and return success without payment requirement
            return this.patientStore.updatePatient(patient).pipe(
              map(() => ({
                user,
                profile: patient,
                requiresPayment: false,
                dashboardRoute: '/patient/dashboard'
              }))
            );
          })
        );
      }),
      catchError((error) => {
        console.error('Error in patient registration:', error);
        return throwError(() => new Error('Error al completar el registro'));
      })
    );
  }

  /**
   * Register hospital with complete flow: User → Tenant → Subscription
   */
  registerHospital(data: HospitalRegistrationData): Observable<RegistrationResult> {
    // Step 1: Create user
    const newUser = {
      id: Date.now(),
      email: data.email,
      role: 'hospital_admin' as const,
      name: data.adminName,
      password: data.password,
      isVerified: false,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      tenantId: null
    };

    return this.userStore.createUser(newUser).pipe(
      switchMap((user) => {
        // Step 2: Create tenant
        const newTenant = {
          id: Date.now(),
          adminUserId: user.id,
          name: data.hospitalName,
          email: data.email,
          address: data.address,
          phone: data.phone,
          plan: 'basic' as const, // Will be updated with subscription
          status: 'pending_subscription' as const,
          registrationDate: new Date().toISOString(),
          subscriptionId: null,
          settings: {
            allowIndependentDoctors: false,
            requirePatientApproval: true,
            maxDoctors: 10
          }
        };

        return this.tenantStore.createTenant(newTenant).pipe(
          switchMap((tenant) => {
            // Step 3: Get plan details
            return this.subscriptionService.getPlanById(data.planId).pipe(
              switchMap((plan) => {
                if (!plan) {
                  throw new Error('Plan no encontrado');
                }

                // Step 4: Create subscription
                const subscriptionRequest = {
                  planId: plan.id,
                  payerType: 'tenant' as const,
                  payerId: tenant.id,
                  paymentMethod: 'credit_card' as const,
                  billingEmail: data.email,
                  autoRenew: true
                };

                return this.subscriptionService.create(subscriptionRequest).pipe(
                  switchMap((subscription) => {
                    // Step 5: Update tenant with subscription ID
                    const updatedTenant = {
                      ...tenant,
                      subscriptionId: subscription.id,
                      status: 'active' as const
                    };
                    
                    return this.tenantStore.updateTenant(updatedTenant).pipe(
                      switchMap((finalTenant) => {
                        // Step 6: Update user with tenant ID
                        const updatedUser = {
                          ...user,
                          tenantId: tenant.id
                        };
                        
                        return this.userStore.updateUser(updatedUser).pipe(
                          map(() => ({
                            user: updatedUser,
                            profile: finalTenant,
                            subscriptionId: subscription.id,
                            requiresPayment: true, // Hospitals always pay
                            dashboardRoute: '/hospital/dashboard'
                          }))
                        );
                      })
                    );
                  })
                );
              })
            );
          })
        );
      }),
      catchError((error) => {
        console.error('Error in hospital registration:', error);
        return throwError(() => new Error('Error al completar el registro'));
      })
    );
  }
}
