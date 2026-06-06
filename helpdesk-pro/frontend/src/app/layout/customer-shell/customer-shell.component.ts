import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-customer-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule, MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <div class="min-h-screen flex flex-col bg-[var(--color-surface-2)]">
      <!-- Top nav -->
      <header class="bg-[#0F172A] text-white px-6 h-16 flex items-center justify-between shadow-lg">
        <a routerLink="/customer" class="flex items-center gap-2">
          <mat-icon class="text-blue-400">support_agent</mat-icon>
          <span class="font-heading font-semibold text-lg">HelpDesk Pro</span>
        </a>
        <nav class="flex items-center gap-6">
          <a routerLink="/customer" class="text-sm text-slate-300 hover:text-white transition-colors">Home</a>
          <a routerLink="/customer/tickets" class="text-sm text-slate-300 hover:text-white transition-colors">My Tickets</a>
          <a routerLink="/customer/submit" mat-raised-button color="primary" class="!text-sm">Submit Ticket</a>
          <button mat-icon-button [matMenuTriggerFor]="menu" class="text-slate-300">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="auth.logout()">
              <mat-icon>logout</mat-icon> Logout
            </button>
          </mat-menu>
        </nav>
      </header>

      <main class="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        <router-outlet />
      </main>

      <footer class="py-4 text-center text-sm text-gray-400 border-t">
        © 2024 HelpDesk Pro. All rights reserved.
      </footer>
    </div>
  `,
})
export class CustomerShellComponent {
  constructor(public auth: AuthService) {}
}
