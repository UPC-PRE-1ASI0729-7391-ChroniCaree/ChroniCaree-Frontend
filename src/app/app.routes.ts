import { Routes } from '@angular/router';

const baseTitle = 'ChroniCaree';

export const routes: Routes = [
  // Root → login
  {
    path: '',
    redirectTo: '/iam/login',
    pathMatch: 'full',
  },

  // Home route
  {
    path: 'home',
    loadComponent: () =>
      import('./shared/presentation/views/home/home').then((m) => m.Home),
    title: `${baseTitle} - Inicio`,
  },

  // IAM routes (Authentication & Identity)
  {
    path: 'iam',
    children: [
      {
        path: 'register',
        loadComponent: () =>
          import('./iam/presentation/components/register-select/register-select')
            .then((m) => m.RegisterSelectComponent),
        title: `${baseTitle} - Seleccionar Registro`,
      },
      {
        path: 'register/patient',
        loadComponent: () =>
          import('./iam/presentation/components/register-patient/register-patient')
            .then((m) => m.RegisterPatientComponent),
        title: `${baseTitle} - Registro de Paciente`,
      },
      {
        path: 'register/hospital',
        loadComponent: () =>
          import('./iam/presentation/components/register-hospital/register-hospital')
            .then((m) => m.RegisterHospitalComponent),
        title: `${baseTitle} - Registro de Hospital`,
        data: { analyticsId: 'hospital-registration' },
      },
      {
        path: 'login',
        loadComponent: () =>
          import('./iam/presentation/components/login/login')
            .then((m) => m.LoginComponent),
        title: `${baseTitle} - Iniciar Sesión`,
      },
    ],
  },

  // Patient routes
  {
    path: 'patient',
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./patients/presentation/views/dashboard-patient/dashboard-patient')
            .then((m) => m.DashboardPatient),
        title: `${baseTitle} - Dashboard Paciente`,
        data: { role: 'patient' },
      },
      {
        path: 'edit-profile',
        loadComponent: () =>
          import('./patients/presentation/views/edit-profile/edit-profile')
            .then((m) => m.EditProfileComponent),
        title: `${baseTitle} - Editar Perfil`,
        data: { role: 'patient' },
      },
      {
        path: 'recordatorios',
        loadComponent: () =>
          import('./communication/presentation/views/nudges-page/nudges-page')
            .then((m) => m.NudgesPageComponent),
        title: `${baseTitle} - Recordatorios`,
        data: { role: 'patient' },
      },
      {
        path: 'medicamentos',
        loadComponent: () => import('./medications/presentation/views/medication-history/medication-history').then(m => m.MedicationHistoryComponent),
        title: `${baseTitle} - Mis Medicamentos`,
        data: { role: 'patient' }
      },
      {
        path: 'salud',
        loadComponent: () => import('./alerts/presentation/views/health-alerts/health-alerts').then(m => m.HealthAlertsComponent),
        title: `${baseTitle} - Mi Salud`,
        data: { role: 'patient' }
      },
      {
        path: 'appointments/new',
        loadComponent: () => import('./doctors/presentation/components/appointment-scheduler/appointment-scheduler.component').then(m => m.AppointmentSchedulerComponent),
        title: `${baseTitle} - Agendar Cita`,
        data: { role: 'patient' }
      },
      {
        path: 'subscription',
        loadComponent: () => import('./patients/presentation/views/patient-subscription/patient-subscription.view').then(m => m.PatientSubscriptionView),
        title: `${baseTitle} - Mi Suscripción`,
        data: { role: 'patient' }
      }
    ]
  },

  // Clinical routes (Symptoms & Medical Records)
  {
    path: 'clinical',
    children: [
      {
        path: 'symptoms/register',
        loadComponent: () =>
          import('./clinical/presentation/views/register-symptoms/register-symptoms')
            .then((m) => m.RegisterSymptomsComponent),
        title: `${baseTitle} - Registrar Síntomas`,
        data: { role: 'patient' },
      },
    ],
  },

  // Medical Records
  {
    path: 'medical-records',
    children: [
      {
        path: 'diagnoses',
        loadComponent: () =>
          import('./medical-records/presentation/views/medical-diagnoses/medical-diagnoses')
            .then((m) => m.MedicalDiagnosesComponent),
        title: `${baseTitle} - Diagnósticos Médicos`,
        data: { role: 'patient' },
      },
      {
        path: ':id',
        loadComponent: () =>
          import('./medical-records/presentation/views/medical-record-detail/medical-record-detail').then(m => m.MedicalRecordDetailComponent),
        title: `${baseTitle} - Registro Médico`,
      },
    ],
  },

  // Hospital Admin routes
  {
    path: 'hospital',
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./tenants/presentation/views/hospital-dashboard/hospital-dashboard.view')
            .then((m) => m.HospitalDashboardView),
        title: `${baseTitle} - Dashboard Hospital`,
        data: { role: 'hospital_admin' },
      },
      {
        path: 'doctors',
        loadComponent: () =>
          import('./medical-records/presentation/views/hospital-doctors/hospital-doctors.view')
            .then((m) => m.HospitalDoctorsView),
        title: `${baseTitle} - Gestión de Doctores`,
        data: { role: 'hospital_admin' },
      },
      {
        path: 'doctors/add',
        loadComponent: () =>
          import('./doctors/presentation/views/add-doctor/add-doctor.view')
            .then((m) => m.AddDoctorView),
        title: `${baseTitle} - Agregar Doctor`,
        data: { role: 'hospital_admin' },
      },
      {
        path: 'patients',
        loadComponent: () =>
          import('./medical-records/presentation/views/hospital-patients/hospital-patients.view')
            .then((m) => m.HospitalPatientsView),
        title: `${baseTitle} - Gestión de Pacientes`,
        data: { role: 'hospital_admin' },
      },
      {
        path: 'patient-onboarding',
        loadComponent: () =>
          import('./medical-records/presentation/views/patient-onboarding/patient-onboarding.view')
            .then((m) => m.PatientOnboardingView),
        title: `${baseTitle} - Registro de Paciente`,
        data: { role: 'hospital_admin' },
      },
      {
        path: 'assignments',
        loadComponent: () =>
          import('./medical-records/presentation/views/hospital-assignments/hospital-assignments.view')
            .then((m) => m.HospitalAssignmentsView),
        title: `${baseTitle} - Asignaciones Doctor-Paciente`,
        data: { role: 'hospital_admin' },
      },
      {
        path: 'patient-devices',
        loadComponent: () =>
          import('./medical-records/presentation/views/patient-devices/patient-devices.view')
            .then((m) => m.PatientDevicesView),
        title: `${baseTitle} - Gestión de Dispositivos`,
        data: { role: 'hospital_admin' },
      },
      {
        path: 'subscription',
        loadComponent: () =>
          import('./tenants/presentation/views/hospital-subscription/hospital-subscription.view')
            .then((m) => m.HospitalSubscriptionView),
        title: `${baseTitle} - Suscripción`,
        data: { role: 'hospital_admin' },
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./tenants/presentation/views/hospital-profile/hospital-profile.view')
            .then((m) => m.HospitalProfileView),
        title: `${baseTitle} - Perfil Hospital`,
        data: { role: 'hospital_admin' },
      },
    ],
  },

  // Doctor routes
  {
    path: 'doctor',
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./doctors/presentation/views/dashboard-doctor/dashboard-doctor')
            .then((m) => m.DashboardDoctor),
        title: `${baseTitle} - Dashboard Doctor`,
        data: { role: 'doctor' },
      },
      {
        path: 'edit-profile',
        loadComponent: () =>
          import('./doctors/presentation/views/edit-profile/edit-profile')
            .then((m) => m.EditProfileDoctorComponent),
        title: `${baseTitle} - Editar Perfil Doctor`,
        data: { role: 'doctor' }
      },
      {
        path: 'patients',
        loadComponent: () => import('./doctors/presentation/views/patients-list/patients-list').then(m => m.PatientsListComponent),
        title: `${baseTitle} - Mis Pacientes`,
        data: { role: 'doctor' }
      },
      {
        path: 'patients/:id',
        loadComponent: () => import('./doctors/presentation/views/patient-detail/patient-detail').then(m => m.DoctorsPatientDetailComponent),
        title: `${baseTitle} - Detalle Paciente`,
        data: { role: 'doctor' }
      },
      {
        path: 'appointments',
        loadComponent: () => import('./doctors/presentation/views/appointments-list/appointments-list').then(m => m.AppointmentsListComponent),
        title: `${baseTitle} - Mis Citas`,
        data: { role: 'doctor' }
      },
      {
        path: 'records',
        loadComponent: () => import('./doctors/presentation/views/medical-records-list/medical-records-list').then(m => m.MedicalRecordsListComponent),
        title: `${baseTitle} - Historiales Médicos`,
        data: { role: 'doctor' }
      }
    ]
  },


  // Communication - Messages (shared by patient and doctor)
  {
    path: 'communication/messages',
    loadComponent: () =>
      import('./communication/presentation/components/inbox/inbox.component')
        .then((m) => m.InboxComponent),
    title: `${baseTitle} - Mensajes`,
    children: [
      {
        path: 'compose',
        loadComponent: () =>
          import('./communication/presentation/components/message-compose/message-compose.component')
            .then((m) => m.MessageComposeComponent),
        title: `${baseTitle} - Nuevo Mensaje`,
      },
      {
        path: 'thread/:id',
        loadComponent: () =>
          import('./communication/presentation/components/message-thread/message-thread.component')
            .then((m) => m.MessageThreadComponent),
        title: `${baseTitle} - Conversación`,
      },
    ],
  },

  // IoT Devices routes
  {
    path: 'devices',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./devices/presentation/views/device-list.view')
            .then((m) => m.DeviceListView),
        title: `${baseTitle} - Dispositivos IoT`,
      },
      {
        path: 'glucometer',
        loadComponent: () =>
          import('./devices/presentation/components/glucometer/glucometer.component')
            .then((m) => m.GlucometerComponent),
        title: `${baseTitle} - Glucómetro`,
      },
      {
        path: 'blood-pressure',
        loadComponent: () =>
          import('./devices/presentation/components/blood-pressure/blood-pressure.component')
            .then((m) => m.BloodPressureComponent),
        title: `${baseTitle} - Monitor de Presión Arterial`,
      },
      {
        path: 'pulse-oximeter',
        loadComponent: () =>
          import('./devices/presentation/components/pulse-oximeter/pulse-oximeter.component')
            .then((m) => m.PulseOximeterComponent),
        title: `${baseTitle} - Oxímetro de Pulso`,
      },
      {
        path: 'ecg',
        loadComponent: () =>
          import('./devices/presentation/components/ecg/ecg.component')
            .then((m) => m.ECGComponent),
        title: `${baseTitle} - Monitor ECG`,
      },
      {
        path: 'smart-scale',
        loadComponent: () =>
          import('./devices/presentation/components/smart-scale/smart-scale.component')
            .then((m) => m.SmartScaleComponent),
        title: `${baseTitle} - Báscula Inteligente`,
      },
    ],
  },

  // Coming Soon (restaurado, sin redirección a mensajes)
  {
    path: 'coming-soon',
    loadComponent: () =>
      import('./shared/presentation/components/coming-soon/coming-soon')
        .then((m) => m.ComingSoonComponent),
    title: `${baseTitle} - Próximamente`,
  },


  // Atajos legados
  { path: 'messages', redirectTo: '/communication/messages', pathMatch: 'full' },
  { path: 'patient/messages', redirectTo: '/communication/messages', pathMatch: 'full' },
  { path: 'doctor/messages', redirectTo: '/communication/messages', pathMatch: 'full' },

  // 404
  {
    path: '404',
    loadComponent: () => import('./shared/presentation/components/not-found/not-found').then(m => m.NotFoundComponent),
    title: `${baseTitle} - Página no encontrada`
  },

  // Legacy redirects for backward compatibility
  {
    path: 'dashboard/doctor',
    redirectTo: 'doctor/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard/patient',
    redirectTo: 'patient/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'tutorial',
    loadComponent: () =>
      import('./shared/presentation/components/tutorial-reset/tutorial-reset')
        .then(m => m.TutorialResetComponent),
    title: `${baseTitle} - Tutorial`
  },

  // Wildcard route (always last) - redirect to 404
  {
    path: '**',
    redirectTo: '/404'
  }
];