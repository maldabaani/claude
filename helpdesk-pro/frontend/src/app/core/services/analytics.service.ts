import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export interface DailyCount { date: string; count: number; }
export interface AgentStat { agentId: string; agentName: string; total: number; resolved: number; resolutionRate: number; }
export interface AnalyticsData {
  dailyCounts: DailyCount[];
  avgResolutionHours: number;
  totalTickets: number;
  resolvedTickets: number;
  resolutionRate: number;
  agentStats: AgentStat[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private base = `${environment.apiUrl}/analytics`;
  constructor(private http: HttpClient) {}
  getAnalytics(days = 30): Observable<AnalyticsData> {
    return this.http.get<ApiResponse<AnalyticsData>>(this.base, { params: { days } }).pipe(map(r => r.data));
  }
}
