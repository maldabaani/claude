export type AppointmentStatus =
  'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  durationMinutes: number;
  status: AppointmentStatus;
  appointmentType?: string;
  notes?: string;
}

export interface CreateAppointmentRequest {
  patientId: string;
  doctorId: string;
  scheduledAt: string;
  durationMinutes: number;
  appointmentType?: string;
  notes?: string;
}
