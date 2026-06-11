import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface TimeEntry {
  id: string;
  ticketId: string;
  agentId: string;
  agentName: string;
  minutes: number;
  note: string | null;
  loggedAt: string;
}

export interface TimeEntryRequest {
  minutes: number;
  note?: string;
  loggedAt?: string;
}

@Injectable({ providedIn: 'root' })
export class TimeEntryService {
  private base = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient) {}

  getEntries(ticketId: string): Observable<TimeEntry[]> {
    return this.http.get<ApiResponse<TimeEntry[]>>(`${this.base}/${ticketId}/time-entries`).pipe(map(r => r.data));
  }

  logTime(ticketId: string, req: TimeEntryRequest): Observable<TimeEntry> {
    return this.http.post<ApiResponse<TimeEntry>>(`${this.base}/${ticketId}/time-entries`, req).pipe(map(r => r.data));
  }

  deleteEntry(ticketId: string, entryId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${ticketId}/time-entries/${entryId}`);
  }
}
