import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { PlatformService } from '../../core/services/platform.service';

interface KpiCard { label: string; value: string | number; icon: string; color: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule, SkeletonModule],
  template: `
    <div class="page-container">
      <h2 class="card-title">Welcome back</h2>
      <p class="mb-4" style="color:var(--text-color-secondary)">
        {{ auth.getCurrentUser()?.email }} &nbsp;·&nbsp;
        <strong>{{ auth.getCurrentUser()?.role }}</strong>
      </p>

      <div class="grid">
        @for (card of kpis(); track card.label) {
          <div class="col-12 md:col-6 lg:col-3">
            <p-card styleClass="kpi-card">
              <div class="kpi-inner">
                <div class="kpi-icon" [style.background]="card.color">
                  <i [class]="card.icon"></i>
                </div>
                <div>
                  @if (loading()) {
                    <p-skeleton width="60px" height="28px" styleClass="mb-1" />
                  } @else {
                    <div class="kpi-value">{{ card.value }}</div>
                  }
                  <div class="kpi-label">{{ card.label }}</div>
                </div>
              </div>
            </p-card>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .kpi-card .kpi-inner { display:flex; align-items:center; gap:1rem; }
    .kpi-icon { width:52px; height:52px; border-radius:12px; display:flex;
                align-items:center; justify-content:center;
                i { font-size:1.5rem; color:#fff; } }
    .kpi-value { font-size:1.8rem; font-weight:700; line-height:1; }
    .kpi-label { color:var(--text-color-secondary); font-size:0.85rem; margin-top:4px; }
  `]
})
export class DashboardComponent implements OnInit {
  kpis = signal<KpiCard[]>([
    { label: 'Total Patients',   value: '—', icon: 'pi pi-users',    color: '#3b82f6' },
    { label: 'Today Appts',      value: '—', icon: 'pi pi-calendar', color: '#10b981' },
    { label: 'Active Visits',    value: '—', icon: 'pi pi-clock',    color: '#f59e0b' },
    { label: 'Completed Today',  value: '—', icon: 'pi pi-check',    color: '#6366f1' }
  ]);
  loading = signal(true);

  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private platformSvc: PlatformService
  ) {}

  ngOnInit() {
    const user = this.auth.getCurrentUser();
    if (user?.userType === 'PLATFORM') {
      this.loadPlatformStats();
    } else {
      this.loadTenantStats();
    }
  }

  private loadPlatformStats() {
    this.platformSvc.listTenants().subscribe({
      next: tenants => {
        const active = tenants.filter(t => t.active).length;
        this.kpis.set([
          { label: 'Total Clinics',  value: tenants.length, icon: 'pi pi-building', color: '#3b82f6' },
          { label: 'Active Clinics', value: active,         icon: 'pi pi-check',    color: '#10b981' },
          { label: 'Inactive',       value: tenants.length - active, icon: 'pi pi-times', color: '#ef4444' },
          { label: 'Platform',       value: 'Admin',        icon: 'pi pi-shield',   color: '#6366f1' }
        ]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadTenantStats() {
    this.http.get<any>('/api/v1/dashboard/stats').subscribe({
      next: stats => {
        this.kpis.set([
          { label: 'Total Patients',  value: stats.totalPatients,    icon: 'pi pi-users',    color: '#3b82f6' },
          { label: 'Today Appts',     value: stats.todayAppointments, icon: 'pi pi-calendar', color: '#10b981' },
          { label: 'Active Visits',   value: stats.activeVisits,     icon: 'pi pi-clock',    color: '#f59e0b' },
          { label: 'Completed Today', value: stats.completedToday,   icon: 'pi pi-check',    color: '#6366f1' }
        ]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
