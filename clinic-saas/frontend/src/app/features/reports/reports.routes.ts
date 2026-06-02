import { Routes } from '@angular/router';

export const REPORT_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./financial-reports.component').then(m => m.FinancialReportsComponent) }
];
