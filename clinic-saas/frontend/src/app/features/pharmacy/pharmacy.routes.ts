import { Routes } from '@angular/router';

export const PHARMACY_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pharmacy-board.component').then(m => m.PharmacyBoardComponent) }
];
