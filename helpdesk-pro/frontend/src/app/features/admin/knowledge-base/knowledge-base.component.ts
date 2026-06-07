import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { TabsModule } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { KbService, KbCategory, KbArticle, KbArticleRequest } from '../../../core/services/kb.service';

@Component({
  selector: 'app-admin-kb',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, InputTextModule, TextareaModule, SelectModule,
    DialogModule, TabsModule, TooltipModule,
  ],
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-heading text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p class="text-sm text-gray-500 mt-0.5">Manage articles and categories for the self-service portal</p>
        </div>
        <button pButton type="button" (click)="openNew()" label="New Article"
                icon="pi pi-plus" styleClass="!rounded-xl !font-semibold"></button>
      </div>

      <!-- Tabs -->
      <p-tabs value="articles">
        <p-tablist>
          <p-tab value="articles">
            <i class="pi pi-file mr-2"></i>Articles
          </p-tab>
          <p-tab value="categories">
            <i class="pi pi-folder mr-2"></i>Categories
          </p-tab>
        </p-tablist>

        <p-tabpanels>
          <!-- Articles Tab -->
          <p-tabpanel value="articles">
            <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden mt-4"
                 style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">

              <!-- Table header -->
              <div class="grid gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50/60 text-xs font-bold text-slate-400 uppercase tracking-wider"
                   style="grid-template-columns:3fr 2fr 100px 80px 100px">
                <span>Title</span>
                <span>Category</span>
                <span>Status</span>
                <span>Views</span>
                <span class="text-center">Actions</span>
              </div>

              <!-- Rows -->
              <div *ngFor="let a of articles(); let last = last"
                   class="grid gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors"
                   [class.border-b]="!last"
                   style="grid-template-columns:3fr 2fr 100px 80px 100px;border-color:#F1F5F9">
                <p class="text-sm font-semibold text-gray-900 truncate">{{ a.title }}</p>
                <p class="text-xs text-slate-500">{{ a.categoryName || '—' }}</p>
                <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold w-fit"
                      [ngClass]="a.status === 'PUBLISHED' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'">
                  {{ a.status }}
                </span>
                <p class="text-xs text-slate-500">{{ a.viewCount }}</p>
                <div class="flex items-center justify-center gap-1">
                  <button pButton type="button" (click)="openEdit(a)"
                          icon="pi pi-pencil" severity="secondary"
                          [text]="true" [rounded]="true" size="small"
                          pTooltip="Edit" tooltipPosition="top"></button>
                  <button pButton type="button" (click)="confirmDelete(a)"
                          icon="pi pi-trash" severity="danger"
                          [text]="true" [rounded]="true" size="small"
                          pTooltip="Delete" tooltipPosition="top"></button>
                </div>
              </div>

              <!-- Empty state -->
              <div *ngIf="articles().length === 0" class="py-16 text-center">
                <i class="pi pi-file text-gray-200 mb-3" style="font-size:48px;display:block;margin:0 auto 12px"></i>
                <p class="text-sm font-medium text-gray-400">No articles yet</p>
                <p class="text-xs text-gray-300 mt-1">Create your first article using the button above</p>
              </div>
            </div>
          </p-tabpanel>

          <!-- Categories Tab -->
          <p-tabpanel value="categories">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div *ngFor="let cat of categories()"
                   class="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4"
                   style="box-shadow:0 1px 3px rgba(0,0,0,0.05)">
                <div class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style="background:#EFF6FF">
                  <i [class]="'pi ' + cat.icon" style="font-size:20px;color:#2563EB"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-bold text-gray-900 text-sm mb-1">{{ cat.name }}</p>
                  <p class="text-xs text-slate-400 leading-relaxed mb-2">{{ cat.description }}</p>
                  <span class="text-xs font-semibold" style="color:#2563EB">
                    {{ cat.articleCount }} published article{{ cat.articleCount !== 1 ? 's' : '' }}
                  </span>
                </div>
              </div>
              <div *ngIf="categories().length === 0" class="col-span-2 py-16 text-center">
                <i class="pi pi-folder text-gray-200 mb-3" style="font-size:48px;display:block;margin:0 auto 12px"></i>
                <p class="text-sm font-medium text-gray-400">No categories found</p>
              </div>
            </div>
          </p-tabpanel>
        </p-tabpanels>
      </p-tabs>

      <!-- Create / Edit Dialog -->
      <p-dialog [header]="editing() ? 'Edit Article' : 'New Article'"
                [(visible)]="dialogVisible"
                [modal]="true"
                [style]="{width:'600px'}"
                [draggable]="false"
                styleClass="!rounded-2xl">
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4 pt-2">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              Title <span class="text-red-500">*</span>
            </label>
            <input pInputText formControlName="title" class="w-full"
                   placeholder="e.g. How to reset your password" />
            <div *ngIf="form.get('title')?.invalid && form.get('title')?.touched"
                 class="text-xs text-red-500 mt-1">Title is required</div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Category</label>
            <p-select formControlName="categoryId"
                      [options]="categoryOptions"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Select a category"
                      class="w-full"
                      styleClass="w-full"></p-select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
            <p-select formControlName="status"
                      [options]="statusOptions"
                      optionLabel="label"
                      optionValue="value"
                      class="w-full"
                      styleClass="w-full"></p-select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              Body <span class="text-red-500">*</span>
            </label>
            <textarea pTextarea formControlName="body" rows="8" class="w-full"
                      placeholder="Write your article content here..."></textarea>
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
      <p-dialog header="Delete Article" [(visible)]="deleteDialogVisible"
                [modal]="true" [style]="{width:'400px'}" [draggable]="false"
                styleClass="!rounded-2xl">
        <p class="text-sm text-gray-600 py-2">
          Are you sure you want to delete
          <strong class="text-gray-900">{{ deletingArticle()?.title }}</strong>?
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
export class AdminKbComponent implements OnInit {
  articles = signal<KbArticle[]>([]);
  categories = signal<KbCategory[]>([]);
  editing = signal<KbArticle | null>(null);
  deletingArticle = signal<KbArticle | null>(null);
  saving = signal(false);
  dialogVisible = false;
  deleteDialogVisible = false;

  categoryOptions: { label: string; value: string }[] = [];
  statusOptions = [
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Published', value: 'PUBLISHED' },
  ];

  form = this.fb.group({
    title: ['', Validators.required],
    body: ['', Validators.required],
    categoryId: [null as string | null],
    status: ['DRAFT', Validators.required],
  });

  constructor(private kbService: KbService, private fb: FormBuilder) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.kbService.getCategories().subscribe(cats => {
      this.categories.set(cats);
      this.categoryOptions = cats.map(c => ({ label: c.name, value: c.id }));
    });
    this.kbService.getArticles().subscribe(arts => this.articles.set(arts));
  }

  openNew() {
    this.editing.set(null);
    this.form.reset({ status: 'DRAFT' });
    this.dialogVisible = true;
  }

  openEdit(a: KbArticle) {
    this.editing.set(a);
    this.form.patchValue({ title: a.title, body: a.body, categoryId: a.categoryId, status: a.status });
    this.dialogVisible = true;
  }

  closeDialog() {
    this.dialogVisible = false;
    this.editing.set(null);
    this.form.reset({ status: 'DRAFT' });
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.value;
    const data: KbArticleRequest = {
      title: raw.title!,
      body: raw.body!,
      categoryId: raw.categoryId ?? undefined,
      status: raw.status!,
    };
    const e = this.editing();
    const req = e ? this.kbService.update(e.id, data) : this.kbService.create(data);
    req.subscribe({
      next: () => { this.loadAll(); this.closeDialog(); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  confirmDelete(a: KbArticle) {
    this.deletingArticle.set(a);
    this.deleteDialogVisible = true;
  }

  doDelete() {
    const a = this.deletingArticle();
    if (!a) return;
    this.kbService.delete(a.id).subscribe(() => {
      this.loadAll();
      this.deleteDialogVisible = false;
      this.deletingArticle.set(null);
    });
  }
}
