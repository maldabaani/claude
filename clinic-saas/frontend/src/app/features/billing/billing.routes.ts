import { Routes } from '@angular/router';

export const BILLING_ROUTES: Routes = [
  { path: '', redirectTo: 'claims', pathMatch: 'full' },
  {
    path: 'claims',
    loadComponent: () => import('./claims-management.component').then(m => m.ClaimsManagementComponent)
  }
];
