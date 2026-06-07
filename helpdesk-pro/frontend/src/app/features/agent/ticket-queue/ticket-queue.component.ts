import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { TicketService } from '../../../core/services/ticket.service';
import { Ticket, TicketStatus, Priority } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-ticket-queue',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule,
    SelectModule, PaginatorModule,
    StatusBadgeComponent, PriorityBadgeComponent, SkeletonLoaderComponent, TimeAgoPipe],
  template: `
    <div class="space-y-5">

      <!-- Page header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Ticket Queue</h1>
          <p class="text-sm text-slate-400 mt-0.5">{{ totalElements() }} tickets total</p>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <i class="pi pi-filter text-slate-400 shrink-0" style="font-size:16px"></i>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter by:</span>

        <p-select [options]="statusOptions" [(ngModel)]="selectedStatus" (onChange)="load()"
                  optionLabel="label" optionValue="value" placeholder="All statuses"
                  [style]="{'width':'160px'}" />

        <p-select [options]="priorityOptions" [(ngModel)]="selectedPriority" (onChange)="load()"
                  optionLabel="label" optionValue="value" placeholder="All priorities"
                  [style]="{'width':'160px'}" />

        <button (click)="resetFilters()"
                class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors border border-gray-200">
          <i class="pi pi-refresh" style="font-size:14px"></i>
          Reset
        </button>
      </div>

      <!-- Data table -->
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 1px 3px rgba(0,0,0,0.06)">

        <!-- Table header -->
        <div class="grid gap-4 px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider"
             style="grid-template-columns:130px 1fr 90px 110px 150px 80px;background:#FAFAFA;border-bottom:1px solid #F1F5F9">
          <span>Ticket ID</span>
          <span>Subject</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Assigned To</span>
          <span>Age</span>
        </div>

        <app-skeleton-loader *ngIf="loading()" type="table" [count]="8" class="block px-4 py-2" />

        <div *ngIf="!loading()">
          <div *ngFor="let ticket of tickets(); let last = last"
               class="grid gap-4 items-center px-6 py-3.5 hover:bg-slate-50/70 cursor-pointer transition-colors group"
               style="grid-template-columns:130px 1fr 90px 110px 150px 80px"
               [style.border-bottom]="!last ? '1px solid #F8FAFC' : 'none'"
               [routerLink]="['/agent/tickets', ticket.id]">

            <span class="text-xs font-mono font-bold" style="color:#2563EB">{{ ticket.ticketNumber }}</span>

            <span class="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {{ ticket.title }}
            </span>

            <app-priority-badge [priority]="ticket.priority" />
            <app-status-badge [status]="ticket.status" />

            <div class="flex items-center gap-2 min-w-0">
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
            </div>

            <span class="text-xs text-slate-400 font-medium">{{ ticket.createdAt | timeAgo }}</span>
          </div>

          <div *ngIf="tickets().length === 0" class="py-16 text-center">
            <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                 style="background:#F8FAFC;border:2px dashed #E2E8F0">
              <i class="pi pi-search" style="font-size:28px;color:#CBD5E1"></i>
            </div>
            <p class="text-sm font-semibold text-slate-400">No tickets match your filters</p>
            <p class="text-xs text-slate-300 mt-1">Try adjusting or resetting your filters</p>
          </div>
        </div>
      </div>

      <p-paginator [totalRecords]="totalElements()" [rows]="pageSize" (onPageChange)="onPage($event)"
                   styleClass="bg-white rounded-xl border border-gray-100"
                   [style]="{'box-shadow':'0 1px 3px rgba(0,0,0,0.04)'}" />
    </div>
  `,
})
export class TicketQueueComponent implements OnInit {
  tickets = signal<Ticket[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageSize = 15;
  currentPage = 0;

  selectedStatus = '';
  selectedPriority = '';

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

  constructor(private ticketService: TicketService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const params: any = { page: this.currentPage, size: this.pageSize };
    if (this.selectedStatus) params.status = this.selectedStatus;
    if (this.selectedPriority) params.priority = this.selectedPriority;
    this.ticketService.getTickets(params).subscribe({
      next: (page) => { this.tickets.set(page.content); this.totalElements.set(page.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  resetFilters() { this.selectedStatus = ''; this.selectedPriority = ''; this.load(); }
  onPage(e: PaginatorState) { this.currentPage = e.page ?? 0; this.load(); }
}
