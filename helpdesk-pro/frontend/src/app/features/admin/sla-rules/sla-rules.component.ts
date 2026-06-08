import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models';
import { map } from 'rxjs/operators';

interface SlaRule {
  id: string;
  name: string;
  priority: string;
  thresholdPercent: number;
  action: string;
  active: boolean;
}

@Component({
  selector: 'app-sla-rules',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">SLA Escalation Rules</h1>
          <p class="text-slate-400 text-sm mt-0.5">Auto-notify or reassign tickets when SLA is at risk</p>
        </div>
        <button (click)="toggleForm()"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style="background:linear-gradient(135deg,#6366F1,#4F46E5)">
          <i class="pi pi-plus" style="font-size:14px"></i>
          Add Rule
        </button>
      </div>

      <!-- Add Form -->
      <div *ngIf="showForm()" class="bg-white rounded-2xl border border-gray-100 p-6"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <h3 class="font-bold text-gray-900 mb-4 text-sm">New Escalation Rule</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Rule Name</label>
            <input pInputText [(ngModel)]="newRule.name" class="w-full" placeholder="e.g. Critical 80%" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Priority</label>
            <p-select [options]="priorityOptions" [(ngModel)]="newRule.priority"
                      optionLabel="label" optionValue="value" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Threshold %</label>
            <input pInputText type="number" [(ngModel)]="newRule.thresholdPercent" class="w-full" placeholder="80" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Action</label>
            <p-select [options]="actionOptions" [(ngModel)]="newRule.action"
                      optionLabel="label" optionValue="value" class="w-full" />
          </div>
        </div>
        <div class="flex gap-3 mt-5">
          <button (click)="saveRule()"
                  class="px-5 py-2 rounded-xl text-sm font-bold text-white"
                  style="background:#6366F1">
            Save Rule
          </button>
          <button (click)="toggleForm()"
                  class="px-5 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>

      <!-- Rules Table -->
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <div *ngIf="loading()" class="p-8 text-center text-slate-400 text-sm">Loading...</div>
        <div *ngIf="!loading() && rules().length === 0" class="p-12 text-center">
          <i class="pi pi-clock text-4xl text-slate-200 mb-3 block"></i>
          <p class="text-slate-400 text-sm">No escalation rules defined</p>
        </div>
        <table *ngIf="!loading() && rules().length > 0" class="w-full">
          <thead>
            <tr style="border-bottom:1px solid #F1F5F9;background:#FAFAFA">
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Priority</th>
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Threshold</th>
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Action</th>
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let rule of rules()" style="border-bottom:1px solid #F8FAFC"
                class="hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3.5 text-sm font-semibold text-gray-800">{{ rule.name }}</td>
              <td class="px-5 py-3.5">
                <span class="text-xs font-bold px-2.5 py-1 rounded-full"
                      [ngStyle]="priorityBadgeStyle(rule.priority)">
                  {{ rule.priority }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-sm text-gray-700">{{ rule.thresholdPercent }}%</td>
              <td class="px-5 py-3.5">
                <span class="text-xs font-semibold px-2 py-1 rounded"
                      style="background:#F0FDF4;color:#166534">
                  {{ rule.action }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <span *ngIf="rule.active"
                      class="text-xs font-bold px-2.5 py-1 rounded-full"
                      style="background:#DCFCE7;color:#15803D">Active</span>
                <span *ngIf="!rule.active"
                      class="text-xs font-medium text-slate-400">Inactive</span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <button (click)="deleteRule(rule)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <i class="pi pi-trash" style="font-size:14px"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class SlaRulesComponent implements OnInit {
  rules = signal<SlaRule[]>([]);
  loading = signal(true);
  showForm = signal(false);

  newRule: Partial<SlaRule> = {
    name: '', priority: 'HIGH', thresholdPercent: 80, action: 'NOTIFY_AGENT'
  };

  priorityOptions = [
    { label: 'Critical', value: 'CRITICAL' },
    { label: 'High', value: 'HIGH' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'Low', value: 'LOW' },
  ];

  actionOptions = [
    { label: 'Notify Agent', value: 'NOTIFY_AGENT' },
    { label: 'Notify Admin', value: 'NOTIFY_ADMIN' },
    { label: 'Reassign to Admin', value: 'REASSIGN_ADMIN' },
  ];

  constructor(private http: HttpClient, private messageService: MessageService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<ApiResponse<SlaRule[]>>(`${environment.apiUrl}/sla-rules`)
      .pipe(map(r => r.data))
      .subscribe({
        next: rules => { this.rules.set(rules); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  toggleForm() {
    this.showForm.update(v => !v);
    this.newRule = { name: '', priority: 'HIGH', thresholdPercent: 80, action: 'NOTIFY_AGENT' };
  }

  saveRule() {
    if (!this.newRule.name) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Name is required' });
      return;
    }
    this.http.post<ApiResponse<SlaRule>>(`${environment.apiUrl}/sla-rules`, this.newRule)
      .pipe(map(r => r.data))
      .subscribe({
        next: rule => {
          this.rules.update(list => [...list, rule]);
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Rule created' });
          this.toggleForm();
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create rule' }),
      });
  }

  deleteRule(rule: SlaRule) {
    this.http.delete(`${environment.apiUrl}/sla-rules/${rule.id}`).subscribe({
      next: () => {
        this.rules.update(list => list.filter(r => r.id !== rule.id));
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Rule deleted' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete rule' }),
    });
  }

  priorityBadgeStyle(priority: string): Record<string, string> {
    const map: Record<string, Record<string, string>> = {
      CRITICAL: { background: '#FEF2F2', color: '#DC2626' },
      HIGH: { background: '#FFF7ED', color: '#C2410C' },
      MEDIUM: { background: '#FFF7ED', color: '#D97706' },
      LOW: { background: '#F0FDF4', color: '#16A34A' },
    };
    return map[priority] || { background: '#F1F5F9', color: '#475569' };
  }
}
