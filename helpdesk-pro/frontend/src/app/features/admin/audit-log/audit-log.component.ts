import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { AuditService, AuditLog } from '../../../core/services/audit.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, SelectModule, PaginatorModule, SkeletonLoaderComponent],
  template: `
    <div class="space-y-5">

      <!-- Page header -->
      <div>
        <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Audit Log</h1>
        <p class="text-sm text-slate-400 mt-0.5">Track all system activity and changes</p>
      </div>

      <!-- Filter bar -->
      <div class="flex items-center gap-3 flex-wrap p-4 bg-white rounded-xl border border-gray-100"
           style="box-shadow:0 1px 3px rgba(0,0,0,0.04)">
        <i class="pi pi-filter text-slate-400" style="font-size:16px"></i>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter:</span>

        <p-select [options]="entityTypeOptions" [(ngModel)]="selectedEntityType" (onChange)="load()"
                  optionLabel="label" optionValue="value" placeholder="All entities"
                  [style]="{'width':'160px'}" />

        <p-select [options]="actionOptions" [(ngModel)]="selectedAction" (onChange)="load()"
                  optionLabel="label" optionValue="value" placeholder="All actions"
                  [style]="{'width':'180px'}" />

        <button (click)="reset()"
                class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors border border-gray-200">
          <i class="pi pi-refresh" style="font-size:14px"></i>
          Reset
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 1px 3px rgba(0,0,0,0.06)">

        <!-- Header -->
        <div class="grid gap-3 items-center px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider"
             style="grid-template-columns:160px 120px 100px 140px 1fr;background:#FAFAFA;border-bottom:1px solid #F1F5F9">
          <span>Timestamp</span>
          <span>Actor</span>
          <span>Entity</span>
          <span>Action</span>
          <span>Details</span>
        </div>

        <app-skeleton-loader *ngIf="loading()" type="table" [count]="10" class="block px-4 py-2" />

        <div *ngIf="!loading()">
          <div *ngFor="let log of logs(); let last = last"
               class="grid gap-3 items-start px-5 py-3.5 hover:bg-slate-50/70 transition-colors"
               style="grid-template-columns:160px 120px 100px 140px 1fr"
               [style.border-bottom]="!last ? '1px solid #F8FAFC' : 'none'">

            <span class="text-xs text-slate-500 font-medium">{{ log.createdAt | date:'MMM d, h:mm a' }}</span>

            <span class="text-xs font-semibold text-gray-700 truncate">{{ log.performedByName || 'System' }}</span>

            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                  style="background:#EFF6FF;color:#1D4ED8;width:fit-content">
              {{ log.entityType }}
            </span>

            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                  [style]="getActionStyle(log.action) + ';width:fit-content'"
                  >
              {{ log.action }}
            </span>

            <div class="text-xs text-slate-500 truncate">
              <span *ngIf="log.newValue" class="font-mono">{{ log.newValue }}</span>
              <span *ngIf="!log.newValue" class="italic text-slate-300">—</span>
            </div>
          </div>

          <div *ngIf="logs().length === 0" class="py-16 text-center">
            <i class="pi pi-list" style="font-size:32px;color:#CBD5E1;display:block;margin-bottom:12px"></i>
            <p class="text-sm font-semibold text-slate-400">No audit logs found</p>
            <p class="text-xs text-slate-300 mt-1">Logs will appear here as actions are performed</p>
          </div>
        </div>
      </div>

      <p-paginator [totalRecords]="totalElements()" [rows]="pageSize" (onPageChange)="onPage($event)"
                   styleClass="bg-white rounded-xl border border-gray-100"
                   [style]="{'box-shadow':'0 1px 3px rgba(0,0,0,0.04)'}" />
    </div>
  `,
})
export class AuditLogComponent implements OnInit {
  logs = signal<AuditLog[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageSize = 20;
  currentPage = 0;

  selectedEntityType = '';
  selectedAction = '';

  entityTypeOptions = [
    { label: 'All entities', value: '' },
    { label: 'TICKET', value: 'TICKET' },
    { label: 'USER', value: 'USER' },
    { label: 'COMMENT', value: 'COMMENT' },
  ];

  actionOptions = [
    { label: 'All actions', value: '' },
    { label: 'CREATED', value: 'CREATED' },
    { label: 'UPDATED', value: 'UPDATED' },
    { label: 'DELETED', value: 'DELETED' },
    { label: 'STATUS_CHANGED', value: 'STATUS_CHANGED' },
    { label: 'ASSIGNED', value: 'ASSIGNED' },
  ];

  constructor(private auditService: AuditService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params: any = { page: this.currentPage, size: this.pageSize };
    if (this.selectedEntityType) params.entityType = this.selectedEntityType;
    if (this.selectedAction) params.action = this.selectedAction;
    this.auditService.getAuditLogs(params).subscribe({
      next: p => { this.logs.set(p.content); this.totalElements.set(p.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  reset() { this.selectedEntityType = ''; this.selectedAction = ''; this.load(); }

  onPage(e: PaginatorState) { this.currentPage = e.page ?? 0; this.load(); }

  getActionClass(action: string): string {
    const map: Record<string, string> = {
      CREATED: 'background:#F0FDF4;color:#166534',
      DELETED: 'background:#FEF2F2;color:#991B1B',
      STATUS_CHANGED: 'background:#EFF6FF;color:#1D4ED8',
      ASSIGNED: 'background:#FAF5FF;color:#6B21A8',
    };
    return '';
  }

  getActionStyle(action: string): string {
    const map: Record<string, string> = {
      CREATED: 'background:#F0FDF4;color:#166534',
      DELETED: 'background:#FEF2F2;color:#991B1B',
      STATUS_CHANGED: 'background:#EFF6FF;color:#1D4ED8',
      ASSIGNED: 'background:#FAF5FF;color:#6B21A8',
    };
    return map[action] || 'background:#F1F5F9;color:#475569';
  }
}
