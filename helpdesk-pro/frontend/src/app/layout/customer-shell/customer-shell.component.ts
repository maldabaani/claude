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
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    <div class="min-h-screen flex flex-col" style="background:#F1F5F9">
      <!-- Top nav -->
      <header class="bg-white border-b border-gray-200/80 px-6 h-16 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <a routerLink="/customer" class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <mat-icon class="text-white" style="font-size:18px;width:18px;height:18px">support_agent</mat-icon>
          </div>
          <span class="font-heading font-bold text-gray-900 text-base">HelpDesk Pro</span>
        </a>

        <nav class="flex items-center gap-1">
          <a routerLink="/customer"
             routerLinkActive="!text-blue-600 !bg-blue-50"
             [routerLinkActiveOptions]="{exact:true}"
             class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <mat-icon style="font-size:16px;width:16px;height:16px">home</mat-icon>
            <span class="hidden sm:inline">Home</span>
          </a>
          <a routerLink="/customer/tickets"
             routerLinkActive="!text-blue-600 !bg-blue-50"
             class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
            <mat-icon style="font-size:16px;width:16px;height:16px">confirmation_number</mat-icon>
            <span class="hidden sm:inline">My Tickets</span>
          </a>
          <a routerLink="/customer/submit" mat-raised-button color="primary"
             class="!text-sm !rounded-lg !ml-2 !px-4">
            <mat-icon style="font-size:16px;width:16px;height:16px">add</mat-icon>
            <span class="hidden sm:inline ml-1">New Ticket</span>
          </a>
          <div class="w-px h-6 bg-gray-200 mx-2"></div>
          <button mat-icon-button [matMenuTriggerFor]="menu" class="!text-gray-500">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item (click)="auth.logout()">
              <mat-icon class="text-gray-500">logout</mat-icon>
              <span>Sign out</span>
            </button>
          </mat-menu>
        </nav>
      </header>

      <main class="flex-1 max-w-4xl mx-auto w-full px-6 py-8">
        <router-outlet />
      </main>

      <footer class="py-5 text-center text-xs text-gray-400 border-t border-gray-200 bg-white">
        &copy; 2024 HelpDesk Pro. All rights reserved.
      </footer>
    </div>
  `,
})
export class CustomerShellComponent {
  constructor(public auth: AuthService) {}
}
