import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { StatsService } from '../../../core/services/stats.service';
import { TicketService } from '../../../core/services/ticket.service';
import { DashboardStats, Ticket } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule,
    StatusBadgeComponent, PriorityBadgeComponent, TimeAgoPipe, SkeletonLoaderComponent],
  template: `
    <div class="space-y-6">
      <h1 class="font-heading text-2xl font-bold text-gray-900">Overview</h1>

      <!-- KPI Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <mat-card *ngFor="let kpi of kpis()" class="!rounded-xl !shadow-sm">
          <mat-card-content class="!p-5">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center" [ngClass]="kpi.bg">
                <mat-icon [ngClass]="kpi.color">{{ kpi.icon }}</mat-icon>
              </div>
              <span class="text-sm text-gray-500 font-medium">{{ kpi.label }}</span>
            </div>
            <p class="text-3xl font-heading font-bold" [ngClass]="kpi.valueColor || 'text-gray-900'">{{ kpi.value }}</p>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Status breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <mat-card class="!rounded-xl !shadow-sm">
          <mat-card-header class="!px-6 !pt-5">
            <mat-card-title class="!font-heading !text-base !font-semibold">Tickets by Status</mat-card-title>
          </mat-card-header>
          <mat-card-content class="!p-6">
            <div class="space-y-3">
              <div *ngFor="let item of statusBreakdown()" class="flex items-center gap-3">
                <span class="text-sm text-gray-600 w-24">{{ item.label }}</span>
                <div class="flex-1 bg-gray-100 rounded-full h-2">
                  <div class="h-2 rounded-full transition-all duration-500" [ngClass]="item.color"
                       [style.width.%]="item.percent"></div>
                </div>
                <span class="text-sm font-semibold text-gray-900 w-8 text-right">{{ item.value }}</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Recent -->
        <mat-card class="!rounded-xl !shadow-sm">
          <mat-card-header class="!px-6 !pt-5">
            <mat-card-title class="!font-heading !text-base !font-semibold">Recent Activity</mat-card-title>
          </mat-card-header>
          <mat-card-content class="!px-0 !pb-0 !mt-2">
            <app-skeleton-loader *ngIf="loadingTickets()" type="table" [count]="4" class="block px-6 pb-4" />
            <div *ngIf="!loadingTickets()">
              <div *ngFor="let t of recentTickets()" class="flex items-center gap-3 px-6 py-3 border-b border-gray-100 last:border-0">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ t.title }}</p>
                  <p class="text-xs text-gray-400">{{ t.ticketNumber }}</p>
                </div>
                <app-status-badge [status]="t.status" />
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
})
export class OverviewComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  kpis = signal<any[]>([]);
  statusBreakdown = signal<any[]>([]);
  recentTickets = signal<Ticket[]>([]);
  loadingTickets = signal(true);

  constructor(private statsService: StatsService, private ticketService: TicketService) {}

  ngOnInit() {
    this.statsService.getDashboard().subscribe(s => {
      this.stats.set(s);
      const total = s.openTickets + s.pendingTickets + s.newTickets + s.onHold + s.resolvedToday || 1;
      this.kpis.set([
        { label: 'New', value: s.newTickets, icon: 'fiber_new', bg: 'bg-blue-50', color: 'text-blue-600' },
        { label: 'Open', value: s.openTickets, icon: 'inbox', bg: 'bg-indigo-50', color: 'text-indigo-600' },
        { label: 'Pending', value: s.pendingTickets, icon: 'schedule', bg: 'bg-yellow-50', color: 'text-yellow-600' },
        { label: 'SLA Breached', value: s.slaBreached, icon: 'warning', bg: 'bg-red-50', color: 'text-red-600', valueColor: s.slaBreached > 0 ? 'text-red-600' : 'text-gray-900' },
      ]);
      this.statusBreakdown.set([
        { label: 'New', value: s.newTickets, color: 'bg-blue-500', percent: (s.newTickets / total) * 100 },
        { label: 'Open', value: s.openTickets, color: 'bg-indigo-500', percent: (s.openTickets / total) * 100 },
        { label: 'Pending', value: s.pendingTickets, color: 'bg-yellow-400', percent: (s.pendingTickets / total) * 100 },
        { label: 'On Hold', value: s.onHold, color: 'bg-slate-400', percent: (s.onHold / total) * 100 },
        { label: 'Resolved', value: s.resolvedToday, color: 'bg-green-500', percent: (s.resolvedToday / total) * 100 },
      ]);
    });

    this.ticketService.getTickets({ size: 8, sort: 'createdAt,desc' }).subscribe({
      next: (p) => { this.recentTickets.set(p.content); this.loadingTickets.set(false); },
      error: () => this.loadingTickets.set(false),
    });
  }
}
