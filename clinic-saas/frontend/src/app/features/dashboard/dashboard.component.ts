import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { AuthService } from '../../core/services/auth.service';

interface KpiCard { label: string; value: string; icon: string; color: string; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CardModule],
  template: `
    <div class="page-container">
      <h2 class="card-title">Welcome back, {{ auth.getCurrentUser()?.email }}</h2>
      <p class="mb-4" style="color:var(--text-color-secondary)">
        Role: <strong>{{ auth.getCurrentUser()?.role }}</strong>
      </p>
      <div class="grid">
        @for (card of kpis; track card.label) {
          <div class="col-12 md:col-6 lg:col-3">
            <p-card styleClass="kpi-card">
              <div class="kpi-inner">
                <div class="kpi-icon" [style.background]="card.color">
                  <i [class]="card.icon"></i>
                </div>
                <div>
                  <div class="kpi-value">{{ card.value }}</div>
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
    .kpi-icon { width:48px; height:48px; border-radius:12px; display:flex;
                align-items:center; justify-content:center;
                i { font-size:1.4rem; color:#fff; } }
    .kpi-value { font-size:1.6rem; font-weight:700; }
    .kpi-label { color:var(--text-color-secondary); font-size:0.85rem; }
  `]
})
export class DashboardComponent {
  kpis: KpiCard[] = [
    { label: 'Total Patients',   value: '—', icon: 'pi pi-users',    color: '#3b82f6' },
    { label: 'Today Appts',      value: '—', icon: 'pi pi-calendar', color: '#10b981' },
    { label: 'Pending',          value: '—', icon: 'pi pi-clock',    color: '#f59e0b' },
    { label: 'Completed Today',  value: '—', icon: 'pi pi-check',    color: '#6366f1' }
  ];

  constructor(public auth: AuthService) {}
}
