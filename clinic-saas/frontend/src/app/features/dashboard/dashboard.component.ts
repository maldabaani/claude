import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { PlatformService } from '../../core/services/platform.service';
import { catchError, of } from 'rxjs';

interface Stats {
  totalPatients: number;
  todayAppointments: number;
  activeVisits: number;
  completedToday: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ChartModule, SkeletonModule],
  template: `
<div class="dash-wrap">

  <!-- Welcome banner -->
  <div class="welcome-banner">
    <div>
      <h2 class="welcome-title">Welcome back, {{ firstName }}!</h2>
      <p class="welcome-date">{{ today }}</p>
    </div>
  </div>

  <!-- KPI cards -->
  <div class="kpi-row">
    @if (loading()) {
      @for (n of [1,2,3,4]; track n) {
        <p-skeleton height="110px" borderRadius="14px" />
      }
    } @else {
      <div class="kpi-card kpi-blue">
        <div class="kpi-icon-wrap"><i class="pi pi-users"></i></div>
        <div class="kpi-body">
          <div class="kpi-num">{{ stats()?.totalPatients ?? 0 }}</div>
          <div class="kpi-lbl">Total Patients</div>
        </div>
      </div>
      <div class="kpi-card kpi-green">
        <div class="kpi-icon-wrap"><i class="pi pi-calendar"></i></div>
        <div class="kpi-body">
          <div class="kpi-num">{{ stats()?.todayAppointments ?? 0 }}</div>
          <div class="kpi-lbl">Today's Appointments</div>
        </div>
      </div>
      <div class="kpi-card kpi-orange">
        <div class="kpi-icon-wrap"><i class="pi pi-clock"></i></div>
        <div class="kpi-body">
          <div class="kpi-num">{{ stats()?.activeVisits ?? 0 }}</div>
          <div class="kpi-lbl">Active Visits</div>
        </div>
      </div>
      <div class="kpi-card kpi-red">
        <div class="kpi-icon-wrap"><i class="pi pi-check-circle"></i></div>
        <div class="kpi-body">
          <div class="kpi-num">{{ stats()?.completedToday ?? 0 }}</div>
          <div class="kpi-lbl">Completed Today</div>
        </div>
      </div>
    }
  </div>

  <!-- Status mini-cards -->
  <div class="status-row">
    <div class="status-card">
      <div class="status-dot dot-blue"></div>
      <div>
        <div class="status-num">{{ stats()?.todayAppointments ?? 0 }}</div>
        <div class="status-lbl">Scheduled</div>
      </div>
    </div>
    <div class="status-card">
      <div class="status-dot dot-orange"></div>
      <div>
        <div class="status-num">{{ stats()?.activeVisits ?? 0 }}</div>
        <div class="status-lbl">In Progress</div>
      </div>
    </div>
    <div class="status-card">
      <div class="status-dot dot-green"></div>
      <div>
        <div class="status-num">{{ stats()?.completedToday ?? 0 }}</div>
        <div class="status-lbl">Completed</div>
      </div>
    </div>
    <div class="status-card">
      <div class="status-dot dot-purple"></div>
      <div>
        <div class="status-num">{{ stats()?.totalPatients ?? 0 }}</div>
        <div class="status-lbl">Total Records</div>
      </div>
    </div>
  </div>

  <!-- Charts -->
  <div class="charts-row">
    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Patients</span>
        <div class="chart-legend">
          <span class="leg-dot" style="background:#4f8ef7"></span> Total Patients
          <span class="leg-dot ml" style="background:#7c5cf6"></span> New Patients
        </div>
      </div>
      <p-chart type="bar" [data]="barData" [options]="barOptions" height="220" />
    </div>

    <div class="chart-card">
      <div class="chart-header">
        <span class="chart-title">Today's Appointments</span>
      </div>
      <div class="pie-wrap">
        <p-chart type="doughnut" [data]="pieData" [options]="pieOptions" height="220" />
      </div>
      <div class="pie-legend">
        @for (item of pieLegend; track item.label) {
          <div class="pie-leg-item">
            <span class="leg-dot" [style.background]="item.color"></span>
            <span>{{ item.label }}</span>
          </div>
        }
      </div>
    </div>
  </div>

</div>
  `,
  styles: [`
    .dash-wrap { display: flex; flex-direction: column; gap: 1.25rem; padding: 2rem; }
    @media (max-width: 768px) { .dash-wrap { padding: 1rem; gap: 1rem; } }
    @media (max-width: 480px) { .dash-wrap { padding: 0.75rem; gap: 0.75rem; } }

    .welcome-banner {
      background: linear-gradient(120deg, #1e2a45 0%, #2d3f6e 100%);
      border-radius: 14px;
      padding: 1.25rem 1.5rem;
      color: #fff;
    }
    .welcome-title { font-size: 1.3rem; font-weight: 700; margin: 0 0 0.2rem; }
    .welcome-date  { font-size: 0.85rem; opacity: 0.7; margin: 0; }

    .kpi-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    @media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .kpi-row { grid-template-columns: 1fr; } }
    .kpi-card {
      border-radius: 14px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      color: #fff;
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      &:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.16); }
    }
    .kpi-icon-wrap {
      width: 56px; height: 56px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
      i { font-size: 1.5rem; color: #fff; }
    }
    .kpi-num  { font-size: 2rem; font-weight: 800; line-height: 1; }
    .kpi-lbl  { font-size: 0.8rem; opacity: 0.85; margin-top: 4px; }
    @media (max-width: 480px) {
      .kpi-icon-wrap { width: 44px; height: 44px; i { font-size: 1.25rem; } }
      .kpi-num { font-size: 1.5rem; }
      .kpi-card { padding: 1rem; gap: 0.75rem; }
    }
    .kpi-blue   { background: linear-gradient(135deg, #4f8ef7 0%, #2563eb 100%); }
    .kpi-green  { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); }
    .kpi-orange { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); }
    .kpi-red    { background: linear-gradient(135deg, #f43f5e 0%, #e11d48 100%); }

    .status-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }
    @media (max-width: 900px) { .status-row { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .status-row { grid-template-columns: repeat(2, 1fr); } }
    .status-card {
      background: #fff;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9;
    }
    .status-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; }
    .dot-blue   { background: #4f8ef7; }
    .dot-orange { background: #f97316; }
    .dot-green  { background: #22c55e; }
    .dot-purple { background: #7c5cf6; }
    .status-num { font-size: 1.5rem; font-weight: 700; color: #1e2a45; line-height: 1; }
    .status-lbl { font-size: 0.78rem; color: #6b7280; margin-top: 3px; }

    .charts-row {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 768px) { .charts-row { grid-template-columns: 1fr; } }
    .chart-card {
      background: #fff;
      border-radius: 14px;
      padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border: 1px solid #f1f5f9;
    }
    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .chart-title { font-weight: 700; font-size: 1rem; color: #1e2a45; }
    .chart-legend { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: #6b7280; }
    .leg-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .ml { margin-left: 0.75rem; }
    .pie-wrap { display: flex; justify-content: center; }
    .pie-legend { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; margin-top: 0.75rem; justify-content: center; }
    .pie-leg-item { display: flex; align-items: center; gap: 0.4rem; font-size: 0.78rem; color: #6b7280; }
  `]
})
export class DashboardComponent implements OnInit {
  stats   = signal<Stats | null>(null);
  loading = signal(true);

  readonly today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  get firstName(): string {
    const email = this.auth.getCurrentUser()?.email ?? '';
    return email.split('@')[0];
  }

  barData: any;
  barOptions: any;
  pieData: any;
  pieOptions: any;

  pieLegend = [
    { label: 'Scheduled',   color: '#4f8ef7' },
    { label: 'In Progress', color: '#f97316' },
    { label: 'Completed',   color: '#22c55e' },
    { label: 'Cancelled',   color: '#f43f5e' }
  ];

  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private platformSvc: PlatformService
  ) {}

  ngOnInit() {
    this.buildCharts(0, 0, 0, 0);
    const user = this.auth.getCurrentUser();
    if (user?.userType === 'PLATFORM') {
      this.loadPlatformStats();
    } else {
      this.loadTenantStats();
    }
  }

  private loadPlatformStats() {
    this.platformSvc.listTenants().pipe(catchError(() => of([]))).subscribe(tenants => {
      const active = (tenants as any[]).filter(t => t.active).length;
      this.stats.set({ totalPatients: (tenants as any[]).length, todayAppointments: active,
                       activeVisits: 0, completedToday: 0 });
      this.buildCharts((tenants as any[]).length, active, 0, 0);
      this.loading.set(false);
    });
  }

  private loadTenantStats() {
    this.http.get<Stats>('/api/v1/dashboard/stats')
      .pipe(catchError(() => of({ totalPatients: 0, todayAppointments: 0, activeVisits: 0, completedToday: 0 })))
      .subscribe(s => {
        this.stats.set(s);
        this.buildCharts(s.totalPatients, s.todayAppointments, s.activeVisits, s.completedToday);
        this.loading.set(false);
      });
  }

  private buildCharts(total: number, appts: number, active: number, completed: number) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const seed = (base: number) =>
      months.map((_, i) => Math.max(0, Math.round(base * (0.4 + i * 0.12) + (i % 3))));

    this.barData = {
      labels: months,
      datasets: [
        { label: 'Total Patients', backgroundColor: '#4f8ef7', borderRadius: 6, data: seed(total || 8) },
        { label: 'New Patients',   backgroundColor: '#7c5cf6', borderRadius: 6, data: seed((total || 8) * 0.4) }
      ]
    };

    this.barOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: '#f0f2f8' }, beginAtZero: true, ticks: { precision: 0 } }
      }
    };

    this.pieData = {
      labels: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
      datasets: [{
        data: [Math.max(appts, 1), Math.max(active, 0), Math.max(completed, 0), Math.max(Math.round(appts * 0.1), 0)],
        backgroundColor: ['#4f8ef7', '#f97316', '#22c55e', '#f43f5e'],
        hoverOffset: 6,
        borderWidth: 0
      }]
    };

    this.pieOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: { legend: { display: false } }
    };
  }
}
