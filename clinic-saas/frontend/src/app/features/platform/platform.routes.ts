import { Routes } from '@angular/router';

export const PLATFORM_ROUTES: Routes = [
  {
    path: 'tenants',
    loadComponent: () =>
      import('./tenant-list/tenant-list.component').then(m => m.TenantListComponent)
  },
  {
    path: 'tenants/create',
    loadComponent: () =>
      import('./tenant-create/tenant-create.component').then(m => m.TenantCreateComponent)
  },
  { path: '', redirectTo: 'tenants', pathMatch: 'full' }
];
