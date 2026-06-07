import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule,
    StatusBadgeComponent, PriorityBadgeComponent, TimeAgoPipe, SkeletonLoaderComponent],
  template: `
    <div class="space-y-6">

      <!-- Page header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Overview</h1>
          <p class="text-sm text-slate-400 mt-0.5">System-wide ticket and performance metrics</p>
        </div>
        <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
             style="background:#F0FDF4;color:#166534;border:1px solid #BBF7D0">
          <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
          All systems operational
        </div>
      </div>

      <!-- KPI stat cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div *ngFor="let kpi of kpis()" class="stat-card p-5">
          <div class="stat-card-accent" [ngClass]="kpi.accentColor"></div>
          <div class="flex items-start justify-between mb-4 pl-2">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" [ngClass]="kpi.bg">
              <i [class]="'pi ' + kpi.icon" [ngClass]="kpi.color" style="font-size:20px"></i>
            </div>
          </div>
          <div class="pl-2">
            <p class="text-3xl font-black leading-none" [ngClass]="kpi.valueColor || 'text-gray-900'"
               style="letter-spacing:-0.04em">{{ kpi.value }}</p>
            <p class="text-xs font-medium text-slate-400 mt-1.5">{{ kpi.label }}</p>
          </div>
        </div>
      </div>

      <!-- Bottom row: status breakdown + recent activity -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Status breakdown -->
        <div class="bg-white rounded-xl border border-gray-100 overflow-hidden" style="box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div class="flex items-center gap-2.5 px-6 py-4" style="border-bottom:1px solid #F1F5F9">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <i class="pi pi-chart-pie text-slate-500" style="font-size:16px"></i>
            </div>
            <h2 class="font-bold text-gray-900 text-sm">Tickets by Status</h2>
          </div>
          <div class="p-6 space-y-4">
            <div *ngFor="let item of statusBreakdown()" class="flex items-center gap-3">
              <span class="text-xs font-semibold text-gray-500 w-16 shrink-0">{{ item.label }}</span>
              <div class="flex-1 h-2 rounded-full overflow-hidden" style="background:#F1F5F9">
                <div class="h-2 rounded-full transition-all duration-700 ease-out" [ngClass]="item.barColor"
                     [style.width.%]="item.percent"></div>
              </div>
              <span class="text-sm font-black text-gray-900 w-7 text-right shrink-0" style="letter-spacing:-0.02em">{{ item.value }}</span>
            </div>
          </div>
        </div>

        <!-- Recent activity -->
        <div class="bg-white rounded-xl border border-gray-100 overflow-hidden" style="box-shadow:0 1px 3px rgba(0,0,0,0.06)">
          <div class="flex items-center gap-2.5 px-6 py-4" style="border-bottom:1px solid #F1F5F9">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <i class="pi pi-history text-slate-500" style="font-size:16px"></i>
            </div>
            <h2 class="font-bold text-gray-900 text-sm">Recent Tickets</h2>
          </div>

          <app-skeleton-loader *ngIf="loadingTickets()" type="table" [count]="4" class="block px-6 py-2" />

          <div *ngIf="!loadingTickets()">
            <div *ngFor="let t of recentTickets(); let last = last"
                 class="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50/80 transition-colors"
                 [style.border-bottom]="!last ? '1px solid #F8FAFC' : 'none'">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                   style="background:#EFF6FF;border:1px solid #DBEAFE">
                <i class="pi pi-ticket" style="font-size:13px;color:#2563EB"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900 truncate">{{ t.title }}</p>
                <p class="text-xs text-slate-400 font-mono mt-0.5">{{ t.ticketNumber }}</p>
              </div>
              <app-status-badge [status]="t.status" />
            </div>
            <div *ngIf="recentTickets().length === 0" class="py-14 text-center">
              <i class="pi pi-inbox" style="font-size:40px;color:#E2E8F0;display:block;margin:0 auto 8px"></i>
              <p class="text-sm text-slate-400 font-medium">No recent activity</p>
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
      const total = (s.openTickets + s.pendingTickets + s.newTickets + s.onHold + s.resolvedToday) || 1;

      this.kpis.set([
        { label: 'New Tickets', value: s.newTickets, icon: 'pi-star', bg: 'bg-blue-50', color: 'text-blue-600', accentColor: 'bg-blue-500' },
        { label: 'Open', value: s.openTickets, icon: 'pi-inbox', bg: 'bg-indigo-50', color: 'text-indigo-600', accentColor: 'bg-indigo-500' },
        { label: 'Pending', value: s.pendingTickets, icon: 'pi-clock', bg: 'bg-amber-50', color: 'text-amber-600', accentColor: 'bg-amber-500' },
        { label: 'SLA Breached', value: s.slaBreached, icon: 'pi-exclamation-triangle', bg: 'bg-red-50', color: 'text-red-600', accentColor: 'bg-red-500', valueColor: s.slaBreached > 0 ? 'text-red-600' : 'text-gray-900' },
      ]);

      this.statusBreakdown.set([
        { label: 'New', value: s.newTickets, barColor: 'bg-blue-500', percent: (s.newTickets / total) * 100 },
        { label: 'Open', value: s.openTickets, barColor: 'bg-indigo-500', percent: (s.openTickets / total) * 100 },
        { label: 'Pending', value: s.pendingTickets, barColor: 'bg-amber-400', percent: (s.pendingTickets / total) * 100 },
        { label: 'On Hold', value: s.onHold, barColor: 'bg-slate-400', percent: (s.onHold / total) * 100 },
        { label: 'Resolved', value: s.resolvedToday, barColor: 'bg-green-500', percent: (s.resolvedToday / total) * 100 },
      ]);
    });

    this.ticketService.getTickets({ size: 8, sort: 'createdAt,desc' }).subscribe({
      next: (p) => { this.recentTickets.set(p.content); this.loadingTickets.set(false); },
      error: () => this.loadingTickets.set(false),
    });
  }
}
