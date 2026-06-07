import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface SavedView {
  id: string;
  name: string;
  filterJson: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SavedViewService {
  private base = `${environment.apiUrl}/saved-views`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SavedView[]> {
    return this.http.get<ApiResponse<SavedView[]>>(this.base).pipe(map(r => r.data));
  }

  create(name: string, filterJson: string): Observable<SavedView> {
    return this.http.post<ApiResponse<SavedView>>(this.base, { name, filterJson }).pipe(map(r => r.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
