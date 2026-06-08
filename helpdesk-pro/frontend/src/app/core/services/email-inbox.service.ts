import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface EmailInbox {
  id: string;
  name: string;
  email: string;
  host: string;
  port: number;
  username: string;
  protocol: string;
  useSsl: boolean;
  defaultDepartmentId: string | null;
  defaultPriority: string;
  active: boolean;
  lastCheckedAt: string | null;
}

export interface CreateEmailInboxRequest {
  name: string;
  email: string;
  host: string;
  port: number;
  username: string;
  password: string;
  protocol: string;
  useSsl: boolean;
  defaultDepartmentId: string | null;
  defaultPriority: string;
}

@Injectable({ providedIn: 'root' })
export class EmailInboxService {
  private base = `${environment.apiUrl}/email-inboxes`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<EmailInbox[]> {
    return this.http.get<ApiResponse<EmailInbox[]>>(this.base).pipe(map(r => r.data));
  }

  create(data: CreateEmailInboxRequest): Observable<EmailInbox> {
    return this.http.post<ApiResponse<EmailInbox>>(this.base, data).pipe(map(r => r.data));
  }

  update(id: string, data: CreateEmailInboxRequest): Observable<EmailInbox> {
    return this.http.put<ApiResponse<EmailInbox>>(`${this.base}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  test(id: string): Observable<{ result: string }> {
    return this.http.post<ApiResponse<{ result: string }>>(`${this.base}/${id}/test`, {}).pipe(map(r => r.data));
  }
}
