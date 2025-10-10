import { Routes } from '@angular/router';

const baseTitle = 'ChroniCaree';

export const routes: Routes = [
  // Root → login
  {
    path: '',
    redirectTo: '/iam/login',
    pathMatch: 'full',
  },

  // Home
  {
    path: 'home',
    loadComponent: () =>
      import('./shared/presentation/views/home/home').then((m) => m.Home),
    title: `${baseTitle} - Inicio`,
  },

  // IAM
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

  // Patient
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
    ],
  },

  // Clinical
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
    ],
  },

  // Doctor
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
        data: { role: 'doctor' },
      },

      // Bandeja del doctor
      {
        path: 'messages',
        loadComponent: () =>
          import('./communication/messages/presentation/components/inbox/inbox.component')
            .then((m) => m.InboxComponent),
        title: `${baseTitle} - Mensajes (Doctor)`,
        data: { role: 'doctor' },
      },

      // Conversación del doctor
      {
        path: 'messages/thread/:id',
        loadComponent: () =>
          import('./communication/messages/presentation/components/message-thread/message-thread.component')
            .then((m) => m.MessageThreadComponent),
        title: `${baseTitle} - Conversación (Doctor)`,
        data: { role: 'doctor' },
      },
    ],
  },

  // Communication → mensajes del paciente
  {
    path: 'communication',
    children: [
      {
        path: 'messages',
        loadComponent: () =>
          import('./communication/messages/presentation/components/inbox/inbox.component')
            .then((m) => m.InboxComponent),
        title: `${baseTitle} - Mensajes`,
        data: { role: 'patient' },
        children: [
          {
            path: 'compose',
            loadComponent: () =>
              import('./communication/messages/presentation/components/message-compose/message-compose.component')
                .then((m) => m.MessageComposeComponent),
            title: `${baseTitle} - Nuevo Mensaje`,
            data: { role: 'patient' },
          },
          {
            path: 'thread/:id',
            loadComponent: () =>
              import('./communication/messages/presentation/components/message-thread/message-thread.component')
                .then((m) => m.MessageThreadComponent),
            title: `${baseTitle} - Conversación`,
            data: { role: 'patient' },
          },
          // Solo aplica al flujo del paciente
          { path: '', pathMatch: 'full', redirectTo: 'compose' },
        ],
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

  // 404
  {
    path: '404',
    loadComponent: () =>
      import('./shared/presentation/components/not-found/not-found')
        .then((m) => m.NotFoundComponent),
    title: `${baseTitle} - Página no encontrada`,
  },

  // Legacy redirects
  { path: 'dashboard/doctor', redirectTo: 'doctor/dashboard', pathMatch: 'full' },
  { path: 'dashboard/patient', redirectTo: 'patient/dashboard', pathMatch: 'full' },

  // Wildcard
  { path: '**', redirectTo: '/404' },
];
