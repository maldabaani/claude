import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, Department, PageResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private base = `${environment.apiUrl}/departments`;

  constructor(private http: HttpClient) {}

  getDepartments(): Observable<PageResponse<Department>> {
    return this.http.get<ApiResponse<PageResponse<Department>>>(this.base).pipe(map(r => r.data));
  }

  createDepartment(data: Partial<Department>): Observable<Department> {
    return this.http.post<ApiResponse<Department>>(this.base, data).pipe(map(r => r.data));
  }

  updateDepartment(id: string, data: Partial<Department>): Observable<Department> {
    return this.http.put<ApiResponse<Department>>(`${this.base}/${id}`, data).pipe(map(r => r.data));
  }

  deleteDepartment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
