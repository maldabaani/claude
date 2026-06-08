import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface Webhook {
  id: string;
  name: string;
  url: string;
  secret?: string;
  events: string;
  active: boolean;
  createdAt: string;
}

export interface WebhookRequest {
  name: string;
  url: string;
  secret?: string;
  events: string;
  active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class WebhookService {
  private base = `${environment.apiUrl}/webhooks`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Webhook[]> {
    return this.http.get<ApiResponse<Webhook[]>>(this.base).pipe(map(r => r.data));
  }

  create(data: WebhookRequest): Observable<Webhook> {
    return this.http.post<ApiResponse<Webhook>>(this.base, data).pipe(map(r => r.data));
  }

  update(id: string, data: WebhookRequest): Observable<Webhook> {
    return this.http.put<ApiResponse<Webhook>>(`${this.base}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`).pipe(map(() => undefined));
  }

  test(id: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.base}/${id}/test`, {}).pipe(map(() => undefined));
  }
}
