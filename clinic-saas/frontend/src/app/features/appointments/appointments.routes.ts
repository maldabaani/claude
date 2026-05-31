import { Routes } from '@angular/router';

export const APPOINTMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./appointment-scheduler/appointment-scheduler.component').then(m => m.AppointmentSchedulerComponent)
  }
];
