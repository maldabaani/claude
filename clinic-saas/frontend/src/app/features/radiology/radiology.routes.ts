import { Routes } from '@angular/router';

export const RADIOLOGY_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./radiology-board.component').then(m => m.RadiologyBoardComponent) }
];
