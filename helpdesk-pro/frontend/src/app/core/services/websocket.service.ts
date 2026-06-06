import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { Notification } from '../models';

declare const SockJS: any;
declare const Stomp: any;

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private client: any = null;
  notification$ = new Subject<Notification>();

  constructor(private auth: AuthService) {}

  connect() {
    const token = this.auth.getAccessToken();
    if (!token || this.client?.connected) return;

    const socket = new SockJS(environment.wsUrl);
    this.client = Stomp.over(socket);
    this.client.debug = null;
    this.client.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        const userId = this.auth.currentUser()?.userId;
        if (userId) {
          this.client.subscribe(`/user/${userId}/queue/notifications`, (msg: any) => {
            try {
              this.notification$.next(JSON.parse(msg.body));
            } catch {}
          });
        }
      },
      () => setTimeout(() => this.connect(), 5000)
    );
  }

  disconnect() {
    if (this.client?.connected) this.client.disconnect();
  }

  ngOnDestroy() {
    this.disconnect();
  }
}
