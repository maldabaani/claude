import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { StatsService } from '../../../core/services/stats.service';
import { TicketService } from '../../../core/services/ticket.service';
import { DashboardStats, Ticket } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule,
    StatusBadgeComponent, PriorityBadgeComponent, SkeletonLoaderComponent, TimeAgoPipe],
  template: `
    <div class="space-y-6">
      <!-- Page title -->
      <div>
        <h1 class="font-heading text-2xl font-bold text-gray-900">Dashboard</h1>
        <p class="text-sm text-gray-500 mt-0.5">Your support queue at a glance</p>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div *ngFor="let kpi of kpis()"
             class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-4">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" [ngClass]="kpi.bg">
              <mat-icon [ngClass]="kpi.color" style="font-size:20px;width:20px;height:20px">{{ kpi.icon }}</mat-icon>
            </div>
          </div>
          <p class="text-3xl font-heading font-bold text-gray-900 leading-none">{{ kpi.value }}</p>
          <p class="text-sm text-gray-500 mt-1.5">{{ kpi.label }}</p>
        </div>
      </div>

      <!-- Recent tickets -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div class="flex items-center gap-2">
            <mat-icon class="text-gray-400" style="font-size:18px;width:18px;height:18px">receipt_long</mat-icon>
            <h2 class="font-heading font-semibold text-gray-900 text-base">Recent Tickets</h2>
          </div>
          <a routerLink="/agent/queue" mat-button color="primary" class="!text-sm !rounded-lg">
            View all
            <mat-icon style="font-size:16px;width:16px;height:16px">chevron_right</mat-icon>
          </a>
        </div>

        <!-- Table header -->
        <div class="grid gap-4 px-6 py-3 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide"
             style="grid-template-columns:1fr auto auto auto">
          <span>Ticket</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Created</span>
        </div>

        <app-skeleton-loader *ngIf="loadingTickets()" type="table" [count]="5" class="block px-6 pb-4" />

        <div *ngIf="!loadingTickets()">
          <div *ngFor="let ticket of recentTickets(); let last = last"
               class="grid gap-4 items-center px-6 py-3.5 hover:bg-gray-50/80 cursor-pointer transition-colors"
               style="grid-template-columns:1fr auto auto auto"
               [class.border-b]="!last" [class.border-gray-100]="!last"
               [routerLink]="['/agent/tickets', ticket.id]">
            <div class="min-w-0">
              <p class="font-medium text-gray-900 text-sm truncate">{{ ticket.title }}</p>
              <p class="text-xs text-gray-400 mt-0.5 font-mono">{{ ticket.ticketNumber }} &middot; {{ ticket.createdAt | timeAgo }}</p>
            </div>
            <app-priority-badge [priority]="ticket.priority" />
            <app-status-badge [status]="ticket.status" />
            <span class="text-xs text-gray-400 whitespace-nowrap">{{ ticket.createdAt | timeAgo }}</span>
          </div>

          <div *ngIf="recentTickets().length === 0" class="py-16 text-center">
            <mat-icon class="text-gray-200 mb-3" style="font-size:48px;width:48px;height:48px">inbox</mat-icon>
            <p class="text-sm font-medium text-gray-400">No tickets found</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  kpis = signal<any[]>([]);
  recentTickets = signal<Ticket[]>([]);
  loadingTickets = signal(true);

  constructor(private statsService: StatsService, private ticketService: TicketService) {}

  ngOnInit() {
    this.statsService.getDashboard().subscribe(s => {
      this.stats.set(s);
      this.kpis.set([
        { label: 'Open', value: s.openTickets, icon: 'inbox', bg: 'bg-blue-50', color: 'text-blue-600' },
        { label: 'Pending', value: s.pendingTickets, icon: 'schedule', bg: 'bg-yellow-50', color: 'text-yellow-600' },
        { label: 'Resolved Today', value: s.resolvedToday, icon: 'check_circle', bg: 'bg-green-50', color: 'text-green-600' },
        { label: 'SLA Breached', value: s.slaBreached, icon: 'warning', bg: 'bg-red-50', color: 'text-red-600' },
      ]);
    });

    this.ticketService.getTickets({ size: 10 }).subscribe({
      next: (page) => { this.recentTickets.set(page.content); this.loadingTickets.set(false); },
      error: () => this.loadingTickets.set(false),
    });
  }
}
