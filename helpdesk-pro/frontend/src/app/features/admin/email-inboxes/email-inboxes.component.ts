import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { DialogModule } from 'primeng/dialog';
import { EmailInboxService, EmailInbox, CreateEmailInboxRequest } from '../../../core/services/email-inbox.service';
import { DepartmentService } from '../../../core/services/department.service';
import { Department } from '../../../core/models';

@Component({
  selector: 'app-email-inboxes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DatePipe,
    ButtonModule, InputTextModule, SelectModule, ToggleSwitchModule, DialogModule],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-heading text-2xl font-bold text-gray-900">Email Inboxes</h1>
          <p class="text-sm text-gray-500 mt-0.5">Configure email inboxes to automatically convert emails into tickets</p>
        </div>
        <button (click)="showDialog()"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style="background:linear-gradient(135deg,#2563EB,#1D4ED8)">
          <i class="pi pi-plus" style="font-size:14px"></i>
          Add Inbox
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table class="w-full">
          <thead>
            <tr style="border-bottom:1px solid #F1F5F9;background:#FAFAFA">
              <th class="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Name / Email</th>
              <th class="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Server</th>
              <th class="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Protocol</th>
              <th class="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Last Checked</th>
              <th class="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let inbox of inboxes()"
                class="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td class="px-5 py-4">
                <p class="font-semibold text-gray-900 text-sm">{{ inbox.name }}</p>
                <p class="text-xs text-slate-400">{{ inbox.email }}</p>
              </td>
              <td class="px-5 py-4">
                <p class="text-sm text-gray-700 font-mono">{{ inbox.host }}:{{ inbox.port }}</p>
              </td>
              <td class="px-5 py-4">
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                      style="background:#EFF6FF;color:#1D4ED8">
                  {{ inbox.protocol }}{{ inbox.useSsl ? ' SSL' : '' }}
                </span>
              </td>
              <td class="px-5 py-4">
                <p class="text-xs text-gray-500">
                  {{ inbox.lastCheckedAt ? (inbox.lastCheckedAt | date:'MMM d, h:mm a') : 'Never' }}
                </p>
              </td>
              <td class="px-5 py-4">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                      [ngClass]="inbox.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'">
                  <span class="w-1.5 h-1.5 rounded-full"
                        [ngClass]="inbox.active ? 'bg-green-500' : 'bg-gray-400'"></span>
                  {{ inbox.active ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center gap-1 justify-end">
                  <button (click)="testInbox(inbox)"
                          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                    <i class="pi pi-play" style="font-size:12px"></i>
                    Test
                  </button>
                  <button (click)="editInbox(inbox)"
                          class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                    <i class="pi pi-pencil" style="font-size:15px"></i>
                  </button>
                  <button (click)="deleteInbox(inbox.id)"
                          class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <i class="pi pi-trash" style="font-size:15px"></i>
                  </button>
                </div>
              </td>
            </tr>
            <tr *ngIf="inboxes().length === 0">
              <td colspan="6" class="px-5 py-16 text-center">
                <i class="pi pi-inbox text-gray-200 mb-3" style="font-size:48px;display:block;margin:0 auto 12px"></i>
                <p class="text-sm font-medium text-gray-400">No email inboxes configured</p>
                <p class="text-xs text-gray-300 mt-1">Add an inbox to start receiving tickets via email</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Test result -->
      <div *ngIf="testResult()"
           class="flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium"
           [ngClass]="testResult()!.includes('successful') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'">
        <i [class]="'pi ' + (testResult()!.includes('successful') ? 'pi-check-circle' : 'pi-times-circle')" style="font-size:16px"></i>
        {{ testResult() }}
      </div>
    </div>

    <!-- Add/Edit Dialog -->
    <p-dialog [(visible)]="dialogVisible" [modal]="true"
              [header]="editingId() ? 'Edit Email Inbox' : 'Add Email Inbox'"
              [style]="{width:'560px'}" [closable]="true">
      <div class="space-y-4 p-2">
        <form [formGroup]="form" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Name <span class="text-red-400">*</span></label>
              <input pInputText formControlName="name" class="w-full" placeholder="Support Inbox" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email Address <span class="text-red-400">*</span></label>
              <input pInputText formControlName="email" type="email" class="w-full" placeholder="support@example.com" />
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div class="col-span-2">
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">IMAP Host <span class="text-red-400">*</span></label>
              <input pInputText formControlName="host" class="w-full" placeholder="imap.example.com" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Port</label>
              <input pInputText formControlName="port" type="number" class="w-full" placeholder="993" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Username <span class="text-red-400">*</span></label>
              <input pInputText formControlName="username" class="w-full" placeholder="username" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">
                Password {{ editingId() ? '(leave blank to keep)' : '' }} <span *ngIf="!editingId()" class="text-red-400">*</span>
              </label>
              <input pInputText formControlName="password" type="password" class="w-full" placeholder="••••••••" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Default Department</label>
              <p-select [options]="departmentOptions" formControlName="defaultDepartmentId"
                        optionLabel="label" optionValue="value" placeholder="No preference" class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Default Priority</label>
              <p-select [options]="priorityOptions" formControlName="defaultPriority"
                        optionLabel="label" optionValue="value" class="w-full" />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <p-toggleswitch formControlName="useSsl" />
            <span class="text-sm font-semibold text-gray-700">Use SSL/TLS</span>
          </div>
          <div *ngIf="error" class="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{{ error }}</div>
        </form>
      </div>
      <ng-template pTemplate="footer">
        <button (click)="dialogVisible = false"
                class="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 mr-2">
          Cancel
        </button>
        <button (click)="save()" [disabled]="form.invalid || saving"
                class="px-4 py-2 rounded-lg text-sm font-bold text-white disabled:opacity-50"
                style="background:#2563EB">
          {{ saving ? 'Saving...' : (editingId() ? 'Update' : 'Create') }}
        </button>
      </ng-template>
    </p-dialog>
  `,
})
export class EmailInboxesComponent implements OnInit {
  inboxes = signal<EmailInbox[]>([]);
  editingId = signal<string | null>(null);
  testResult = signal<string | null>(null);
  dialogVisible = false;
  saving = false;
  error = '';

  form = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    host: ['', Validators.required],
    port: [993],
    username: ['', Validators.required],
    password: [''],
    protocol: ['IMAP'],
    useSsl: [true],
    defaultDepartmentId: [null as string | null],
    defaultPriority: ['MEDIUM'],
  });

  priorityOptions = [
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Critical', value: 'CRITICAL' },
  ];

  departmentOptions: { label: string; value: string | null }[] = [{ label: 'No preference', value: null }];

  constructor(
    private fb: FormBuilder,
    private emailInboxService: EmailInboxService,
    private departmentService: DepartmentService,
  ) {}

  ngOnInit() {
    this.loadInboxes();
    this.departmentService.getDepartments().subscribe(page => {
      this.departmentOptions = [
        { label: 'No preference', value: null },
        ...page.content.map((d: Department) => ({ label: d.name, value: d.id })),
      ];
    });
  }

  loadInboxes() {
    this.emailInboxService.getAll().subscribe(list => this.inboxes.set(list));
  }

  showDialog() {
    this.editingId.set(null);
    this.form.reset({ port: 993, protocol: 'IMAP', useSsl: true, defaultPriority: 'MEDIUM' });
    this.error = '';
    this.dialogVisible = true;
  }

  editInbox(inbox: EmailInbox) {
    this.editingId.set(inbox.id);
    this.form.patchValue({
      name: inbox.name,
      email: inbox.email,
      host: inbox.host,
      port: inbox.port,
      username: inbox.username,
      password: '',
      protocol: inbox.protocol,
      useSsl: inbox.useSsl,
      defaultDepartmentId: inbox.defaultDepartmentId,
      defaultPriority: inbox.defaultPriority,
    });
    this.error = '';
    this.dialogVisible = true;
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.error = '';
    const data = this.form.value as CreateEmailInboxRequest;
    const id = this.editingId();
    const obs = id ? this.emailInboxService.update(id, data) : this.emailInboxService.create(data);
    obs.subscribe({
      next: () => {
        this.saving = false;
        this.dialogVisible = false;
        this.loadInboxes();
      },
      error: (err) => {
        this.saving = false;
        this.error = err.error?.message || 'Failed to save inbox';
      },
    });
  }

  deleteInbox(id: string) {
    if (!confirm('Delete this email inbox?')) return;
    this.emailInboxService.delete(id).subscribe({ next: () => this.loadInboxes() });
  }

  testInbox(inbox: EmailInbox) {
    this.testResult.set(null);
    this.emailInboxService.test(inbox.id).subscribe({
      next: (r) => this.testResult.set(r.result),
      error: () => this.testResult.set('Test failed — could not connect'),
    });
  }
}
