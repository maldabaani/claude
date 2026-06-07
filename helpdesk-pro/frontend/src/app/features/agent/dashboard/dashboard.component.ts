import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
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
  imports: [CommonModule, RouterLink, MatIconModule, MatButtonModule,
    StatusBadgeComponent, PriorityBadgeComponent, SkeletonLoaderComponent, TimeAgoPipe],
  template: `
    <div class="space-y-6">

      <!-- Page header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Dashboard</h1>
          <p class="text-sm text-slate-400 mt-0.5">Your support queue at a glance</p>
        </div>
        <a routerLink="/agent/queue"
           class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
           style="background:linear-gradient(135deg,#2563EB,#1D4ED8);box-shadow:0 2px 8px rgba(37,99,235,0.3)">
          <mat-icon style="font-size:16px;width:16px;height:16px">inbox</mat-icon>
          View Queue
        </a>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div *ngFor="let kpi of kpis()" class="stat-card p-5">
          <div class="stat-card-accent" [ngClass]="kpi.accentColor"></div>
          <div class="flex items-start justify-between mb-4 pl-2">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" [ngClass]="kpi.bg">
              <mat-icon [ngClass]="kpi.color" style="font-size:20px;width:20px;height:20px">{{ kpi.icon }}</mat-icon>
            </div>
          </div>
          <div class="pl-2">
            <p class="text-3xl font-black text-gray-900 leading-none" style="letter-spacing:-0.04em">{{ kpi.value }}</p>
            <p class="text-xs font-medium text-slate-400 mt-1.5">{{ kpi.label }}</p>
          </div>
        </div>
      </div>

      <!-- Recent tickets table -->
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden" style="box-shadow:0 1px 3px rgba(0,0,0,0.06)">

        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4" style="border-bottom:1px solid #F1F5F9">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <mat-icon class="text-slate-500" style="font-size:16px;width:16px;height:16px">receipt_long</mat-icon>
            </div>
            <h2 class="font-bold text-gray-900 text-sm">Recent Tickets</h2>
          </div>
          <a routerLink="/agent/queue"
             class="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-opacity"
             style="color:#2563EB">
            View all
            <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
          </a>
        </div>

        <!-- Table header -->
        <div class="grid gap-4 px-6 py-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider"
             style="grid-template-columns:1fr 90px 110px 90px;background:#FAFAFA;border-bottom:1px solid #F1F5F9">
          <span>Ticket</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Age</span>
        </div>

        <app-skeleton-loader *ngIf="loadingTickets()" type="table" [count]="5" class="block px-6 pb-4" />

        <div *ngIf="!loadingTickets()">
          <div *ngFor="let ticket of recentTickets(); let last = last"
               class="grid gap-4 items-center px-6 py-3.5 hover:bg-slate-50/70 cursor-pointer transition-colors"
               style="grid-template-columns:1fr 90px 110px 90px"
               [style.border-bottom]="!last ? '1px solid #F8FAFC' : 'none'"
               [routerLink]="['/agent/tickets', ticket.id]">
            <div class="min-w-0">
              <p class="font-semibold text-gray-900 text-sm truncate">{{ ticket.title }}</p>
              <p class="text-xs text-slate-400 mt-0.5 font-mono">{{ ticket.ticketNumber }}</p>
            </div>
            <app-priority-badge [priority]="ticket.priority" />
            <app-status-badge [status]="ticket.status" />
            <span class="text-xs text-slate-400 font-medium">{{ ticket.createdAt | timeAgo }}</span>
          </div>

          <div *ngIf="recentTickets().length === 0" class="py-16 text-center">
            <mat-icon style="font-size:44px;width:44px;height:44px;color:#E2E8F0;display:block;margin:0 auto 10px">inbox</mat-icon>
            <p class="text-sm font-semibold text-slate-400">No tickets in your queue</p>
            <p class="text-xs text-slate-300 mt-1">You're all caught up!</p>
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
        { label: 'Open', value: s.openTickets, icon: 'inbox', bg: 'bg-blue-50', color: 'text-blue-600', accentColor: 'bg-blue-500' },
        { label: 'Pending', value: s.pendingTickets, icon: 'schedule', bg: 'bg-amber-50', color: 'text-amber-600', accentColor: 'bg-amber-500' },
        { label: 'Resolved Today', value: s.resolvedToday, icon: 'check_circle', bg: 'bg-green-50', color: 'text-green-600', accentColor: 'bg-green-500' },
        { label: 'SLA Breached', value: s.slaBreached, icon: 'warning', bg: 'bg-red-50', color: 'text-red-600', accentColor: 'bg-red-500' },
      ]);
    });

    this.ticketService.getTickets({ size: 10 }).subscribe({
      next: (page) => { this.recentTickets.set(page.content); this.loadingTickets.set(false); },
      error: () => this.loadingTickets.set(false),
    });
  }
}
