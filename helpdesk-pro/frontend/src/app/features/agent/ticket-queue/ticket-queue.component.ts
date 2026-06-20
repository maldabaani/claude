import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChildren, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import gsap from 'gsap';
import { TicketService } from '../../../core/services/ticket.service';
import { UserService } from '../../../core/services/user.service';
import { SavedViewService, SavedView } from '../../../core/services/saved-view.service';
import { Ticket, TicketStatus, Priority } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { HlmTableComponent, HlmTdComponent, HlmThComponent, HlmTrowComponent } from '../../../shared/ui/hlm-table/hlm-table.component';
import { HlmButtonComponent } from '../../../shared/ui/hlm-button/hlm-button.component';
import { HlmBadgeComponent, BadgeVariants } from '../../../shared/ui/hlm-badge/hlm-badge.component';
import { HlmInputDirective } from '../../../shared/ui/hlm-input/hlm-input.component';
import { HlmCheckboxDirective } from '../../../shared/ui/hlm-checkbox/hlm-checkbox.component';
import { HlmSelectDirective } from '../../../shared/ui/hlm-select/hlm-select.component';
import { HlmPaginationComponent, HlmPageEvent } from '../../../shared/ui/hlm-pagination/hlm-pagination.component';

const PRIORITY_BADGE_VARIANT: Record<Priority, BadgeVariants['variant']> = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

@Component({
  selector: 'app-ticket-queue',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    StatusBadgeComponent, SkeletonLoaderComponent, TimeAgoPipe,
    HlmTableComponent, HlmTdComponent, HlmThComponent, HlmTrowComponent,
    HlmButtonComponent, HlmBadgeComponent, HlmInputDirective, HlmCheckboxDirective,
    HlmSelectDirective, HlmPaginationComponent,
  ],
  template: `
    <div class="space-y-5">

      <!-- Page header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Ticket Queue</h1>
          <p class="text-sm text-slate-400 mt-0.5">{{ totalElements() }} tickets total</p>
        </div>
      </div>

      <!-- ── Saved Views ── -->
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 1px 3px rgba(0,0,0,0.05)">
        <div class="flex items-center justify-between px-5 py-3"
             style="border-bottom:1px solid #F1F5F9;background:#FAFAFA">
          <div class="flex items-center gap-2">
            <i class="pi pi-bookmark text-slate-400" style="font-size:15px"></i>
            <span class="text-xs font-bold text-slate-500 uppercase tracking-wider">Saved Views</span>
          </div>
          <button hlmButton variant="outline" size="sm" (click)="showSaveForm.set(!showSaveForm())">
            <i class="pi pi-plus" style="font-size:12px"></i>
            Save Current Filters
          </button>
        </div>

        <!-- Save form -->
        <div *ngIf="showSaveForm()" class="px-5 py-3 flex items-center gap-3"
             style="border-bottom:1px solid #F1F5F9;background:#F8FAFC">
          <input hlmInput [(ngModel)]="newViewName"
                 placeholder="View name e.g. 'Open Critical Tickets'"
                 class="flex-1"
                 (keydown.enter)="saveView()" />
          <button hlmButton [disabled]="!newViewName.trim()" (click)="saveView()">
            Save
          </button>
          <button hlmButton variant="outline" (click)="showSaveForm.set(false); newViewName = ''">
            Cancel
          </button>
        </div>

        <!-- Views list -->
        <div class="px-5 py-3 flex flex-wrap gap-2">
          <button *ngFor="let view of savedViews()"
                  (click)="applyView(view)"
                  class="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all"
                  [style.background]="activeViewId() === view.id ? '#EFF6FF' : '#F8FAFC'"
                  [style.border-color]="activeViewId() === view.id ? '#BFDBFE' : '#E2E8F0'"
                  [style.color]="activeViewId() === view.id ? '#1D4ED8' : '#475569'">
            <i class="pi pi-bookmark-fill" style="font-size:11px"></i>
            {{ view.name }}
            <span (click)="deleteView($event, view.id)"
                  class="opacity-0 group-hover:opacity-100 ml-1 hover:text-red-500 transition-all leading-none"
                  title="Delete view">
              <i class="pi pi-times" style="font-size:10px"></i>
            </span>
          </button>
          <span *ngIf="savedViews().length === 0" class="text-xs text-slate-400 italic py-1">
            No saved views yet — use current filters and click "Save Current Filters"
          </span>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <i class="pi pi-filter text-slate-400 shrink-0" style="font-size:16px"></i>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter by:</span>

        <select hlmSelect [(ngModel)]="selectedStatus" (ngModelChange)="load()">
          <option *ngFor="let opt of statusOptions" [value]="opt.value">{{ opt.label }}</option>
        </select>

        <select hlmSelect [(ngModel)]="selectedPriority" (ngModelChange)="load()">
          <option *ngFor="let opt of priorityOptions" [value]="opt.value">{{ opt.label }}</option>
        </select>

        <button hlmButton variant="outline" size="sm" (click)="resetFilters()">
          <i class="pi pi-refresh" style="font-size:14px"></i>
          Reset
        </button>

        <button (click)="toggleShowSnoozed()"
                class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-colors"
                [style.background]="showSnoozed ? '#FFFBEB' : 'white'"
                [style.border-color]="showSnoozed ? '#FDE68A' : '#E2E8F0'"
                [style.color]="showSnoozed ? '#92400E' : '#64748B'">
          <span>💤</span>
          Show snoozed
        </button>
      </div>

      <!-- Bulk action toolbar -->
      <div *ngIf="selectedIds().size > 0"
           class="flex items-center gap-3 px-4 py-3 mb-3 rounded-xl border"
           style="background:#EFF6FF;border-color:#BFDBFE">
        <span class="text-sm font-bold text-blue-700">{{ selectedIds().size }} selected</span>
        <div class="flex items-center gap-2 ml-2">
          <button hlmButton size="sm" (click)="executeBulk('RESOLVE')" [disabled]="bulkLoading()">Resolve</button>
          <button hlmButton variant="outline" size="sm" (click)="executeBulk('CLOSE')" [disabled]="bulkLoading()">Close</button>
          <select hlmSelect [ngModel]="bulkAgentId()" (ngModelChange)="onBulkAgentChange($event)">
            <option [ngValue]="null" disabled selected>Assign to...</option>
            <option *ngFor="let agent of agents()" [value]="agent.id">{{ agent.fullName }}</option>
          </select>
        </div>
        <button hlmButton variant="ghost" size="sm" (click)="clearSelection()" class="ml-auto">Clear</button>
      </div>

      <!-- Data table -->
      <hlm-table class="overflow-hidden">
        <hlm-trow class="grid-cols-[40px_130px_1fr_90px_110px_150px_100px_80px] px-6 py-3 bg-[#FAFAFA] border-b border-[#F1F5F9]">
          <hlm-th class="w-10">
            <input type="checkbox" hlmCheckbox [checked]="isAllSelected()" (change)="toggleSelectAll()" />
          </hlm-th>
          <hlm-th>Ticket ID</hlm-th>
          <hlm-th>Subject</hlm-th>
          <hlm-th>Priority</hlm-th>
          <hlm-th>Status</hlm-th>
          <hlm-th>Assigned To</hlm-th>
          <hlm-th>Due Date</hlm-th>
          <hlm-th>Age</hlm-th>
        </hlm-trow>

        <app-skeleton-loader *ngIf="loading()" type="table" [count]="8" class="block px-4 py-2" />

        <ng-container *ngIf="!loading()">
          <hlm-trow #row *ngFor="let ticket of tickets(); let last = last"
               class="grid-cols-[40px_130px_1fr_90px_110px_150px_100px_80px] px-6 py-3.5 hover:bg-slate-50/70 cursor-pointer group"
               [style.border-bottom]="!last ? '1px solid #F8FAFC' : 'none'"
               [routerLink]="['/agent/tickets', ticket.id]">

            <hlm-td class="w-10" (click)="onCheckboxCellClick($event)">
              <input type="checkbox" hlmCheckbox [checked]="isSelected(ticket.id)" (change)="toggleSelect(ticket.id)" />
            </hlm-td>

            <hlm-td class="text-xs font-mono font-bold" style="color:#2563EB">{{ ticket.ticketNumber }}</hlm-td>

            <hlm-td class="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors"
                  [style.opacity]="ticket.status === 'SNOOZED' ? '0.6' : '1'">
              <span *ngIf="ticket.status === 'SNOOZED'" class="mr-1">💤</span>{{ ticket.title }}
            </hlm-td>

            <hlm-td>
              <hlm-badge [variant]="priorityVariant(ticket.priority)">{{ ticket.priority }}</hlm-badge>
            </hlm-td>
            <hlm-td><app-status-badge [status]="ticket.status" /></hlm-td>

            <hlm-td class="flex items-center gap-2 min-w-0">
              <div *ngIf="ticket.assignedAgent"
                   class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                   style="background:linear-gradient(135deg,#2563EB,#1D4ED8)">
                {{ ticket.assignedAgent.fullName.charAt(0) }}
              </div>
              <div *ngIf="!ticket.assignedAgent"
                   class="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                   style="background:#F1F5F9;border:1px dashed #CBD5E1">
                <i class="pi pi-user" style="font-size:11px;color:#94A3B8"></i>
              </div>
              <span class="text-xs text-slate-500 truncate font-medium">
                {{ ticket.assignedAgent?.fullName || 'Unassigned' }}
              </span>
            </hlm-td>

            <hlm-td>
              <span *ngIf="ticket.manualDueDate"
                    class="text-xs font-semibold"
                    [style.color]="isTicketOverdue(ticket) ? '#EF4444' : '#374151'">
                {{ ticket.manualDueDate | date:'MMM d' }}
              </span>
              <span *ngIf="!ticket.manualDueDate" class="text-xs text-slate-300">—</span>
            </hlm-td>
            <hlm-td class="text-xs text-slate-400 font-medium">{{ ticket.createdAt | timeAgo }}</hlm-td>
          </hlm-trow>

          <div *ngIf="tickets().length === 0" class="py-16 text-center">
            <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                 style="background:#F8FAFC;border:2px dashed #E2E8F0">
              <i class="pi pi-search" style="font-size:28px;color:#CBD5E1"></i>
            </div>
            <p class="text-sm font-semibold text-slate-400">No tickets match your filters</p>
            <p class="text-xs text-slate-300 mt-1">Try adjusting or resetting your filters</p>
          </div>
        </ng-container>
      </hlm-table>

      <hlm-pagination [page]="currentPage" [rows]="pageSize" [totalRecords]="totalElements()" (pageChange)="onPage($event)" />
    </div>
  `,
})
export class TicketQueueComponent implements OnInit, AfterViewInit {
  tickets = signal<Ticket[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageSize = 15;
  currentPage = 0;

  selectedStatus = '';
  selectedPriority = '';
  searchQuery = signal('');
  showSnoozed = false;

  selectedIds = signal<Set<string>>(new Set());
  bulkAction = signal<string>('');
  bulkTag = signal<string>('');
  bulkAgentId = signal<string | null>(null);
  agents = signal<any[]>([]);
  bulkLoading = signal(false);

  // Saved views
  savedViews = signal<SavedView[]>([]);
  activeViewId = signal<string | null>(null);
  showSaveForm = signal(false);
  newViewName = '';

  statusOptions = [
    { label: 'All statuses', value: '' },
    ...(['NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'RESOLVED', 'CLOSED'] as TicketStatus[]).map(s => ({
      label: s.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
      value: s
    }))
  ];

  priorityOptions = [
    { label: 'All priorities', value: '' },
    ...(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as Priority[]).map(p => ({ label: p, value: p }))
  ];

  @ViewChildren('row', { read: ElementRef }) rowEls!: QueryList<ElementRef<HTMLElement>>;

  constructor(
    private ticketService: TicketService,
    private userService: UserService,
    private savedViewService: SavedViewService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['search']) { this.searchQuery.set(p['search']); }
      this.load();
    });
    this.userService.getUsers('AGENT', 0, 100).subscribe(p => this.agents.set(p.content));
    this.savedViewService.getAll().subscribe(views => this.savedViews.set(views));
  }

  ngAfterViewInit() {}

  private animateRowsIn() {
    const els = this.rowEls?.map(r => r.nativeElement) ?? [];
    if (!els.length) return;
    gsap.fromTo(
      els,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, stagger: 0.05, duration: 0.4, ease: 'power2.out' },
    );
  }

  load() {
    this.loading.set(true);
    const params: any = { page: this.currentPage, size: this.pageSize };
    if (this.selectedStatus) params.status = this.selectedStatus;
    if (this.selectedPriority) params.priority = this.selectedPriority;
    if (this.searchQuery()) params.search = this.searchQuery();
    if (this.showSnoozed) params.includeSnoozed = 'true';
    this.ticketService.getTickets(params).subscribe({
      next: (page) => {
        this.tickets.set(page.content);
        this.totalElements.set(page.totalElements);
        this.loading.set(false);
        requestAnimationFrame(() => this.animateRowsIn());
      },
      error: () => this.loading.set(false),
    });
  }

  resetFilters() {
    this.selectedStatus = '';
    this.selectedPriority = '';
    this.searchQuery.set('');
    this.showSnoozed = false;
    this.activeViewId.set(null);
    this.load();
  }

  toggleShowSnoozed() {
    this.showSnoozed = !this.showSnoozed;
    this.load();
  }

  onPage(e: HlmPageEvent) { this.currentPage = e.page; this.load(); }

  // ── Saved Views ──

  saveView() {
    const name = this.newViewName.trim();
    if (!name) return;
    const filterJson = JSON.stringify({
      status: this.selectedStatus,
      priority: this.selectedPriority,
    });
    this.savedViewService.create(name, filterJson).subscribe(view => {
      this.savedViews.update(list => [...list, view]);
      this.newViewName = '';
      this.showSaveForm.set(false);
    });
  }

  applyView(view: SavedView) {
    this.activeViewId.set(view.id);
    try {
      const filters = JSON.parse(view.filterJson);
      this.selectedStatus = filters.status || '';
      this.selectedPriority = filters.priority || '';
    } catch { /* ignore parse errors */ }
    this.load();
  }

  deleteView(event: Event, id: string) {
    event.stopPropagation();
    this.savedViewService.delete(id).subscribe(() => {
      this.savedViews.update(list => list.filter(v => v.id !== id));
      if (this.activeViewId() === id) this.activeViewId.set(null);
    });
  }

  // ── Selection ──

  isSelected(id: string): boolean { return this.selectedIds().has(id); }
  toggleSelect(id: string): void {
    const s = new Set(this.selectedIds());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selectedIds.set(s);
  }
  isAllSelected(): boolean { return this.tickets().length > 0 && this.selectedIds().size === this.tickets().length; }
  toggleSelectAll(): void {
    if (this.isAllSelected()) { this.selectedIds.set(new Set()); }
    else { this.selectedIds.set(new Set(this.tickets().map(t => t.id))); }
  }
  clearSelection(): void { this.selectedIds.set(new Set()); }
  onCheckboxCellClick(event: Event): void { event.stopPropagation(); }

  onBulkAgentChange(agentId: string): void {
    this.bulkAgentId.set(agentId);
    this.executeBulk('ASSIGN');
  }

  executeBulk(action: string): void {
    const ids = Array.from(this.selectedIds());
    if (!ids.length) return;
    this.bulkLoading.set(true);
    this.ticketService.bulkAction({
      ticketIds: ids,
      action,
      agentId: this.bulkAgentId() ?? undefined,
      tag: this.bulkTag() || undefined
    }).subscribe({
      next: () => { this.clearSelection(); this.bulkAgentId.set(null); this.bulkLoading.set(false); this.load(); },
      error: () => this.bulkLoading.set(false)
    });
  }

  priorityVariant(priority: Priority): BadgeVariants['variant'] {
    return PRIORITY_BADGE_VARIANT[priority] ?? 'default';
  }

  isTicketOverdue(ticket: any): boolean {
    if (!ticket.manualDueDate) return false;
    return new Date(ticket.manualDueDate) < new Date();
  }
}
