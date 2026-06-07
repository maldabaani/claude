import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { TextareaModule } from 'primeng/textarea';
import { ButtonModule } from 'primeng/button';
import { TicketService } from '../../../core/services/ticket.service';
import { CsatService } from '../../../core/services/csat.service';
import { Ticket, Comment, Attachment } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
    TextareaModule, ButtonModule,
    StatusBadgeComponent, PriorityBadgeComponent, TimeAgoPipe, SkeletonLoaderComponent],
  template: `
    <app-skeleton-loader *ngIf="loading()" type="card" />

    <div *ngIf="!loading() && ticket()" class="max-w-3xl mx-auto space-y-5">

      <!-- Back link -->
      <a routerLink="/customer/tickets"
         class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-gray-900 transition-colors">
        <i class="pi pi-arrow-left" style="font-size:16px"></i>
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

          <!-- Attachments -->
          <div *ngIf="attachments().length > 0" class="mt-4">
            <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Attachments</p>
            <div class="flex flex-wrap gap-2">
              <a *ngFor="let att of attachments()"
                 [href]="getDownloadUrl(att.id)"
                 target="_blank"
                 class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-blue-50 transition-colors"
                 style="background:#F8FAFC;border-color:#E2E8F0;color:#2563EB">
                <i class="pi pi-paperclip" style="font-size:12px"></i>
                {{ att.fileName }}
              </a>
            </div>
          </div>

          <div class="flex items-center gap-5 mt-4 text-xs text-slate-400 font-medium">
            <div class="flex items-center gap-1.5">
              <i class="pi pi-clock" style="font-size:13px"></i>
              Submitted {{ ticket()!.createdAt | timeAgo }}
            </div>
            <div *ngIf="ticket()!.assignedAgent" class="flex items-center gap-1.5">
              <i class="pi pi-user" style="font-size:13px"></i>
              Handled by {{ ticket()!.assignedAgent!.fullName }}
            </div>
            <div *ngIf="!ticket()!.assignedAgent" class="flex items-center gap-1.5">
              <i class="pi pi-hourglass" style="font-size:13px"></i>
              Awaiting assignment
            </div>
          </div>
        </div>
      </div>

      <!-- Conversation -->
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">

        <div class="flex items-center gap-2.5 px-6 py-4" style="border-bottom:1px solid #F1F5F9">
          <i class="pi pi-comments text-slate-400" style="font-size:16px"></i>
          <h2 class="font-bold text-gray-900 text-sm">Conversation</h2>
          <span class="ml-auto px-2 py-0.5 rounded-full text-xs font-bold"
                style="background:#F1F5F9;color:#64748B">{{ comments().length }}</span>
        </div>

        <div class="p-6">
          <!-- Empty state -->
          <div *ngIf="comments().length === 0" class="text-center py-8">
            <i class="pi pi-comments" style="font-size:36px;color:#E2E8F0;display:block;margin:0 auto 8px"></i>
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
            <textarea pTextarea [formControl]="replyControl" rows="4" class="w-full"
                      placeholder="Type your message here..."></textarea>

            <!-- Pending files -->
            <div *ngIf="pendingFiles().length > 0" class="flex flex-wrap gap-2 mt-2">
              <div *ngFor="let f of pendingFiles()"
                   class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
                   style="background:#F0FDF4;border-color:#BBF7D0;color:#166534">
                <i class="pi pi-file" style="font-size:11px"></i>
                {{ f.name }}
                <button type="button" (click)="removeFile(f)" class="hover:text-red-500 transition-colors ml-1">
                  <i class="pi pi-times" style="font-size:10px"></i>
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between mt-3">
              <div>
                <input type="file" #fileInput (change)="onFileSelected($event)" multiple style="display:none">
                <button type="button" (click)="fileInput.click()"
                        class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                  <i class="pi pi-paperclip" style="font-size:14px"></i>
                  Attach
                </button>
              </div>
              <button (click)="sendReply()"
                      [disabled]="replyControl.invalid || submitting"
                      class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      style="background:linear-gradient(135deg,#2563EB,#1D4ED8);box-shadow:0 2px 8px rgba(37,99,235,0.3)">
                <i class="pi pi-send" style="font-size:16px"></i>
                {{ submitting ? 'Sending...' : 'Send Reply' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CSAT Rating -->
      <div *ngIf="showCsatForm()" class="bg-white rounded-2xl border border-gray-100 p-6" style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <div *ngIf="!csatSubmitted()">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <i class="pi pi-star-fill text-amber-400" style="font-size:20px"></i>
            </div>
            <div>
              <h3 class="font-bold text-gray-900">How was your support experience?</h3>
              <p class="text-sm text-slate-400">Your feedback helps us improve</p>
            </div>
          </div>
          <!-- Stars -->
          <div class="flex gap-2 mb-4">
            <i *ngFor="let star of stars"
               [class]="csatRating() >= star ? 'pi pi-star-fill text-amber-400 cursor-pointer' : 'pi pi-star text-gray-300 cursor-pointer'"
               style="font-size:28px"
               (click)="setCsatRating(star)"></i>
          </div>
          <textarea pTextarea [(ngModel)]="csatComment" rows="3" class="w-full mb-4"
                    placeholder="Optional comment..."></textarea>
          <button pButton label="Submit Rating" icon="pi pi-send" (click)="submitCsat()"
                  [disabled]="csatRating() === 0 || csatSubmitting()"></button>
        </div>
        <div *ngIf="csatSubmitted()" class="text-center py-4">
          <i class="pi pi-check-circle text-green-500" style="font-size:40px;display:block;margin-bottom:12px"></i>
          <p class="font-bold text-gray-900">Thank you for your feedback!</p>
          <p class="text-sm text-slate-400 mt-1">Your rating helps us serve you better.</p>
        </div>
      </div>

    </div>
  `,
})
export class TicketDetailComponent implements OnInit {
  ticket = signal<Ticket | null>(null);
  comments = signal<Comment[]>([]);
  attachments = signal<Attachment[]>([]);
  pendingFiles = signal<File[]>([]);
  loading = signal(true);
  submitting = false;
  replyControl = new FormControl('', Validators.required);

  csatRating = signal(0);
  csatComment = '';
  csatSubmitted = signal(false);
  csatSubmitting = signal(false);
  existingRating = signal<any>(null);
  stars = [1, 2, 3, 4, 5];

  constructor(
    private route: ActivatedRoute,
    private ticketService: TicketService,
    private csatService: CsatService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ticketService.getTicket(id).subscribe(t => { this.ticket.set(t); this.loading.set(false); });
    this.ticketService.getComments(id).subscribe(c => this.comments.set(c));
    this.ticketService.getAttachments(id).subscribe(a => this.attachments.set(a));
    this.csatService.getRating(id).subscribe({ next: r => this.existingRating.set(r), error: () => {} });
  }

  getDownloadUrl(attId: string): string {
    return `${environment.apiUrl}/attachments/${attId}/download`;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files);
    this.pendingFiles.update(existing => [...existing, ...files]);
    input.value = '';
  }

  removeFile(file: File) {
    this.pendingFiles.update(existing => existing.filter(f => f !== file));
  }

  showCsatForm(): boolean {
    const t = this.ticket();
    if (!t) return false;
    if (t.status !== 'RESOLVED' && t.status !== 'CLOSED') return false;
    if (this.existingRating()) return false;
    return true;
  }

  setCsatRating(n: number) { this.csatRating.set(n); }

  submitCsat() {
    if (!this.csatRating()) return;
    this.csatSubmitting.set(true);
    this.csatService.submitRating(this.ticket()!.id, this.csatRating(), this.csatComment).subscribe({
      next: () => { this.csatSubmitted.set(true); this.csatSubmitting.set(false); },
      error: () => this.csatSubmitting.set(false)
    });
  }

  sendReply() {
    if (this.replyControl.invalid) return;
    this.submitting = true;
    const id = this.ticket()!.id;
    this.ticketService.addComment(id, this.replyControl.value!).subscribe({
      next: (comment) => {
        this.comments.update(c => [...c, comment]);
        const files = this.pendingFiles();
        this.pendingFiles.set([]);
        files.forEach(f => this.ticketService.uploadAttachment(id, f).subscribe({
          next: (att) => this.attachments.update(a => [...a, att])
        }));
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
