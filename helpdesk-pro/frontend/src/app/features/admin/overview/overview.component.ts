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
      <!-- Page header -->
      <div>
        <h1 class="font-heading text-2xl font-bold text-gray-900">Overview</h1>
        <p class="text-sm text-gray-500 mt-0.5">System-wide ticket and performance metrics</p>
      </div>

      <!-- KPI Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div *ngFor="let kpi of kpis()"
             class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between mb-4">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" [ngClass]="kpi.bg">
              <mat-icon [ngClass]="kpi.color" style="font-size:20px;width:20px;height:20px">{{ kpi.icon }}</mat-icon>
            </div>
          </div>
          <p class="text-3xl font-heading font-bold leading-none" [ngClass]="kpi.valueColor || 'text-gray-900'">{{ kpi.value }}</p>
          <p class="text-sm text-gray-500 mt-1.5">{{ kpi.label }}</p>
        </div>
      </div>

      <!-- Status breakdown + Recent activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Status breakdown -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <mat-icon class="text-gray-400" style="font-size:18px;width:18px;height:18px">donut_large</mat-icon>
            <h2 class="font-heading font-semibold text-gray-900 text-base">Tickets by Status</h2>
          </div>
          <div class="p-6 space-y-4">
            <div *ngFor="let item of statusBreakdown()" class="flex items-center gap-3">
              <span class="text-xs font-medium text-gray-600 w-20 shrink-0">{{ item.label }}</span>
              <div class="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div class="h-2 rounded-full transition-all duration-700" [ngClass]="item.color"
                     [style.width.%]="item.percent"></div>
              </div>
              <span class="text-sm font-bold text-gray-900 w-8 text-right shrink-0">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <!-- Recent activity -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <mat-icon class="text-gray-400" style="font-size:18px;width:18px;height:18px">history</mat-icon>
            <h2 class="font-heading font-semibold text-gray-900 text-base">Recent Activity</h2>
          </div>

          <app-skeleton-loader *ngIf="loadingTickets()" type="table" [count]="4" class="block px-6 py-2" />

          <div *ngIf="!loadingTickets()">
            <div *ngFor="let t of recentTickets(); let last = last"
                 class="flex items-center gap-3 px-6 py-3.5 transition-colors"
                 [class.border-b]="!last" [class.border-gray-100]="!last">
              <div class="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0">
                <mat-icon class="text-gray-400" style="font-size:14px;width:14px;height:14px">confirmation_number</mat-icon>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ t.title }}</p>
                <p class="text-xs text-gray-400 font-mono">{{ t.ticketNumber }}</p>
              </div>
              <app-status-badge [status]="t.status" />
            </div>
          </div>
        </div>
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
