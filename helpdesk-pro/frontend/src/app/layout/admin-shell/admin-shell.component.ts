import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule,
    MatIconModule, MatButtonModule, MatMenuModule, MatTooltipModule],
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
          <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <mat-icon class="text-white" style="font-size:18px;width:18px;height:18px">admin_panel_settings</mat-icon>
          </div>
          <span *ngIf="!collapsed()" class="ml-2.5 font-heading font-bold text-white text-base tracking-tight whitespace-nowrap">Admin Panel</span>
        </div>

        <!-- Nav section label -->
        <div *ngIf="!collapsed()" class="px-4 pt-4 pb-1">
          <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Navigation</p>
        </div>

        <!-- Nav -->
        <nav class="flex-1 py-1 overflow-y-auto space-y-0.5">
          <a *ngFor="let item of navItems"
             [routerLink]="item.path"
             routerLinkActive="active-nav-item"
             [routerLinkActiveOptions]="{exact: item.exact}"
             class="admin-nav-item flex items-center gap-3 py-2.5 mx-2 rounded-lg transition-all duration-150 relative"
             [class.px-3]="!collapsed()" [class.justify-center]="collapsed()" [class.px-0]="collapsed()"
             [matTooltip]="collapsed() ? item.label : ''" matTooltipPosition="right">
            <mat-icon class="shrink-0 transition-colors" style="font-size:19px;width:19px;height:19px">{{ item.icon }}</mat-icon>
            <span *ngIf="!collapsed()" class="text-sm font-medium whitespace-nowrap">{{ item.label }}</span>
          </a>
        </nav>

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
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span class="font-heading font-semibold text-gray-900 text-base">Administration</span>
          </div>

          <div class="flex items-center gap-2">
            <button mat-button [matMenuTriggerFor]="userMenu" class="!rounded-lg !px-3 !py-1">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                  A
                </div>
                <span class="text-sm font-medium text-gray-700">Admin</span>
                <mat-icon class="text-gray-400 !text-base">expand_more</mat-icon>
              </div>
            </button>
            <mat-menu #userMenu="matMenu">
              <div class="px-4 py-3 border-b border-gray-100">
                <p class="text-xs text-gray-400 font-medium">Administrator</p>
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
    .admin-nav-item { color: rgba(148, 163, 184, 1); }
    .admin-nav-item:hover { color: white; background: rgba(255,255,255,0.07); }
    :host ::ng-deep .active-nav-item {
      color: #818CF8 !important;
      background: rgba(129, 140, 248, 0.12) !important;
      border-left: 2px solid #6366F1;
      padding-left: calc(0.75rem - 2px) !important;
    }
  `],
})
export class AdminShellComponent {
  collapsed = signal(false);

  navItems = [
    { path: '/admin', icon: 'dashboard', label: 'Overview', exact: true },
    { path: '/admin/tickets', icon: 'confirmation_number', label: 'Tickets', exact: false },
    { path: '/admin/users', icon: 'group', label: 'Users', exact: false },
    { path: '/admin/departments', icon: 'business', label: 'Departments', exact: false },
    { path: '/admin/sla', icon: 'timer', label: 'SLA Policies', exact: false },
    { path: '/admin/settings', icon: 'settings', label: 'Settings', exact: false },
  ];

  constructor(public auth: AuthService) {}

  toggleCollapsed() { this.collapsed.update(v => !v); }
}
