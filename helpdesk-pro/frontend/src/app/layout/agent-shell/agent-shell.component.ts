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
    <div class="flex h-screen overflow-hidden" style="background:#F1F5F9">
      <!-- Sidebar -->
      <aside class="flex flex-col transition-all duration-300 ease-in-out shrink-0 relative z-20"
             style="background:#0F172A;color:white"
             [style.width]="collapsed() ? '64px' : '240px'">
        <!-- Logo -->
        <div class="flex items-center h-16 border-b shrink-0 overflow-hidden"
             style="border-color:rgba(255,255,255,0.08)"
             [class.px-4]="!collapsed()" [class.justify-center]="collapsed()" [class.px-0]="collapsed()">
          <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
            <mat-icon class="text-white" style="font-size:18px;width:18px;height:18px">support_agent</mat-icon>
          </div>
          <span *ngIf="!collapsed()" class="ml-2.5 font-heading font-bold text-white text-base tracking-tight whitespace-nowrap">HelpDesk Pro</span>
        </div>

        <!-- Nav -->
        <nav class="flex-1 py-3 overflow-y-auto space-y-0.5">
          <a *ngFor="let item of navItems"
             [routerLink]="item.path"
             routerLinkActive="active-nav-item"
             class="nav-item flex items-center gap-3 py-2.5 mx-2 rounded-lg text-slate-400 hover:text-white transition-all duration-150 relative group"
             [class.px-3]="!collapsed()" [class.justify-center]="collapsed()" [class.px-0]="collapsed()"
             [matTooltip]="collapsed() ? item.label : ''" matTooltipPosition="right">
            <mat-icon class="shrink-0 transition-colors" style="font-size:20px;width:20px;height:20px">{{ item.icon }}</mat-icon>
            <span *ngIf="!collapsed()" class="text-sm font-medium whitespace-nowrap">{{ item.label }}</span>
          </a>
        </nav>

        <!-- User info at bottom -->
        <div *ngIf="!collapsed()" class="px-3 pb-3">
          <div class="flex items-center gap-2.5 px-3 py-2.5 rounded-lg" style="background:rgba(255,255,255,0.06)">
            <div class="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {{ initials() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-white truncate">Agent</p>
            </div>
          </div>
        </div>

        <!-- Collapse toggle -->
        <button (click)="toggleCollapsed()"
                class="flex items-center justify-center h-11 border-t shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
                style="border-color:rgba(255,255,255,0.08)">
          <mat-icon style="font-size:18px;width:18px;height:18px">{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>
      </aside>

      <!-- Main -->
      <div class="flex flex-col flex-1 overflow-hidden min-w-0">
        <!-- Header -->
        <header class="flex items-center justify-between px-6 h-16 bg-white border-b border-gray-200/80 shrink-0 shadow-sm">
          <div class="flex items-center gap-2 text-sm text-gray-500">
            <span class="font-heading font-semibold text-gray-900 text-base">Agent Portal</span>
          </div>

          <div class="flex items-center gap-2">
            <!-- Notification bell -->
            <button mat-icon-button [matMenuTriggerFor]="notifMenu" class="relative"
                    [matBadge]="notifService.unreadCount() || null" matBadgeColor="warn" matBadgeSize="small">
              <mat-icon class="text-gray-500" style="font-size:20px">notifications_none</mat-icon>
            </button>
            <mat-menu #notifMenu="matMenu">
              <div class="px-4 py-3 border-b border-gray-100">
                <p class="font-semibold text-sm text-gray-900">Notifications</p>
              </div>
              <div class="px-4 py-8 text-center">
                <mat-icon class="text-gray-300 mb-2" style="font-size:32px;width:32px;height:32px">notifications_off</mat-icon>
                <p class="text-sm text-gray-400">No new notifications</p>
              </div>
            </mat-menu>

            <!-- Divider -->
            <div class="w-px h-6 bg-gray-200 mx-1"></div>

            <!-- User menu -->
            <button mat-button [matMenuTriggerFor]="userMenu" class="!rounded-lg !px-2">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {{ initials() }}
                </div>
                <mat-icon class="text-gray-400 !text-base">expand_more</mat-icon>
              </div>
            </button>
            <mat-menu #userMenu="matMenu">
              <div class="px-4 py-3 border-b border-gray-100">
                <p class="text-xs text-gray-400 font-medium">Signed in as</p>
                <p class="text-sm font-semibold text-gray-900 mt-0.5">Agent</p>
              </div>
              <button mat-menu-item (click)="auth.logout()">
                <mat-icon class="text-gray-500">logout</mat-icon>
                <span>Sign out</span>
              </button>
            </mat-menu>
          </div>
        </header>

        <!-- Content -->
        <main class="flex-1 overflow-auto px-6 py-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .nav-item { color: rgba(148, 163, 184, 1); }
    .nav-item:hover { color: white; background: rgba(255,255,255,0.07); }
    :host ::ng-deep .active-nav-item {
      color: #60A5FA !important;
      background: rgba(96, 165, 250, 0.12) !important;
      border-left: 2px solid #3B82F6;
      padding-left: calc(0.75rem - 2px) !important;
    }
  `],
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
