import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-customer-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule,
    ButtonModule, MenuModule, TooltipModule],
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
            <p class="text-slate-500 text-xs whitespace-nowrap">Customer Portal</p>
          </div>
        </div>

        <!-- Nav label -->
        <div *ngIf="!collapsed()" class="px-4 pt-5 pb-1.5">
          <p class="text-slate-600 text-[10px] font-bold uppercase tracking-[0.1em]">Support</p>
        </div>

        <!-- Nav items -->
        <nav class="flex-1 py-1.5 overflow-y-auto">
          <a *ngFor="let item of navItems"
             [routerLink]="item.path"
             routerLinkActive="nav-active"
             [routerLinkActiveOptions]="{exact: item.exact || false}"
             class="sidebar-nav-item"
             [class.justify-center]="collapsed()"
             [pTooltip]="collapsed() ? item.label : ''"
             tooltipPosition="right">
            <i [class]="'pi ' + item.icon + ' shrink-0'" style="font-size:18px"></i>
            <span *ngIf="!collapsed()" class="truncate">{{ item.label }}</span>
          </a>

          <!-- Submit ticket CTA -->
          <div class="px-3 mt-4">
            <a routerLink="/customer/submit"
               *ngIf="!collapsed()"
               class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
               style="background:linear-gradient(135deg,#2563EB,#1D4ED8);box-shadow:0 2px 8px rgba(37,99,235,0.35)">
              <i class="pi pi-plus" style="font-size:15px"></i>
              New Ticket
            </a>
            <a routerLink="/customer/submit"
               *ngIf="collapsed()"
               class="flex items-center justify-center w-10 h-10 rounded-xl text-white"
               style="background:linear-gradient(135deg,#2563EB,#1D4ED8)"
               pTooltip="New Ticket" tooltipPosition="right">
              <i class="pi pi-plus" style="font-size:16px"></i>
            </a>
          </div>
        </nav>

        <!-- User area -->
        <div style="border-top:1px solid rgba(255,255,255,0.07)" class="p-3">
          <button (click)="userMenu.toggle($event)"
                  class="w-full flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-white/5"
                  [class.justify-center]="collapsed()">
            <div class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold"
                 style="background:linear-gradient(135deg,#2563EB,#1D4ED8)">
              {{ initials() }}
            </div>
            <div *ngIf="!collapsed()" class="flex-1 min-w-0 text-left">
              <p class="text-white text-xs font-semibold truncate">{{ displayName() }}</p>
              <p class="text-slate-500 text-xs">Customer</p>
            </div>
            <i *ngIf="!collapsed()" class="pi pi-sort-alt text-slate-600 shrink-0" style="font-size:14px"></i>
          </button>
          <p-menu #userMenu [model]="menuItems" [popup]="true" />
        </div>

        <!-- Collapse toggle -->
        <button (click)="collapsed.set(!collapsed())"
                class="absolute -right-3 top-20 w-6 h-6 rounded-full flex items-center justify-center border transition-colors"
                style="background:#1E293B;border-color:rgba(255,255,255,0.1);color:#94A3B8">
          <i [class]="collapsed() ? 'pi pi-chevron-right' : 'pi pi-chevron-left'" style="font-size:10px"></i>
        </button>
      </aside>

      <!-- ── Main ── -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

        <!-- Top bar -->
        <header class="h-14 shrink-0 flex items-center px-6 gap-4 bg-white"
                style="border-bottom:1px solid #F1F5F9;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <h2 class="text-sm font-bold text-gray-900 truncate">{{ pageTitle() }}</h2>
          </div>
        </header>

        <!-- Scrollable content -->
        <main class="flex-1 overflow-y-auto p-6">
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
      padding: 9px 16px;
      margin: 1px 8px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      color: #94A3B8;
      text-decoration: none;
      transition: all 0.15s ease;
      cursor: pointer;
    }
    .sidebar-nav-item:hover { background: rgba(255,255,255,0.06); color: #E2E8F0; }
    :host ::ng-deep .nav-active {
      background: rgba(37,99,235,0.18) !important;
      color: #93C5FD !important;
    }
  `],
})
export class CustomerShellComponent {
  collapsed = signal(false);
  menuItems: MenuItem[] = [];

  navItems = [
    { path: '/customer', label: 'Home', icon: 'pi-home', exact: true },
    { path: '/customer/tickets', label: 'My Tickets', icon: 'pi-ticket' },
    { path: '/customer/kb', label: 'Knowledge Base', icon: 'pi-book' },
    { path: '/profile', label: 'My Profile', icon: 'pi-user' },
  ];

  constructor(public auth: AuthService, private router: Router) {
    this.menuItems = [
      { label: this.displayName(), disabled: true, styleClass: 'font-semibold text-gray-800' },
      { separator: true },
      { label: 'My Profile', icon: 'pi pi-user', routerLink: '/profile' },
      { separator: true },
      { label: 'Sign out', icon: 'pi pi-sign-out', command: () => this.auth.logout() },
    ];
  }

  displayName(): string {
    const user = this.auth.currentUser();
    return user?.fullName || user?.email || 'You';
  }

  initials(): string {
    const name = this.auth.currentUser()?.fullName || this.auth.currentUser()?.email || '?';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  pageTitle(): string {
    const url = this.router.url;
    if (url === '/customer') return 'Home';
    if (url.includes('/customer/tickets/')) return 'Ticket Details';
    if (url.startsWith('/customer/tickets')) return 'My Tickets';
    if (url.startsWith('/customer/submit')) return 'Submit a Ticket';
    if (url.startsWith('/customer/kb')) return 'Knowledge Base';
    return 'Customer Portal';
  }
}
