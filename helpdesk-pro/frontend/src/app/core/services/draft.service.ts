import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface TicketDraft {
  id: string;
  ticketId: string;
  agentId: string;
  content: string;
  isInternal: boolean;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class DraftService {
  private base = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient) {}

  getDraft(ticketId: string): Observable<TicketDraft | null> {
    return this.http.get<ApiResponse<TicketDraft>>(`${this.base}/${ticketId}/draft`).pipe(
      map(r => r.data),
      catchError(() => EMPTY)
    );
  }

  saveDraft(ticketId: string, content: string, isInternal: boolean): Observable<TicketDraft> {
    return this.http.put<ApiResponse<TicketDraft>>(`${this.base}/${ticketId}/draft`, { content, isInternal })
      .pipe(map(r => r.data));
  }

  deleteDraft(ticketId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${ticketId}/draft`);
  }
}
