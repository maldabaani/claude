import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-agent-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule,
    MatIconModule, MatBadgeModule, MatMenuModule, MatButtonModule, MatTooltipModule],
  template: `
    <div class="flex h-screen overflow-hidden bg-[var(--color-surface-2)]">
      <!-- Sidebar -->
      <aside class="flex flex-col transition-all duration-300 bg-[#0F172A] text-white"
             [class.w-64]="!collapsed()" [class.w-16]="collapsed()">
        <!-- Logo -->
        <div class="flex items-center px-4 h-16 border-b border-white/10">
          <mat-icon class="text-blue-400 text-2xl shrink-0">support_agent</mat-icon>
          <span *ngIf="!collapsed()" class="ml-3 font-heading font-semibold text-lg tracking-tight">HelpDesk Pro</span>
        </div>

        <!-- Nav -->
        <nav class="flex-1 py-4 overflow-y-auto">
          <a *ngFor="let item of navItems" [routerLink]="item.path" routerLinkActive="bg-white/10 text-blue-400"
             class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
             [matTooltip]="collapsed() ? item.label : ''" matTooltipPosition="right">
            <mat-icon class="shrink-0 text-xl">{{ item.icon }}</mat-icon>
            <span *ngIf="!collapsed()" class="text-sm font-medium">{{ item.label }}</span>
          </a>
        </nav>

        <!-- Collapse toggle -->
        <button (click)="toggleCollapsed()"
                class="flex items-center justify-center h-12 border-t border-white/10 text-slate-400 hover:text-white transition-colors">
          <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>
      </aside>

      <!-- Main -->
      <div class="flex flex-col flex-1 overflow-hidden">
        <!-- Header -->
        <header class="flex items-center justify-between px-6 h-16 bg-white border-b border-gray-200 shrink-0">
          <h1 class="font-heading font-semibold text-gray-900 text-lg">Agent Dashboard</h1>
          <div class="flex items-center gap-3">
            <!-- Notification bell -->
            <button mat-icon-button [matMenuTriggerFor]="notifMenu"
                    [matBadge]="notifService.unreadCount() || null" matBadgeColor="warn" matBadgeSize="small">
              <mat-icon>notifications</mat-icon>
            </button>
            <mat-menu #notifMenu="matMenu" class="w-80">
              <div class="px-4 py-3 border-b font-medium text-sm text-gray-700">Notifications</div>
              <p class="px-4 py-6 text-center text-sm text-gray-400">No new notifications</p>
            </mat-menu>

            <!-- User menu -->
            <button mat-icon-button [matMenuTriggerFor]="userMenu">
              <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                {{ initials() }}
              </div>
            </button>
            <mat-menu #userMenu="matMenu">
              <button mat-menu-item (click)="auth.logout()">
                <mat-icon>logout</mat-icon> Logout
              </button>
            </mat-menu>
          </div>
        </header>

        <!-- Content -->
        <main class="flex-1 overflow-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class AgentShellComponent implements OnInit {
  collapsed = signal(false);

  navItems = [
    { path: '/agent', icon: 'dashboard', label: 'Dashboard' },
    { path: '/agent/queue', icon: 'inbox', label: 'Ticket Queue' },
  ];

  constructor(
    public auth: AuthService,
    public notifService: NotificationService,
    private ws: WebSocketService,
  ) {}

  ngOnInit() {
    this.ws.connect();
    this.notifService.refreshCount();
    this.ws.notification$.subscribe(() => this.notifService.refreshCount());
  }

  toggleCollapsed() { this.collapsed.update(v => !v); }

  initials() {
    const name = this.auth.currentUser()?.fullName || this.auth.currentUser()?.email || '?';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
