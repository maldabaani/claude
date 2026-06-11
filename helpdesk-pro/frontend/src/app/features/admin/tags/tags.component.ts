import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { TagService, Tag } from '../../../core/services/tag.service';

const PALETTE = [
  '#6366F1', '#0EA5E9', '#10B981', '#F59E0B',
  '#EF4444', '#8B5CF6', '#EC4899', '#64748B'
];

@Component({
  selector: 'app-admin-tags',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, DialogModule,
    InputTextModule, SelectModule, ToastModule, TooltipModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Tag Taxonomy</h1>
          <p class="text-sm text-slate-400 mt-0.5">Manage global tags — agents pick from this list when tagging tickets</p>
        </div>
        <button pButton (click)="openCreate()" class="!rounded-xl !font-semibold" style="height:40px">
          <i class="pi pi-plus mr-2"></i>New Tag
        </button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 1px 3px rgba(0,0,0,0.06)">
        <p-table [value]="tags()" [loading]="loading()" styleClass="p-datatable-sm">
          <ng-template pTemplate="header">
            <tr>
              <th style="width:40px"></th>
              <th>Name</th>
              <th>Usage</th>
              <th style="width:140px">Actions</th>
            </tr>
          </ng-template>
          <ng-template pTemplate="body" let-tag>
            <tr>
              <td>
                <span class="inline-block w-4 h-4 rounded-full"
                      [style.background]="tag.color"></span>
              </td>
              <td class="font-semibold text-gray-900">{{ tag.name }}</td>
              <td>
                <span class="text-sm text-slate-500">{{ tag.usageCount }} ticket{{ tag.usageCount !== 1 ? 's' : '' }}</span>
              </td>
              <td>
                <div class="flex items-center gap-1.5">
                  <button pButton severity="secondary" size="small"
                          pTooltip="Edit" (click)="openEdit(tag)"
                          class="!rounded-lg">
                    <i class="pi pi-pencil"></i>
                  </button>
                  <button pButton severity="secondary" size="small"
                          pTooltip="Merge into..." (click)="openMerge(tag)"
                          class="!rounded-lg">
                    <i class="pi pi-arrow-right-arrow-left"></i>
                  </button>
                  <button pButton severity="danger" size="small"
                          pTooltip="Delete" (click)="confirmDelete(tag)"
                          class="!rounded-lg">
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </ng-template>
          <ng-template pTemplate="emptymessage">
            <tr>
              <td colspan="4" class="text-center text-sm text-slate-400 py-10">
                No tags yet. Create your first tag.
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </div>

    <!-- Create / Edit Dialog -->
    <p-dialog [(visible)]="showFormDialog" [header]="editingTag ? 'Edit Tag' : 'New Tag'"
              [modal]="true" [style]="{width:'420px'}" [draggable]="false">
      <div class="space-y-4 py-2">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
          <input pInputText [(ngModel)]="formName" placeholder="e.g. billing" class="w-full" maxlength="50" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-2">Color</label>
          <div class="flex gap-2 flex-wrap">
            <button *ngFor="let c of palette"
                    (click)="formColor = c"
                    class="w-8 h-8 rounded-full border-2 transition-all"
                    [style.background]="c"
                    [style.border-color]="formColor === c ? '#1D4ED8' : 'transparent'"
                    [style.box-shadow]="formColor === c ? '0 0 0 2px #fff, 0 0 0 4px #1D4ED8' : 'none'">
            </button>
          </div>
          <div class="flex items-center gap-2 mt-3">
            <span class="inline-block w-6 h-6 rounded-full border border-gray-200"
                  [style.background]="formColor"></span>
            <input pInputText [(ngModel)]="formColor" placeholder="#6366F1"
                   class="w-32 font-mono text-sm" maxlength="7" />
          </div>
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton severity="secondary" label="Cancel" (click)="showFormDialog = false"
                class="!rounded-xl"></button>
        <button pButton [label]="editingTag ? 'Save' : 'Create'" (click)="saveTag()"
                [disabled]="!formName.trim()" class="!rounded-xl"></button>
      </ng-template>
    </p-dialog>

    <!-- Merge Dialog -->
    <p-dialog [(visible)]="showMergeDialog" header="Merge Tag"
              [modal]="true" [style]="{width:'400px'}" [draggable]="false">
      <div class="space-y-4 py-2" *ngIf="mergingTag">
        <p class="text-sm text-gray-600">
          Merge <strong class="text-gray-900">{{ mergingTag.name }}</strong> into another tag.
          All tickets using this tag will be switched to the target tag, and this tag will be deleted.
        </p>
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1.5">Target Tag</label>
          <p-select [(ngModel)]="mergeTargetId"
                    [options]="mergeOptions"
                    optionLabel="name"
                    optionValue="id"
                    placeholder="Select target tag..."
                    [filter]="true"
                    class="w-full" />
        </div>
      </div>
      <ng-template pTemplate="footer">
        <button pButton severity="secondary" label="Cancel" (click)="showMergeDialog = false"
                class="!rounded-xl"></button>
        <button pButton severity="danger" label="Merge & Delete" (click)="doMerge()"
                [disabled]="!mergeTargetId" class="!rounded-xl"></button>
      </ng-template>
    </p-dialog>

    <!-- Delete Confirm Dialog -->
    <p-dialog [(visible)]="showDeleteDialog" header="Delete Tag"
              [modal]="true" [style]="{width:'360px'}" [draggable]="false">
      <p class="text-sm text-gray-600 py-2" *ngIf="deletingTag">
        Delete tag <strong class="text-gray-900">{{ deletingTag.name }}</strong>?
        It will be removed from all tickets.
      </p>
      <ng-template pTemplate="footer">
        <button pButton severity="secondary" label="Cancel" (click)="showDeleteDialog = false"
                class="!rounded-xl"></button>
        <button pButton severity="danger" label="Delete" (click)="doDelete()"
                class="!rounded-xl"></button>
      </ng-template>
    </p-dialog>
  `,
})
export class AdminTagsComponent implements OnInit {
  tags = signal<Tag[]>([]);
  loading = signal(false);

  showFormDialog = false;
  editingTag: Tag | null = null;
  formName = '';
  formColor = '#6366F1';

  showMergeDialog = false;
  mergingTag: Tag | null = null;
  mergeTargetId: string | null = null;
  mergeOptions: Tag[] = [];

  showDeleteDialog = false;
  deletingTag: Tag | null = null;

  palette = PALETTE;

  constructor(private tagService: TagService, private msg: MessageService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.tagService.getAllTags().subscribe({
      next: tags => { this.tags.set(tags); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  openCreate() {
    this.editingTag = null;
    this.formName = '';
    this.formColor = '#6366F1';
    this.showFormDialog = true;
  }

  openEdit(tag: Tag) {
    this.editingTag = tag;
    this.formName = tag.name;
    this.formColor = tag.color;
    this.showFormDialog = true;
  }

  saveTag() {
    if (!this.formName.trim()) return;
    const obs = this.editingTag
      ? this.tagService.updateTag(this.editingTag.id, this.formName, this.formColor)
      : this.tagService.createTag(this.formName, this.formColor);
    obs.subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: this.editingTag ? 'Tag updated' : 'Tag created' });
        this.showFormDialog = false;
        this.load();
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Error saving tag' })
    });
  }

  openMerge(tag: Tag) {
    this.mergingTag = tag;
    this.mergeTargetId = null;
    this.mergeOptions = this.tags().filter(t => t.id !== tag.id);
    this.showMergeDialog = true;
  }

  doMerge() {
    if (!this.mergingTag || !this.mergeTargetId) return;
    this.tagService.mergeTag(this.mergingTag.id, this.mergeTargetId).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Tags merged' });
        this.showMergeDialog = false;
        this.load();
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Error merging tags' })
    });
  }

  confirmDelete(tag: Tag) {
    this.deletingTag = tag;
    this.showDeleteDialog = true;
  }

  doDelete() {
    if (!this.deletingTag) return;
    this.tagService.deleteTag(this.deletingTag.id).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Tag deleted' });
        this.showDeleteDialog = false;
        this.load();
      },
      error: () => this.msg.add({ severity: 'error', summary: 'Error deleting tag' })
    });
  }
}
