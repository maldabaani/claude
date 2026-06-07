import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
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
    MatButtonModule, MatInputModule, MatSelectModule, MatIconModule, MatCardModule, MatPaginatorModule,
    StatusBadgeComponent, PriorityBadgeComponent, SkeletonLoaderComponent, TimeAgoPipe],
  template: `
    <div class="space-y-5">
      <!-- Page header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-heading text-2xl font-bold text-gray-900">My Tickets</h1>
          <p class="text-sm text-gray-500 mt-0.5">Track and manage your support requests</p>
        </div>
        <a routerLink="/customer/submit" mat-raised-button color="primary" class="!rounded-lg">
          <mat-icon style="font-size:18px;width:18px;height:18px">add</mat-icon>
          <span class="ml-1">New Ticket</span>
        </a>
      </div>

      <!-- Filters bar -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 flex-wrap">
        <mat-icon class="text-gray-400 shrink-0" style="font-size:18px;width:18px;height:18px">filter_list</mat-icon>
        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter:</span>
        <mat-form-field appearance="outline" class="!text-sm" style="width:180px;margin-bottom:-1.25em">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="statusFilter" (selectionChange)="loadTickets()">
            <mat-option value="">All statuses</mat-option>
            <mat-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Ticket list -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <!-- Table header -->
        <div class="grid gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100"
             style="grid-template-columns:1fr auto auto auto">
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ticket</span>
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Priority</span>
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</span>
          <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</span>
        </div>

        <app-skeleton-loader *ngIf="loading()" type="table" [count]="5" class="block px-5 py-2" />

        <div *ngIf="!loading()">
          <div *ngFor="let ticket of tickets(); let last = last"
               class="grid gap-4 items-center px-5 py-4 hover:bg-gray-50/80 cursor-pointer transition-colors"
               style="grid-template-columns:1fr auto auto auto"
               [class.border-b]="!last" [class.border-gray-100]="!last"
               [routerLink]="['/customer/tickets', ticket.id]">
            <div class="min-w-0">
              <p class="font-medium text-gray-900 truncate text-sm">{{ ticket.title }}</p>
              <p class="text-xs text-gray-400 mt-0.5 font-mono">{{ ticket.ticketNumber }}</p>
            </div>
            <app-priority-badge [priority]="ticket.priority" />
            <app-status-badge [status]="ticket.status" />
            <span class="text-xs text-gray-400 whitespace-nowrap">{{ ticket.createdAt | timeAgo }}</span>
          </div>

          <div *ngIf="tickets().length === 0" class="py-16 text-center">
            <mat-icon class="text-gray-200 mb-3" style="font-size:48px;width:48px;height:48px">inbox</mat-icon>
            <p class="text-sm font-medium text-gray-400">No tickets found</p>
            <p class="text-xs text-gray-300 mt-1">Try adjusting your filters</p>
          </div>
        </div>
      </div>

      <mat-paginator [length]="totalElements()" [pageSize]="pageSize" (page)="onPage($event)"
                     class="bg-white rounded-xl border border-gray-100 shadow-sm" />
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
}
