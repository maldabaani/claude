import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface TenantResponse {
  id: string;
  name: string;
  dbName: string;
  adminEmail: string;
  active: boolean;
  createdAt: string;
}

export interface CreateTenantRequest {
  name: string;
  dbName: string;
  adminEmail: string;
  adminPassword: string;
}

@Injectable({ providedIn: 'root' })
export class PlatformService {
  private readonly BASE = '/api/v1/platform';

  constructor(private http: HttpClient) {}

  listTenants(): Observable<TenantResponse[]> {
    return this.http.get<TenantResponse[]>(`${this.BASE}/tenants`);
  }

  createTenant(req: CreateTenantRequest): Observable<TenantResponse> {
    return this.http.post<TenantResponse>(`${this.BASE}/tenants`, req);
  }

  getTenant(id: string): Observable<TenantResponse> {
    return this.http.get<TenantResponse>(`${this.BASE}/tenants/${id}`);
  }
}
