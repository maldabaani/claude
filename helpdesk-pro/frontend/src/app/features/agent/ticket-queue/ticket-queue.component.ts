import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
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
    MatButtonModule, MatCardModule, MatCheckboxModule, MatIconModule, MatMenuModule,
    MatSelectModule, MatInputModule, MatPaginatorModule, MatSortModule,
    StatusBadgeComponent, PriorityBadgeComponent, SkeletonLoaderComponent, TimeAgoPipe],
  template: `
    <div class="space-y-5">
      <!-- Page header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-heading text-2xl font-bold text-gray-900">Ticket Queue</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ totalElements() }} tickets total</p>
        </div>
      </div>

      <!-- Filters bar -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 flex-wrap">
        <mat-icon class="text-gray-400 shrink-0" style="font-size:18px;width:18px;height:18px">filter_list</mat-icon>
        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter:</span>

        <mat-form-field appearance="outline" style="width:160px;margin-bottom:-1.25em" class="!text-sm">
          <mat-label>Status</mat-label>
          <mat-select [formControl]="filters.controls['status']" (selectionChange)="load()">
            <mat-option value="">All statuses</mat-option>
            <mat-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" style="width:160px;margin-bottom:-1.25em" class="!text-sm">
          <mat-label>Priority</mat-label>
          <mat-select [formControl]="filters.controls['priority']" (selectionChange)="load()">
            <mat-option value="">All priorities</mat-option>
            <mat-option *ngFor="let p of priorities" [value]="p">{{ p }}</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-stroked-button (click)="resetFilters()" class="!rounded-lg !text-sm !text-gray-500">
          <mat-icon style="font-size:16px;width:16px;height:16px">refresh</mat-icon>
          Reset
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <!-- Table header -->
        <div class="grid gap-4 px-6 py-3 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide"
             style="grid-template-columns:140px 1fr 100px 120px 140px 100px">
          <span>Ticket ID</span>
          <span>Subject</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Assigned To</span>
          <span>Created</span>
        </div>

        <app-skeleton-loader *ngIf="loading()" type="table" [count]="8" class="block px-4 py-2" />

        <div *ngIf="!loading()">
          <div *ngFor="let ticket of tickets(); let last = last"
               class="grid gap-4 items-center px-6 py-3.5 hover:bg-gray-50/80 cursor-pointer transition-colors"
               style="grid-template-columns:140px 1fr 100px 120px 140px 100px"
               [class.border-b]="!last" [class.border-gray-100]="!last"
               [routerLink]="['/agent/tickets', ticket.id]">
            <span class="text-xs font-mono text-blue-600 font-semibold">{{ ticket.ticketNumber }}</span>
            <span class="text-sm font-medium text-gray-900 truncate">{{ ticket.title }}</span>
            <app-priority-badge [priority]="ticket.priority" />
            <app-status-badge [status]="ticket.status" />
            <div class="flex items-center gap-2 min-w-0">
              <div *ngIf="ticket.assignedAgent"
                   class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                {{ ticket.assignedAgent.fullName?.charAt(0) }}
              </div>
              <span class="text-xs text-gray-500 truncate">{{ ticket.assignedAgent?.fullName || 'Unassigned' }}</span>
            </div>
            <span class="text-xs text-gray-400 whitespace-nowrap">{{ ticket.createdAt | timeAgo }}</span>
          </div>

          <div *ngIf="tickets().length === 0" class="py-16 text-center">
            <mat-icon class="text-gray-200 mb-3" style="font-size:48px;width:48px;height:48px">inbox</mat-icon>
            <p class="text-sm font-medium text-gray-400">No tickets match the filters</p>
            <p class="text-xs text-gray-300 mt-1">Try adjusting your search criteria</p>
          </div>
        </div>
      </div>

      <mat-paginator [length]="totalElements()" [pageSize]="pageSize" (page)="onPage($event)"
                     class="bg-white rounded-xl border border-gray-100 shadow-sm" />
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
}
