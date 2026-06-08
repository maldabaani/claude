import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface CustomField {
  id: string;
  name: string;
  fieldKey: string;
  fieldType: 'TEXT' | 'DROPDOWN' | 'DATE' | 'CHECKBOX';
  options: string[];
  required: boolean;
  displayOrder: number;
}

@Injectable({ providedIn: 'root' })
export class CustomFieldService {
  private base = `${environment.apiUrl}/custom-fields`;

  constructor(private http: HttpClient) {}

  getFields(): Observable<CustomField[]> {
    return this.http.get<ApiResponse<CustomField[]>>(this.base).pipe(map(r => r.data));
  }

  createField(field: Partial<CustomField>): Observable<CustomField> {
    return this.http.post<ApiResponse<CustomField>>(this.base, field).pipe(map(r => r.data));
  }

  deleteField(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getValues(ticketId: string): Observable<Record<string, string>> {
    return this.http.get<ApiResponse<Record<string, string>>>(`${environment.apiUrl}/tickets/${ticketId}/custom-values`).pipe(map(r => r.data));
  }

  saveValues(ticketId: string, values: Record<string, string>): Observable<Record<string, string>> {
    return this.http.post<ApiResponse<Record<string, string>>>(`${environment.apiUrl}/tickets/${ticketId}/custom-values`, values).pipe(map(r => r.data));
  }
}
