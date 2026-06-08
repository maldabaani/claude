import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { IssueService, Issue } from '../../../core/services/issue.service';
import { TicketService } from '../../../core/services/ticket.service';
import { UserService } from '../../../core/services/user.service';
import { Ticket, User } from '../../../core/models';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-issues',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe,
    ButtonModule, InputTextModule, DialogModule, TableModule, TextareaModule, TooltipModule, SelectModule,
    StatusBadgeComponent],
  template: `
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Issues</h1>
          <p class="text-sm text-slate-400 mt-0.5">Group related tickets under a common issue</p>
        </div>
        <button (click)="openCreate()"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style="background:linear-gradient(135deg,#2563EB,#1D4ED8);box-shadow:0 2px 8px rgba(37,99,235,0.3)">
          <i class="pi pi-plus" style="font-size:14px"></i>
          New Issue
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <p-table [value]="issues()" [loading]="loading()" dataKey="id"
                 [expandedRowKeys]="expandedRows" rowExpandMode="single">
          <ng-template pTemplate="header">
            <tr>
              <th style="width:3rem"></th>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Tickets</th>
              <th>Assignee</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-issue let-expanded="expanded">
            <tr>
              <td>
                <button (click)="toggleRow(issue)" class="text-slate-400 hover:text-blue-600 transition-colors">
                  <i [class]="'pi ' + (expanded ? 'pi-chevron-down' : 'pi-chevron-right')" style="font-size:14px"></i>
                </button>
              </td>
              <td>
                <p class="font-semibold text-gray-900 text-sm">{{ issue.title }}</p>
                <p *ngIf="issue.description" class="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{{ issue.description }}</p>
              </td>
              <td>
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      [ngClass]="statusClass(issue.status)">
                  {{ issue.status }}
                </span>
              </td>
              <td>
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
                      [ngClass]="priorityClass(issue.priority)">
                  {{ issue.priority }}
                </span>
              </td>
              <td>
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style="background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE">
                  <i class="pi pi-ticket" style="font-size:11px"></i>
                  {{ issue.ticketCount }}
                </span>
              </td>
              <td><span class="text-sm text-gray-600">{{ issue.assignedToName || '—' }}</span></td>
              <td><span class="text-xs text-slate-400">{{ issue.createdAt | date:'MMM d, y' }}</span></td>
              <td>
                <div class="flex items-center gap-1">
                  <button (click)="openEdit(issue)" pTooltip="Edit"
                          class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <i class="pi pi-pencil" style="font-size:14px"></i>
                  </button>
                  <button (click)="deleteIssue(issue)" pTooltip="Delete"
                          class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <i class="pi pi-trash" style="font-size:14px"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="rowexpansion" let-issue>
            <tr>
              <td colspan="8" class="p-0">
                <div class="p-5 bg-slate-50 border-t border-gray-100">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-gray-900 text-sm">Linked Tickets for: {{ issue.title }}</h3>
                    <div class="flex items-center gap-2">
                      <input pInputText class="text-sm" placeholder="Search ticket by ID..."
                             [ngModel]="linkSearch()" (ngModelChange)="onLinkSearch($event, issue)" />
                      <div *ngIf="searchResults().length > 0" class="absolute mt-8 z-50 bg-white rounded-xl border shadow overflow-hidden" style="min-width:300px">
                        <div *ngFor="let t of searchResults()"
                             (click)="linkTicket(issue, t)"
                             class="px-4 py-2.5 cursor-pointer hover:bg-blue-50 transition-colors text-sm border-b border-gray-50 last:border-0">
                          <span class="font-semibold">{{ t.title }}</span>
                          <span class="text-slate-400 ml-2 font-mono text-xs">{{ t.ticketNumber }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div *ngIf="!linkedTicketsMap[issue.id]?.length" class="text-xs text-slate-400 italic py-2">
                    No tickets linked
                  </div>
                  <div class="space-y-2">
                    <div *ngFor="let ticket of linkedTicketsMap[issue.id]"
                         class="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-gray-100">
                      <div>
                        <p class="text-sm font-semibold text-gray-900">{{ ticket.title }}</p>
                        <p class="text-xs text-slate-400 font-mono">{{ ticket.ticketNumber }}</p>
                      </div>
                      <div class="flex items-center gap-3">
                        <app-status-badge [status]="ticket.status" />
                        <button (click)="unlinkTicket(issue, ticket)"
                                class="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors">
                          Unlink
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="8" class="text-center py-12 text-slate-400 text-sm">
                No issues found
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <p-dialog [(visible)]="dialogVisible" [modal]="true"
              [header]="editingIssue ? 'Edit Issue' : 'New Issue'"
              [style]="{width:'500px'}" [closable]="true">
      <div class="space-y-4 p-1">
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Title *</label>
          <input pInputText class="w-full" [(ngModel)]="form.title" placeholder="Issue title" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</label>
          <textarea pTextarea class="w-full" [(ngModel)]="form.description" rows="3" placeholder="Describe the issue..."></textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Status</label>
            <p-select [options]="statusOptions" [(ngModel)]="form.status" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Priority</label>
            <p-select [options]="priorityOptions" [(ngModel)]="form.priority" class="w-full" />
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assign To</label>
          <p-select [options]="agents()" [(ngModel)]="form.assignedTo" optionLabel="fullName" optionValue="id"
                    placeholder="Unassigned" class="w-full" [showClear]="true" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button (click)="dialogVisible = false"
                class="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors mr-2">
          Cancel
        </button>
        <button (click)="save()" [disabled]="!form.title || saving()"
                class="px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                style="background:#2563EB">
          {{ saving() ? 'Saving...' : 'Save' }}
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class IssuesComponent implements OnInit {
  issues = signal<Issue[]>([]);
  loading = signal(true);
  saving = signal(false);
  dialogVisible = false;
  editingIssue: Issue | null = null;
  expandedRows: Record<string, boolean> = {};
  linkedTicketsMap: Record<string, Ticket[]> = {};
  agents = signal<User[]>([]);
  linkSearch = signal('');
  searchResults = signal<Ticket[]>([]);
  private linkSearchTimeout: any;

  form: any = {};

  statusOptions = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  constructor(
    private issueService: IssueService,
    private ticketService: TicketService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.load();
    this.userService.getUsers('AGENT', 0, 100).subscribe(p => this.agents.set(p.content));
  }

  load() {
    this.loading.set(true);
    this.issueService.getIssues().subscribe({
      next: issues => { this.issues.set(issues); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleRow(issue: Issue) {
    if (this.expandedRows[issue.id]) {
      delete this.expandedRows[issue.id];
    } else {
      this.expandedRows = { [issue.id]: true };
      if (!this.linkedTicketsMap[issue.id]) {
        this.issueService.getLinkedTickets(issue.id).subscribe(tickets => {
          this.linkedTicketsMap = { ...this.linkedTicketsMap, [issue.id]: tickets };
        });
      }
    }
    this.searchResults.set([]);
    this.linkSearch.set('');
  }

  onLinkSearch(query: string, issue: Issue) {
    this.linkSearch.set(query);
    clearTimeout(this.linkSearchTimeout);
    if (query.length < 2) { this.searchResults.set([]); return; }
    this.linkSearchTimeout = setTimeout(() => {
      this.ticketService.getTickets({ search: query, size: 8 }).subscribe(page => {
        const linked = (this.linkedTicketsMap[issue.id] || []).map(t => t.id);
        this.searchResults.set(page.content.filter(t => !linked.includes(t.id)));
      });
    }, 300);
  }

  linkTicket(issue: Issue, ticket: Ticket) {
    this.issueService.linkTicket(issue.id, ticket.id).subscribe(() => {
      this.linkedTicketsMap = { ...this.linkedTicketsMap, [issue.id]: [...(this.linkedTicketsMap[issue.id] || []), ticket] };
      this.searchResults.set([]);
      this.linkSearch.set('');
      this.load();
    });
  }

  unlinkTicket(issue: Issue, ticket: Ticket) {
    this.issueService.unlinkTicket(issue.id, ticket.id).subscribe(() => {
      this.linkedTicketsMap = { ...this.linkedTicketsMap, [issue.id]: (this.linkedTicketsMap[issue.id] || []).filter(t => t.id !== ticket.id) };
      this.load();
    });
  }

  openCreate() {
    this.editingIssue = null;
    this.form = { status: 'OPEN', priority: 'MEDIUM' };
    this.dialogVisible = true;
  }

  openEdit(issue: Issue) {
    this.editingIssue = issue;
    this.form = { title: issue.title, description: issue.description, status: issue.status, priority: issue.priority };
    this.dialogVisible = true;
  }

  save() {
    if (!this.form.title) return;
    this.saving.set(true);
    const obs = this.editingIssue
      ? this.issueService.updateIssue(this.editingIssue.id, this.form)
      : this.issueService.createIssue(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialogVisible = false; this.load(); },
      error: () => this.saving.set(false),
    });
  }

  deleteIssue(issue: Issue) {
    if (!confirm(`Delete issue "${issue.title}"?`)) return;
    this.issueService.deleteIssue(issue.id).subscribe(() => this.load());
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      OPEN: 'bg-blue-100 text-blue-700',
      IN_PROGRESS: 'bg-amber-100 text-amber-700',
      RESOLVED: 'bg-green-100 text-green-700',
      CLOSED: 'bg-gray-100 text-gray-600',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  }

  priorityClass(priority: string): string {
    const map: Record<string, string> = {
      LOW: 'bg-slate-100 text-slate-600',
      MEDIUM: 'bg-blue-100 text-blue-700',
      HIGH: 'bg-orange-100 text-orange-700',
      CRITICAL: 'bg-red-100 text-red-700',
    };
    return map[priority] || 'bg-gray-100 text-gray-600';
  }
}
