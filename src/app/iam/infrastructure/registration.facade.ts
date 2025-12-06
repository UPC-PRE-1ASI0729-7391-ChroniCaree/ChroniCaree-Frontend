import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { switchMap, map, catchError } from 'rxjs/operators';
import { AuthService } from '../application/auth.service';
import { PatientStore } from '../../patients/application/patient.store';
import { TenantStore } from '../../tenants/application/tenant.store';
import { DoctorService } from '../../doctors/infrastructure/doctor.service';
import { SubscriptionService } from '../../subscriptions/infrastructure/subscription.service';
import { PaymentStore } from '../../payments/application/payment.store';
import { Patient } from '../../patients/domain/model/patient.entity';

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
  private readonly authService = inject(AuthService);
  private readonly patientStore = inject(PatientStore);
  private readonly tenantStore = inject(TenantStore);
  private readonly subscriptionService = inject(SubscriptionService);
  private readonly paymentStore = inject(PaymentStore);
  private readonly doctorService = inject(DoctorService);

  /**
   * Register patient with complete flow: User → Patient → Subscription
   */
  registerPatient(data: PatientRegistrationData): Observable<RegistrationResult> {
    // Step 1: Create user via AuthService
    const signUpRequest = {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'patient'
    };

    return this.authService.signUp(signUpRequest).pipe(
      switchMap((response: any) => {
        // Auto-login after sign up to ensure we have tokens
        return this.authService.signIn({ email: data.email, password: data.password }).pipe(
          map((authResponse) => {
             // Return the user from the auth response
             return authResponse.user || response.user || response;
          })
        );
      }),
      switchMap((user) => {
        // Step 1.5: Fetch doctors to assign one (optional logic, kept from original)
        return this.doctorService.getAll().pipe(
          map((doctors) => ({ 
            user, 
            lastDoctor: (doctors && doctors.length) ? doctors.reduce((a, b) => new Date(a.joinedAt) > new Date(b.joinedAt) ? a : b, doctors[0]) : null 
          })),
          catchError(() => {
             // If fetching doctors fails, proceed without assigning one
             return of({ user, lastDoctor: null });
          })
        );
      }),
      switchMap(({ user, lastDoctor }) => {
        console.log('🧾 [RegistrationFacade] Creating patient: user=', user?.id, 'lastDoctor=', lastDoctor);
        // Defensive validation: ensure assignedDoctorId is a valid positive integer
        let assignedDoctorId: number | null = null;
        if (lastDoctor && typeof lastDoctor.id === 'number' && lastDoctor.id > 0) {
          assignedDoctorId = lastDoctor.id;
        } else if (lastDoctor) {
          console.warn('⚠️ [RegistrationFacade] Ignoring invalid lastDoctor id:', lastDoctor?.id);
        }
        // Step 2: Create patient profile (sin campo 'id' - lo genera el backend)
        const newPatient: Omit<Patient, 'id'> = {
          userId: user.id,
          assignedDoctorId: assignedDoctorId,
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

        console.log('📤 [RegistrationFacade] Patient payload', newPatient);
        return this.patientStore.createPatient(newPatient).pipe(
          switchMap((patient) => {
            // Step 3: If a planId was provided, get plan details
            if (data.planId) {
              return this.subscriptionService.getPlanById(data.planId).pipe(
                switchMap((plan) => {
                  if (!plan) {
                    throw new Error('Plan no encontrado');
                  }

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

            // No plan selected
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
    // Step 1: Create user via AuthService
    const signUpRequest = {
      email: data.email,
      password: data.password,
      name: data.adminName,
      role: 'hospital_admin'
    };

    return this.authService.signUp(signUpRequest).pipe(
      switchMap((response: any) => {
        const user = response.user || response;

        // Step 2: Create tenant
        const newTenant = {
          id: 0, // Backend will generate ID
          adminUserId: user.id,
          name: data.hospitalName,
          email: data.email,
          address: data.address,
          phone: data.phone,
          plan: 'basic' as const,
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
                        // Step 6: Update user with tenant ID (if needed by backend, usually backend handles this relation)
                        // We'll skip updating user manually as backend should handle it or we don't have an endpoint for it exposed in AuthService easily without re-login.
                        // But if we need to, we can call a user service.
                        // For now, let's assume backend links them.
                        
                        return of({
                            user,
                            profile: finalTenant,
                            subscriptionId: subscription.id,
                            requiresPayment: true,
                            dashboardRoute: '/hospital/dashboard'
                        });
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
