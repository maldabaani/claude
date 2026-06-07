import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { PopoverModule } from 'primeng/popover';
import { InputTextModule } from 'primeng/inputtext';
import { TicketService } from '../../../core/services/ticket.service';
import { UserService } from '../../../core/services/user.service';
import { DepartmentService } from '../../../core/services/department.service';
import { CannedResponseService, CannedResponse as CannedResponseModel } from '../../../core/services/canned-response.service';
import { Ticket, Comment, TicketStatus, User, Department, Attachment } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-agent-ticket-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormsModule, DatePipe,
    ButtonModule, SelectModule, SelectButtonModule, TooltipModule, TextareaModule,
    PopoverModule, InputTextModule,
    StatusBadgeComponent, PriorityBadgeComponent, TimeAgoPipe, SkeletonLoaderComponent],
  template: `
    <app-skeleton-loader *ngIf="loading()" type="card" />

    <div *ngIf="!loading() && ticket()" class="space-y-5">

      <!-- Back nav -->
      <a routerLink="/agent/queue"
         class="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-gray-900 transition-colors">
        <i class="pi pi-arrow-left" style="font-size:16px"></i>
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
                <div class="flex items-center gap-2">
                  <button type="button" (click)="cannedPanel.toggle($event)"
                          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                    <i class="pi pi-bookmark" style="font-size:12px"></i>
                    Canned
                  </button>
                  <p-popover #cannedPanel>
                    <div style="width:320px">
                      <div class="p-3 border-b border-gray-100">
                        <input pInputText class="w-full text-sm" placeholder="Search responses..."
                               [ngModel]="cannedSearch()" (ngModelChange)="setCannedSearch($event)" />
                      </div>
                      <div class="max-h-64 overflow-y-auto">
                        <div *ngFor="let r of filteredCanned()"
                             (click)="insertCanned(r); cannedPanel.hide()"
                             class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 transition-colors">
                          <p class="text-sm font-semibold text-gray-900">{{ r.title }}</p>
                          <p class="text-xs text-slate-400 mt-0.5 truncate">{{ r.body }}</p>
                        </div>
                        <div *ngIf="filteredCanned().length === 0" class="px-4 py-6 text-center text-xs text-slate-400">
                          No responses found
                        </div>
                      </div>
                    </div>
                  </p-popover>
                  <p-selectbutton [options]="noteModeOptions" [(ngModel)]="noteMode"
                                  optionLabel="label" optionValue="value" />
                </div>
              </div>

              <div *ngIf="noteMode === 'internal'"
                   class="flex items-center gap-2 px-3 py-2.5 rounded-lg mb-3 text-xs font-medium"
                   style="background:#FFFBEB;border:1px solid #FDE68A;color:#92400E">
                <i class="pi pi-lock" style="font-size:14px"></i>
                Internal note — only agents can see this
              </div>

              <textarea pTextarea [formControl]="replyControl" rows="4" class="w-full"
                        [placeholder]="noteMode === 'internal'
                          ? 'Add an internal note visible only to your team...'
                          : 'Type a reply to the customer...'"></textarea>

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
                        [style.background]="noteMode === 'internal' ? 'linear-gradient(135deg,#F59E0B,#D97706)' : 'linear-gradient(135deg,#2563EB,#1D4ED8)'"
                        style="box-shadow:0 2px 8px rgba(0,0,0,0.15)">
                  <i class="pi pi-send" style="font-size:16px"></i>
                  {{ submitting ? 'Sending...' : (noteMode === 'internal' ? 'Add Note' : 'Send Reply') }}
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
                <p-select [options]="statusOptions" [(ngModel)]="currentStatus" (onChange)="updateStatus()"
                          optionLabel="label" optionValue="value" class="w-full" />
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
                  <i *ngIf="ticket()!.slaBreached" class="pi pi-exclamation-triangle text-red-500" style="font-size:14px"></i>
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

              <!-- Assigned Agent -->
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assigned To</label>
                <p-select [options]="agentOptions" [(ngModel)]="currentAgentId" (onChange)="assignAgent()"
                          optionLabel="label" optionValue="value" class="w-full"
                          placeholder="Unassigned" />
              </div>

              <!-- Department -->
              <div *ngIf="ticket()!.departmentId">
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Department</label>
                <p class="text-sm font-semibold text-gray-700">{{ departmentName() }}</p>
              </div>

              <!-- First Response -->
              <div *ngIf="ticket()!.firstResponseAt">
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">First Response</label>
                <p class="text-sm font-semibold text-green-600">{{ ticket()!.firstResponseAt | date:'MMM d, h:mm a' }}</p>
              </div>
              <div *ngIf="!ticket()!.firstResponseAt">
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">First Response</label>
                <p class="text-xs font-medium text-amber-500">Awaiting first reply</p>
              </div>

              <!-- Tags -->
              <div>
                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tags</label>
                <div class="flex flex-wrap gap-1.5 mb-2">
                  <span *ngFor="let tag of ticket()!.tags"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                        style="background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE">
                    {{ tag }}
                    <button (click)="removeTag(tag)" class="hover:text-red-500 transition-colors leading-none">
                      <i class="pi pi-times" style="font-size:11px"></i>
                    </button>
                  </span>
                  <span *ngIf="ticket()!.tags.length === 0" class="text-xs text-slate-300 italic">No tags</span>
                </div>
                <div class="flex gap-1.5">
                  <input #tagInput
                         class="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-200 focus:outline-none focus:border-blue-400"
                         placeholder="Add tag..."
                         (keydown.enter)="addTag(tagInput.value); tagInput.value = ''"
                         style="font-family:inherit">
                  <button (click)="addTag(tagInput.value); tagInput.value = ''"
                          class="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white"
                          style="background:#2563EB">
                    Add
                  </button>
                </div>
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
  agents = signal<User[]>([]);
  departments = signal<Department[]>([]);
  attachments = signal<Attachment[]>([]);
  pendingFiles = signal<File[]>([]);
  loading = signal(true);
  submitting = false;
  replyControl = new FormControl('', Validators.required);
  noteMode: 'public' | 'internal' = 'public';
  currentStatus: TicketStatus = 'NEW';
  currentAgentId: string | null = null;

  noteModeOptions = [
    { label: 'Public', value: 'public' },
    { label: 'Internal', value: 'internal' },
  ];

  statusOptions = ['NEW', 'OPEN', 'PENDING', 'ON_HOLD', 'RESOLVED', 'CLOSED'].map(s => ({
    label: s.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    value: s as TicketStatus
  }));

  agentOptions: { label: string; value: string | null }[] = [{ label: 'Unassigned', value: null }];

  cannedResponses = signal<CannedResponseModel[]>([]);
  cannedSearch = signal('');

  filteredCanned(): CannedResponseModel[] {
    const q = this.cannedSearch().toLowerCase();
    return this.cannedResponses().filter(r =>
      r.title.toLowerCase().includes(q) || r.body.toLowerCase().includes(q)
    );
  }

  setCannedSearch(value: string) { this.cannedSearch.set(value); }

  insertCanned(r: CannedResponseModel) {
    this.replyControl.setValue((this.replyControl.value || '') + r.body);
  }

  getDownloadUrl(attId: string): string {
    return `${environment.apiUrl}/attachments/${attId}/download`;
  }

  constructor(
    private route: ActivatedRoute,
    private ticketService: TicketService,
    private userService: UserService,
    private departmentService: DepartmentService,
    private cannedResponseService: CannedResponseService,
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.ticketService.getTicket(id).subscribe(t => {
      this.ticket.set(t);
      this.currentStatus = t.status;
      this.currentAgentId = t.assignedAgent?.id ?? null;
      this.loading.set(false);
    });
    this.ticketService.getComments(id).subscribe(c => this.comments.set(c));
    this.ticketService.getAttachments(id).subscribe(a => this.attachments.set(a));
    this.userService.getUsers('AGENT', 0, 100).subscribe(p => {
      this.agents.set(p.content);
      this.agentOptions = [
        { label: 'Unassigned', value: null },
        ...p.content.map((a: User) => ({ label: a.fullName, value: a.id }))
      ];
    });
    this.departmentService.getDepartments().subscribe(p => this.departments.set(p.content));
    this.cannedResponseService.getAll().subscribe(list => this.cannedResponses.set(list));
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

  sendReply() {
    if (this.replyControl.invalid) return;
    this.submitting = true;
    const id = this.ticket()!.id;
    const isInternal = this.noteMode === 'internal';
    this.ticketService.addComment(id, this.replyControl.value!, isInternal).subscribe({
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

  updateStatus() {
    const id = this.ticket()!.id;
    this.ticketService.changeStatus(id, this.currentStatus).subscribe(t => this.ticket.set(t));
  }

  assignAgent() {
    if (!this.currentAgentId) return;
    const id = this.ticket()!.id;
    this.ticketService.assignTicket(id, this.currentAgentId).subscribe(t => this.ticket.set(t));
  }

  departmentName(): string {
    const deptId = this.ticket()?.departmentId;
    if (!deptId) return '';
    return this.departments().find(d => d.id === deptId)?.name ?? deptId;
  }

  addTag(value: string) {
    const tag = value.trim();
    if (!tag) return;
    const ticket = this.ticket()!;
    if (ticket.tags.includes(tag)) return;
    const newTags = [...ticket.tags, tag];
    this.ticketService.updateTicket(ticket.id, { tags: newTags }).subscribe(t => this.ticket.set(t));
  }

  removeTag(tag: string) {
    const ticket = this.ticket()!;
    const newTags = ticket.tags.filter(t => t !== tag);
    this.ticketService.updateTicket(ticket.id, { tags: newTags }).subscribe(t => this.ticket.set(t));
  }

  topBarClass(): string {
    const map: Record<string, string> = {
      NEW: 'bg-blue-500', OPEN: 'bg-indigo-500', PENDING: 'bg-amber-400',
      ON_HOLD: 'bg-slate-400', RESOLVED: 'bg-green-500', CLOSED: 'bg-slate-300',
    };
    return map[this.ticket()?.status || ''] || 'bg-gray-200';
  }
}
