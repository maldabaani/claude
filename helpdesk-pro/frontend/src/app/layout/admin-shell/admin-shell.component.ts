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
    <div class="flex h-screen overflow-hidden" style="background:#F8FAFC">

      <!-- ── Sidebar ── -->
      <aside class="flex flex-col shrink-0 relative z-20 transition-all duration-300 ease-in-out"
             style="background:#0F172A"
             [style.width]="collapsed() ? '64px' : '240px'">

        <!-- Logo area -->
        <div class="flex items-center h-16 shrink-0 overflow-hidden px-4"
             style="border-bottom:1px solid rgba(255,255,255,0.07)"
             [class.justify-center]="collapsed()">
          <div class="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
               style="background:linear-gradient(135deg,#6366F1,#4F46E5)">
            <mat-icon class="text-white" style="font-size:17px;width:17px;height:17px">admin_panel_settings</mat-icon>
          </div>
          <div *ngIf="!collapsed()" class="ml-2.5 overflow-hidden">
            <p class="text-white font-bold text-sm whitespace-nowrap" style="letter-spacing:-0.02em">Admin Panel</p>
            <p class="text-slate-500 text-xs whitespace-nowrap">HelpDesk Pro</p>
          </div>
        </div>

        <!-- Nav section label -->
        <div *ngIf="!collapsed()" class="px-4 pt-5 pb-1.5">
          <p class="text-slate-600 text-[10px] font-bold uppercase tracking-[0.1em]">Main Menu</p>
        </div>

        <!-- Nav items -->
        <nav class="flex-1 py-1.5 overflow-y-auto">
          <a *ngFor="let item of navItems"
             [routerLink]="item.path"
             routerLinkActive="nav-active"
             [routerLinkActiveOptions]="{exact: item.exact}"
             class="sidebar-nav-item"
             [class.justify-center]="collapsed()"
             [matTooltip]="collapsed() ? item.label : ''"
             matTooltipPosition="right">
            <mat-icon class="shrink-0" style="font-size:18px;width:18px;height:18px">{{ item.icon }}</mat-icon>
            <span *ngIf="!collapsed()" class="truncate">{{ item.label }}</span>
          </a>
        </nav>

        <!-- User area -->
        <div style="border-top:1px solid rgba(255,255,255,0.07)" class="p-3">
          <button [matMenuTriggerFor]="userMenu" class="w-full flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-white/5"
                  [class.justify-center]="collapsed()">
            <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                 style="background:linear-gradient(135deg,#6366F1,#4F46E5)">A</div>
            <div *ngIf="!collapsed()" class="flex-1 min-w-0 text-left">
              <p class="text-white text-xs font-semibold truncate">Administrator</p>
              <p class="text-slate-500 text-xs truncate">admin&#64;helpdesk.com</p>
            </div>
            <mat-icon *ngIf="!collapsed()" class="text-slate-600 shrink-0" style="font-size:14px;width:14px;height:14px">unfold_more</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item (click)="auth.logout()">
              <mat-icon>logout</mat-icon>
              <span>Sign out</span>
            </button>
          </mat-menu>
        </div>

        <!-- Collapse toggle -->
        <button (click)="toggleCollapsed()"
                class="flex items-center justify-center h-9 transition-colors hover:bg-white/5"
                style="border-top:1px solid rgba(255,255,255,0.07);color:#475569">
          <mat-icon style="font-size:16px;width:16px;height:16px">
            {{ collapsed() ? 'chevron_right' : 'chevron_left' }}
          </mat-icon>
        </button>
      </aside>

      <!-- ── Main ── -->
      <div class="flex flex-col flex-1 overflow-hidden min-w-0">

        <!-- Header -->
        <header class="flex items-center justify-between px-6 shrink-0 bg-white"
                style="height:64px;border-bottom:1px solid #E2E8F0;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
          <div class="flex items-center gap-3">
            <div class="w-2 h-2 rounded-full bg-indigo-500"></div>
            <span class="font-bold text-gray-900 text-sm" style="letter-spacing:-0.01em">Administration</span>
          </div>

          <div class="flex items-center gap-2">
            <button mat-button [matMenuTriggerFor]="topUserMenu" class="!rounded-lg !px-3">
              <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                     style="background:linear-gradient(135deg,#6366F1,#4F46E5)">A</div>
                <span class="text-sm font-semibold text-gray-700">Admin</span>
                <mat-icon class="text-gray-400 !text-sm">expand_more</mat-icon>
              </div>
            </button>
            <mat-menu #topUserMenu="matMenu">
              <div class="px-4 py-3" style="border-bottom:1px solid #F1F5F9">
                <p class="text-xs text-gray-400 font-medium">Signed in as</p>
                <p class="text-sm font-semibold text-gray-900 mt-0.5">Administrator</p>
              </div>
              <button mat-menu-item (click)="auth.logout()">
                <mat-icon class="text-gray-500">logout</mat-icon>
                <span>Sign out</span>
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
  styles: [`
    .sidebar-nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      margin: 2px 8px;
      border-radius: 8px;
      font-size: 13.5px;
      font-weight: 500;
      color: rgba(100, 116, 139, 1);
      cursor: pointer;
      transition: all 0.15s ease;
      text-decoration: none;
      white-space: nowrap;
      overflow: hidden;
      border: 1px solid transparent;
    }
    .sidebar-nav-item:hover {
      color: #e2e8f0;
      background: rgba(255,255,255,0.07);
    }
    :host ::ng-deep .nav-active {
      color: #93C5FD !important;
      background: rgba(37,99,235,0.18) !important;
      border-color: rgba(37,99,235,0.3) !important;
    }
  `],
})
export class AdminShellComponent {
  collapsed = signal(false);

  navItems = [
    { path: '/admin', icon: 'grid_view', label: 'Overview', exact: true },
    { path: '/admin/tickets', icon: 'confirmation_number', label: 'Tickets', exact: false },
    { path: '/admin/users', icon: 'group', label: 'Users', exact: false },
    { path: '/admin/departments', icon: 'business', label: 'Departments', exact: false },
    { path: '/admin/sla', icon: 'timer', label: 'SLA Policies', exact: false },
    { path: '/admin/settings', icon: 'settings', label: 'Settings', exact: false },
  ];

  constructor(public auth: AuthService) {}

  toggleCollapsed() { this.collapsed.update(v => !v); }
}
