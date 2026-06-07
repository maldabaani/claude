import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { BadgeModule } from 'primeng/badge';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { WebSocketService } from '../../core/services/websocket.service';

@Component({
  selector: 'app-agent-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, FormsModule,
    ButtonModule, MenuModule, BadgeModule, TooltipModule, InputTextModule],
  template: `
    <div class="flex h-screen overflow-hidden" style="background:#F8FAFC">

      <!-- ── Sidebar ── -->
      <aside class="flex flex-col shrink-0 relative z-20 transition-all duration-300 ease-in-out"
             style="background:#0F172A"
             [style.width]="collapsed() ? '64px' : '240px'">

        <!-- Logo -->
        <div class="flex items-center h-16 shrink-0 overflow-hidden px-4"
             style="border-bottom:1px solid rgba(255,255,255,0.07)"
             [class.justify-center]="collapsed()">
          <div class="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center"
               style="background:linear-gradient(135deg,#2563EB,#1D4ED8)">
            <i class="pi pi-headphones text-white" style="font-size:17px"></i>
          </div>
          <div *ngIf="!collapsed()" class="ml-2.5 overflow-hidden">
            <p class="text-white font-bold text-sm whitespace-nowrap" style="letter-spacing:-0.02em">HelpDesk Pro</p>
            <p class="text-slate-500 text-xs whitespace-nowrap">Agent Portal</p>
          </div>
        </div>

        <!-- Nav section label -->
        <div *ngIf="!collapsed()" class="px-4 pt-5 pb-1.5">
          <p class="text-slate-600 text-[10px] font-bold uppercase tracking-[0.1em]">Workspace</p>
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
          <button (click)="sideUserMenu.toggle($event)" class="w-full flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-white/5"
                  [class.justify-center]="collapsed()">
            <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                 style="background:linear-gradient(135deg,#2563EB,#1D4ED8)">
              {{ initials() }}
            </div>
            <div *ngIf="!collapsed()" class="flex-1 min-w-0 text-left">
              <p class="text-white text-xs font-semibold truncate">{{ displayName() }}</p>
              <p class="text-slate-500 text-xs">Agent</p>
            </div>
            <i *ngIf="!collapsed()" class="pi pi-sort-alt text-slate-600 shrink-0" style="font-size:14px"></i>
          </button>
          <p-menu #sideUserMenu [model]="sideMenuItems" [popup]="true" />
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
            <div class="w-2 h-2 rounded-full bg-blue-500"></div>
            <span class="font-bold text-gray-900 text-sm" style="letter-spacing:-0.01em">Agent Portal</span>
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

          <div class="flex items-center gap-1">
            <!-- Notification bell -->
            <button (click)="notifMenu.toggle($event)"
                    class="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
              <i class="pi pi-bell" style="font-size:20px"></i>
              <span *ngIf="notifService.unreadCount() > 0"
                    class="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold"
                    style="font-size:9px">{{ notifService.unreadCount() }}</span>
            </button>
            <p-menu #notifMenu [model]="notifMenuItems" [popup]="true" />

            <div class="w-px h-5 mx-1" style="background:#E2E8F0"></div>

            <!-- User menu -->
            <button (click)="headerUserMenu.toggle($event)" class="flex items-center gap-2 rounded-lg px-2.5 py-1.5 hover:bg-gray-50 transition-colors">
              <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                   style="background:linear-gradient(135deg,#2563EB,#1D4ED8)">
                {{ initials() }}
              </div>
              <span class="text-sm font-semibold text-gray-700">{{ displayName() }}</span>
              <i class="pi pi-chevron-down text-gray-400" style="font-size:12px"></i>
            </button>
            <p-menu #headerUserMenu [model]="headerMenuItems" [popup]="true" />
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
export class AgentShellComponent implements OnInit {
  collapsed = signal(false);
  searchQuery = signal('');
  private searchTimeout: any;

  navItems = [
    { path: '/agent', icon: 'pi-th-large', label: 'Dashboard', exact: true },
    { path: '/agent/queue', icon: 'pi-inbox', label: 'Ticket Queue', exact: false },
  ];

  sideMenuItems: MenuItem[] = [
    { label: 'Profile', icon: 'pi pi-user', routerLink: '/profile' },
    { separator: true },
    { label: 'Sign out', icon: 'pi pi-sign-out', command: () => this.auth.logout() }
  ];

  notifMenuItems: MenuItem[] = [
    { label: "You're all caught up!", disabled: true }
  ];

  headerMenuItems: MenuItem[] = [];

  constructor(
    public auth: AuthService,
    public notifService: NotificationService,
    private ws: WebSocketService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.ws.connect();
    this.notifService.refreshCount();
    this.ws.notification$.subscribe(() => this.notifService.refreshCount());
    this.headerMenuItems = [
      { label: this.displayName(), disabled: true, styleClass: 'font-semibold' },
      { separator: true },
      { label: 'Profile', icon: 'pi pi-user', routerLink: '/profile' },
      { separator: true },
      { label: 'Sign out', icon: 'pi pi-sign-out', command: () => this.auth.logout() }
    ];
  }

  toggleCollapsed() { this.collapsed.update(v => !v); }

  onSearch(query: string) {
    this.searchQuery.set(query);
    clearTimeout(this.searchTimeout);
    if (!query.trim()) return;
    this.searchTimeout = setTimeout(() => {
      this.router.navigate(['/agent/queue'], { queryParams: { search: query } });
    }, 400);
  }

  displayName(): string {
    const user = this.auth.currentUser();
    return user?.fullName || user?.email || 'Agent';
  }

  initials(): string {
    const name = this.auth.currentUser()?.fullName || this.auth.currentUser()?.email || '?';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
