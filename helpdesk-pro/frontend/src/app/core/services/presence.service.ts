import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models';
import { WebSocketService } from './websocket.service';

export interface PresenceViewer {
  agentId: string;
  agentName: string;
  lastSeen?: string;
}

export interface PresenceUpdate {
  ticketId: string;
  viewers: PresenceViewer[];
}

@Injectable({ providedIn: 'root' })
export class PresenceService implements OnDestroy {
  private base = `${environment.apiUrl}/tickets`;
  presence$ = new Subject<PresenceUpdate>();
  private wsSubscription: any = null;

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService,
  ) {}

  join(ticketId: string): Observable<PresenceViewer[]> {
    return this.http
      .post<ApiResponse<PresenceViewer[]>>(`${this.base}/${ticketId}/presence/join`, {})
      .pipe(map(r => r.data));
  }

  leave(ticketId: string): Observable<PresenceViewer[]> {
    return this.http
      .post<ApiResponse<PresenceViewer[]>>(`${this.base}/${ticketId}/presence/leave`, {})
      .pipe(map(r => r.data));
  }

  getViewers(ticketId: string): Observable<PresenceViewer[]> {
    return this.http
      .get<ApiResponse<PresenceViewer[]>>(`${this.base}/${ticketId}/presence`)
      .pipe(map(r => r.data));
  }

  subscribeToTicket(ticketId: string): void {
    const client = (this.wsService as any).client;
    if (!client?.connected) return;
    this.wsSubscription = client.subscribe(
      `/topic/tickets/${ticketId}/presence`,
      (msg: any) => {
        try {
          const update: PresenceUpdate = JSON.parse(msg.body);
          this.presence$.next(update);
        } catch {}
      }
    );
  }

  unsubscribeFromTicket(): void {
    if (this.wsSubscription) {
      try { this.wsSubscription.unsubscribe(); } catch {}
      this.wsSubscription = null;
    }
  }

  ngOnDestroy() {
    this.unsubscribeFromTicket();
  }
}
