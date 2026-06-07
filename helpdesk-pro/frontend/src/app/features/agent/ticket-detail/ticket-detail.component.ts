import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TicketService } from '../../../core/services/ticket.service';
import { Ticket, Comment, TicketStatus } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-agent-ticket-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
    MatButtonModule, MatButtonToggleModule,
    MatIconModule, MatInputModule, MatSelectModule, MatTooltipModule,
    StatusBadgeComponent, PriorityBadgeComponent, TimeAgoPipe, SkeletonLoaderComponent, DatePipe],
  template: `
    <app-skeleton-loader *ngIf="loading()" type="card" />

    <div *ngIf="!loading() && ticket()" class="space-y-5">

      <!-- Back nav -->
      <a routerLink="/agent/queue"
         class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-gray-900 transition-colors">
        <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon>
        Back to queue
      </a>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <!-- ── Left: Main thread ── -->
        <div class="lg:col-span-2 space-y-4">

          <!-- Ticket header -->
          <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
               style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
            <div class="h-1 w-full" [ngClass]="topBarClass()"></div>
            <div class="p-6">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-mono font-bold text-slate-400">{{ ticket()!.ticketNumber }}</span>
                <span class="text-slate-300">•</span>
                <span class="text-xs text-slate-400">{{ ticket()!.createdAt | timeAgo }}</span>
              </div>
              <h1 class="text-xl font-black text-gray-900 mb-3" style="letter-spacing:-0.02em">{{ ticket()!.title }}</h1>
              <div class="rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                   style="background:#F8FAFC;border:1px solid #F1F5F9">
                {{ ticket()!.description }}
              </div>
              <p class="text-xs text-slate-400 mt-3 font-medium">
                Submitted by <span class="text-gray-700 font-semibold">{{ ticket()!.createdBy?.fullName }}</span>
              </p>
            </div>
          </div>

          <!-- Conversation thread -->
          <div *ngIf="comments().length > 0" class="space-y-3">
            <div *ngFor="let comment of comments()"
                 class="flex gap-3"
                 [class.flex-row-reverse]="comment.internal">

              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                   [ngClass]="comment.internal ? 'bg-amber-500' : 'bg-gradient-to-br from-blue-600 to-blue-700'">
                {{ comment.author.fullName[0] }}
              </div>

              <div class="flex-1 max-w-2xl">
                <div class="rounded-2xl p-4 text-sm"
                     [ngClass]="comment.internal
                       ? 'rounded-tr-sm bg-amber-50 border border-amber-200'
                       : 'rounded-tl-sm bg-white border border-gray-100'"
                     [style.box-shadow]="'0 1px 3px rgba(0,0,0,0.04)'">
                  <div class="flex items-center gap-2 mb-2 flex-wrap">
                    <span class="font-bold text-gray-900 text-sm">{{ comment.author.fullName }}</span>
                    <span *ngIf="comment.internal"
                          class="px-2 py-0.5 rounded-full text-xs font-bold"
                          style="background:#FDE68A;color:#78350F">
                      Internal Note
                    </span>
                    <span class="text-xs text-slate-400 font-medium ml-auto">{{ comment.createdAt | timeAgo }}</span>
                  </div>
                  <p class="text-gray-700 leading-relaxed whitespace-pre-wrap">{{ comment.body }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Reply card -->
          <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
               style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
            <div class="p-5">
              <div class="flex items-center justify-between mb-4">
                <h3 class="font-bold text-gray-900 text-sm">Reply</h3>
                <mat-button-toggle-group [formControl]="noteMode" class="!h-8">
                  <mat-button-toggle value="public" class="!text-xs !px-3">
                    <mat-icon style="font-size:13px;width:13px;height:13px;margin-right:4px">public</mat-icon>
                    Public
                  </mat-button-toggle>
                  <mat-button-toggle value="internal" class="!text-xs !px-3">
                    <mat-icon style="font-size:13px;width:13px;height:13px;margin-right:4px">lock</mat-icon>
                    Internal
                  </mat-button-toggle>
                </mat-button-toggle-group>
              </div>

              <div *ngIf="noteMode.value === 'internal'"
                   class="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-3 text-xs font-medium"
                   style="background:#FFFBEB;border:1px solid #FDE68A;color:#92400E">
                <mat-icon style="font-size:14px;width:14px;height:14px">lock</mat-icon>
                Internal note — only agents can see this
              </div>

              <mat-form-field class="w-full" appearance="outline">
                <textarea matInput [formControl]="replyControl" rows="4"
                          [placeholder]="noteMode.value === 'internal'
                            ? 'Add an internal note visible only to your team...'
                            : 'Type a reply to the customer...'"></textarea>
              </mat-form-field>
              <div class="flex justify-end mt-1">
                <button (click)="sendReply()"
                        [disabled]="replyControl.invalid || submitting"
                        class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        [style.background]="noteMode.value === 'internal' ? 'linear-gradient(135deg,#F59E0B,#D97706)' : 'linear-gradient(135deg,#2563EB,#1D4ED8)'"
                        style="box-shadow:0 2px 8px rgba(0,0,0,0.15)">
                  <mat-icon style="font-size:16px;width:16px;height:16px">send</mat-icon>
                  {{ submitting ? 'Sending...' : (noteMode.value === 'internal' ? 'Add Note' : 'Send Reply') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Right: Sidebar details ── -->
        <div class="space-y-4">

          <!-- Status & Actions -->
          <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
               style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
            <div class="px-5 py-4" style="border-bottom:1px solid #F1F5F9">
              <h3 class="font-bold text-gray-900 text-sm">Ticket Details</h3>
            </div>
            <div class="p-5 space-y-5">

              <!-- Status -->
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
                <mat-select [(value)]="currentStatus" (selectionChange)="updateStatus()"
                            class="w-full" style="font-size:13px">
                  <mat-option *ngFor="let s of statuses" [value]="s">{{ statusLabel(s) }}</mat-option>
                </mat-select>
              </div>

              <!-- Priority -->
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
                <app-priority-badge [priority]="ticket()!.priority" />
              </div>

              <!-- SLA -->
              <div *ngIf="ticket()!.dueDate">
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">SLA Due</label>
                <div class="flex items-center gap-2" [ngClass]="ticket()!.slaBreached ? 'text-red-600' : 'text-gray-700'">
                  <mat-icon *ngIf="ticket()!.slaBreached"
                            style="font-size:14px;width:14px;height:14px" class="text-red-500">warning</mat-icon>
                  <span class="text-sm font-semibold">{{ ticket()!.dueDate | date:'MMM d, h:mm a' }}</span>
                </div>
                <p *ngIf="ticket()!.slaBreached" class="text-xs text-red-500 font-medium mt-1">SLA Breached</p>
              </div>

              <!-- Divider -->
              <div style="border-top:1px solid #F1F5F9"></div>

              <!-- Customer info -->
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Customer</label>
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                       style="background:linear-gradient(135deg,#6366F1,#4F46E5)">
                    {{ (ticket()!.createdBy?.fullName || 'C')[0] }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-bold text-gray-900 truncate">{{ ticket()!.createdBy?.fullName }}</p>
                    <p class="text-xs text-slate-400 truncate">{{ ticket()!.createdBy?.email }}</p>
                  </div>
                </div>
              </div>

              <!-- Department -->
              <div *ngIf="ticket()!.departmentId">
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
                <p class="text-sm font-semibold text-gray-700">{{ ticket()!.departmentId }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AgentTicketDetailComponent implements OnInit {
  ticket = signal<Ticket | null>(null);
  comments = signal<Comment[]>([]);
  loading = signal(true);
  submitting = false;
  replyControl = new FormControl('', Validators.required);
  noteMode = new FormControl<'public' | 'internal'>('public');
  currentStatus: TicketStatus = 'NEW';
  statuses: TicketStatus[] = ['NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'RESOLVED', 'CLOSED'];

  constructor(private route: ActivatedRoute, private ticketService: TicketService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ticketService.getTicket(id).subscribe(t => {
      this.ticket.set(t);
      this.currentStatus = t.status;
      this.loading.set(false);
    });
    this.ticketService.getComments(id).subscribe(c => this.comments.set(c));
  }

  sendReply() {
    if (this.replyControl.invalid) return;
    this.submitting = true;
    const id = this.ticket()!.id;
    const isInternal = this.noteMode.value === 'internal';
    this.ticketService.addComment(id, this.replyControl.value!, isInternal).subscribe({
      next: (comment) => { this.comments.update(c => [...c, comment]); this.replyControl.reset(); this.submitting = false; },
      error: () => { this.submitting = false; },
    });
  }

  updateStatus() {
    const id = this.ticket()!.id;
    this.ticketService.changeStatus(id, this.currentStatus).subscribe(t => this.ticket.set(t));
  }

  topBarClass(): string {
    const map: Record<string, string> = {
      NEW: 'bg-blue-500', OPEN: 'bg-indigo-500', PENDING: 'bg-amber-400',
      ON_HOLD: 'bg-slate-400', RESOLVED: 'bg-green-500', CLOSED: 'bg-slate-300',
    };
    return map[this.ticket()?.status || ''] || 'bg-gray-200';
  }

  statusLabel(status: string): string {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  }
}
