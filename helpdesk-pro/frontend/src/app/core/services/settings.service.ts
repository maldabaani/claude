import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface AppSettings {
  companyName: string;
  supportEmail: string;
  notifyTicketCreated: boolean;
  notifyCommentAdded: boolean;
  notifyStatusChanged: boolean;
  notifyTicketAssigned: boolean;
  notifySlaBreached: boolean;
  autoAssignTickets: boolean;
  businessHoursStart: string;
  businessHoursEnd: string;
  businessDays: string;
  businessTimezone: string;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private base = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) {}

  getSettings(): Observable<AppSettings> {
    return this.http.get<ApiResponse<AppSettings>>(this.base).pipe(map(r => r.data));
  }

  updateSettings(data: Partial<AppSettings>): Observable<AppSettings> {
    return this.http.put<ApiResponse<AppSettings>>(this.base, data).pipe(map(r => r.data));
  }
}
