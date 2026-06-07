import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { CannedResponseService, CannedResponse, CannedResponseRequest } from '../../../core/services/canned-response.service';

@Component({
  selector: 'app-canned-responses',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, InputTextModule, TextareaModule, DialogModule, TooltipModule],
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-heading text-2xl font-bold text-gray-900">Canned Responses</h1>
          <p class="text-sm text-gray-500 mt-0.5">Manage reusable reply templates for agents</p>
        </div>
        <button pButton type="button" (click)="openNew()" label="New Response"
                icon="pi pi-plus" styleClass="!rounded-xl !font-semibold"></button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">

        <!-- Table header -->
        <div class="grid gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50/60 text-xs font-bold text-slate-400 uppercase tracking-wider"
             style="grid-template-columns:2fr 1fr 3fr 100px">
          <span>Title</span>
          <span>Category</span>
          <span>Preview</span>
          <span class="text-center">Actions</span>
        </div>

        <!-- Rows -->
        <div *ngFor="let r of responses(); let last = last"
             class="grid gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors"
             [class.border-b]="!last"
             style="grid-template-columns:2fr 1fr 3fr 100px;border-color:#F1F5F9">
          <p class="text-sm font-semibold text-gray-900">{{ r.title }}</p>
          <span *ngIf="r.category"
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 w-fit">
            {{ r.category }}
          </span>
          <span *ngIf="!r.category" class="text-xs text-slate-300 italic">—</span>
          <p class="text-xs text-slate-500 truncate">{{ r.body }}</p>
          <div class="flex items-center justify-center gap-1">
            <button pButton type="button" (click)="openEdit(r)"
                    icon="pi pi-pencil" severity="secondary"
                    [text]="true" [rounded]="true" size="small"
                    pTooltip="Edit" tooltipPosition="top"></button>
            <button pButton type="button" (click)="confirmDelete(r)"
                    icon="pi pi-trash" severity="danger"
                    [text]="true" [rounded]="true" size="small"
                    pTooltip="Delete" tooltipPosition="top"></button>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="responses().length === 0" class="py-16 text-center">
          <i class="pi pi-bookmark text-gray-200 mb-3" style="font-size:48px;display:block;margin:0 auto 12px"></i>
          <p class="text-sm font-medium text-gray-400">No canned responses yet</p>
          <p class="text-xs text-gray-300 mt-1">Create your first response using the button above</p>
        </div>
      </div>

      <!-- Create / Edit Dialog -->
      <p-dialog [header]="editing() ? 'Edit Response' : 'New Response'"
                [(visible)]="dialogVisible"
                [modal]="true"
                [style]="{width:'560px'}"
                [draggable]="false"
                styleClass="!rounded-2xl">
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4 pt-2">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Title <span class="text-red-500">*</span></label>
            <input pInputText formControlName="title" class="w-full" placeholder="e.g. Password Reset Instructions" />
            <div *ngIf="form.get('title')?.invalid && form.get('title')?.touched"
                 class="text-xs text-red-500 mt-1">Title is required</div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
            <input pInputText formControlName="category" class="w-full" placeholder="e.g. Billing, Technical, General" />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Body <span class="text-red-500">*</span></label>
            <textarea pTextarea formControlName="body" rows="6" class="w-full"
                      placeholder="Write your template response here..."></textarea>
            <div *ngIf="form.get('body')?.invalid && form.get('body')?.touched"
                 class="text-xs text-red-500 mt-1">Body is required</div>
          </div>
          <div class="flex gap-3 justify-end pt-2">
            <button pButton type="button" (click)="closeDialog()" label="Cancel"
                    variant="outlined" styleClass="!rounded-xl"></button>
            <button pButton type="submit" [disabled]="form.invalid || saving()"
                    [label]="saving() ? 'Saving...' : (editing() ? 'Save Changes' : 'Create')"
                    styleClass="!rounded-xl !font-semibold"></button>
          </div>
        </form>
      </p-dialog>

      <!-- Delete Confirmation Dialog -->
      <p-dialog header="Delete Response" [(visible)]="deleteDialogVisible"
                [modal]="true" [style]="{width:'400px'}" [draggable]="false"
                styleClass="!rounded-2xl">
        <p class="text-sm text-gray-600 py-2">
          Are you sure you want to delete
          <strong class="text-gray-900">{{ deletingResponse()?.title }}</strong>?
          This action cannot be undone.
        </p>
        <div class="flex gap-3 justify-end pt-4">
          <button pButton type="button" (click)="deleteDialogVisible = false" label="Cancel"
                  variant="outlined" styleClass="!rounded-xl"></button>
          <button pButton type="button" (click)="doDelete()" label="Delete"
                  severity="danger" styleClass="!rounded-xl !font-semibold"></button>
        </div>
      </p-dialog>
    </div>
  `,
})
export class CannedResponsesComponent implements OnInit {
  responses = signal<CannedResponse[]>([]);
  editing = signal<CannedResponse | null>(null);
  deletingResponse = signal<CannedResponse | null>(null);
  saving = signal(false);
  dialogVisible = false;
  deleteDialogVisible = false;

  form = this.fb.group({
    title: ['', Validators.required],
    category: [''],
    body: ['', Validators.required],
  });

  constructor(
    private cannedResponseService: CannedResponseService,
    private fb: FormBuilder,
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.cannedResponseService.getAll().subscribe(list => this.responses.set(list));
  }

  openNew() {
    this.editing.set(null);
    this.form.reset();
    this.dialogVisible = true;
  }

  openEdit(r: CannedResponse) {
    this.editing.set(r);
    this.form.patchValue({ title: r.title, category: r.category ?? '', body: r.body });
    this.dialogVisible = true;
  }

  closeDialog() {
    this.dialogVisible = false;
    this.editing.set(null);
    this.form.reset();
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.value;
    const data: CannedResponseRequest = {
      title: raw.title!,
      body: raw.body!,
      category: raw.category || undefined,
    };
    const e = this.editing();
    const req = e
      ? this.cannedResponseService.update(e.id, data)
      : this.cannedResponseService.create(data);
    req.subscribe({
      next: () => { this.load(); this.closeDialog(); this.saving.set(false); },
      error: () => { this.saving.set(false); },
    });
  }

  confirmDelete(r: CannedResponse) {
    this.deletingResponse.set(r);
    this.deleteDialogVisible = true;
  }

  doDelete() {
    const r = this.deletingResponse();
    if (!r) return;
    this.cannedResponseService.delete(r.id).subscribe(() => {
      this.load();
      this.deleteDialogVisible = false;
      this.deletingResponse.set(null);
    });
  }
}
