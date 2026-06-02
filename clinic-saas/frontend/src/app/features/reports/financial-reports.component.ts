import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { ChartModule } from 'primeng/chart';

interface FinancialReport {
  totalRevenue: number;
  totalPaid: number;
  totalOutstanding: number;
  totalInvoices: number;
  revenueByMonth: Record<string, number>;
  invoicesByStatus: Record<string, number>;
  paymentsByMethod: Record<string, number>;
}

@Component({
  selector: 'app-financial-reports',
  standalone: true,
  imports: [CommonModule, ChartModule],
  template: `
    <div class="page-container">

      <div class="rpt-header">
        <div>
          <h2 class="page-title">Financial Reports</h2>
          <p class="page-sub">Revenue, billing, and payment analytics</p>
        </div>
      </div>

      @if (loading()) {
        <div class="rpt-loading"><i class="pi pi-spinner pi-spin"></i> Loading report…</div>
      }

      @if (!loading() && report()) {
        <!-- KPI Row -->
        <div class="kpi-row">
          <div class="kpi-card blue">
            <div class="kpi-icon"><i class="pi pi-dollar"></i></div>
            <div class="kpi-body">
              <span class="kpi-label">Total Revenue</span>
              <span class="kpi-val">{{ report()!.totalRevenue | number:'1.2-2' }}</span>
            </div>
          </div>
          <div class="kpi-card green">
            <div class="kpi-icon"><i class="pi pi-check-circle"></i></div>
            <div class="kpi-body">
              <span class="kpi-label">Collected</span>
              <span class="kpi-val">{{ report()!.totalPaid | number:'1.2-2' }}</span>
            </div>
          </div>
          <div class="kpi-card red">
            <div class="kpi-icon"><i class="pi pi-exclamation-circle"></i></div>
            <div class="kpi-body">
              <span class="kpi-label">Outstanding</span>
              <span class="kpi-val">{{ report()!.totalOutstanding | number:'1.2-2' }}</span>
            </div>
          </div>
          <div class="kpi-card purple">
            <div class="kpi-icon"><i class="pi pi-file"></i></div>
            <div class="kpi-body">
              <span class="kpi-label">Total Invoices</span>
              <span class="kpi-val">{{ report()!.totalInvoices }}</span>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">

          <!-- Revenue by Month -->
          <div class="chart-card wide">
            <h3 class="chart-title">Revenue by Month</h3>
            <div class="chart-wrap">
              <p-chart type="bar" [data]="monthChartData()" [options]="barOptions" height="240px" />
            </div>
          </div>

          <!-- Status Breakdown -->
          <div class="chart-card">
            <h3 class="chart-title">Invoice Status</h3>
            <div class="chart-wrap chart-wrap-sm">
              <p-chart type="doughnut" [data]="statusChartData()" [options]="doughnutOptions" height="160px" />
            </div>
            <div class="legend-list">
              @for (entry of statusEntries(); track entry.label) {
                <div class="legend-row">
                  <span class="legend-dot" [style.background]="entry.color"></span>
                  <span class="legend-label">{{ entry.label }}</span>
                  <span class="legend-val">{{ entry.value }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Payment Method -->
          <div class="chart-card">
            <h3 class="chart-title">Payment Methods</h3>
            <div class="chart-wrap chart-wrap-sm">
              <p-chart type="doughnut" [data]="methodChartData()" [options]="doughnutOptions" height="160px" />
            </div>
            <div class="legend-list">
              @for (entry of methodEntries(); track entry.label) {
                <div class="legend-row">
                  <span class="legend-dot" [style.background]="entry.color"></span>
                  <span class="legend-label">{{ entry.label }}</span>
                  <span class="legend-val">{{ entry.value }}</span>
                </div>
              }
            </div>
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    .rpt-header  { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1.5rem; }
    .page-title  { font-size:1.375rem; font-weight:800; color:#1e2a45; letter-spacing:-.03em; margin:0; }
    .page-sub    { font-size:.875rem; color:#8a94a6; margin:.25rem 0 0; }
    .rpt-loading { text-align:center; padding:3rem; color:#8a94a6; font-size:.875rem; i{margin-right:.5rem;} }

    .kpi-row { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:1.5rem; @media(max-width:900px){grid-template-columns:repeat(2,1fr);} }

    .kpi-card {
      background:#fff; border-radius:14px; padding:1.125rem 1.25rem;
      display:flex; align-items:center; gap:1rem;
      box-shadow:0 1px 4px rgba(0,0,0,.06);
      border-left:4px solid transparent;
      &.blue   { border-color:#3b82f6; .kpi-icon{background:#eff6ff; color:#3b82f6;} }
      &.green  { border-color:#10b981; .kpi-icon{background:#ecfdf5; color:#10b981;} }
      &.red    { border-color:#ef4444; .kpi-icon{background:#fef2f2; color:#ef4444;} }
      &.purple { border-color:#8b5cf6; .kpi-icon{background:#f5f3ff; color:#8b5cf6;} }
    }
    .kpi-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; i{font-size:1.125rem;} }
    .kpi-body { display:flex; flex-direction:column; }
    .kpi-label { font-size:.72rem; font-weight:600; color:#8a94a6; text-transform:uppercase; letter-spacing:.06em; }
    .kpi-val   { font-size:1.375rem; font-weight:800; color:#1e2a45; letter-spacing:-.03em; }

    .charts-row { display:grid; grid-template-columns:2fr 1fr 1fr; gap:1rem; @media(max-width:1100px){grid-template-columns:1fr 1fr;} @media(max-width:700px){grid-template-columns:1fr;} }

    .chart-card {
      background:#fff; border-radius:14px; padding:1.25rem;
      box-shadow:0 1px 4px rgba(0,0,0,.06);
      &.wide { grid-column:1; @media(max-width:1100px){grid-column:1/-1;} }
    }
    .chart-title { font-size:.875rem; font-weight:700; color:#1e2a45; margin:0 0 1rem; }
    .chart-wrap    { position:relative; height:240px; }
    .chart-wrap-sm { position:relative; height:160px; }

    .legend-list { margin-top:.875rem; display:flex; flex-direction:column; gap:.375rem; }
    .legend-row  { display:flex; align-items:center; gap:.5rem; font-size:.775rem; }
    .legend-dot  { width:10px; height:10px; border-radius:3px; flex-shrink:0; }
    .legend-label{ flex:1; color:#374151; }
    .legend-val  { font-weight:700; color:#1e2a45; }
  `]
})
export class FinancialReportsComponent implements OnInit {

  report  = signal<FinancialReport | null>(null);
  loading = signal(true);

  private readonly STATUS_COLORS = ['#10b981','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#6b7280'];
  private readonly METHOD_COLORS = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#f97316'];

  barOptions: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 } } }
    }
  };

  doughnutOptions: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    cutout: '65%'
  };

  monthChartData = () => {
    const r = this.report(); if (!r) return { labels: [], datasets: [] };
    const labels = Object.keys(r.revenueByMonth).map(k => {
      const [y, m] = k.split('-');
      return new Date(+y, +m - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });
    return {
      labels,
      datasets: [{
        data: Object.values(r.revenueByMonth),
        backgroundColor: '#4f8ef7',
        borderRadius: 6,
        hoverBackgroundColor: '#2563eb'
      }]
    };
  };

  statusChartData = () => {
    const r = this.report(); if (!r) return { labels: [], datasets: [] };
    return {
      labels: Object.keys(r.invoicesByStatus),
      datasets: [{ data: Object.values(r.invoicesByStatus), backgroundColor: this.STATUS_COLORS, borderWidth: 0 }]
    };
  };

  methodChartData = () => {
    const r = this.report(); if (!r) return { labels: [], datasets: [] };
    return {
      labels: Object.keys(r.paymentsByMethod),
      datasets: [{ data: Object.values(r.paymentsByMethod), backgroundColor: this.METHOD_COLORS, borderWidth: 0 }]
    };
  };

  statusEntries = () => {
    const r = this.report(); if (!r) return [];
    return Object.entries(r.invoicesByStatus).map(([label, value], i) => ({
      label, value, color: this.STATUS_COLORS[i % this.STATUS_COLORS.length]
    }));
  };

  methodEntries = () => {
    const r = this.report(); if (!r) return [];
    return Object.entries(r.paymentsByMethod).map(([label, value], i) => ({
      label, value, color: this.METHOD_COLORS[i % this.METHOD_COLORS.length]
    }));
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<FinancialReport>('/api/v1/reports/financial')
      .pipe(catchError(() => of(null)))
      .subscribe(r => { this.report.set(r); this.loading.set(false); });
  }
}
