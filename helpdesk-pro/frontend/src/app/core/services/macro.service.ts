import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface MacroAction {
  type: 'SET_STATUS' | 'ASSIGN_TO' | 'ADD_TAG' | 'ADD_COMMENT' | 'SET_PRIORITY';
  value: string;
}

export interface Macro {
  id: string;
  name: string;
  description?: string;
  actions: string;
  active: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MacroRequest {
  name: string;
  description?: string;
  actions: string;
}

@Injectable({ providedIn: 'root' })
export class MacroService {
  private base = `${environment.apiUrl}/macros`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Macro[]> {
    return this.http.get<ApiResponse<Macro[]>>(this.base).pipe(map(r => r.data));
  }

  create(data: MacroRequest): Observable<Macro> {
    return this.http.post<ApiResponse<Macro>>(this.base, data).pipe(map(r => r.data));
  }

  update(id: string, data: MacroRequest): Observable<Macro> {
    return this.http.put<ApiResponse<Macro>>(`${this.base}/${id}`, data).pipe(map(r => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  apply(macroId: string, ticketId: string): Observable<void> {
    return this.http.post<void>(`${this.base}/${macroId}/apply/${ticketId}`, {});
  }
}
