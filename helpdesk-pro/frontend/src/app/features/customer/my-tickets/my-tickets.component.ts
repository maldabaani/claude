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
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="font-heading text-2xl font-bold text-gray-900">My Tickets</h1>
        <a routerLink="/customer/submit" mat-raised-button color="primary" class="!rounded-xl">
          <mat-icon>add</mat-icon> New Ticket
        </a>
      </div>

      <!-- Filters -->
      <mat-card class="!rounded-xl !shadow-sm">
        <mat-card-content class="!p-4">
          <div class="flex gap-3 flex-wrap">
            <mat-form-field appearance="outline" class="!text-sm" style="width:200px">
              <mat-label>Status</mat-label>
              <mat-select [formControl]="statusFilter" (selectionChange)="loadTickets()">
                <mat-option value="">All</mat-option>
                <mat-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Table -->
      <mat-card class="!rounded-xl !shadow-sm overflow-hidden">
        <app-skeleton-loader *ngIf="loading()" type="table" [count]="5" class="block p-4" />

        <div *ngIf="!loading()">
          <div *ngFor="let ticket of tickets()"
               class="flex items-center gap-4 px-6 py-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
               [routerLink]="['/customer/tickets', ticket.id]">
            <div class="flex-1 min-w-0">
              <p class="font-medium text-gray-900 truncate">{{ ticket.title }}</p>
              <p class="text-xs text-gray-400 mt-0.5">{{ ticket.ticketNumber }} · {{ ticket.createdAt | timeAgo }}</p>
            </div>
            <app-priority-badge [priority]="ticket.priority" />
            <app-status-badge [status]="ticket.status" />
            <mat-icon class="text-gray-300 shrink-0">chevron_right</mat-icon>
          </div>
          <p *ngIf="tickets().length === 0" class="text-center py-12 text-gray-400">No tickets found.</p>
        </div>
      </mat-card>

      <mat-paginator [length]="totalElements()" [pageSize]="pageSize" (page)="onPage($event)" />
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
