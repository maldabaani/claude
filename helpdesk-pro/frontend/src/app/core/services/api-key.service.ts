import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  createdBy: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
}

export interface GeneratedApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class ApiKeyService {
  private base = `${environment.apiUrl}/api-keys`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<ApiKey[]> {
    return this.http.get<ApiResponse<ApiKey[]>>(this.base).pipe(map(r => r.data));
  }

  generate(name: string, expiresAt?: string): Observable<GeneratedApiKey> {
    return this.http.post<ApiResponse<GeneratedApiKey>>(this.base, { name, expiresAt }).pipe(map(r => r.data));
  }

  revoke(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`).pipe(map(() => undefined));
  }
}
