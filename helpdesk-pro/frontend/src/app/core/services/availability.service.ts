import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';

export type AvailabilityStatus = 'ONLINE' | 'BUSY' | 'AWAY' | 'OFFLINE';

export interface AgentAvailability {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  availabilityStatus: AvailabilityStatus;
  availabilityUpdatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private base = `${environment.apiUrl}/agents/availability`;

  myStatus = signal<AvailabilityStatus>('OFFLINE');
  allAgents = signal<AgentAvailability[]>([]);

  constructor(private http: HttpClient) {}

  loadMyStatus(): void {
    this.http.get<ApiResponse<AgentAvailability>>(`${this.base}/me`)
      .pipe(map(r => r.data))
      .subscribe(agent => this.myStatus.set(agent.availabilityStatus));
  }

  loadAllAgents(): void {
    this.http.get<ApiResponse<AgentAvailability[]>>(this.base)
      .pipe(map(r => r.data))
      .subscribe(agents => this.allAgents.set(agents));
  }

  updateStatus(status: AvailabilityStatus): Observable<AgentAvailability> {
    return this.http.put<ApiResponse<AgentAvailability>>(this.base, { status })
      .pipe(
        map(r => r.data),
        tap(agent => this.myStatus.set(agent.availabilityStatus))
      );
  }

  onlineCount(): number {
    return this.allAgents().filter(a => a.availabilityStatus === 'ONLINE').length;
  }

  statusColor(status: AvailabilityStatus): string {
    switch (status) {
      case 'ONLINE': return '#22C55E';
      case 'BUSY': return '#F59E0B';
      case 'AWAY': return '#94A3B8';
      case 'OFFLINE': return '#EF4444';
    }
  }

  statusLabel(status: AvailabilityStatus): string {
    switch (status) {
      case 'ONLINE': return 'Online';
      case 'BUSY': return 'Busy';
      case 'AWAY': return 'Away';
      case 'OFFLINE': return 'Offline';
    }
  }
}
