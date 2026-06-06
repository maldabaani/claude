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
    <div class="flex h-screen overflow-hidden bg-[var(--color-surface-2)]">
      <aside class="flex flex-col transition-all duration-300 bg-[#0F172A] text-white"
             [class.w-64]="!collapsed()" [class.w-16]="collapsed()">
        <div class="flex items-center px-4 h-16 border-b border-white/10">
          <mat-icon class="text-blue-400 shrink-0">admin_panel_settings</mat-icon>
          <span *ngIf="!collapsed()" class="ml-3 font-heading font-semibold text-lg">Admin Panel</span>
        </div>

        <nav class="flex-1 py-4 overflow-y-auto space-y-0.5">
          <a *ngFor="let item of navItems" [routerLink]="item.path" routerLinkActive="bg-white/10 text-blue-400"
             [routerLinkActiveOptions]="{exact: item.exact}"
             class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
             [matTooltip]="collapsed() ? item.label : ''" matTooltipPosition="right">
            <mat-icon class="shrink-0 text-xl">{{ item.icon }}</mat-icon>
            <span *ngIf="!collapsed()" class="text-sm font-medium">{{ item.label }}</span>
          </a>
        </nav>

        <button (click)="collapsed.update(v => !v)"
                class="flex items-center justify-center h-12 border-t border-white/10 text-slate-400 hover:text-white">
          <mat-icon>{{ collapsed() ? 'chevron_right' : 'chevron_left' }}</mat-icon>
        </button>
      </aside>

      <div class="flex flex-col flex-1 overflow-hidden">
        <header class="flex items-center justify-between px-6 h-16 bg-white border-b border-gray-200 shrink-0">
          <h1 class="font-heading font-semibold text-gray-900 text-lg">Administration</h1>
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item (click)="auth.logout()">
              <mat-icon>logout</mat-icon> Logout
            </button>
          </mat-menu>
        </header>

        <main class="flex-1 overflow-auto p-6">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
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
}
