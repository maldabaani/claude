import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface TicketSummary {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  assignedToName: string | null;
}

@Injectable({ providedIn: 'root' })
export class TicketParentService {
  private base = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient) {}

  getChildren(ticketId: string): Observable<TicketSummary[]> {
    return this.http.get<ApiResponse<TicketSummary[]>>(`${this.base}/${ticketId}/children`).pipe(map(r => r.data));
  }

  createChild(ticketId: string, data: { subject: string; description: string; priority?: string }): Observable<TicketSummary> {
    return this.http.post<ApiResponse<TicketSummary>>(`${this.base}/${ticketId}/children`, data).pipe(map(r => r.data));
  }

  setParent(ticketId: string, parentTicketId: string | null): Observable<TicketSummary> {
    return this.http.put<ApiResponse<TicketSummary>>(`${this.base}/${ticketId}/parent`, { parentTicketId }).pipe(map(r => r.data));
  }

  removeParent(ticketId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${ticketId}/parent`);
  }
}
