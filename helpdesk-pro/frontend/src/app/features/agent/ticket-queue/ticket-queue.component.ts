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
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="font-heading text-2xl font-bold text-gray-900">Ticket Queue</h1>
        <span class="text-sm text-gray-500">{{ totalElements() }} tickets</span>
      </div>

      <!-- Filters -->
      <mat-card class="!rounded-xl !shadow-sm">
        <mat-card-content class="!p-4">
          <div class="flex gap-3 flex-wrap items-end">
            <mat-form-field appearance="outline" style="width:160px" class="!text-sm">
              <mat-label>Status</mat-label>
              <mat-select [formControl]="filters.controls['status']" (selectionChange)="load()">
                <mat-option value="">All</mat-option>
                <mat-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" style="width:160px" class="!text-sm">
              <mat-label>Priority</mat-label>
              <mat-select [formControl]="filters.controls['priority']" (selectionChange)="load()">
                <mat-option value="">All</mat-option>
                <mat-option *ngFor="let p of priorities" [value]="p">{{ p }}</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-stroked-button (click)="resetFilters()" class="!rounded-lg">
              <mat-icon>clear</mat-icon> Reset
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Table -->
      <mat-card class="!rounded-xl !shadow-sm overflow-hidden">
        <!-- Header -->
        <div class="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-6 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>ID</span>
          <span>Title</span>
          <span>Priority</span>
          <span>Status</span>
          <span>Assigned</span>
          <span>Created</span>
        </div>

        <app-skeleton-loader *ngIf="loading()" type="table" [count]="8" class="block px-4 py-2" />

        <div *ngIf="!loading()">
          <div *ngFor="let ticket of tickets()"
               class="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 items-center px-6 py-3.5 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
               [routerLink]="['/agent/tickets', ticket.id]">
            <span class="text-xs font-mono text-blue-600">{{ ticket.ticketNumber }}</span>
            <span class="text-sm font-medium text-gray-900 truncate">{{ ticket.title }}</span>
            <app-priority-badge [priority]="ticket.priority" />
            <app-status-badge [status]="ticket.status" />
            <span class="text-xs text-gray-500">{{ ticket.assignedAgent?.fullName || '—' }}</span>
            <span class="text-xs text-gray-400">{{ ticket.createdAt | timeAgo }}</span>
          </div>
          <p *ngIf="tickets().length === 0" class="text-center py-12 text-gray-400">No tickets match the filters.</p>
        </div>
      </mat-card>

      <mat-paginator [length]="totalElements()" [pageSize]="pageSize" (page)="onPage($event)" />
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
