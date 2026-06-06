import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { TicketService } from '../../../core/services/ticket.service';
import { Ticket, TicketStatus, Priority } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-admin-tickets',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule,
    MatButtonModule, MatCardModule, MatCheckboxModule, MatIconModule, MatMenuModule,
    MatPaginatorModule, MatSelectModule, MatInputModule,
    StatusBadgeComponent, PriorityBadgeComponent, TimeAgoPipe, SkeletonLoaderComponent],
  template: `
    <div class="space-y-4">
      <h1 class="font-heading text-2xl font-bold text-gray-900">All Tickets</h1>

      <mat-card class="!rounded-xl !shadow-sm">
        <mat-card-content class="!p-4">
          <div class="flex gap-3 flex-wrap items-end">
            <mat-form-field appearance="outline" style="width:150px">
              <mat-label>Status</mat-label>
              <mat-select [formControl]="f.controls['status']" (selectionChange)="load()">
                <mat-option value="">All</mat-option>
                <mat-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-option>
              </mat-select>
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:150px">
              <mat-label>Priority</mat-label>
              <mat-select [formControl]="f.controls['priority']" (selectionChange)="load()">
                <mat-option value="">All</mat-option>
                <mat-option *ngFor="let p of priorities" [value]="p">{{ p }}</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-stroked-button (click)="reset()" class="!rounded-lg">
              <mat-icon>clear</mat-icon> Reset
            </button>
            <span class="flex-1"></span>
            <button mat-stroked-button color="warn" [disabled]="!selected.size" (click)="bulkDelete()" class="!rounded-lg">
              <mat-icon>delete</mat-icon> Delete ({{ selected.size }})
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="!rounded-xl !shadow-sm overflow-hidden">
        <div class="grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto] gap-3 items-center px-4 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span></span><span>ID</span><span>Title</span><span>Priority</span><span>Status</span><span>Assignee</span><span>Created</span>
        </div>

        <app-skeleton-loader *ngIf="loading()" type="table" [count]="10" class="block px-4 py-2" />

        <div *ngIf="!loading()">
          <div *ngFor="let ticket of tickets()"
               class="grid grid-cols-[auto_auto_1fr_auto_auto_auto_auto] gap-3 items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <mat-checkbox [checked]="selected.has(ticket.id)" (change)="toggle(ticket.id)" />
            <a [routerLink]="['/admin/tickets', ticket.id]" class="text-xs font-mono text-blue-600 hover:underline">{{ ticket.ticketNumber }}</a>
            <a [routerLink]="['/admin/tickets', ticket.id]" class="text-sm font-medium text-gray-900 truncate hover:text-blue-600">{{ ticket.title }}</a>
            <app-priority-badge [priority]="ticket.priority" />
            <app-status-badge [status]="ticket.status" />
            <span class="text-xs text-gray-500">{{ ticket.assignedAgent?.fullName || '—' }}</span>
            <span class="text-xs text-gray-400">{{ ticket.createdAt | timeAgo }}</span>
          </div>
          <p *ngIf="tickets().length === 0" class="text-center py-12 text-gray-400">No tickets found.</p>
        </div>
      </mat-card>

      <mat-paginator [length]="totalElements()" [pageSize]="pageSize" (page)="onPage($event)" />
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
  f = this.fb.group({ status: [''], priority: [''] });

  constructor(private ticketService: TicketService, private fb: FormBuilder) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const v = this.f.value;
    const params: any = { page: this.currentPage, size: this.pageSize };
    if (v.status) params.status = v.status;
    if (v.priority) params.priority = v.priority;
    this.ticketService.getTickets(params).subscribe({
      next: (p) => { this.tickets.set(p.content); this.totalElements.set(p.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggle(id: string) { this.selected.has(id) ? this.selected.delete(id) : this.selected.add(id); }
  reset() { this.f.reset({ status: '', priority: '' }); this.load(); }
  onPage(e: PageEvent) { this.currentPage = e.pageIndex; this.load(); }

  bulkDelete() {
    if (!confirm(`Delete ${this.selected.size} tickets?`)) return;
    const ids = [...this.selected];
    Promise.all(ids.map(id => this.ticketService.deleteTicket(id).toPromise()))
      .then(() => { this.selected.clear(); this.load(); });
  }
}
