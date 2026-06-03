import { Routes } from '@angular/router';

export const LAB_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./lab-board.component').then(m => m.LabBoardComponent) }
];
