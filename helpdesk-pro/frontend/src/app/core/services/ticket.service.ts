import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse, Ticket, Comment, Attachment, TicketStatus, Priority } from '../models';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private base = `${environment.apiUrl}/tickets`;

  constructor(private http: HttpClient) {}

  getTickets(filters: {
    status?: TicketStatus; priority?: Priority; departmentId?: string;
    agentId?: string; createdById?: string; from?: string; to?: string;
    page?: number; size?: number; sort?: string; search?: string;
  } = {}): Observable<PageResponse<Ticket>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => { if (v != null) params = params.set(k, String(v)); });
    return this.http.get<ApiResponse<PageResponse<Ticket>>>(this.base, { params }).pipe(map(r => r.data));
  }

  getTicket(id: string): Observable<Ticket> {
    return this.http.get<ApiResponse<Ticket>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  createTicket(data: Partial<Ticket>): Observable<Ticket> {
    return this.http.post<ApiResponse<Ticket>>(this.base, data).pipe(map(r => r.data));
  }

  updateTicket(id: string, data: Partial<Ticket>): Observable<Ticket> {
    return this.http.patch<ApiResponse<Ticket>>(`${this.base}/${id}`, data).pipe(map(r => r.data));
  }

  assignTicket(id: string, agentId: string): Observable<Ticket> {
    return this.http.patch<ApiResponse<Ticket>>(`${this.base}/${id}/assign`, { agentId }).pipe(map(r => r.data));
  }

  changeStatus(id: string, status: TicketStatus): Observable<Ticket> {
    return this.http.patch<ApiResponse<Ticket>>(`${this.base}/${id}/status`, { status }).pipe(map(r => r.data));
  }

  deleteTicket(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  bulkAction(data: { ticketIds: string[]; action: string; agentId?: string; tag?: string }): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/bulk`, data).pipe(map(r => r.data));
  }

  getComments(ticketId: string): Observable<Comment[]> {
    return this.http.get<ApiResponse<Comment[]>>(`${this.base}/${ticketId}/comments`).pipe(map(r => r.data));
  }

  addComment(ticketId: string, body: string, internal = false): Observable<Comment> {
    return this.http.post<ApiResponse<Comment>>(`${this.base}/${ticketId}/comments`, { body, internal }).pipe(map(r => r.data));
  }

  getAttachments(ticketId: string): Observable<Attachment[]> {
    return this.http.get<ApiResponse<Attachment[]>>(`${this.base}/${ticketId}/attachments`).pipe(map(r => r.data));
  }

  uploadAttachment(ticketId: string, file: File): Observable<Attachment> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<Attachment>>(`${this.base}/${ticketId}/attachments`, formData).pipe(map(r => r.data));
  }

  getWatchers(ticketId: string): Observable<string[]> {
    return this.http.get<ApiResponse<string[]>>(`${this.base}/${ticketId}/watchers`).pipe(map(r => r.data));
  }

  addWatcher(ticketId: string, email: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.base}/${ticketId}/watchers`, { email }).pipe(map(() => undefined));
  }

  removeWatcher(ticketId: string, email: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${ticketId}/watchers/${encodeURIComponent(email)}`).pipe(map(() => undefined));
  }

  updateDueDate(ticketId: string, dueDate: string | null): Observable<Ticket> {
    return this.http.patch<ApiResponse<Ticket>>(`${this.base}/${ticketId}/due-date`, { dueDate }).pipe(map(r => r.data));
  }

  splitTicket(sourceId: string, request: {subject: string; description: string; departmentId?: string; priority?: string; commentIds?: string[]}): Observable<Ticket> {
    return this.http.post<ApiResponse<Ticket>>(`${this.base}/${sourceId}/split`, request).pipe(map(r => r.data));
  }

  mergeTicket(sourceId: string, targetTicketId: string): Observable<Ticket> {
    return this.http.post<ApiResponse<Ticket>>(`${this.base}/${sourceId}/merge`, { targetTicketId }).pipe(map(r => r.data));
  }

  snoozeTicket(ticketId: string, snoozeUntil: string | null): Observable<Ticket> {
    return this.http.patch<ApiResponse<Ticket>>(`${this.base}/${ticketId}/snooze`, { snoozeUntil }).pipe(map(r => r.data));
  }

  recordPresence(ticketId: string): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/${ticketId}/presence`, {}).pipe(map(r => r.data));
  }

  getPresence(ticketId: string): Observable<{agentId: string; agentName: string}[]> {
    return this.http.get<ApiResponse<{agentId: string; agentName: string}[]>>(`${this.base}/${ticketId}/presence`).pipe(map(r => r.data));
  }

  getAiSuggestions(ticketId: string): Observable<{category: string; priority: string; suggestedResponse: string}> {
    return this.http.post<ApiResponse<{category: string; priority: string; suggestedResponse: string}>>(
      `${this.base}/${ticketId}/ai-suggestions`, {}
    ).pipe(map(r => r.data));
  }
}
