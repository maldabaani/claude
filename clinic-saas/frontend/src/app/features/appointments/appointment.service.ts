import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Appointment, CreateAppointmentRequest } from '../../core/models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private readonly BASE = '/api/v1/appointments';

  constructor(private http: HttpClient) {}

  getByRange(from: string, to: string) {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<Appointment[]>(`${this.BASE}/range`, { params });
  }

  create(req: CreateAppointmentRequest) {
    return this.http.post<Appointment>(this.BASE, req);
  }

  updateStatus(id: string, status: string) {
    return this.http.patch<Appointment>(`${this.BASE}/${id}/status`, null, {
      params: { status }
    });
  }
}
