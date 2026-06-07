import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models';

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedById: string;
  performedByName: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private base = `${environment.apiUrl}/audit-logs`;

  constructor(private http: HttpClient) {}

  getAuditLogs(filters: {
    entityType?: string; action?: string; actorId?: string;
    page?: number; size?: number;
  } = {}): Observable<PageResponse<AuditLog>> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => { if (v != null && v !== '') params = params.set(k, String(v)); });
    return this.http.get<ApiResponse<PageResponse<AuditLog>>>(this.base, { params }).pipe(map(r => r.data));
  }
}
