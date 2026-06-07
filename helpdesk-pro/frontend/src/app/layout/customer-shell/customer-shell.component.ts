import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-customer-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule,
    MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <div class="min-h-screen flex flex-col" style="background:#F8FAFC">

      <!-- ── Top navigation ── -->
      <header class="sticky top-0 z-30 bg-white" style="border-bottom:1px solid #E2E8F0;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
        <div class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">

          <!-- Brand -->
          <a routerLink="/customer" class="flex items-center gap-2.5 no-underline">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                 style="background:linear-gradient(135deg,#2563EB,#4F46E5)">
              <mat-icon class="text-white" style="font-size:17px;width:17px;height:17px">support_agent</mat-icon>
            </div>
            <span class="font-bold text-gray-900 text-base" style="letter-spacing:-0.02em">HelpDesk Pro</span>
          </a>

          <!-- Nav -->
          <nav class="flex items-center gap-1">
            <a routerLink="/customer"
               routerLinkActive="nav-active"
               [routerLinkActiveOptions]="{exact:true}"
               class="cust-nav-link flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium">
              <mat-icon style="font-size:16px;width:16px;height:16px">home</mat-icon>
              <span class="hidden sm:inline">Home</span>
            </a>
            <a routerLink="/customer/tickets"
               routerLinkActive="nav-active"
               class="cust-nav-link flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium">
              <mat-icon style="font-size:16px;width:16px;height:16px">confirmation_number</mat-icon>
              <span class="hidden sm:inline">My Tickets</span>
            </a>

            <div class="w-px h-5 mx-1.5" style="background:#E2E8F0"></div>

            <a routerLink="/customer/submit"
               class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
               style="background:linear-gradient(135deg,#2563EB,#1D4ED8);box-shadow:0 1px 3px rgba(37,99,235,0.35)">
              <mat-icon style="font-size:16px;width:16px;height:16px">add</mat-icon>
              <span class="hidden sm:inline">New Ticket</span>
            </a>

            <button [matMenuTriggerFor]="userMenu"
                    class="ml-1 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold transition-opacity hover:opacity-80"
                    style="background:linear-gradient(135deg,#2563EB,#4F46E5)">
              {{ initials() }}
            </button>
            <mat-menu #userMenu="matMenu">
              <div class="px-4 py-3" style="border-bottom:1px solid #F1F5F9;min-width:200px">
                <p class="text-xs text-gray-400 font-medium">Signed in as</p>
                <p class="text-sm font-bold text-gray-900 mt-0.5">{{ displayName() }}</p>
              </div>
              <button mat-menu-item (click)="auth.logout()">
                <mat-icon class="text-gray-500">logout</mat-icon>
                <span>Sign out</span>
              </button>
            </mat-menu>
          </nav>
        </div>
      </header>

      <!-- ── Content ── -->
      <main class="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <router-outlet />
      </main>

      <!-- ── Footer ── -->
      <footer class="py-5 text-center bg-white" style="border-top:1px solid #E2E8F0">
        <p class="text-xs text-gray-400">&copy; 2024 HelpDesk Pro. All rights reserved.</p>
      </footer>
    </div>
  `,
  styles: [`
    .cust-nav-link {
      color: #64748B;
      transition: all 0.15s ease;
      text-decoration: none;
    }
    .cust-nav-link:hover { color: #0F172A; background: #F8FAFC; }
    :host ::ng-deep .nav-active {
      color: #2563EB !important;
      background: #EFF6FF !important;
    }
  `],
})
export class CustomerShellComponent {
  constructor(public auth: AuthService) {}

  displayName(): string {
    const user = this.auth.currentUser();
    return user?.fullName || user?.email || 'You';
  }

  initials(): string {
    const name = this.auth.currentUser()?.fullName || this.auth.currentUser()?.email || '?';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
