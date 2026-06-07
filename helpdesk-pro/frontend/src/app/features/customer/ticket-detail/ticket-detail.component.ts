import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { TicketService } from '../../../core/services/ticket.service';
import { Ticket, Comment } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
    MatButtonModule, MatInputModule, MatIconModule,
    StatusBadgeComponent, PriorityBadgeComponent, TimeAgoPipe, SkeletonLoaderComponent],
  template: `
    <app-skeleton-loader *ngIf="loading()" type="card" />

    <div *ngIf="!loading() && ticket()" class="max-w-3xl mx-auto space-y-5">

      <!-- Back link -->
      <a routerLink="/customer/tickets"
         class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-gray-900 transition-colors">
        <mat-icon style="font-size:16px;width:16px;height:16px">arrow_back</mat-icon>
        Back to tickets
      </a>

      <!-- Ticket header card -->
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <!-- Status bar at top -->
        <div class="h-1 w-full" [ngClass]="topBarClass()"></div>
        <div class="p-6">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xs font-mono font-bold text-slate-400">{{ ticket()!.ticketNumber }}</span>
              </div>
              <h1 class="text-xl font-black text-gray-900" style="letter-spacing:-0.02em">{{ ticket()!.title }}</h1>
            </div>
            <div class="flex gap-2 shrink-0">
              <app-priority-badge [priority]="ticket()!.priority" />
              <app-status-badge [status]="ticket()!.status" />
            </div>
          </div>

          <div class="rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
               style="background:#F8FAFC;border:1px solid #F1F5F9">
            {{ ticket()!.description }}
          </div>

          <div class="flex items-center gap-5 mt-4 text-xs text-slate-400 font-medium">
            <div class="flex items-center gap-1.5">
              <mat-icon style="font-size:13px;width:13px;height:13px">schedule</mat-icon>
              Submitted {{ ticket()!.createdAt | timeAgo }}
            </div>
            <div *ngIf="ticket()!.assignedAgent" class="flex items-center gap-1.5">
              <mat-icon style="font-size:13px;width:13px;height:13px">person</mat-icon>
              Handled by {{ ticket()!.assignedAgent!.fullName }}
            </div>
            <div *ngIf="!ticket()!.assignedAgent" class="flex items-center gap-1.5">
              <mat-icon style="font-size:13px;width:13px;height:13px">hourglass_empty</mat-icon>
              Awaiting assignment
            </div>
          </div>
        </div>
      </div>

      <!-- Conversation -->
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">

        <div class="flex items-center gap-2.5 px-6 py-4" style="border-bottom:1px solid #F1F5F9">
          <mat-icon class="text-slate-400" style="font-size:16px;width:16px;height:16px">forum</mat-icon>
          <h2 class="font-bold text-gray-900 text-sm">Conversation</h2>
          <span class="ml-auto px-2 py-0.5 rounded-full text-xs font-bold"
                style="background:#F1F5F9;color:#64748B">{{ comments().length }}</span>
        </div>

        <div class="p-6">
          <!-- Empty state -->
          <div *ngIf="comments().length === 0" class="text-center py-8">
            <mat-icon style="font-size:36px;width:36px;height:36px;color:#E2E8F0;display:block;margin:0 auto 8px">chat_bubble_outline</mat-icon>
            <p class="text-sm font-medium text-slate-400">No replies yet</p>
            <p class="text-xs text-slate-300 mt-1">Add a reply below to start the conversation</p>
          </div>

          <!-- Comments thread -->
          <div class="space-y-4">
            <div *ngFor="let comment of comments()" class="flex gap-3">
              <div class="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                   style="background:linear-gradient(135deg,#2563EB,#1D4ED8)">
                {{ initials(comment.author.fullName) }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="rounded-2xl rounded-tl-sm p-4 border"
                     style="background:#fff;border-color:#F1F5F9;box-shadow:0 1px 3px rgba(0,0,0,0.04)">
                  <div class="flex items-center justify-between mb-2">
                    <span class="font-bold text-gray-900 text-sm">{{ comment.author.fullName }}</span>
                    <span class="text-xs text-slate-400 font-medium">{{ comment.createdAt | timeAgo }}</span>
                  </div>
                  <p class="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{{ comment.body }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Reply box -->
          <div class="mt-6 pt-6" style="border-top:1px solid #F1F5F9">
            <h3 class="font-bold text-gray-900 text-sm mb-3">Add a Reply</h3>
            <mat-form-field class="w-full" appearance="outline">
              <textarea matInput [formControl]="replyControl" rows="4"
                        placeholder="Type your message here..."></textarea>
            </mat-form-field>
            <div class="flex justify-end mt-2">
              <button (click)="sendReply()"
                      [disabled]="replyControl.invalid || submitting"
                      class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style="background:linear-gradient(135deg,#2563EB,#1D4ED8);box-shadow:0 2px 8px rgba(37,99,235,0.3)">
                <mat-icon style="font-size:16px;width:16px;height:16px">send</mat-icon>
                {{ submitting ? 'Sending...' : 'Send Reply' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TicketDetailComponent implements OnInit {
  ticket = signal<Ticket | null>(null);
  comments = signal<Comment[]>([]);
  loading = signal(true);
  submitting = false;
  replyControl = new FormControl('', Validators.required);

  constructor(private route: ActivatedRoute, private ticketService: TicketService) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ticketService.getTicket(id).subscribe(t => { this.ticket.set(t); this.loading.set(false); });
    this.ticketService.getComments(id).subscribe(c => this.comments.set(c));
  }

  sendReply() {
    if (this.replyControl.invalid) return;
    this.submitting = true;
    const id = this.ticket()!.id;
    this.ticketService.addComment(id, this.replyControl.value!).subscribe({
      next: (comment) => {
        this.comments.update(c => [...c, comment]);
        this.replyControl.reset();
        this.submitting = false;
      },
      error: () => { this.submitting = false; },
    });
  }

  topBarClass(): string {
    const map: Record<string, string> = {
      NEW: 'bg-blue-500', OPEN: 'bg-indigo-500', PENDING: 'bg-amber-400',
      ON_HOLD: 'bg-slate-400', RESOLVED: 'bg-green-500', CLOSED: 'bg-slate-300',
    };
    return map[this.ticket()?.status || ''] || 'bg-gray-200';
  }

  initials(name: string): string {
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
