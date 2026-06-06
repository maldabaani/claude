import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { TicketService } from '../../../core/services/ticket.service';
import { Ticket, Comment } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    MatButtonModule, MatInputModule, MatIconModule, MatCardModule, MatDividerModule,
    StatusBadgeComponent, PriorityBadgeComponent, TimeAgoPipe, SkeletonLoaderComponent],
  template: `
    <app-skeleton-loader *ngIf="loading()" type="card" />

    <div *ngIf="!loading() && ticket()" class="max-w-3xl mx-auto space-y-6">
      <!-- Header -->
      <mat-card class="!rounded-2xl !shadow-sm">
        <mat-card-content class="!p-6">
          <div class="flex items-start justify-between gap-4 mb-4">
            <div class="flex-1">
              <p class="text-sm font-mono text-gray-400 mb-1">{{ ticket()!.ticketNumber }}</p>
              <h1 class="font-heading text-xl font-bold text-gray-900">{{ ticket()!.title }}</h1>
            </div>
            <div class="flex gap-2 shrink-0">
              <app-priority-badge [priority]="ticket()!.priority" />
              <app-status-badge [status]="ticket()!.status" />
            </div>
          </div>

          <div class="prose prose-sm max-w-none text-gray-700 bg-gray-50 rounded-xl p-4">
            {{ ticket()!.description }}
          </div>

          <div class="flex gap-6 mt-4 text-sm text-gray-500">
            <span>Created {{ ticket()!.createdAt | timeAgo }}</span>
            <span *ngIf="ticket()!.assignedAgent">Assigned to {{ ticket()!.assignedAgent!.fullName }}</span>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Conversation thread -->
      <div class="space-y-4">
        <h2 class="font-heading font-semibold text-gray-900">Conversation</h2>

        <div *ngFor="let comment of comments()" class="flex gap-3">
          <div class="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
            {{ initials(comment.author.fullName) }}
          </div>
          <div class="flex-1">
            <div class="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100">
              <div class="flex items-center justify-between mb-2">
                <span class="font-medium text-gray-900 text-sm">{{ comment.author.fullName }}</span>
                <span class="text-xs text-gray-400">{{ comment.createdAt | timeAgo }}</span>
              </div>
              <p class="text-gray-700 text-sm whitespace-pre-wrap">{{ comment.body }}</p>
            </div>
          </div>
        </div>

        <p *ngIf="comments().length === 0" class="text-center py-6 text-gray-400 text-sm">
          No replies yet. Add a reply below.
        </p>
      </div>

      <!-- Reply box -->
      <mat-card class="!rounded-2xl !shadow-sm">
        <mat-card-content class="!p-6">
          <h3 class="font-semibold text-gray-900 mb-3">Add Reply</h3>
          <mat-form-field class="w-full" appearance="outline">
            <textarea matInput [formControl]="replyControl" rows="4" placeholder="Type your reply..."></textarea>
          </mat-form-field>
          <div class="flex justify-end mt-2">
            <button mat-raised-button color="primary" (click)="sendReply()"
                    [disabled]="replyControl.invalid || submitting" class="!rounded-xl !font-semibold">
              <mat-icon>send</mat-icon> Send Reply
            </button>
          </div>
        </mat-card-content>
      </mat-card>
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

  initials(name: string) {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  }
}
