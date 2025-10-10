import { Routes } from '@angular/router';

const baseTitle = 'ChroniCaree';

export const routes: Routes = [
  // Root redirects to login
  {
    path: '',
    redirectTo: '/iam/login',
    pathMatch: 'full'
  },
  
  // Home route
  {
    path: 'home',
    loadComponent: () => import('./shared/presentation/views/home/home').then(m => m.Home),
    title: `${baseTitle} - Inicio`
  },
  
  // IAM routes (Authentication & Identity)
  {
    path: 'iam',
    children: [
      {
        path: 'register',
        loadComponent: () => import('./iam/presentation/components/register-select/register-select').then(m => m.RegisterSelectComponent),
        title: `${baseTitle} - Seleccionar Registro`
      },
      {
        path: 'register/patient',
        loadComponent: () => import('./iam/presentation/components/register-patient/register-patient').then(m => m.RegisterPatientComponent),
        title: `${baseTitle} - Registro de Paciente`
      },
      {
        path: 'register/hospital',
        loadComponent: () => import('./iam/presentation/components/register-hospital/register-hospital').then(m => m.RegisterHospitalComponent),
        title: `${baseTitle} - Registro de Hospital`,
        data: { analyticsId: 'hospital-registration' }
      },
      {
        path: 'login',
        loadComponent: () => import('./iam/presentation/components/login/login').then(m => m.LoginComponent),
        title: `${baseTitle} - Iniciar Sesión`
      }
    ]
  },
  
  // Patient routes
  {
    path: 'patient',
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./patients/presentation/views/dashboard-patient/dashboard-patient').then(m => m.DashboardPatient),
        title: `${baseTitle} - Dashboard Paciente`,
        data: { role: 'patient' }
      },
      {
        path: 'edit-profile',
        loadComponent: () => import('./patients/presentation/views/edit-profile/edit-profile').then(m => m.EditProfileComponent),
        title: `${baseTitle} - Editar Perfil`,
        data: { role: 'patient' }
      },
      {
        path: 'recordatorios',
        loadComponent: () => import('./communication/presentation/views/nudges-page/nudges-page').then(m => m.NudgesPageComponent),
        title: `${baseTitle} - Recordatorios`,
        data: { role: 'patient' }
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
      }
    ]
  },
  
  // Clinical routes (Symptoms & Medical Records)
  {
    path: 'clinical',
    children: [
      {
        path: 'symptoms/register',
        loadComponent: () => import('./clinical/presentation/views/register-symptoms/register-symptoms').then(m => m.RegisterSymptomsComponent),
        title: `${baseTitle} - Registrar Síntomas`,
        data: { role: 'patient' }
      }
    ]
  },

  // Medical Records routes (Diagnoses)
  {
    path: 'medical-records',
    children: [
      {
        path: 'diagnoses',
        loadComponent: () => import('./medical-records/presentation/views/medical-diagnoses/medical-diagnoses').then(m => m.MedicalDiagnosesComponent),
        title: `${baseTitle} - Diagnósticos Médicos`,
        data: { role: 'patient' }
      }
    ]
  },
  
  // Doctor routes
  {
    path: 'doctor',
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./doctors/presentation/views/dashboard-doctor/dashboard-doctor').then(m => m.DashboardDoctor),
        title: `${baseTitle} - Dashboard Doctor`,
        data: { role: 'doctor' }
      },
      {
        path: 'edit-profile',
        loadComponent: () => import('./doctors/presentation/views/edit-profile/edit-profile').then(m => m.EditProfileDoctorComponent),
        title: `${baseTitle} - Editar Perfil Doctor`,
        data: { role: 'doctor' }
      }
    ]
  },
  
  // Coming Soon page (for features under development)
  {
    path: 'coming-soon',
    loadComponent: () => import('./shared/presentation/components/coming-soon/coming-soon').then(m => m.ComingSoonComponent),
    title: `${baseTitle} - Próximamente`
  },
  
  // 404 Not Found page
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
  
  // Wildcard route (always last) - redirect to 404
  { 
    path: '**', 
    redirectTo: '/404'
  }
];
