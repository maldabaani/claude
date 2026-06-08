import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface TicketTemplate {
  id: string;
  name: string;
  subject: string;
  description: string;
  priority: string;
  category: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class TemplateService {
  private base = `${environment.apiUrl}/ticket-templates`;

  constructor(private http: HttpClient) {}

  getTemplates(): Observable<TicketTemplate[]> {
    return this.http.get<ApiResponse<TicketTemplate[]>>(this.base).pipe(map(r => r.data));
  }

  createTemplate(template: Partial<TicketTemplate>): Observable<TicketTemplate> {
    return this.http.post<ApiResponse<TicketTemplate>>(this.base, template).pipe(map(r => r.data));
  }

  updateTemplate(id: string, template: Partial<TicketTemplate>): Observable<TicketTemplate> {
    return this.http.put<ApiResponse<TicketTemplate>>(`${this.base}/${id}`, template).pipe(map(r => r.data));
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
