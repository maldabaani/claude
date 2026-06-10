import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface NotificationPreference {
  id: string;
  userId: string;
  eventType: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

const EVENT_LABELS: Record<string, string> = {
  TICKET_CREATED: 'Ticket Created',
  TICKET_ASSIGNED: 'Ticket Assigned to Me',
  STATUS_CHANGED: 'Ticket Status Changed',
  COMMENT_ADDED: 'New Comment / Reply',
  SLA_BREACHED: 'SLA Breached',
};

@Injectable({ providedIn: 'root' })
export class NotificationPreferenceService {
  private base = `${environment.apiUrl}/notification-preferences`;

  readonly eventLabels = EVENT_LABELS;

  constructor(private http: HttpClient) {}

  getAll(): Observable<NotificationPreference[]> {
    return this.http.get<ApiResponse<NotificationPreference[]>>(this.base).pipe(
      map(r => r.data ?? [])
    );
  }

  update(eventType: string, emailEnabled: boolean, inAppEnabled: boolean): Observable<NotificationPreference> {
    return this.http.put<ApiResponse<NotificationPreference>>(`${this.base}/${eventType}`, { emailEnabled, inAppEnabled }).pipe(
      map(r => r.data)
    );
  }
}
