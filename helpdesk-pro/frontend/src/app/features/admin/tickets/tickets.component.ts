import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../core/services/ticket.service';
import { SavedViewService, SavedView } from '../../../core/services/saved-view.service';
import { environment } from '../../../../environments/environment';
import { Ticket, TicketStatus, Priority } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-admin-tickets',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, FormsModule, HttpClientModule,
    ButtonModule, SelectModule, PaginatorModule, CheckboxModule, DialogModule, InputTextModule,
    StatusBadgeComponent, PriorityBadgeComponent, TimeAgoPipe, SkeletonLoaderComponent],
  template: `
    <div class="space-y-5">

      <!-- Page header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">All Tickets</h1>
          <p class="text-sm text-slate-400 mt-0.5">{{ totalElements() }} total tickets across all departments</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="exportCsv()"
                  class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style="background:#059669;box-shadow:0 2px 6px rgba(5,150,105,0.3)">
            <i class="pi pi-download" style="font-size:16px"></i>
            Export CSV
          </button>
          <button *ngIf="selected.size > 0"
                  (click)="bulkDelete()"
                  class="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style="background:#EF4444;box-shadow:0 2px 6px rgba(239,68,68,0.3)">
            <i class="pi pi-trash" style="font-size:16px"></i>
            Delete ({{ selected.size }})
          </button>
        </div>
      </div>

      <!-- Saved views chips -->
      <div *ngIf="savedViews().length > 0 || hasActiveFilter()" class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Saved Views:</span>
        <button *ngFor="let view of savedViews()"
                (click)="applyView(view)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                [style]="activeViewId === view.id ? 'background:#EFF6FF;border-color:#BFDBFE;color:#1D4ED8' : 'background:#F8FAFC;border-color:#E2E8F0;color:#475569'">
          <i class="pi pi-bookmark-fill" style="font-size:11px"></i>
          {{ view.name }}
          <button (click)="deleteView(view.id, $event)"
                  class="hover:text-red-500 transition-colors ml-0.5">
            <i class="pi pi-times" style="font-size:10px"></i>
          </button>
        </button>
        <button *ngIf="hasActiveFilter()"
                (click)="openSaveDialog()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-dashed transition-all hover:bg-blue-50"
                style="border-color:#93C5FD;color:#2563EB">
          <i class="pi pi-plus" style="font-size:11px"></i>
          Save current filter
        </button>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <i class="pi pi-filter text-slate-400 shrink-0" style="font-size:16px"></i>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter by:</span>

        <p-select [options]="statusOptions" [(ngModel)]="selectedStatus" (onChange)="onFilterChange()"
                  optionLabel="label" optionValue="value" placeholder="All statuses"
                  [style]="{'width':'150px'}" />

        <p-select [options]="priorityOptions" [(ngModel)]="selectedPriority" (onChange)="onFilterChange()"
                  optionLabel="label" optionValue="value" placeholder="All priorities"
                  [style]="{'width':'150px'}" />

        <button (click)="reset()"
                class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors border border-gray-200">
          <i class="pi pi-refresh" style="font-size:14px"></i>
          Reset
        </button>

        <button *ngIf="hasActiveFilter() && savedViews().length === 0"
                (click)="openSaveDialog()"
                class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-dashed transition-colors hover:bg-blue-50"
                style="border-color:#93C5FD;color:#2563EB">
          <i class="pi pi-bookmark" style="font-size:14px"></i>
          Save filter
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

      <!-- Save view dialog -->
      <p-dialog header="Save Filter View" [(visible)]="showSaveDialog" [modal]="true" [style]="{width:'380px'}">
        <div class="space-y-4 py-2">
          <div>
            <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">View Name</label>
            <input pInputText class="w-full" placeholder="e.g. Open Critical Tickets" [(ngModel)]="newViewName" />
          </div>
        </div>
        <ng-template pTemplate="footer">
          <button (click)="showSaveDialog = false"
                  class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button (click)="saveView()"
                  [disabled]="!newViewName.trim()"
                  class="px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50 ml-2"
                  style="background:#2563EB">
            Save
          </button>
        </ng-template>
      </p-dialog>
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

  savedViews = signal<SavedView[]>([]);
  showSaveDialog = false;
  newViewName = '';
  activeViewId = '';

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

  constructor(
    private ticketService: TicketService,
    private savedViewService: SavedViewService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['search']) { this.searchQuery.set(p['search']); }
      this.load();
    });
    this.savedViewService.getAll().subscribe(views => this.savedViews.set(views));
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

  onFilterChange() {
    this.activeViewId = '';
    this.load();
  }

  hasActiveFilter(): boolean {
    return !!(this.selectedStatus || this.selectedPriority);
  }

  toggle(id: string) { this.selected.has(id) ? this.selected.delete(id) : this.selected.add(id); }

  reset() {
    this.selectedStatus = '';
    this.selectedPriority = '';
    this.searchQuery.set('');
    this.activeViewId = '';
    this.load();
  }

  onPage(e: PaginatorState) { this.currentPage = e.page ?? 0; this.load(); }

  exportCsv() {
    this.http.get(`${environment.apiUrl}/tickets/export?format=csv`, { responseType: 'blob' }).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tickets.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  openSaveDialog() {
    this.newViewName = '';
    this.showSaveDialog = true;
  }

  saveView() {
    if (!this.newViewName.trim()) return;
    const filterJson = JSON.stringify({ status: this.selectedStatus, priority: this.selectedPriority });
    this.savedViewService.create(this.newViewName.trim(), filterJson).subscribe(view => {
      this.savedViews.update(v => [view, ...v]);
      this.activeViewId = view.id;
      this.showSaveDialog = false;
    });
  }

  applyView(view: SavedView) {
    const filter = JSON.parse(view.filterJson);
    this.selectedStatus = filter.status || '';
    this.selectedPriority = filter.priority || '';
    this.activeViewId = view.id;
    this.load();
  }

  deleteView(id: string, event: Event) {
    event.stopPropagation();
    this.savedViewService.delete(id).subscribe(() => {
      this.savedViews.update(v => v.filter(sv => sv.id !== id));
      if (this.activeViewId === id) this.activeViewId = '';
    });
  }

  bulkDelete() {
    if (!confirm(`Delete ${this.selected.size} ticket(s)? This cannot be undone.`)) return;
    const ids = [...this.selected];
    Promise.all(ids.map(id => this.ticketService.deleteTicket(id).toPromise()))
      .then(() => { this.selected.clear(); this.load(); });
  }
}
