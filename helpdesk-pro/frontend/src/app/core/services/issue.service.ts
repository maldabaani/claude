import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, Ticket } from '../models';

export interface Issue {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  createdByName?: string;
  assignedToName?: string;
  ticketCount: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class IssueService {
  private base = `${environment.apiUrl}/issues`;

  constructor(private http: HttpClient) {}

  getIssues(): Observable<Issue[]> {
    return this.http.get<ApiResponse<Issue[]>>(this.base).pipe(map(r => r.data));
  }

  getIssue(id: string): Observable<Issue> {
    return this.http.get<ApiResponse<Issue>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  createIssue(data: Partial<Issue>): Observable<Issue> {
    return this.http.post<ApiResponse<Issue>>(this.base, data).pipe(map(r => r.data));
  }

  updateIssue(id: string, data: Partial<Issue>): Observable<Issue> {
    return this.http.put<ApiResponse<Issue>>(`${this.base}/${id}`, data).pipe(map(r => r.data));
  }

  deleteIssue(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`).pipe(map(() => undefined));
  }

  getLinkedTickets(issueId: string): Observable<Ticket[]> {
    return this.http.get<ApiResponse<Ticket[]>>(`${this.base}/${issueId}/tickets`).pipe(map(r => r.data));
  }

  linkTicket(issueId: string, ticketId: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.base}/${issueId}/tickets`, { ticketId }).pipe(map(() => undefined));
  }

  unlinkTicket(issueId: string, ticketId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${issueId}/tickets/${ticketId}`).pipe(map(() => undefined));
  }

  getIssuesByTicket(ticketId: string): Observable<Issue[]> {
    return this.http.get<ApiResponse<Issue[]>>(`${this.base}/by-ticket/${ticketId}`).pipe(map(r => r.data ?? []));
  }
}
