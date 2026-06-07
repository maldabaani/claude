import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface CannedResponse {
  id: string;
  title: string;
  body: string;
  category?: string;
  createdAt: string;
}

export interface CannedResponseRequest {
  title: string;
  body: string;
  category?: string;
}

@Injectable({ providedIn: 'root' })
export class CannedResponseService {
  private base = `${environment.apiUrl}/canned-responses`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<CannedResponse[]> {
    return this.http.get<ApiResponse<CannedResponse[]>>(this.base).pipe(map(r => r.data));
  }

  create(data: CannedResponseRequest): Observable<CannedResponse> {
    return this.http.post<ApiResponse<CannedResponse>>(this.base, data).pipe(map(r => r.data));
  }

  update(id: string, data: CannedResponseRequest): Observable<CannedResponse> {
    return this.http.put<ApiResponse<CannedResponse>>(`${this.base}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
