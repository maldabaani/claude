import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Patient, CreatePatientRequest } from '../../core/models/patient.model';
import { PageResponse } from '../../core/models/api-response.model';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly BASE = '/api/v1/patients';

  constructor(private http: HttpClient) {}

  search(query: string, page = 0, size = 20) {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page)
      .set('size', size)
      .set('sort', 'lastName,asc');
    return this.http.get<PageResponse<Patient>>(this.BASE, { params });
  }

  getById(id: string) {
    return this.http.get<Patient>(`${this.BASE}/${id}`);
  }

  create(req: CreatePatientRequest) {
    return this.http.post<Patient>(this.BASE, req);
  }

  deactivate(id: string) {
    return this.http.delete(`${this.BASE}/${id}`);
  }
}
