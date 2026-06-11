import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface AgentPerformanceDto {
  agentId: string;
  agentName: string;
  agentEmail: string;
  availabilityStatus: string;
  ticketsResolved: number;
  ticketsOpen: number;
  avgFirstResponseMinutes: number;
  avgResolutionMinutes: number;
  csatScore: number;
}

@Component({
  selector: 'app-agent-performance',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, SkeletonModule],
  template: `
<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Agent Performance</h1>
      <p class="text-sm text-slate-400 mt-0.5">Per-agent metrics, response times, and CSAT scores</p>
    </div>
    <div class="flex gap-2 flex-wrap">
      <div class="flex gap-1">
        <button *ngFor="let p of periods" pButton [outlined]="selectedDays !== p.days"
                [label]="p.label" size="small" (click)="setPeriod(p.days)"></button>
      </div>
      <button pButton outlined label="Export CSV" icon="pi pi-download" size="small"
              (click)="exportCsv()"></button>
    </div>
  </div>

  <!-- Summary KPIs -->
  <div *ngIf="agents().length > 0" class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="stat-card p-5">
      <div class="stat-card-accent bg-blue-500"></div>
      <div class="pl-2">
        <p class="text-3xl font-black text-gray-900" style="letter-spacing:-0.04em">{{ totalResolved() }}</p>
        <p class="text-xs text-slate-400 mt-1.5">Total Resolved</p>
      </div>
    </div>
    <div class="stat-card p-5">
      <div class="stat-card-accent bg-amber-500"></div>
      <div class="pl-2">
        <p class="text-3xl font-black text-gray-900" style="letter-spacing:-0.04em">{{ totalOpen() }}</p>
        <p class="text-xs text-slate-400 mt-1.5">Open Tickets</p>
      </div>
    </div>
    <div class="stat-card p-5">
      <div class="stat-card-accent bg-indigo-500"></div>
      <div class="pl-2">
        <p class="text-3xl font-black text-gray-900" style="letter-spacing:-0.04em">{{ avgFirstResponse() }}m</p>
        <p class="text-xs text-slate-400 mt-1.5">Avg First Response</p>
      </div>
    </div>
    <div class="stat-card p-5">
      <div class="stat-card-accent bg-emerald-500"></div>
      <div class="pl-2">
        <p class="text-3xl font-black text-gray-900" style="letter-spacing:-0.04em">{{ avgCsat() }}</p>
        <p class="text-xs text-slate-400 mt-1.5">Avg CSAT</p>
      </div>
    </div>
  </div>

  <!-- Agent Table -->
  <div *ngIf="!loading() && agents().length > 0"
       class="bg-white rounded-xl border border-gray-100 overflow-hidden"
       style="box-shadow:0 1px 3px rgba(0,0,0,0.06)">
    <div class="px-6 py-4 border-b border-gray-100">
      <h2 class="font-bold text-gray-900 text-sm">All Agents</h2>
    </div>
    <div class="data-table-header"
         style="grid-template-columns:1fr 120px 90px 90px 140px 140px 100px">
      <span>Agent</span>
      <span>Status</span>
      <span>Resolved</span>
      <span>Open</span>
      <span>Avg First Response</span>
      <span>Avg Resolution</span>
      <span>CSAT</span>
    </div>
    <ng-container *ngFor="let agent of agents()">
      <div class="data-table-row cursor-pointer"
           style="grid-template-columns:1fr 120px 90px 90px 140px 140px 100px"
           (click)="toggleExpand(agent.agentId)">
        <div>
          <p class="font-semibold text-gray-900 text-sm">{{ agent.agentName }}</p>
          <p class="text-xs text-slate-400">{{ agent.agentEmail }}</p>
        </div>
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full shrink-0"
                [ngClass]="statusDotClass(agent.availabilityStatus)"></span>
          <span class="text-xs text-gray-600 capitalize">{{ agent.availabilityStatus.toLowerCase() }}</span>
        </div>
        <span class="text-sm font-semibold text-green-600">{{ agent.ticketsResolved }}</span>
        <span class="text-sm text-amber-600 font-semibold">{{ agent.ticketsOpen }}</span>
        <span class="text-sm text-gray-700">{{ formatMinutes(agent.avgFirstResponseMinutes) }}</span>
        <span class="text-sm text-gray-700">{{ formatMinutes(agent.avgResolutionMinutes) }}</span>
        <span class="text-sm font-bold" [ngClass]="csatClass(agent.csatScore)">
          {{ agent.csatScore > 0 ? agent.csatScore.toFixed(1) : '—' }}
        </span>
      </div>

      <!-- Expanded detail row -->
      <div *ngIf="expandedId() === agent.agentId"
           class="px-6 py-4 bg-slate-50 border-t border-gray-100">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p class="text-xs text-slate-400 mb-1">First Response Time</p>
            <div class="flex items-center gap-2">
              <div class="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                <div class="h-full rounded-full bg-indigo-400"
                     [style.width]="barWidth(agent.avgFirstResponseMinutes, maxFirstResponse())"></div>
              </div>
              <span class="text-xs font-bold text-indigo-700 shrink-0">{{ formatMinutes(agent.avgFirstResponseMinutes) }}</span>
            </div>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">Resolution Time</p>
            <div class="flex items-center gap-2">
              <div class="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                <div class="h-full rounded-full bg-blue-400"
                     [style.width]="barWidth(agent.avgResolutionMinutes, maxResolution())"></div>
              </div>
              <span class="text-xs font-bold text-blue-700 shrink-0">{{ formatMinutes(agent.avgResolutionMinutes) }}</span>
            </div>
          </div>
          <div>
            <p class="text-xs text-slate-400 mb-1">CSAT Score</p>
            <div class="flex items-center gap-2">
              <div class="flex-1 h-2 rounded-full bg-gray-200 overflow-hidden">
                <div class="h-full rounded-full bg-emerald-400"
                     [style.width]="agent.csatScore > 0 ? (agent.csatScore / 5 * 100) + '%' : '0%'"></div>
              </div>
              <span class="text-xs font-bold text-emerald-700 shrink-0">
                {{ agent.csatScore > 0 ? agent.csatScore.toFixed(1) + ' / 5' : 'No data' }}
              </span>
            </div>
          </div>
        </div>
        <div class="mt-3 flex gap-4 text-xs text-slate-500">
          <span><strong class="text-green-600">{{ agent.ticketsResolved }}</strong> resolved this period</span>
          <span><strong class="text-amber-600">{{ agent.ticketsOpen }}</strong> currently open</span>
        </div>
      </div>
    </ng-container>
  </div>

  <div *ngIf="!loading() && agents().length === 0"
       class="bg-white rounded-xl border border-gray-100 p-12 text-center"
       style="box-shadow:0 1px 3px rgba(0,0,0,0.06)">
    <i class="pi pi-users text-4xl text-slate-300 mb-3 block"></i>
    <p class="text-gray-500 text-sm">No agent data available for this period.</p>
  </div>

  <!-- Loading skeleton -->
  <div *ngIf="loading()" class="space-y-4">
    <div class="grid grid-cols-4 gap-4">
      <p-skeleton *ngFor="let i of skeletonItems" height="100px" borderRadius="12px"></p-skeleton>
    </div>
    <p-skeleton height="300px" borderRadius="12px"></p-skeleton>
  </div>
</div>
  `,
})
export class AgentPerformanceComponent implements OnInit {
  private http = inject(HttpClient);

  agents = signal<AgentPerformanceDto[]>([]);
  loading = signal(true);
  expandedId = signal<string | null>(null);
  selectedDays = 30;
  skeletonItems = [1, 2, 3, 4];

  periods = [
    { label: '7 days', days: 7 },
    { label: '30 days', days: 30 },
    { label: '90 days', days: 90 },
  ];

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const to = new Date().toISOString();
    const from = new Date(Date.now() - this.selectedDays * 86400000).toISOString();
    this.http.get<any>(`${environment.apiUrl}/analytics/agents`, { params: { from, to } }).subscribe({
      next: r => { this.agents.set(r.data || r); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  setPeriod(days: number) { this.selectedDays = days; this.load(); }

  toggleExpand(id: string) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  totalResolved(): number { return this.agents().reduce((s, a) => s + a.ticketsResolved, 0); }
  totalOpen(): number { return this.agents().reduce((s, a) => s + a.ticketsOpen, 0); }
  avgFirstResponse(): number {
    const active = this.agents().filter(a => a.avgFirstResponseMinutes > 0);
    if (!active.length) return 0;
    return Math.round(active.reduce((s, a) => s + a.avgFirstResponseMinutes, 0) / active.length);
  }
  avgCsat(): string {
    const active = this.agents().filter(a => a.csatScore > 0);
    if (!active.length) return '—';
    return (active.reduce((s, a) => s + a.csatScore, 0) / active.length).toFixed(1);
  }
  maxFirstResponse(): number { return Math.max(1, ...this.agents().map(a => a.avgFirstResponseMinutes)); }
  maxResolution(): number { return Math.max(1, ...this.agents().map(a => a.avgResolutionMinutes)); }

  formatMinutes(min: number): string {
    if (!min) return '—';
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
  }

  barWidth(value: number, max: number): string {
    if (!value || !max) return '0%';
    return Math.min(100, (value / max) * 100) + '%';
  }

  statusDotClass(status: string): string {
    switch (status) {
      case 'ONLINE': return 'bg-green-500';
      case 'BUSY': return 'bg-amber-500';
      case 'AWAY': return 'bg-orange-400';
      default: return 'bg-gray-400';
    }
  }

  csatClass(score: number): string {
    if (!score) return 'text-gray-400';
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-amber-600';
    return 'text-red-500';
  }

  exportCsv() {
    const headers = ['Name', 'Email', 'Status', 'Resolved', 'Open', 'Avg First Response (min)', 'Avg Resolution (min)', 'CSAT'];
    const rows = this.agents().map(a => [
      a.agentName, a.agentEmail, a.availabilityStatus,
      a.ticketsResolved, a.ticketsOpen,
      a.avgFirstResponseMinutes.toFixed(1),
      a.avgResolutionMinutes.toFixed(1),
      a.csatScore > 0 ? a.csatScore.toFixed(1) : '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent-performance-${this.selectedDays}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
