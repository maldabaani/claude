import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface Tag {
  id: string;
  name: string;
  color: string;
  usageCount: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class TagService {
  private base = `${environment.apiUrl}/tags`;

  constructor(private http: HttpClient) {}

  getAllTags(): Observable<Tag[]> {
    return this.http.get<ApiResponse<Tag[]>>(this.base).pipe(map(r => r.data));
  }

  searchTags(q: string): Observable<Tag[]> {
    const params = new HttpParams().set('q', q);
    return this.http.get<ApiResponse<Tag[]>>(`${this.base}/search`, { params }).pipe(map(r => r.data));
  }

  createTag(name: string, color: string): Observable<Tag> {
    return this.http.post<ApiResponse<Tag>>(this.base, { name, color }).pipe(map(r => r.data));
  }

  updateTag(id: string, name: string, color: string): Observable<Tag> {
    return this.http.put<ApiResponse<Tag>>(`${this.base}/${id}`, { name, color }).pipe(map(r => r.data));
  }

  deleteTag(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  mergeTag(sourceId: string, targetTagId: string): Observable<Tag> {
    return this.http.post<ApiResponse<Tag>>(`${this.base}/${sourceId}/merge`, { targetTagId }).pipe(map(r => r.data));
  }

  setTicketTags(ticketId: string, tagIds: string[]): Observable<Tag[]> {
    return this.http.put<ApiResponse<Tag[]>>(`${environment.apiUrl}/tickets/${ticketId}/tags`, { tagIds }).pipe(map(r => r.data));
  }

  getTicketTags(ticketId: string): Observable<Tag[]> {
    return this.http.get<ApiResponse<Tag[]>>(`${environment.apiUrl}/tickets/${ticketId}/tags`).pipe(map(r => r.data));
  }
}
