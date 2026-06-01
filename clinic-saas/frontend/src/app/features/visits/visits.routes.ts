import { Routes } from '@angular/router';

export const VISIT_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./visit-detail/visit-detail.component').then(m => m.VisitDetailComponent)
  }
];
