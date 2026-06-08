import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, User } from '../models';

export interface Organization {
  id: string;
  name: string;
  domain?: string;
  phone?: string;
  address?: string;
  notes?: string;
  memberCount: number;
}

@Injectable({ providedIn: 'root' })
export class OrganizationService {
  private base = `${environment.apiUrl}/organizations`;

  constructor(private http: HttpClient) {}

  getOrganizations(search?: string): Observable<Organization[]> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    return this.http.get<ApiResponse<Organization[]>>(this.base, { params }).pipe(map(r => r.data));
  }

  createOrganization(data: Partial<Organization>): Observable<Organization> {
    return this.http.post<ApiResponse<Organization>>(this.base, data).pipe(map(r => r.data));
  }

  updateOrganization(id: string, data: Partial<Organization>): Observable<Organization> {
    return this.http.put<ApiResponse<Organization>>(`${this.base}/${id}`, data).pipe(map(r => r.data));
  }

  deleteOrganization(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`).pipe(map(() => undefined));
  }

  getMembers(orgId: string): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${this.base}/${orgId}/members`).pipe(map(r => r.data));
  }

  addMember(orgId: string, userId: string): Observable<void> {
    return this.http.post<ApiResponse<void>>(`${this.base}/${orgId}/members`, { userId }).pipe(map(() => undefined));
  }

  removeMember(orgId: string, userId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${orgId}/members/${userId}`).pipe(map(() => undefined));
  }
}
