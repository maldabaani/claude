import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse, User, Role } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private base = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getUsers(role?: Role, page = 0, size = 20): Observable<PageResponse<User>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (role) params = params.set('role', role);
    return this.http.get<ApiResponse<PageResponse<User>>>(this.base, { params }).pipe(map(r => r.data));
  }

  getUser(id: string): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.base}/${id}`).pipe(map(r => r.data));
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.base}/${id}`, data).pipe(map(r => r.data));
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  getMe(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.base}/me`).pipe(map(r => r.data));
  }

  updateProfile(data: { fullName?: string; currentPassword?: string; newPassword?: string }): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.base}/me`, data).pipe(map(r => r.data));
  }
}
