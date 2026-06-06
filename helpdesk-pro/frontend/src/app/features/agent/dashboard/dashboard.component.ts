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
      <h1 class="font-heading text-2xl font-bold text-gray-900">Dashboard</h1>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <mat-card *ngFor="let kpi of kpis()" class="!rounded-xl !shadow-sm">
          <mat-card-content class="!p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" [ngClass]="kpi.bg">
                <mat-icon [ngClass]="kpi.color" class="text-xl">{{ kpi.icon }}</mat-icon>
              </div>
              <span class="text-sm text-gray-500 font-medium">{{ kpi.label }}</span>
            </div>
            <p class="text-3xl font-heading font-bold text-gray-900">{{ kpi.value }}</p>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Recent tickets -->
      <mat-card class="!rounded-xl !shadow-sm">
        <mat-card-header class="!px-6 !pt-5 !pb-0">
          <mat-card-title class="!font-heading !text-base !font-semibold !text-gray-900">Recent Tickets</mat-card-title>
          <span class="flex-1"></span>
          <a routerLink="/agent/queue" mat-button color="primary" class="!text-sm">View All</a>
        </mat-card-header>
        <mat-card-content class="!px-0 !py-0 !mt-3">
          <app-skeleton-loader *ngIf="loadingTickets()" type="table" [count]="5" class="block px-6 pb-4" />
          <div *ngIf="!loadingTickets()">
            <div *ngFor="let ticket of recentTickets()"
                 class="flex items-center gap-4 px-6 py-3.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                 [routerLink]="['/agent/tickets', ticket.id]">
              <div class="flex-1 min-w-0">
                <p class="font-medium text-gray-900 text-sm truncate">{{ ticket.title }}</p>
                <p class="text-xs text-gray-400 mt-0.5">{{ ticket.ticketNumber }} · {{ ticket.createdAt | timeAgo }}</p>
              </div>
              <app-priority-badge [priority]="ticket.priority" />
              <app-status-badge [status]="ticket.status" />
            </div>
            <p *ngIf="recentTickets().length === 0" class="text-center py-8 text-gray-400 text-sm">No tickets found.</p>
          </div>
        </mat-card-content>
      </mat-card>
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
