import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { TicketService } from '../../../core/services/ticket.service';
import { Ticket, TicketStatus } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-my-tickets',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatInputModule, MatSelectModule, MatIconModule, MatPaginatorModule,
    StatusBadgeComponent, PriorityBadgeComponent, SkeletonLoaderComponent, TimeAgoPipe],
  template: `
    <div class="space-y-5">

      <!-- Page header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">My Tickets</h1>
          <p class="text-sm text-slate-400 mt-0.5">Track and manage your support requests</p>
        </div>
        <a routerLink="/customer/submit"
           class="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90"
           style="background:linear-gradient(135deg,#2563EB,#1D4ED8);box-shadow:0 2px 8px rgba(37,99,235,0.3)">
          <mat-icon style="font-size:16px;width:16px;height:16px">add</mat-icon>
          New Ticket
        </a>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <mat-icon class="text-slate-400 shrink-0" style="font-size:16px;width:16px;height:16px">filter_list</mat-icon>
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">Filter:</span>
        <mat-form-field appearance="outline" style="width:180px;margin-bottom:-1.25em">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="statusFilter" (selectionChange)="loadTickets()">
            <mat-option value="">All statuses</mat-option>
            <mat-option *ngFor="let s of statuses" [value]="s">{{ statusLabel(s) }}</mat-option>
          </mat-select>
        </mat-form-field>
        <span class="ml-auto text-xs text-slate-400 font-medium">{{ totalElements() }} tickets</span>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 1px 3px rgba(0,0,0,0.06)">

        <!-- Table header -->
        <div class="grid gap-4 px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider"
             style="grid-template-columns:1fr 90px 110px 80px;background:#FAFAFA;border-bottom:1px solid #F1F5F9">
          <span>Ticket</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Age</span>
        </div>

        <app-skeleton-loader *ngIf="loading()" type="table" [count]="5" class="block px-5 py-2" />

        <div *ngIf="!loading()">
          <div *ngFor="let ticket of tickets(); let last = last"
               class="grid gap-4 items-center px-5 py-4 hover:bg-slate-50/70 cursor-pointer transition-colors"
               style="grid-template-columns:1fr 90px 110px 80px"
               [style.border-bottom]="!last ? '1px solid #F8FAFC' : 'none'"
               [routerLink]="['/customer/tickets', ticket.id]">
            <div class="min-w-0">
              <p class="font-semibold text-gray-900 truncate text-sm">{{ ticket.title }}</p>
              <p class="text-xs text-slate-400 mt-0.5 font-mono">{{ ticket.ticketNumber }}</p>
            </div>
            <app-priority-badge [priority]="ticket.priority" />
            <app-status-badge [status]="ticket.status" />
            <span class="text-xs text-slate-400 font-medium">{{ ticket.createdAt | timeAgo }}</span>
          </div>

          <div *ngIf="tickets().length === 0" class="py-16 text-center">
            <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                 style="background:#F8FAFC;border:2px dashed #E2E8F0">
              <mat-icon style="font-size:28px;width:28px;height:28px;color:#CBD5E1">search_off</mat-icon>
            </div>
            <p class="text-sm font-semibold text-slate-400">No tickets found</p>
            <p class="text-xs text-slate-300 mt-1">Try adjusting your filter</p>
          </div>
        </div>
      </div>

      <mat-paginator [length]="totalElements()" [pageSize]="pageSize" (page)="onPage($event)"
                     class="bg-white rounded-xl border border-gray-100"
                     style="box-shadow:0 1px 3px rgba(0,0,0,0.04)" />
    </div>
  `,
})
export class MyTicketsComponent implements OnInit {
  tickets = signal<Ticket[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageSize = 10;
  currentPage = 0;
  statuses: TicketStatus[] = ['NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'RESOLVED', 'CLOSED'];
  statusFilter = this.fb.control('');

  constructor(private ticketService: TicketService, private fb: FormBuilder) {}

  ngOnInit() { this.loadTickets(); }

  loadTickets() {
    this.loading.set(true);
    const filters: any = { page: this.currentPage, size: this.pageSize };
    if (this.statusFilter.value) filters.status = this.statusFilter.value;
    this.ticketService.getTickets(filters).subscribe({
      next: (page) => { this.tickets.set(page.content); this.totalElements.set(page.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onPage(e: PageEvent) { this.currentPage = e.pageIndex; this.loadTickets(); }

  statusLabel(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  }
}
