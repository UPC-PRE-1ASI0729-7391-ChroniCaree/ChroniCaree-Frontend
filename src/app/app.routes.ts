import { Routes } from '@angular/router';
import { Home } from './shared/presentation/views/home/home';

const dashboardDoctor = () => import('./doctors/presentation/views/dashboard-doctor/dashboard-doctor').then(m => m.DashboardDoctor);
const dashboardPatient = () => import('./patients/presentation/views/dashboard-patient/dashboard-patient').then(m => m.DashboardPatient);

const baseTitle = 'ChroniCaree';

export const routes: Routes = [
  { path: 'home', component: Home, title: `${baseTitle} - Inicio` },
  { path: 'dashboard/doctor', loadComponent: dashboardDoctor, title: `${baseTitle} - Dashboard Doctor` },
  { path: 'dashboard/patient', loadComponent: dashboardPatient, title: `${baseTitle} - Dashboard Paciente` },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', redirectTo: '/home' }
];
