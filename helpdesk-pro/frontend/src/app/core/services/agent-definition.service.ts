import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface AgentDefinition {
  id: number;
  name: string;
  description?: string;
  triggerCategory: string;
  keywords: string[];
  capability: string;
  autoClose: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentDefinitionRequest {
  name: string;
  description?: string;
  triggerCategory: string;
  keywords: string[];
  capability: string;
  autoClose: boolean;
  active: boolean;
}

export interface AgentCapabilityOption {
  key: string;
  label: string;
  description?: string;
  hasHandler: boolean;
}

export interface AgentCapabilityRequest {
  key: string;
  label: string;
  description?: string;
}

@Injectable({ providedIn: 'root' })
export class AgentDefinitionService {
  private base = `${environment.apiUrl}/agent-definitions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<AgentDefinition[]> {
    return this.http.get<ApiResponse<AgentDefinition[]>>(this.base).pipe(map(r => r.data));
  }

  getCapabilities(): Observable<AgentCapabilityOption[]> {
    return this.http.get<ApiResponse<AgentCapabilityOption[]>>(`${this.base}/capabilities`).pipe(map(r => r.data));
  }

  createCapability(data: AgentCapabilityRequest): Observable<AgentCapabilityOption> {
    return this.http.post<ApiResponse<AgentCapabilityOption>>(`${this.base}/capabilities`, data).pipe(map(r => r.data));
  }

  getCategories(): Observable<string[]> {
    return this.http.get<ApiResponse<string[]>>(`${this.base}/categories`).pipe(map(r => r.data));
  }

  create(data: AgentDefinitionRequest): Observable<AgentDefinition> {
    return this.http.post<ApiResponse<AgentDefinition>>(this.base, data).pipe(map(r => r.data));
  }

  update(id: number, data: AgentDefinitionRequest): Observable<AgentDefinition> {
    return this.http.put<ApiResponse<AgentDefinition>>(`${this.base}/${id}`, data).pipe(map(r => r.data));
  }

  toggle(id: number): Observable<AgentDefinition> {
    return this.http.patch<ApiResponse<AgentDefinition>>(`${this.base}/${id}/toggle`, {}).pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`).pipe(map(() => undefined));
  }
}
