import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { OrganizationService, Organization } from '../../../core/services/organization.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../core/models';

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,
    ButtonModule, InputTextModule, DialogModule, TableModule, TextareaModule, TooltipModule, SelectModule],
  template: `
    <div class="space-y-5">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Organizations</h1>
          <p class="text-sm text-slate-400 mt-0.5">Group customers under company accounts</p>
        </div>
        <button (click)="openCreate()"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style="background:linear-gradient(135deg,#2563EB,#1D4ED8);box-shadow:0 2px 8px rgba(37,99,235,0.3)">
          <i class="pi pi-plus" style="font-size:14px"></i>
          New Organization
        </button>
      </div>

      <!-- Search -->
      <div class="relative max-w-sm">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" style="font-size:14px"></i>
        <input pInputText class="w-full pl-9 text-sm" placeholder="Search organizations..."
               [ngModel]="search()" (ngModelChange)="onSearch($event)" />
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <p-table [value]="organizations()" [loading]="loading()" dataKey="id"
                 [expandedRowKeys]="expandedRows" rowExpandMode="single">
          <ng-template pTemplate="header">
            <tr>
              <th style="width:3rem"></th>
              <th>Name</th>
              <th>Domain</th>
              <th>Phone</th>
              <th>Members</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-org let-expanded="expanded">
            <tr>
              <td>
                <button (click)="toggleRow(org)" class="text-slate-400 hover:text-blue-600 transition-colors">
                  <i [class]="'pi ' + (expanded ? 'pi-chevron-down' : 'pi-chevron-right')" style="font-size:14px"></i>
                </button>
              </td>
              <td>
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                       style="background:linear-gradient(135deg,#6366F1,#4F46E5)">
                    {{ org.name[0] }}
                  </div>
                  <span class="font-semibold text-gray-900 text-sm">{{ org.name }}</span>
                </div>
              </td>
              <td><span class="text-sm text-gray-600">{{ org.domain || '—' }}</span></td>
              <td><span class="text-sm text-gray-600">{{ org.phone || '—' }}</span></td>
              <td>
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                      style="background:#EFF6FF;color:#1D4ED8;border:1px solid #BFDBFE">
                  <i class="pi pi-users" style="font-size:11px"></i>
                  {{ org.memberCount }}
                </span>
              </td>
              <td>
                <div class="flex items-center gap-1">
                  <button (click)="openEdit(org)" pTooltip="Edit"
                          class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <i class="pi pi-pencil" style="font-size:14px"></i>
                  </button>
                  <button (click)="deleteOrg(org)" pTooltip="Delete"
                          class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <i class="pi pi-trash" style="font-size:14px"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="rowexpansion" let-org>
            <tr>
              <td colspan="6" class="p-0">
                <div class="p-5 bg-slate-50 border-t border-gray-100">
                  <div class="flex items-center justify-between mb-4">
                    <h3 class="font-bold text-gray-900 text-sm">Members of {{ org.name }}</h3>
                    <div class="flex items-center gap-2">
                      <p-select [options]="availableUsers()" [(ngModel)]="selectedUserId"
                                optionLabel="fullName" optionValue="id"
                                placeholder="Select user to add" class="text-sm" />
                      <button (click)="addMember(org)" [disabled]="!selectedUserId"
                              class="px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50"
                              style="background:#2563EB">
                        Add Member
                      </button>
                    </div>
                  </div>
                  <div *ngIf="membersMap[org.id]?.length === 0" class="text-xs text-slate-400 italic py-2">
                    No members yet
                  </div>
                  <div class="space-y-2">
                    <div *ngFor="let member of membersMap[org.id]"
                         class="flex items-center justify-between px-3 py-2 bg-white rounded-xl border border-gray-100">
                      <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                             style="background:linear-gradient(135deg,#6366F1,#4F46E5)">
                          {{ member.fullName[0] }}
                        </div>
                        <div>
                          <p class="text-sm font-semibold text-gray-900">{{ member.fullName }}</p>
                          <p class="text-xs text-slate-400">{{ member.email }}</p>
                        </div>
                        <span class="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold"
                              style="background:#F0FDF4;color:#166534;border:1px solid #BBF7D0">
                          {{ member.role }}
                        </span>
                      </div>
                      <button (click)="removeMember(org, member)"
                              class="text-xs text-red-500 hover:text-red-700 font-semibold transition-colors">
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="6" class="text-center py-12 text-slate-400 text-sm">
                No organizations found
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <p-dialog [(visible)]="dialogVisible" [modal]="true"
              [header]="editingOrg ? 'Edit Organization' : 'New Organization'"
              [style]="{width:'480px'}" [closable]="true">
      <div class="space-y-4 p-1">
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Name *</label>
          <input pInputText class="w-full" [(ngModel)]="form.name" placeholder="Company name" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Domain</label>
          <input pInputText class="w-full" [(ngModel)]="form.domain" placeholder="company.com" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Phone</label>
          <input pInputText class="w-full" [(ngModel)]="form.phone" placeholder="+1 555 000 0000" />
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Address</label>
          <textarea pTextarea class="w-full" [(ngModel)]="form.address" rows="2" placeholder="Street address..."></textarea>
        </div>
        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</label>
          <textarea pTextarea class="w-full" [(ngModel)]="form.notes" rows="2" placeholder="Internal notes..."></textarea>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button (click)="dialogVisible = false"
                class="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors mr-2">
          Cancel
        </button>
        <button (click)="save()" [disabled]="!form.name || saving()"
                class="px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                style="background:#2563EB">
          {{ saving() ? 'Saving...' : 'Save' }}
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class OrganizationsComponent implements OnInit {
  organizations = signal<Organization[]>([]);
  loading = signal(true);
  saving = signal(false);
  search = signal('');
  dialogVisible = false;
  editingOrg: Organization | null = null;
  expandedRows: Record<string, boolean> = {};
  membersMap: Record<string, User[]> = {};
  availableUsers = signal<User[]>([]);
  selectedUserId: string | null = null;

  form: Partial<Organization> = {};
  private searchTimeout: any;

  constructor(
    private orgService: OrganizationService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.load();
    this.userService.getUsers('CUSTOMER', 0, 200).subscribe(p => this.availableUsers.set(p.content));
  }

  load() {
    this.loading.set(true);
    this.orgService.getOrganizations(this.search()).subscribe({
      next: orgs => { this.organizations.set(orgs); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSearch(val: string) {
    this.search.set(val);
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.load(), 400);
  }

  toggleRow(org: Organization) {
    if (this.expandedRows[org.id]) {
      delete this.expandedRows[org.id];
    } else {
      this.expandedRows = { [org.id]: true };
      if (!this.membersMap[org.id]) {
        this.orgService.getMembers(org.id).subscribe(members => {
          this.membersMap = { ...this.membersMap, [org.id]: members };
        });
      }
    }
  }

  openCreate() {
    this.editingOrg = null;
    this.form = {};
    this.dialogVisible = true;
  }

  openEdit(org: Organization) {
    this.editingOrg = org;
    this.form = { name: org.name, domain: org.domain, phone: org.phone, address: org.address, notes: org.notes };
    this.dialogVisible = true;
  }

  save() {
    if (!this.form.name) return;
    this.saving.set(true);
    const obs = this.editingOrg
      ? this.orgService.updateOrganization(this.editingOrg.id, this.form)
      : this.orgService.createOrganization(this.form);
    obs.subscribe({
      next: () => { this.saving.set(false); this.dialogVisible = false; this.load(); },
      error: () => this.saving.set(false),
    });
  }

  deleteOrg(org: Organization) {
    if (!confirm(`Delete "${org.name}"? This cannot be undone.`)) return;
    this.orgService.deleteOrganization(org.id).subscribe(() => this.load());
  }

  addMember(org: Organization) {
    if (!this.selectedUserId) return;
    this.orgService.addMember(org.id, this.selectedUserId).subscribe(() => {
      this.orgService.getMembers(org.id).subscribe(members => {
        this.membersMap = { ...this.membersMap, [org.id]: members };
      });
      this.selectedUserId = null;
      this.load();
    });
  }

  removeMember(org: Organization, member: User) {
    this.orgService.removeMember(org.id, member.id).subscribe(() => {
      this.membersMap = { ...this.membersMap, [org.id]: (this.membersMap[org.id] || []).filter(m => m.id !== member.id) };
      this.load();
    });
  }
}
