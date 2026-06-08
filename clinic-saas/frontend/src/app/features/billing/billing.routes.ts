import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
  { path: '', redirectTo: 'claims', pathMatch: 'full' },
  {
    path: 'claims',
    loadComponent: () => import('./claims-management.component').then(m => m.ClaimsManagementComponent)
  },
  {
    path: 'preauth',
    loadComponent: () => import('./pre-auth-management.component').then(m => m.PreAuthManagementComponent)
  }
];
