import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TicketService } from '../../../core/services/ticket.service';
import { Ticket, Comment, TicketStatus, Priority } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-agent-ticket-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    MatButtonModule, MatButtonToggleModule, MatCardModule, MatChipsModule,
    MatIconModule, MatInputModule, MatSelectModule, MatTooltipModule,
    StatusBadgeComponent, PriorityBadgeComponent, TimeAgoPipe, SkeletonLoaderComponent],
  template: `
    <app-skeleton-loader *ngIf="loading()" type="card" />

    <div *ngIf="!loading() && ticket()" class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">

      <!-- Left: Thread -->
      <div class="lg:col-span-2 space-y-4">
        <!-- Ticket header -->
        <mat-card class="!rounded-2xl !shadow-sm">
          <mat-card-content class="!p-6">
            <p class="text-xs font-mono text-gray-400 mb-1">{{ ticket()!.ticketNumber }}</p>
            <h1 class="font-heading text-xl font-bold text-gray-900 mb-3">{{ ticket()!.title }}</h1>
            <div class="bg-gray-50 rounded-xl p-4 text-gray-700 text-sm whitespace-pre-wrap">{{ ticket()!.description }}</div>
            <p class="text-xs text-gray-400 mt-3">Created {{ ticket()!.createdAt | timeAgo }} by {{ ticket()!.createdBy?.fullName }}</p>
          </mat-card-content>
        </mat-card>

        <!-- Comments -->
        <div class="space-y-3">
          <div *ngFor="let comment of comments()"
               class="flex gap-3"
               [class.justify-end]="comment.internal">
            <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0"
                 *ngIf="!comment.internal">
              {{ comment.author.fullName[0] }}
            </div>
            <div class="flex-1 max-w-lg">
              <div class="rounded-2xl p-4 text-sm"
                   [ngClass]="comment.internal ? 'bg-amber-50 border border-amber-200 rounded-tr-none' : 'bg-white border border-gray-100 shadow-sm rounded-tl-none'">
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-medium text-gray-900">{{ comment.author.fullName }}</span>
                  <span *ngIf="comment.internal" class="text-xs px-1.5 py-0.5 bg-amber-200 text-amber-800 rounded font-medium">Internal Note</span>
                  <span class="text-xs text-gray-400 ml-auto">{{ comment.createdAt | timeAgo }}</span>
                </div>
                <p class="text-gray-700 whitespace-pre-wrap">{{ comment.body }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Reply -->
        <mat-card class="!rounded-2xl !shadow-sm">
          <mat-card-content class="!p-5">
            <div class="flex items-center gap-3 mb-3">
              <span class="text-sm font-semibold text-gray-900">Reply</span>
              <mat-button-toggle-group [formControl]="noteMode" class="!h-8 !text-xs">
                <mat-button-toggle value="public" class="!px-3">Public</mat-button-toggle>
                <mat-button-toggle value="internal" class="!px-3">Internal Note</mat-button-toggle>
              </mat-button-toggle-group>
            </div>
            <mat-form-field class="w-full" appearance="outline">
              <textarea matInput [formControl]="replyControl" rows="4"
                        [placeholder]="noteMode.value === 'internal' ? 'Add an internal note (only agents can see this)...' : 'Type a reply to the customer...'"></textarea>
            </mat-form-field>
            <div class="flex justify-end mt-1">
              <button mat-raised-button color="primary" (click)="sendReply()"
                      [disabled]="replyControl.invalid || submitting" class="!rounded-xl !font-semibold">
                <mat-icon>send</mat-icon>
                {{ noteMode.value === 'internal' ? 'Add Note' : 'Send Reply' }}
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Right: Ticket info -->
      <div class="space-y-4">
        <mat-card class="!rounded-2xl !shadow-sm">
          <mat-card-content class="!p-5 space-y-4">
            <h3 class="font-semibold text-gray-900 text-sm">Ticket Details</h3>

            <div>
              <label class="text-xs text-gray-500 font-medium uppercase tracking-wide">Status</label>
              <mat-select [(value)]="currentStatus" (selectionChange)="updateStatus()" class="w-full mt-1">
                <mat-option *ngFor="let s of statuses" [value]="s">{{ s }}</mat-option>
              </mat-select>
            </div>

            <div>
              <label class="text-xs text-gray-500 font-medium uppercase tracking-wide">Priority</label>
              <div class="mt-1"><app-priority-badge [priority]="ticket()!.priority" /></div>
            </div>

            <div *ngIf="ticket()!.dueDate">
              <label class="text-xs text-gray-500 font-medium uppercase tracking-wide">SLA Due</label>
              <p class="text-sm mt-1" [ngClass]="ticket()!.slaBreached ? 'text-red-600 font-semibold' : 'text-gray-700'">
                <mat-icon *ngIf="ticket()!.slaBreached" class="text-sm text-red-500 mr-1">warning</mat-icon>
                {{ ticket()!.dueDate | date:'short' }}
              </p>
            </div>

            <div>
              <label class="text-xs text-gray-500 font-medium uppercase tracking-wide">Customer</label>
              <p class="text-sm mt-1 text-gray-900">{{ ticket()!.createdBy?.fullName }}</p>
              <p class="text-xs text-gray-400">{{ ticket()!.createdBy?.email }}</p>
            </div>
          </mat-card-content>
        </mat-card>
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
}
