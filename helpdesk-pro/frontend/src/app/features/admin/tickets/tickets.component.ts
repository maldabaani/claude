import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { CheckboxModule } from 'primeng/checkbox';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { Ticket, TicketStatus, Priority } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-admin-tickets',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule,
    ButtonModule, SelectModule, PaginatorModule, CheckboxModule,
    StatusBadgeComponent, PriorityBadgeComponent, TimeAgoPipe, SkeletonLoaderComponent],
  template: `
    <div class="space-y-5">

      <!-- Page header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">All Tickets</h1>
          <p class="text-sm text-slate-400 mt-0.5">{{ totalElements() }} total tickets across all departments</p>
        </div>
        <button *ngIf="selected.size > 0"
                (click)="bulkDelete()"
                class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style="background:#EF4444;box-shadow:0 2px 6px rgba(239,68,68,0.3)">
          <i class="pi pi-trash" style="font-size:16px"></i>
          Delete ({{ selected.size }})
        </button>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <i class="pi pi-filter text-slate-400 shrink-0" style="font-size:16px"></i>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter by:</span>

        <p-select [options]="statusOptions" [(ngModel)]="selectedStatus" (onChange)="load()"
                  optionLabel="label" optionValue="value" placeholder="All statuses"
                  [style]="{'width':'150px'}" />

        <p-select [options]="priorityOptions" [(ngModel)]="selectedPriority" (onChange)="load()"
                  optionLabel="label" optionValue="value" placeholder="All priorities"
                  [style]="{'width':'150px'}" />

        <button (click)="reset()"
                class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors border border-gray-200">
          <i class="pi pi-refresh" style="font-size:14px"></i>
          Reset
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 1px 3px rgba(0,0,0,0.06)">

        <!-- Table header -->
        <div class="grid gap-3 items-center px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider"
             style="grid-template-columns:32px 130px 1fr 90px 110px 120px 80px;background:#FAFAFA;border-bottom:1px solid #F1F5F9">
          <span></span>
          <span>Ticket ID</span>
          <span>Subject</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Assignee</span>
          <span>Age</span>
        </div>

        <app-skeleton-loader *ngIf="loading()" type="table" [count]="10" class="block px-4 py-2" />

        <div *ngIf="!loading()">
          <div *ngFor="let ticket of tickets(); let last = last"
               class="grid gap-3 items-center px-4 py-3.5 hover:bg-slate-50/70 transition-colors group"
               style="grid-template-columns:32px 130px 1fr 90px 110px 120px 80px"
               [style.border-bottom]="!last ? '1px solid #F8FAFC' : 'none'">
            <p-checkbox [binary]="true" [ngModel]="selected.has(ticket.id)"
                        (ngModelChange)="toggle(ticket.id)" (click)="$event.stopPropagation()" />
            <a [routerLink]="['/admin/tickets', ticket.id]"
               class="text-xs font-mono font-bold hover:underline" style="color:#2563EB">
              {{ ticket.ticketNumber }}
            </a>
            <a [routerLink]="['/admin/tickets', ticket.id]"
               class="text-sm font-semibold text-gray-900 truncate hover:text-blue-600 transition-colors">
              {{ ticket.title }}
            </a>
            <app-priority-badge [priority]="ticket.priority" />
            <app-status-badge [status]="ticket.status" />
            <div class="flex items-center gap-2 min-w-0">
              <div *ngIf="ticket.assignedAgent"
                   class="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                   style="background:linear-gradient(135deg,#6366F1,#4F46E5)">
                {{ ticket.assignedAgent.fullName.charAt(0) }}
              </div>
              <span class="text-xs text-slate-500 truncate">{{ ticket.assignedAgent?.fullName || '—' }}</span>
            </div>
            <span class="text-xs text-slate-400 font-medium">{{ ticket.createdAt | timeAgo }}</span>
          </div>

          <div *ngIf="tickets().length === 0" class="py-16 text-center">
            <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                 style="background:#F8FAFC;border:2px dashed #E2E8F0">
              <i class="pi pi-search" style="font-size:28px;color:#CBD5E1"></i>
            </div>
            <p class="text-sm font-semibold text-slate-400">No tickets found</p>
            <p class="text-xs text-slate-300 mt-1">Try adjusting your filters</p>
          </div>
        </div>
      </div>

      <p-paginator [totalRecords]="totalElements()" [rows]="pageSize" (onPageChange)="onPage($event)"
                   styleClass="bg-white rounded-xl border border-gray-100"
                   [style]="{'box-shadow':'0 1px 3px rgba(0,0,0,0.04)'}" />
    </div>
  `,
})
export class AdminTicketsComponent implements OnInit {
  tickets = signal<Ticket[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageSize = 15;
  currentPage = 0;
  selected = new Set<string>();

  statuses: TicketStatus[] = ['NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'RESOLVED', 'CLOSED'];
  priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  selectedStatus = '';
  selectedPriority = '';
  searchQuery = signal('');

  statusOptions = [
    { label: 'All statuses', value: '' },
    ...['NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'RESOLVED', 'CLOSED'].map(s => ({
      label: s.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      value: s
    }))
  ];

  priorityOptions = [
    { label: 'All priorities', value: '' },
    ...['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => ({ label: p, value: p }))
  ];

  constructor(private ticketService: TicketService, private fb: FormBuilder, private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['search']) { this.searchQuery.set(p['search']); }
      this.load();
    });
  }

  load() {
    this.loading.set(true);
    const params: any = { page: this.currentPage, size: this.pageSize };
    if (this.selectedStatus) params.status = this.selectedStatus;
    if (this.selectedPriority) params.priority = this.selectedPriority;
    if (this.searchQuery()) params.search = this.searchQuery();
    this.ticketService.getTickets(params).subscribe({
      next: (p) => { this.tickets.set(p.content); this.totalElements.set(p.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggle(id: string) { this.selected.has(id) ? this.selected.delete(id) : this.selected.add(id); }

  reset() {
    this.selectedStatus = '';
    this.selectedPriority = '';
    this.searchQuery.set('');
    this.load();
  }

  onPage(e: PaginatorState) { this.currentPage = e.page ?? 0; this.load(); }

  bulkDelete() {
    if (!confirm(`Delete ${this.selected.size} ticket(s)? This cannot be undone.`)) return;
    const ids = [...this.selected];
    Promise.all(ids.map(id => this.ticketService.deleteTicket(id).toPromise()))
      .then(() => { this.selected.clear(); this.load(); });
  }
}
