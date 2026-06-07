import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { ChartModule } from 'primeng/chart';
import { AnalyticsService, AnalyticsData } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, ChartModule, ButtonModule, SkeletonModule],
  template: `
<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Analytics</h1>
      <p class="text-sm text-slate-400 mt-0.5">Performance metrics and trends</p>
    </div>
    <div class="flex gap-2">
      <button *ngFor="let p of periods" pButton [outlined]="selectedDays !== p.days"
              [label]="p.label" size="small" (click)="setPeriod(p.days)"></button>
    </div>
  </div>

  <!-- KPI cards -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4" *ngIf="data()">
    <div class="stat-card p-5">
      <div class="stat-card-accent bg-blue-500"></div>
      <div class="pl-2">
        <p class="text-3xl font-black text-gray-900" style="letter-spacing:-0.04em">{{ data()!.totalTickets }}</p>
        <p class="text-xs text-slate-400 mt-1.5">Total Tickets</p>
      </div>
    </div>
    <div class="stat-card p-5">
      <div class="stat-card-accent bg-green-500"></div>
      <div class="pl-2">
        <p class="text-3xl font-black text-gray-900" style="letter-spacing:-0.04em">{{ data()!.resolvedTickets }}</p>
        <p class="text-xs text-slate-400 mt-1.5">Resolved</p>
      </div>
    </div>
    <div class="stat-card p-5">
      <div class="stat-card-accent bg-indigo-500"></div>
      <div class="pl-2">
        <p class="text-3xl font-black text-gray-900" style="letter-spacing:-0.04em">{{ data()!.avgResolutionHours }}h</p>
        <p class="text-xs text-slate-400 mt-1.5">Avg Resolution</p>
      </div>
    </div>
    <div class="stat-card p-5">
      <div class="stat-card-accent bg-emerald-500"></div>
      <div class="pl-2">
        <p class="text-3xl font-black text-gray-900" style="letter-spacing:-0.04em">{{ data()!.resolutionRate }}%</p>
        <p class="text-xs text-slate-400 mt-1.5">Resolution Rate</p>
      </div>
    </div>
  </div>

  <!-- Chart -->
  <div *ngIf="data()" class="bg-white rounded-xl border border-gray-100 p-6" style="box-shadow:0 1px 3px rgba(0,0,0,0.06)">
    <h2 class="font-bold text-gray-900 mb-4 text-sm">Ticket Volume</h2>
    <div style="height:260px">
      <p-chart type="line" [data]="chartData" [options]="chartOptions" height="260"></p-chart>
    </div>
  </div>

  <!-- Agent table -->
  <div *ngIf="data() && data()!.agentStats.length > 0" class="bg-white rounded-xl border border-gray-100 overflow-hidden" style="box-shadow:0 1px 3px rgba(0,0,0,0.06)">
    <div class="px-6 py-4 border-b border-gray-100">
      <h2 class="font-bold text-gray-900 text-sm">Agent Performance</h2>
    </div>
    <div class="data-table-header" style="grid-template-columns:1fr 100px 100px 100px">
      <span>Agent</span><span>Total</span><span>Resolved</span><span>Rate</span>
    </div>
    <div *ngFor="let agent of data()!.agentStats"
         class="data-table-row" style="grid-template-columns:1fr 100px 100px 100px">
      <span class="font-semibold text-gray-900 text-sm">{{ agent.agentName }}</span>
      <span class="text-sm text-gray-700">{{ agent.total }}</span>
      <span class="text-sm text-green-600 font-semibold">{{ agent.resolved }}</span>
      <span class="text-sm font-bold" [ngClass]="getRateClass(agent.resolutionRate)">{{ agent.resolutionRate }}%</span>
    </div>
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
export class AnalyticsComponent implements OnInit {
  data = signal<AnalyticsData | null>(null);
  loading = signal(true);
  selectedDays = 30;
  chartData: any = {};
  chartOptions: any = {};
  skeletonItems = [1, 2, 3, 4];

  periods = [
    { label: '7 days', days: 7 },
    { label: '30 days', days: 30 },
    { label: '90 days', days: 90 },
  ];

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.analyticsService.getAnalytics(this.selectedDays).subscribe({
      next: d => { this.data.set(d); this.buildChartData(d); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  setPeriod(days: number) { this.selectedDays = days; this.load(); }

  getRateClass(rate: number): string {
    return rate >= 70 ? 'text-green-600' : 'text-amber-600';
  }

  buildChartData(data: AnalyticsData) {
    this.chartData = {
      labels: data.dailyCounts.map(d => d.date),
      datasets: [{
        label: 'Tickets',
        data: data.dailyCounts.map(d => d.count),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37,99,235,0.08)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#2563EB',
        pointRadius: 3,
      }]
    };
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } },
        x: { grid: { display: false } }
      }
    };
  }
}
