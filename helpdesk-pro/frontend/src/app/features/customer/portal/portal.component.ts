import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { TicketService } from '../../../core/services/ticket.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatCardModule, SkeletonLoaderComponent],
  template: `
    <div class="space-y-6">
      <!-- Welcome banner -->
      <div class="relative overflow-hidden rounded-2xl p-8 text-white"
           style="background:linear-gradient(135deg,#1D4ED8 0%,#4F46E5 100%)">
        <!-- Decorative circles -->
        <div class="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
             style="background:white;transform:translate(30%,-30%)"></div>
        <div class="absolute bottom-0 right-24 w-32 h-32 rounded-full opacity-10"
             style="background:white;transform:translateY(50%)"></div>

        <div class="relative">
          <p class="text-blue-200 text-sm font-medium mb-1">Customer Portal</p>
          <h1 class="font-heading text-2xl font-bold mb-1">Welcome back!</h1>
          <p class="text-blue-100/80 text-sm mb-6">How can we help you today?</p>
          <a routerLink="/customer/submit" mat-raised-button
             class="!bg-white !text-blue-700 !font-semibold !rounded-lg">
            <mat-icon style="font-size:18px;width:18px;height:18px">add</mat-icon>
            <span class="ml-1">Submit New Ticket</span>
          </a>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div *ngFor="let stat of stats"
             class="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" [ngClass]="stat.bg">
            <mat-icon [ngClass]="stat.color">{{ stat.icon }}</mat-icon>
          </div>
          <div>
            <p class="text-2xl font-heading font-bold text-gray-900 leading-none">{{ stat.value }}</p>
            <p class="text-sm text-gray-500 mt-1">{{ stat.label }}</p>
          </div>
        </div>
      </div>

      <!-- Recent tickets -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-heading font-semibold text-gray-900 text-lg">Recent Tickets</h2>
          <a routerLink="/customer/tickets" class="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
            View all
            <mat-icon style="font-size:16px;width:16px;height:16px">chevron_right</mat-icon>
          </a>
        </div>

        <app-skeleton-loader *ngIf="loading()" type="table" [count]="3" />

        <div *ngIf="!loading()" class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div *ngFor="let ticket of recentTickets(); let last = last"
               class="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/80 cursor-pointer transition-colors"
               [class.border-b]="!last" [class.border-gray-100]="!last"
               [routerLink]="['/customer/tickets', ticket.id]">
            <div class="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              <mat-icon class="text-blue-500" style="font-size:16px;width:16px;height:16px">confirmation_number</mat-icon>
            </div>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate text-sm">{{ ticket.title }}</p>
              <p class="text-xs text-gray-400 mt-0.5 font-mono">{{ ticket.ticketNumber }}</p>
            </div>
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
                  [ngClass]="statusClass(ticket.status)">
              {{ ticket.status | titlecase }}
            </span>
            <mat-icon class="text-gray-300 shrink-0" style="font-size:18px;width:18px;height:18px">chevron_right</mat-icon>
          </div>

          <div *ngIf="recentTickets().length === 0" class="py-16 text-center">
            <mat-icon class="text-gray-200 mb-3" style="font-size:48px;width:48px;height:48px">inbox</mat-icon>
            <p class="text-sm font-medium text-gray-400">No tickets yet</p>
            <p class="text-xs text-gray-300 mt-1">Submit your first ticket to get started</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PortalComponent implements OnInit {
  loading = signal(true);
  recentTickets = signal<any[]>([]);
  stats: any[] = [];

  constructor(private ticketService: TicketService, public auth: AuthService) {}

  ngOnInit() {
    this.ticketService.getTickets({ size: 5 }).subscribe({
      next: (page) => {
        this.recentTickets.set(page.content);
        this.stats = [
          { label: 'Open', value: page.content.filter(t => t.status === 'OPEN' || t.status === 'NEW').length,
            icon: 'inbox', bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Pending', value: page.content.filter(t => t.status === 'PENDING').length,
            icon: 'schedule', bg: 'bg-yellow-50', color: 'text-yellow-600' },
          { label: 'Resolved', value: page.content.filter(t => t.status === 'RESOLVED').length,
            icon: 'check_circle', bg: 'bg-green-50', color: 'text-green-600' },
        ];
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  statusClass(status: string) {
    const map: Record<string, string> = {
      NEW: 'badge-new', OPEN: 'badge-open', PENDING: 'badge-pending',
      ON_HOLD: 'badge-on-hold', RESOLVED: 'badge-resolved', CLOSED: 'badge-closed',
    };
    return map[status] || '';
  }
}
