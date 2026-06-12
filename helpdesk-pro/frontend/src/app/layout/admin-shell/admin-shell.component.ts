import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule,
    ButtonModule, MenuModule, TooltipModule, InputTextModule],
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
            <i class="pi pi-cog text-white" style="font-size:17px"></i>
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
             [pTooltip]="collapsed() ? item.label : ''"
             tooltipPosition="right">
            <i [class]="'pi ' + item.icon + ' shrink-0'" style="font-size:18px"></i>
            <span *ngIf="!collapsed()" class="truncate">{{ item.label }}</span>
          </a>
        </nav>

        <!-- User area -->
        <div style="border-top:1px solid rgba(255,255,255,0.07)" class="p-3">
          <button (click)="sideMenu.toggle($event)" class="w-full flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-white/5"
                  [class.justify-center]="collapsed()">
            <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                 style="background:linear-gradient(135deg,#6366F1,#4F46E5)">A</div>
            <div *ngIf="!collapsed()" class="flex-1 min-w-0 text-left">
              <p class="text-white text-xs font-semibold truncate">Administrator</p>
              <p class="text-slate-500 text-xs truncate">admin&#64;helpdesk.com</p>
            </div>
            <i *ngIf="!collapsed()" class="pi pi-sort-alt text-slate-600 shrink-0" style="font-size:14px"></i>
          </button>
          <p-menu #sideMenu [model]="sideMenuItems" [popup]="true" />
        </div>

        <!-- Collapse toggle -->
        <button (click)="toggleCollapsed()"
                class="flex items-center justify-center h-9 transition-colors hover:bg-white/5"
                style="border-top:1px solid rgba(255,255,255,0.07);color:#475569">
          <i [class]="'pi ' + (collapsed() ? 'pi-chevron-right' : 'pi-chevron-left')" style="font-size:16px"></i>
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

          <!-- Search bar -->
          <div class="flex-1 max-w-md mx-6">
            <div class="relative">
              <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style="font-size:14px"></i>
              <input pInputText [ngModel]="searchQuery()" (ngModelChange)="onSearch($event)"
                     placeholder="Search tickets..."
                     class="w-full pl-9 text-sm" style="height:36px;border-radius:8px" />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button (click)="themeService.toggle()"
                    class="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                    title="Toggle dark mode">
              <i [class]="'pi ' + (themeService.isDark() ? 'pi-sun' : 'pi-moon')" style="font-size:18px"></i>
            </button>
            <button (click)="topMenu.toggle($event)" class="flex items-center gap-2 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
              <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                   style="background:linear-gradient(135deg,#6366F1,#4F46E5)">A</div>
              <span class="text-sm font-semibold text-gray-700">Admin</span>
              <i class="pi pi-chevron-down text-gray-400" style="font-size:12px"></i>
            </button>
            <p-menu #topMenu [model]="topMenuItems" [popup]="true" />
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
  searchQuery = signal('');
  private searchTimeout: any;

  navItems = [
    { path: '/admin', icon: 'pi-th-large', label: 'Overview', exact: true },
    { path: '/admin/tickets', icon: 'pi-ticket', label: 'Tickets', exact: false },
    { path: '/admin/users', icon: 'pi-users', label: 'Users', exact: false },
    { path: '/admin/departments', icon: 'pi-building', label: 'Departments', exact: false },
    { path: '/admin/sla', icon: 'pi-stopwatch', label: 'SLA Policies', exact: false },
    { path: '/admin/canned', icon: 'pi-bookmark', label: 'Canned Responses', exact: false },
    { path: '/admin/analytics', icon: 'pi-chart-line', label: 'Analytics', exact: false },
    { path: '/admin/kb', icon: 'pi-book', label: 'Knowledge Base', exact: false },
    { path: '/admin/audit', icon: 'pi-list', label: 'Audit Log', exact: false },
    { path: '/admin/custom-fields', icon: 'pi-sliders-h', label: 'Custom Fields', exact: false },
    { path: '/admin/sla-rules', icon: 'pi-clock', label: 'SLA Rules', exact: false },
    { path: '/admin/templates', icon: 'pi-file', label: 'Templates', exact: false },
    { path: '/admin/webhooks', icon: 'pi-link', label: 'Webhooks', exact: false },
    { path: '/admin/api-keys', icon: 'pi-key', label: 'API Keys', exact: false },
    { path: '/admin/help-topics', icon: 'pi-tags', label: 'Help Topics', exact: false },
    { path: '/admin/email-inboxes', icon: 'pi-inbox', label: 'Email Inboxes', exact: false },
    { path: '/admin/organizations', icon: 'pi-building', label: 'Organizations', exact: false },
    { path: '/admin/issues', icon: 'pi-exclamation-circle', label: 'Issues', exact: false },
    { path: '/admin/tags', icon: 'pi-tag', label: 'Tags', exact: false },
    { path: '/admin/business-hours', icon: 'pi-calendar', label: 'Business Hours', exact: false },
    { path: '/admin/agent-performance', icon: 'pi-chart-bar', label: 'Performance', exact: false },
        { path: '/admin/macros', icon: 'pi-bolt', label: 'Macros', exact: false },
        { path: '/admin/teams', icon: 'pi-users', label: 'Teams', exact: false },
        { path: '/admin/nps', icon: 'pi-heart', label: 'NPS', exact: false },
        { path: '/admin/automation-rules', icon: 'pi-bolt', label: 'Automation Rules', exact: false },
        { path: '/admin/automation-rules', icon: 'pi-bolt', label: 'Automation Rules', exact: false },
        { path: '/admin/settings', icon: 'pi-cog', label: 'Settings', exact: false },
  ];

  sideMenuItems: MenuItem[] = [
    { label: 'Profile', icon: 'pi pi-user', routerLink: '/profile' },
    { separator: true },
    { label: 'Sign out', icon: 'pi pi-sign-out', command: () => this.auth.logout() }
  ];

  topMenuItems: MenuItem[] = [
    { label: 'Administrator', disabled: true, styleClass: 'font-semibold text-gray-900' },
    { separator: true },
    { label: 'Profile', icon: 'pi pi-user', routerLink: '/profile' },
    { separator: true },
    { label: 'Sign out', icon: 'pi pi-sign-out', command: () => this.auth.logout() }
  ];

  constructor(public auth: AuthService, public themeService: ThemeService, private router: Router) {}

  toggleCollapsed() { this.collapsed.update(v => !v); }

  onSearch(query: string) {
    this.searchQuery.set(query);
    clearTimeout(this.searchTimeout);
    if (!query.trim()) return;
    this.searchTimeout = setTimeout(() => {
      this.router.navigate(['/admin/tickets'], { queryParams: { search: query } });
    }, 400);
  }
}
