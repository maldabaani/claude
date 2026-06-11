import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';

interface RoundRobinConfig {
  id?: string;
  departmentId: string | null;
  isEnabled: boolean;
  lastAssignedAgentId: string | null;
}

interface Department {
  id: string;
  name: string;
}

interface DepartmentRow {
  department: Department;
  config: RoundRobinConfig;
  lastAssignedName: string | null;
}

@Component({
  selector: 'app-round-robin',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Round Robin Assignment</h1>
        <p class="text-slate-400 text-sm mt-0.5">Automatically distribute new tickets evenly across agents</p>
      </div>

      <div *ngIf="loading()" class="flex items-center justify-center py-20">
        <i class="pi pi-spin pi-spinner text-indigo-500" style="font-size:24px"></i>
      </div>

      <ng-container *ngIf="!loading()">
        <!-- Global Config -->
        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden" style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
          <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 class="font-bold text-gray-900 text-sm">Global Configuration</h2>
          </div>
          <div class="px-6 py-5 flex items-start gap-4">
            <label class="relative inline-flex items-center cursor-pointer mt-0.5">
              <input type="checkbox" class="sr-only peer" [checked]="globalConfig().isEnabled"
                     (change)="globalConfig().isEnabled = !globalConfig().isEnabled">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
            <div>
              <p class="text-sm font-semibold text-gray-800">Enable Global Round Robin</p>
              <p class="text-xs text-slate-400 mt-0.5">When enabled, tickets with no matching department config will be assigned globally in round-robin order across all agents.</p>
            </div>
          </div>
        </div>

        <!-- Department Configs -->
        <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden" style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
          <div class="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <h2 class="font-bold text-gray-900 text-sm">Department Configuration</h2>
          </div>
          <div *ngIf="departmentRows().length === 0" class="px-6 py-10 text-center text-slate-400 text-sm">
            No departments found.
          </div>
          <div class="divide-y divide-gray-50">
            <div *ngFor="let row of departmentRows()" class="flex items-center gap-4 px-6 py-4">
              <div class="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <i class="pi pi-building text-indigo-500" style="font-size:16px"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-800 truncate">{{ row.department.name }}</p>
                <p *ngIf="row.config.isEnabled && row.lastAssignedName" class="text-xs text-slate-400 mt-0.5">
                  Last assigned to: <span class="text-indigo-500 font-medium">{{ row.lastAssignedName }}</span>
                </p>
                <p *ngIf="row.config.isEnabled && !row.lastAssignedName" class="text-xs text-slate-400 mt-0.5">No assignments yet</p>
                <p *ngIf="!row.config.isEnabled" class="text-xs text-slate-400 mt-0.5">Round robin disabled for this department</p>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer" [checked]="row.config.isEnabled"
                       (change)="row.config.isEnabled = !row.config.isEnabled">
                <div class="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
          </div>
        </div>

        <!-- Save Button -->
        <div class="flex justify-end">
          <p-button label="Save Changes" icon="pi pi-check" [loading]="saving()" (onClick)="save()"></p-button>
        </div>
      </ng-container>
    </div>
  `,
})
export class RoundRobinComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  globalConfig = signal<RoundRobinConfig>({ departmentId: null, isEnabled: false, lastAssignedAgentId: null });
  departmentRows = signal<DepartmentRow[]>([]);

  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient, private msg: MessageService) {}

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    Promise.all([
      this.http.get<any>(`${this.base}/round-robin/config`).toPromise(),
      this.http.get<any>(`${this.base}/departments`).toPromise(),
    ]).then(([configRes, deptRes]) => {
      this.globalConfig.set(configRes.data);
      const departments: Department[] = deptRes.data?.content ?? deptRes.data ?? [];
      const rows: DepartmentRow[] = departments.map((dept: Department) => ({
        department: dept,
        config: { departmentId: dept.id, isEnabled: false, lastAssignedAgentId: null },
        lastAssignedName: null,
      }));
      this.departmentRows.set(rows);
      // Load per-department configs
      Promise.all(
        departments.map((dept: Department) =>
          this.http.get<any>(`${this.base}/round-robin/config/department/${dept.id}`).toPromise()
            .then(res => ({ deptId: dept.id, config: res.data as RoundRobinConfig }))
            .catch(() => ({ deptId: dept.id, config: { departmentId: dept.id, isEnabled: false, lastAssignedAgentId: null } as RoundRobinConfig }))
        )
      ).then(configs => {
        const updated = rows.map(row => {
          const found = configs.find(c => c.deptId === row.department.id);
          if (found) row.config = found.config;
          return row;
        });
        this.departmentRows.set([...updated]);
        this.loading.set(false);
      });
    }).catch(() => this.loading.set(false));
  }

  save() {
    this.saving.set(true);
    const global = this.globalConfig();
    const deptRows = this.departmentRows();
    Promise.all([
      this.http.put<any>(`${this.base}/round-robin/config`, { isEnabled: global.isEnabled }).toPromise(),
      ...deptRows.map(row =>
        this.http.put<any>(`${this.base}/round-robin/config/department/${row.department.id}`, { isEnabled: row.config.isEnabled }).toPromise()
      ),
    ]).then(() => {
      this.msg.add({ severity: 'success', summary: 'Saved', detail: 'Round robin configuration updated.' });
      this.saving.set(false);
    }).catch(() => {
      this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to save configuration.' });
      this.saving.set(false);
    });
  }
}
