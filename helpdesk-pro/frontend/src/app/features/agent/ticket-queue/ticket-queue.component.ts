import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TicketService } from '../../../core/services/ticket.service';
import { Ticket, TicketStatus, Priority } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-ticket-queue',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatSelectModule, MatInputModule, MatPaginatorModule,
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
        <mat-icon class="text-slate-400 shrink-0" style="font-size:16px;width:16px;height:16px">filter_list</mat-icon>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter by:</span>

        <mat-form-field appearance="outline" style="width:160px;margin-bottom:-1.25em">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="filters.controls['status']" (selectionChange)="load()">
            <mat-option value="">All statuses</mat-option>
            <mat-option *ngFor="let s of statuses" [value]="s">{{ statusLabel(s) }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:160px;margin-bottom:-1.25em">
          <mat-label>Priority</mat-label>
          <mat-select [formControl]="filters.controls['priority']" (selectionChange)="load()">
            <mat-option value="">All priorities</mat-option>
            <mat-option *ngFor="let p of priorities" [value]="p">{{ p }}</mat-option>
          </mat-select>
        </mat-form-field>

        <button (click)="resetFilters()"
                class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors border border-gray-200">
          <mat-icon style="font-size:14px;width:14px;height:14px">refresh</mat-icon>
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
                <mat-icon style="font-size:11px;width:11px;height:11px;color:#94A3B8">person</mat-icon>
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
              <mat-icon style="font-size:28px;width:28px;height:28px;color:#CBD5E1">search_off</mat-icon>
            </div>
            <p class="text-sm font-semibold text-slate-400">No tickets match your filters</p>
            <p class="text-xs text-slate-300 mt-1">Try adjusting or resetting your filters</p>
          </div>
        </div>
      </div>

      <mat-paginator [length]="totalElements()" [pageSize]="pageSize" (page)="onPage($event)"
                     class="bg-white rounded-xl border border-gray-100"
                     style="box-shadow:0 1px 3px rgba(0,0,0,0.04)" />
    </div>
  `,
})
export class TicketQueueComponent implements OnInit {
  tickets = signal<Ticket[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageSize = 15;
  currentPage = 0;

  statuses: TicketStatus[] = ['NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'RESOLVED', 'CLOSED'];
  priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  filters = this.fb.group({ status: [''], priority: [''] });

  constructor(private ticketService: TicketService, private fb: FormBuilder) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const f = this.filters.value;
    const params: any = { page: this.currentPage, size: this.pageSize };
    if (f.status) params.status = f.status;
    if (f.priority) params.priority = f.priority;
    this.ticketService.getTickets(params).subscribe({
      next: (page) => { this.tickets.set(page.content); this.totalElements.set(page.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  resetFilters() { this.filters.reset({ status: '', priority: '' }); this.load(); }
  onPage(e: PageEvent) { this.currentPage = e.pageIndex; this.load(); }

  statusLabel(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  }
}
