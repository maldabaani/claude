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
    page?: number; size?: number; sort?: string;
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
}
