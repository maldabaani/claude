import { Routes } from '@angular/router';

export const QUEUE_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./queue-board.component').then(m => m.QueueBoardComponent) }
];
