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
    <div class="space-y-8">
      <!-- Welcome banner -->
      <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
        <h1 class="font-heading text-3xl font-bold mb-2">Welcome back! 👋</h1>
        <p class="text-blue-100 mb-6">How can we help you today?</p>
        <a routerLink="/customer/submit" mat-raised-button
           class="!bg-white !text-blue-700 !font-semibold !rounded-xl !px-6">
          <mat-icon class="mr-1">add</mat-icon>
          Submit New Ticket
        </a>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <mat-card *ngFor="let stat of stats" class="!rounded-xl">
          <mat-card-content class="!p-5">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center" [ngClass]="stat.bg">
                <mat-icon [ngClass]="stat.color">{{ stat.icon }}</mat-icon>
              </div>
              <div>
                <p class="text-2xl font-heading font-bold text-gray-900">{{ stat.value }}</p>
                <p class="text-sm text-gray-500">{{ stat.label }}</p>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Recent tickets -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-heading font-semibold text-gray-900 text-lg">Recent Tickets</h2>
          <a routerLink="/customer/tickets" class="text-blue-600 text-sm hover:underline">View all</a>
        </div>
        <app-skeleton-loader *ngIf="loading()" type="table" [count]="3" />
        <div *ngIf="!loading()" class="space-y-3">
          <mat-card *ngFor="let ticket of recentTickets()" class="!rounded-xl hover:shadow-md transition-shadow cursor-pointer"
                    [routerLink]="['/customer/tickets', ticket.id]">
            <mat-card-content class="!p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 truncate">{{ ticket.title }}</p>
                  <p class="text-sm text-gray-500 mt-0.5">{{ ticket.ticketNumber }}</p>
                </div>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shrink-0"
                      [ngClass]="statusClass(ticket.status)">
                  {{ ticket.status | titlecase }}
                </span>
              </div>
            </mat-card-content>
          </mat-card>
          <p *ngIf="recentTickets().length === 0" class="text-center py-8 text-gray-400 text-sm">
            No tickets yet. Submit your first ticket!
          </p>
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
