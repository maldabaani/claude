import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
      {
        path: 'auth',
        loadChildren: () =>
          import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
      }
    ]
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./layouts/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES)
      },
      {
        path: 'patients',
        loadChildren: () =>
          import('./features/patients/patients.routes').then(m => m.PATIENT_ROUTES)
      },
      {
        path: 'appointments',
        loadChildren: () =>
          import('./features/appointments/appointments.routes').then(m => m.APPOINTMENT_ROUTES)
      },
      {
        path: 'platform',
        loadChildren: () =>
          import('./features/platform/platform.routes').then(m => m.PLATFORM_ROUTES)
      },
      {
        path: 'visits',
        loadChildren: () =>
          import('./features/visits/visits.routes').then(m => m.VISIT_ROUTES)
      },
      {
        path: 'staff',
        loadChildren: () =>
          import('./features/staff/staff.routes').then(m => m.STAFF_ROUTES)
      },
      {
        path: 'queue',
        loadChildren: () =>
          import('./features/queue/queue.routes').then(m => m.QUEUE_ROUTES)
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./features/reports/reports.routes').then(m => m.REPORT_ROUTES)
      }
    ]
  },
  { path: '**', redirectTo: 'auth/login' }
];
