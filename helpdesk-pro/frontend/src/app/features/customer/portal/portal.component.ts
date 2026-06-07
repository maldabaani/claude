import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TicketService } from '../../../core/services/ticket.service';
import { AuthService } from '../../../core/auth/auth.service';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-portal',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, SkeletonLoaderComponent],
  template: `
    <div class="space-y-6">

      <!-- Welcome hero -->
      <div class="relative overflow-hidden rounded-2xl p-8 text-white"
           style="background:linear-gradient(135deg,#1E40AF 0%,#2563EB 50%,#4F46E5 100%)">
        <!-- Decorative shapes -->
        <div class="absolute top-0 right-0 opacity-10"
             style="width:280px;height:280px;border-radius:50%;background:white;transform:translate(35%,-35%)"></div>
        <div class="absolute bottom-0 right-32 opacity-10"
             style="width:140px;height:140px;border-radius:50%;background:white;transform:translateY(55%)"></div>
        <div class="absolute top-1/2 left-2/3 opacity-5"
             style="width:200px;height:200px;border-radius:50%;background:white;transform:translateY(-50%)"></div>

        <div class="relative z-10 flex items-center justify-between">
          <div>
            <p class="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2">Customer Portal</p>
            <h1 class="text-3xl font-black mb-2" style="letter-spacing:-0.03em">
              Hello, {{ firstName() }}! 👋
            </h1>
            <p class="text-blue-200/80 text-sm mb-6 max-w-xs">
              How can our support team help you today?
            </p>
            <a routerLink="/customer/submit"
               class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:shadow-lg"
               style="background:white;color:#1D4ED8;box-shadow:0 2px 10px rgba(0,0,0,0.15)">
              <mat-icon style="font-size:18px;width:18px;height:18px">add_circle_outline</mat-icon>
              Submit New Ticket
            </a>
          </div>
          <div class="hidden sm:flex items-center justify-center w-24 h-24 rounded-full opacity-20"
               style="background:rgba(255,255,255,0.15)">
            <mat-icon style="font-size:52px;width:52px;height:52px">support_agent</mat-icon>
          </div>
        </div>
      </div>

      <!-- Stats cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div *ngFor="let stat of stats"
             class="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4"
             style="box-shadow:0 1px 3px rgba(0,0,0,0.05)">
          <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" [ngClass]="stat.bg">
            <mat-icon [ngClass]="stat.color" style="font-size:20px;width:20px;height:20px">{{ stat.icon }}</mat-icon>
          </div>
          <div>
            <p class="text-2xl font-black text-gray-900 leading-none" style="letter-spacing:-0.03em">{{ stat.value }}</p>
            <p class="text-xs font-medium text-slate-400 mt-1">{{ stat.label }}</p>
          </div>
        </div>
      </div>

      <!-- Recent tickets section -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-bold text-gray-900 text-base" style="letter-spacing:-0.02em">Recent Tickets</h2>
          <a routerLink="/customer/tickets"
             class="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-opacity"
             style="color:#2563EB">
            View all
            <mat-icon style="font-size:14px;width:14px;height:14px">chevron_right</mat-icon>
          </a>
        </div>

        <app-skeleton-loader *ngIf="loading()" type="table" [count]="3" />

        <div *ngIf="!loading()" class="bg-white rounded-xl border border-gray-100 overflow-hidden"
             style="box-shadow:0 1px 3px rgba(0,0,0,0.05)">

          <div *ngFor="let ticket of recentTickets(); let last = last"
               class="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/70 cursor-pointer transition-colors"
               [style.border-bottom]="!last ? '1px solid #F8FAFC' : 'none'"
               [routerLink]="['/customer/tickets', ticket.id]">

            <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                 style="background:#EFF6FF;border:1px solid #DBEAFE">
              <mat-icon style="font-size:15px;width:15px;height:15px;color:#2563EB">confirmation_number</mat-icon>
            </div>

            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-900 truncate text-sm">{{ ticket.title }}</p>
              <p class="text-xs text-slate-400 mt-0.5 font-mono">{{ ticket.ticketNumber }}</p>
            </div>

            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0"
                  [ngClass]="statusClass(ticket.status)">
              {{ statusLabel(ticket.status) }}
            </span>

            <mat-icon class="shrink-0 text-slate-300" style="font-size:16px;width:16px;height:16px">chevron_right</mat-icon>
          </div>

          <div *ngIf="recentTickets().length === 0" class="py-16 text-center">
            <div class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                 style="background:#F8FAFC;border:2px dashed #E2E8F0">
              <mat-icon style="font-size:28px;width:28px;height:28px;color:#CBD5E1">inbox</mat-icon>
            </div>
            <p class="text-sm font-semibold text-slate-400">No tickets yet</p>
            <p class="text-xs text-slate-300 mt-1 mb-4">Submit your first ticket to get started</p>
            <a routerLink="/customer/submit"
               class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white"
               style="background:#2563EB">
              <mat-icon style="font-size:14px;width:14px;height:14px">add</mat-icon>
              Submit a Ticket
            </a>
          </div>
        </div>
      </div>

      <!-- Quick help section -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4"
             style="box-shadow:0 1px 3px rgba(0,0,0,0.05)">
          <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <mat-icon class="text-blue-600" style="font-size:18px;width:18px;height:18px">menu_book</mat-icon>
          </div>
          <div>
            <p class="font-bold text-gray-900 text-sm mb-1">Knowledge Base</p>
            <p class="text-xs text-slate-400 leading-relaxed">Browse our self-service articles to find quick answers.</p>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4"
             style="box-shadow:0 1px 3px rgba(0,0,0,0.05)">
          <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <mat-icon class="text-green-600" style="font-size:18px;width:18px;height:18px">chat_bubble_outline</mat-icon>
          </div>
          <div>
            <p class="font-bold text-gray-900 text-sm mb-1">Live Chat</p>
            <p class="text-xs text-slate-400 leading-relaxed">Chat with a support agent in real time — average wait &lt;2 min.</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PortalComponent implements OnInit {
  loading = signal(true);
  recentTickets = signal<any[]>([]);
  stats: any[] = [];

  constructor(private ticketService: TicketService, public auth: AuthService) {}

  ngOnInit() {
    this.ticketService.getTickets({ size: 5 }).subscribe({
      next: (page) => {
        this.recentTickets.set(page.content);
        this.stats = [
          {
            label: 'Open Tickets',
            value: page.content.filter((t: any) => t.status === 'OPEN' || t.status === 'NEW').length,
            icon: 'inbox', bg: 'bg-blue-50', color: 'text-blue-600',
          },
          {
            label: 'Pending Reply',
            value: page.content.filter((t: any) => t.status === 'PENDING').length,
            icon: 'schedule', bg: 'bg-amber-50', color: 'text-amber-600',
          },
          {
            label: 'Resolved',
            value: page.content.filter((t: any) => t.status === 'RESOLVED').length,
            icon: 'check_circle', bg: 'bg-green-50', color: 'text-green-600',
          },
        ];
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  firstName(): string {
    const name = this.auth.currentUser()?.fullName || '';
    return name.split(' ')[0] || 'there';
  }

  statusLabel(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      NEW: 'badge-new', OPEN: 'badge-open', PENDING: 'badge-pending',
      ON_HOLD: 'badge-on-hold', RESOLVED: 'badge-resolved', CLOSED: 'badge-closed',
    };
    return map[status] || '';
  }
}
