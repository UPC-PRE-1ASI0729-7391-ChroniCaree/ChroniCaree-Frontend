import { Injectable, signal, computed } from '@angular/core';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { switchMap, tap, catchError, map } from 'rxjs/operators';
import { TenantService } from '../../tenants/infrastructure/tenant.service';
import { DoctorService } from '../../doctors/infrastructure/doctor.service';
import { PatientService } from '../../patients/infrastructure/patient.service';
import { SubscriptionService } from '../../subscriptions/infrastructure/subscription.service';
import { InvitationService, CreateInvitationRequest } from '../../tenants/infrastructure/invitation.service';
import { UserService } from '../../iam/infrastructure/user.service';
import { TenantEntity } from '../../tenants/domain/model/tenant.entity';
import { DoctorEntity } from '../../doctors/domain/model/doctor.entity';
import { SubscriptionEntity } from '../../subscriptions/domain/model/subscription.entity';

/**
 * Estadísticas del dashboard del hospital
 */
export interface HospitalDashboardStats {
  totalDoctors: number;
  maxDoctors: number;
  availableDoctorSlots: number;
  totalPatients: number;
  pendingInvitations: number;
  activeSubscription: boolean;
  planName: string;
  subscriptionStatus: string;
}

/**
 * Request para registrar un doctor desde el hospital
 */
export interface RegisterDoctorFromHospitalRequest {
  tenantId: number;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  specialty: string;
  phone?: string;
  dni?: string; // DNI requerido por backend (mínimo 8 caracteres)
}

/**
 * Request para invitar un doctor
 */
export interface InviteDoctorRequest {
  tenantId: number;
  invitedBy: number;
  email: string;
}

/**
 * Resultado de operaciones del dashboard
 */
export interface HospitalDashboardResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Store para el Dashboard del Hospital
 * Orquesta estadísticas, gestión de doctores e invitaciones
 */
@Injectable({
  providedIn: 'root'
})
export class HospitalDashboardStore {
  // Estado reactivo
  private _stats = signal<HospitalDashboardStats | null>(null);
  private _doctors = signal<DoctorEntity[]>([]);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Getters computados
  readonly stats = computed(() => this._stats());
  readonly doctors = computed(() => this._doctors());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly canAddMoreDoctors = computed(() => {
    const stats = this._stats();
    return stats ? stats.availableDoctorSlots > 0 : false;
  });

  constructor(
    private tenantService: TenantService,
    private doctorService: DoctorService,
    private patientService: PatientService,
    private subscriptionService: SubscriptionService,
    private invitationService: InvitationService,
    private userService: UserService
  ) {}

  /**
   * Carga las estadísticas del dashboard del hospital
   */
  loadDashboardStats(tenantId: number): Observable<HospitalDashboardResult> {
    this._loading.set(true);
    this._error.set(null);

    console.log('🏥 [HospitalDashboardStore] loadDashboardStats() iniciado');
    console.log('  📍 tenantId recibido:', tenantId);

    return this.tenantService.getById(tenantId).pipe(
      switchMap(tenant => {
        console.log('🏥 [HospitalDashboardStore] Tenant obtenido:', tenant);
        console.log('  📍 tenant.id:', tenant.id);
        console.log('  📍 tenant.status:', tenant.status);
        console.log('  📍 tenant.subscriptionId:', tenant.subscriptionId);
        
        // Validar que el tenant esté activo
        if (tenant.status !== 'active') {
          console.error('❌ [HospitalDashboardStore] Hospital no está activo. Status:', tenant.status);
          return throwError(() => new Error('Hospital no está activo'));
        }

        // Validar que tenga suscripción
        if (!tenant.subscriptionId) {
          console.error('❌ [HospitalDashboardStore] Hospital no tiene subscriptionId');
          return throwError(() => new Error('Hospital no tiene suscripción'));
        }

        console.log('🌐 [HospitalDashboardStore] Iniciando carga de datos...');
        console.log('  → subscriptionService.getById(' + tenant.subscriptionId + ')');
        console.log('  → doctorService.countByTenantId(' + tenantId + ')');
        console.log('  → doctorService.getByTenantId(' + tenantId + ')');
        console.log('  → invitationService.getPendingByTenantId(' + tenantId + ')');

        // Primero obtener subscription para tener el planId correcto
        return this.subscriptionService.getById(tenant.subscriptionId).pipe(
          tap(sub => console.log('  ✅ subscription loaded:', sub)),
          catchError(err => {
            console.error('  ❌ subscription error:', err);
            return throwError(() => err);
          }),
          switchMap(subscription => {
            console.log('  → subscriptionService.getPlanById(' + subscription.planId + ') [CORREGIDO: usando planId de subscription]');
            
            // Ahora cargar plan y demás datos en paralelo
            return forkJoin({
              tenant: of(tenant),
              subscription: of(subscription),
              subscriptionPlan: this.subscriptionService.getPlanById(subscription.planId).pipe(
                tap(plan => console.log('  ✅ subscriptionPlan loaded:', plan)),
                catchError(err => {
                  console.error('  ❌ subscriptionPlan error:', err);
                  return of(null);
                })
              ),
              doctorsCount: this.doctorService.countByTenantId(tenantId).pipe(
                tap(count => console.log('  ✅ doctorsCount loaded:', count)),
                catchError(err => {
                  console.error('  ❌ doctorsCount error:', err);
                  return of(0);
                })
              ),
              doctors: this.doctorService.getByTenantId(tenantId).pipe(
                tap(docs => console.log('  ✅ doctors loaded:', docs.length, 'doctors')),
                catchError(err => {
                  console.error('  ❌ doctors error:', err);
                  return of([]);
                })
              ),
              // Nota: getPatientsByTenantId no existe, se calcula por doctores
              pendingInvitations: this.invitationService.getPendingByTenantId(tenantId).pipe(
                tap(inv => console.log('  ✅ pendingInvitations loaded:', inv.length, 'invitations')),
                catchError(err => {
                  console.error('  ⚠️ pendingInvitations error (usando array vacío):', err);
                  return of([]);  // Si falla (404 o 500), retornar array vacío
                })
              )
            });
          })
        );
      }),
      switchMap(result => {
        console.log('🏥 [HospitalDashboardStore] forkJoin completado, procesando resultado...');
        console.log('  📦 result.tenant:', result.tenant);
        console.log('  📦 result.subscription:', result.subscription);
        console.log('  📦 result.subscriptionPlan:', result.subscriptionPlan);
        console.log('  📦 result.doctorsCount:', result.doctorsCount);
        console.log('  📦 result.doctors.length:', result.doctors.length);
        console.log('  📦 result.pendingInvitations.length:', result.pendingInvitations.length);
        
        // Verificar si la suscripción es válida (activa o pending después de pago)
        const validStatuses = ['active', 'ACTIVE', 'pending', 'PENDING', 'trial'];
        const hasValidSubscription = result.subscription && 
          (result.subscription.isActive || validStatuses.includes(result.subscription.status));
        
        console.log('  📦 hasValidSubscription check:');
        console.log('    → subscription exists:', !!result.subscription);
        console.log('    → subscription.status:', result.subscription?.status);
        console.log('    → subscription.isActive:', result.subscription?.isActive);
        console.log('    → hasValidSubscription:', hasValidSubscription);
        
        // Si no hay suscripción válida, permitir acceso limitado
        if (!hasValidSubscription) {
          console.warn('⚠️ [HospitalDashboardStore] Suscripción inactiva o no existe');
          console.log('  → subscription:', result.subscription);
          console.log('  → subscription.isActive:', result.subscription?.isActive);
          
          // Dashboard con acceso limitado (sin suscripción activa)
          const limitedStats: HospitalDashboardStats = {
            totalDoctors: 0,
            maxDoctors: 0,
            availableDoctorSlots: 0,
            totalPatients: 0,
            pendingInvitations: 0,
            activeSubscription: false,
            planName: 'Sin Plan',
            subscriptionStatus: 'inactive'
          };

          this._stats.set(limitedStats);
          this._doctors.set([]);
          
          console.log('📊 [HospitalDashboardStore] Stats LIMITED:', limitedStats);

          return of({
            success: true,
            message: 'Dashboard en modo limitado. Activa tu suscripción.',
            data: limitedStats
          });
        }

        // Validar que el plan exista
        if (!result.subscriptionPlan) {
          console.warn('⚠️ [HospitalDashboardStore] Plan no encontrado, usando valores por defecto');
          
          // Permitir dashboard sin plan específico
          const limitedStats: HospitalDashboardStats = {
            totalDoctors: result.doctorsCount,
            maxDoctors: 5,
            availableDoctorSlots: 5 - result.doctorsCount,
            totalPatients: 0,
            pendingInvitations: result.pendingInvitations.length,
            activeSubscription: hasValidSubscription, // Usar la verificación correcta
            planName: 'Plan Básico',
            subscriptionStatus: result.subscription.status
          };

          this._stats.set(limitedStats);
          this._doctors.set(result.doctors);
          
          console.log('📊 [HospitalDashboardStore] Stats (sin plan):', limitedStats);

          return of({
            success: true,
            message: 'Dashboard cargado',
            data: limitedStats
          });
        }
        
        console.log('✅ [HospitalDashboardStore] Suscripción y plan válidos, calculando pacientes...');

        // Calcular pacientes asociados a los doctores del hospital
        const patientCountObservables = result.doctors.map(doctor =>
          this.patientService.getByAssignedDoctorId(doctor.id).pipe(
            map(patients => patients.length),
            catchError(() => of(0))
          )
        );

        return forkJoin(patientCountObservables.length > 0 ? patientCountObservables : [of(0)]).pipe(
          map(patientCounts => {
            const totalPatients = patientCounts.reduce((sum, count) => sum + count, 0);
            const maxDoctors = (result.subscriptionPlan!.features as any).maxDoctors || 5;
            
            const stats: HospitalDashboardStats = {
              totalDoctors: result.doctorsCount,
              maxDoctors: maxDoctors,
              availableDoctorSlots: maxDoctors - result.doctorsCount,
              totalPatients,
              pendingInvitations: result.pendingInvitations.length,
              activeSubscription: hasValidSubscription, // Usar la verificación correcta
              planName: result.subscriptionPlan!.name,
              subscriptionStatus: result.subscription.status
            };

            this._stats.set(stats);
            this._doctors.set(result.doctors);

            return {
              success: true,
              message: 'Estadísticas cargadas correctamente',
              data: stats
            };
          })
        );
      }),
      tap(() => this._loading.set(false)),
      catchError(error => {
        this._loading.set(false);
        this._error.set(error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Registra un doctor directamente desde el hospital
   */
  registerDoctor(request: RegisterDoctorFromHospitalRequest): Observable<HospitalDashboardResult> {
    this._loading.set(true);
    this._error.set(null);

    return this.tenantService.getById(request.tenantId).pipe(
      switchMap(tenant => {
        // Validar tenant activo
        if (tenant.status !== 'active') {
          return throwError(() => new Error('Hospital no está activo'));
        }

        // Validar que tenga suscripción
        if (!tenant.subscriptionId) {
          return throwError(() => new Error('Hospital no tiene suscripción'));
        }

        // Primero obtener subscription para tener el planId correcto
        return this.subscriptionService.getById(tenant.subscriptionId).pipe(
          switchMap(subscription => {
            // Ahora obtener plan con el planId correcto y contar doctores
            return forkJoin({
              tenant: of(tenant),
              subscription: of(subscription),
              subscriptionPlan: this.subscriptionService.getPlanById(subscription.planId),
              doctorsCount: this.doctorService.countByTenantId(request.tenantId)
            });
          })
        );
      }),
      switchMap(result => {
        // Validar suscripción activa (incluye status 'pending' como válido temporalmente)
        const validStatuses = ['active', 'ACTIVE', 'pending', 'PENDING', 'trial'];
        const hasValidSubscription = result.subscription && 
          (result.subscription.isActive || validStatuses.includes(result.subscription.status));
        
        console.log('👨‍⚕️ [HospitalDashboardStore] registerDoctor - subscription check:');
        console.log('  → status:', result.subscription.status);
        console.log('  → isActive:', result.subscription.isActive);
        console.log('  → hasValidSubscription:', hasValidSubscription);
        
        if (!hasValidSubscription) {
          return throwError(() => new Error(
            'No se pueden registrar doctores con suscripción inactiva'
          ));
        }

        // Validar que el plan exista
        if (!result.subscriptionPlan) {
          return throwError(() => new Error('Plan de suscripción no encontrado'));
        }

        // Validar límite de doctores
        const maxDoctors = (result.subscriptionPlan.features as any).maxDoctors || 5;
        if (result.doctorsCount >= maxDoctors) {
          return throwError(() => new Error(
            `Se ha alcanzado el límite de doctores (${maxDoctors}). ` +
            `Por favor actualice su plan de suscripción.`
          ));
        }

        // Verificar que el email no esté registrado
        return this.userService.emailExists(request.email).pipe(
          switchMap(exists => {
            if (exists) {
              return throwError(() => new Error('El email ya está registrado'));
            }

            // Crear usuario para el doctor
            return this.userService.create({
              email: request.email,
              password: request.password,
              role: 'doctor',
              name: `${request.firstName} ${request.lastName}`
            });
          }),
          switchMap(user => {
            // Crear el doctor
            return this.doctorService.create({
              userId: user.id,
              tenantId: request.tenantId,
              firstName: request.firstName,
              lastName: request.lastName,
              dni: 'N/A', // Requerido por DoctorService
              licenseNumber: request.licenseNumber,
              specialty: request.specialty,
              phone: request.phone || ''
            });
          }),
          map(doctor => ({
            success: true,
            message: `Doctor ${doctor.fullName} registrado exitosamente`,
            data: doctor
          }))
        );
      }),
      tap(() => this._loading.set(false)),
      catchError(error => {
        this._loading.set(false);
        this._error.set(error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Registra un doctor sin validar suscripción (flujo admin interno).
   * Útil para permitir que el administrador cree doctores directamente
   * aunque el tenant no tenga suscripción activa.
   */
  registerDoctorAsAdmin(request: RegisterDoctorFromHospitalRequest): Observable<HospitalDashboardResult> {
    this._loading.set(true);
    this._error.set(null);

    return this.tenantService.getById(request.tenantId).pipe(
      switchMap(tenant => {
        if (!tenant) {
          return throwError(() => new Error('Hospital no encontrado'));
        }

        // No validamos suscripción ni límites: admin puede crear doctores.
        // Verificar que el email no esté registrado y crear usuario + doctor.
        return this.userService.emailExists(request.email).pipe(
          switchMap(exists => {
            if (exists) {
              return throwError(() => new Error('El email ya está registrado'));
            }

            // Crear usuario para el doctor
            return this.userService.create({
              email: request.email,
              password: request.password,
              role: 'doctor',
              name: `${request.firstName} ${request.lastName}`
            });
          }),
          switchMap(user => {
            // Crear el doctor vinculado al tenant
            return this.doctorService.create({
              userId: user.id,
              tenantId: request.tenantId,
              firstName: request.firstName,
              lastName: request.lastName,
              dni: request.dni || '00000000', // Backend requiere mínimo 8 caracteres
              licenseNumber: request.licenseNumber,
              specialty: request.specialty,
              phone: request.phone || ''
            });
          }),
          map(doctor => ({
            success: true,
            message: `Doctor ${doctor.fullName} registrado exitosamente (admin)`,
            data: doctor
          }))
        );
      }),
      tap(() => this._loading.set(false)),
      catchError(error => {
        this._loading.set(false);
        this._error.set(error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Invita un doctor por email
   */
  inviteDoctor(request: InviteDoctorRequest): Observable<HospitalDashboardResult> {
    this._loading.set(true);
    this._error.set(null);

    return this.tenantService.getById(request.tenantId).pipe(
      switchMap(tenant => {
        // Validar tenant activo
        if (tenant.status !== 'active') {
          return throwError(() => new Error('Hospital no está activo'));
        }

        // Validar que tenga suscripción
        if (!tenant.subscriptionId) {
          return throwError(() => new Error('Hospital no tiene suscripción'));
        }

        // Primero obtener subscription para tener el planId correcto
        return this.subscriptionService.getById(tenant.subscriptionId).pipe(
          switchMap(subscription => {
            // Ahora obtener plan con el planId correcto y contar doctores
            return forkJoin({
              tenant: of(tenant),
              subscription: of(subscription),
              subscriptionPlan: this.subscriptionService.getPlanById(subscription.planId),
              doctorsCount: this.doctorService.countByTenantId(request.tenantId)
            });
          })
        );
      }),
      switchMap(result => {
        // Validar suscripción activa
        if (!result.subscription.isActive) {
          return throwError(() => new Error(
            'No se pueden enviar invitaciones con suscripción inactiva'
          ));
        }

        // Validar que el plan exista
        if (!result.subscriptionPlan) {
          return throwError(() => new Error('Plan de suscripción no encontrado'));
        }

        // Validar límite de doctores
        const maxDoctors = (result.subscriptionPlan.features as any).maxDoctors || 5;
        if (result.doctorsCount >= maxDoctors) {
          return throwError(() => new Error(
            `Se ha alcanzado el límite de doctores (${maxDoctors}). ` +
            `Por favor actualice su plan de suscripción.`
          ));
        }

        // Verificar que el email no esté ya registrado
        return this.userService.emailExists(request.email).pipe(
          switchMap(exists => {
            if (exists) {
              return throwError(() => new Error(
                'El email ya está registrado. Use la opción de registro directo.'
              ));
            }

            // Crear la invitación
            const invitationRequest: CreateInvitationRequest = {
              tenantId: request.tenantId,
              invitedBy: request.invitedBy,
              email: request.email,
              role: 'doctor',
              expiresInDays: 7
            };

            return this.invitationService.create(invitationRequest);
          }),
          map(invitation => ({
            success: true,
            message: `Invitación enviada a ${request.email}. Válida por ${invitation.daysUntilExpiry} días.`,
            data: invitation
          }))
        );
      }),
      tap(() => this._loading.set(false)),
      catchError(error => {
        this._loading.set(false);
        this._error.set(error.message);
        return throwError(() => error);
      })
    );
  }

  /**
   * Limpia el estado
   */
  clear(): void {
    this._stats.set(null);
    this._doctors.set([]);
    this._loading.set(false);
    this._error.set(null);
  }
}
