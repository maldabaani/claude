import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, Notification, PageResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  unreadCount = signal(0);

  constructor(private http: HttpClient) {}

  getNotifications(page = 0, size = 20): Observable<PageResponse<Notification>> {
    return this.http.get<ApiResponse<PageResponse<Notification>>>(
      `${environment.apiUrl}/notifications`, { params: { page, size } }
    ).pipe(map(r => r.data));
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<ApiResponse<{ count: number }>>(
      `${environment.apiUrl}/notifications/unread-count`
    ).pipe(map(r => r.data.count));
  }

  markAllRead(): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/notifications/mark-all-read`, {});
  }

  refreshCount() {
    this.getUnreadCount().subscribe(count => this.unreadCount.set(count));
  }
}
