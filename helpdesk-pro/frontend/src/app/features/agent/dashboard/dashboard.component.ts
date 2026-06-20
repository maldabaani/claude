import { AfterViewInit, Component, ElementRef, OnInit, QueryList, ViewChildren, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import gsap from 'gsap';
import { StatsService } from '../../../core/services/stats.service';
import { TicketService } from '../../../core/services/ticket.service';
import { DashboardStats, Priority, Ticket } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { HlmCardComponent, HlmCardContentComponent, HlmCardHeaderComponent, HlmCardTitleComponent } from '../../../shared/ui/hlm-card/hlm-card.component';
import { HlmBadgeComponent, BadgeVariants } from '../../../shared/ui/hlm-badge/hlm-badge.component';
import { HlmTableComponent, HlmTdComponent, HlmThComponent, HlmTrowComponent } from '../../../shared/ui/hlm-table/hlm-table.component';
import { HlmButtonComponent } from '../../../shared/ui/hlm-button/hlm-button.component';
import { HlmDialogService } from '../../../shared/ui/hlm-dialog/hlm-dialog.service';
import { Dialog } from '@angular/cdk/dialog';
import { TicketQuickViewDialogComponent } from './ticket-quick-view-dialog.component';

const PRIORITY_BADGE_VARIANT: Record<Priority, BadgeVariants['variant']> = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    StatusBadgeComponent, TimeAgoPipe,
    HlmCardComponent, HlmCardHeaderComponent, HlmCardTitleComponent, HlmCardContentComponent,
    HlmBadgeComponent, HlmTableComponent, HlmTrowComponent, HlmThComponent, HlmTdComponent,
    HlmButtonComponent,
  ],
  providers: [Dialog],
  template: `
    <div class="space-y-6">

      <!-- Page header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Dashboard</h1>
          <p class="text-sm text-slate-400 mt-0.5">Your support queue at a glance</p>
        </div>
        <a hlmButton routerLink="/agent/queue">
          <i class="pi pi-inbox" style="font-size:16px"></i>
          View Queue
        </a>
      </div>

      <!-- KPI cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <hlm-card *ngFor="let kpi of kpis()" class="relative overflow-hidden p-5">
          <div class="absolute left-0 top-0 h-full w-1" [ngClass]="kpi.accentColor"></div>
          <div class="flex items-start justify-between mb-4 pl-2">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" [ngClass]="kpi.bg">
              <i [class]="'pi ' + kpi.icon" [ngClass]="kpi.color" style="font-size:20px"></i>
            </div>
          </div>
          <div class="pl-2">
            <p class="text-3xl font-black text-gray-900 leading-none" style="letter-spacing:-0.04em">{{ kpi.value }}</p>
            <p class="text-xs font-medium text-slate-400 mt-1.5">{{ kpi.label }}</p>
          </div>
        </hlm-card>
      </div>

      <!-- Recent tickets table -->
      <hlm-card class="overflow-hidden">
        <hlm-card-header class="flex-row items-center justify-between border-b border-gray-100 pb-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <i class="pi pi-list text-slate-500" style="font-size:16px"></i>
            </div>
            <hlm-card-title>Recent Tickets</hlm-card-title>
          </div>
          <a routerLink="/agent/queue"
             class="flex items-center gap-1 text-xs font-semibold hover:opacity-80 transition-opacity"
             style="color:#2563EB">
            View all
            <i class="pi pi-chevron-right" style="font-size:14px"></i>
          </a>
        </hlm-card-header>

        <hlm-table>
          <hlm-trow class="grid-cols-[1fr_90px_110px_90px] px-6 py-2.5 bg-[#FAFAFA] border-b border-[#F1F5F9]">
            <hlm-th>Ticket</hlm-th>
            <hlm-th>Priority</hlm-th>
            <hlm-th>Status</hlm-th>
            <hlm-th>Age</hlm-th>
          </hlm-trow>

          <!-- AI-triage loading skeleton: animate-pulse rows instead of a spinner -->
          <ng-container *ngIf="loadingTickets()">
            <hlm-trow *ngFor="let i of skeletonRows" class="grid-cols-[1fr_90px_110px_90px] px-6 py-3.5 border-b border-[#F8FAFC] animate-pulse">
              <div class="h-4 w-2/3 rounded-md bg-slate-100"></div>
              <div class="h-5 w-16 rounded-md bg-slate-100"></div>
              <div class="h-5 w-20 rounded-full bg-slate-100"></div>
              <div class="h-4 w-10 rounded-md bg-slate-100"></div>
            </hlm-trow>
          </ng-container>

          <ng-container *ngIf="!loadingTickets()">
            <hlm-trow #row *ngFor="let ticket of recentTickets(); let last = last"
                 class="grid-cols-[1fr_90px_110px_90px] px-6 py-3.5 hover:bg-slate-50/70 cursor-pointer"
                 [style.border-bottom]="!last ? '1px solid #F8FAFC' : 'none'"
                 (click)="openQuickView(ticket)">
              <hlm-td class="min-w-0">
                <p class="font-semibold text-gray-900 text-sm truncate">{{ ticket.title }}</p>
                <p class="text-xs text-slate-400 mt-0.5 font-mono">{{ ticket.ticketNumber }}</p>
              </hlm-td>
              <hlm-td>
                <hlm-badge [variant]="priorityVariant(ticket.priority)" [attr.data-ticket-id]="ticket.id" class="priority-badge">
                  {{ ticket.priority }}
                </hlm-badge>
              </hlm-td>
              <hlm-td><app-status-badge [status]="ticket.status" /></hlm-td>
              <hlm-td class="text-xs text-slate-400 font-medium">{{ ticket.createdAt | timeAgo }}</hlm-td>
            </hlm-trow>

            <div *ngIf="recentTickets().length === 0" class="py-16 text-center">
              <i class="pi pi-inbox" style="font-size:44px;color:#E2E8F0;display:block;margin:0 auto 10px"></i>
              <p class="text-sm font-semibold text-slate-400">No tickets in your queue</p>
              <p class="text-xs text-slate-300 mt-1">You're all caught up!</p>
            </div>
          </ng-container>
        </hlm-table>
      </hlm-card>
    </div>
  `,
})
export class DashboardComponent implements OnInit, AfterViewInit {
  stats = signal<DashboardStats | null>(null);
  kpis = signal<any[]>([]);
  recentTickets = signal<Ticket[]>([]);
  loadingTickets = signal(true);
  skeletonRows = Array(5);

  @ViewChildren('row', { read: ElementRef }) rowEls!: QueryList<ElementRef<HTMLElement>>;

  constructor(
    private statsService: StatsService,
    private ticketService: TicketService,
    private dialogService: HlmDialogService,
    private dialog: Dialog,
  ) {}

  ngOnInit() {
    this.statsService.getDashboard().subscribe(s => {
      this.stats.set(s);
      this.kpis.set([
        { label: 'Open', value: s.openTickets, icon: 'pi-inbox', bg: 'bg-blue-50', color: 'text-blue-600', accentColor: 'bg-blue-500' },
        { label: 'Pending', value: s.pendingTickets, icon: 'pi-clock', bg: 'bg-amber-50', color: 'text-amber-600', accentColor: 'bg-amber-500' },
        { label: 'Resolved Today', value: s.resolvedToday, icon: 'pi-check-circle', bg: 'bg-green-50', color: 'text-green-600', accentColor: 'bg-green-500' },
        { label: 'SLA Breached', value: s.slaBreached, icon: 'pi-exclamation-triangle', bg: 'bg-red-50', color: 'text-red-600', accentColor: 'bg-red-500' },
      ]);
    });

    this.ticketService.getTickets({ size: 10 }).subscribe({
      next: (page) => {
        this.recentTickets.set(page.content);
        this.loadingTickets.set(false);
        // Rows render on the next tick once *ngIf flips - stagger them in.
        requestAnimationFrame(() => this.animateRowsIn());
      },
      error: () => this.loadingTickets.set(false),
    });
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

  /** Brief pulse/highlight on a ticket's priority badge when AI triage updates it. */
  pulsePriorityBadge(ticketId: string) {
    const badge = document.querySelector(`[data-ticket-id="${ticketId}"]`);
    if (!badge) return;
    gsap.fromTo(
      badge,
      { scale: 1.15, boxShadow: '0 0 0 4px rgba(37,99,235,0.25)' },
      { scale: 1, boxShadow: '0 0 0 0 rgba(37,99,235,0)', duration: 0.4, ease: 'power2.out' },
    );
  }

  priorityVariant(priority: Priority): BadgeVariants['variant'] {
    return PRIORITY_BADGE_VARIANT[priority] ?? 'default';
  }

  openQuickView(ticket: Ticket) {
    this.dialogService.open(TicketQuickViewDialogComponent, {
      data: { ticket },
    });
  }
}
