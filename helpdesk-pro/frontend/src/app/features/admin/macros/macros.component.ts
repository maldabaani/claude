import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { MacroService, Macro, MacroRequest, MacroAction } from '../../../core/services/macro.service';

const ACTION_TYPES = [
  { label: 'Set Status', value: 'SET_STATUS' },
  { label: 'Assign To', value: 'ASSIGN_TO' },
  { label: 'Add Tag', value: 'ADD_TAG' },
  { label: 'Add Comment', value: 'ADD_COMMENT' },
  { label: 'Set Priority', value: 'SET_PRIORITY' },
];

const ACTION_COLORS: Record<string, string> = {
  SET_STATUS: '#6366F1',
  ASSIGN_TO: '#0EA5E9',
  ADD_TAG: '#10B981',
  ADD_COMMENT: '#F59E0B',
  SET_PRIORITY: '#EF4444',
};

@Component({
  selector: 'app-macros',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, InputTextModule, TextareaModule, DialogModule,
    TooltipModule, SelectModule, ToggleSwitchModule],
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-heading text-2xl font-bold text-gray-900">Macros</h1>
          <p class="text-sm text-gray-500 mt-0.5">One-click multi-action templates for ticket workflows</p>
        </div>
        <button pButton type="button" (click)="openNew()" label="New Macro"
                icon="pi pi-plus" styleClass="!rounded-xl !font-semibold"></button>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">

        <!-- Table header -->
        <div class="grid gap-4 px-5 py-3 border-b border-gray-100 bg-gray-50/60 text-xs font-bold text-slate-400 uppercase tracking-wider"
             style="grid-template-columns:2fr 2fr 3fr 80px 100px">
          <span>Name</span>
          <span>Description</span>
          <span>Actions</span>
          <span class="text-center">Active</span>
          <span class="text-center">Options</span>
        </div>

        <!-- Rows -->
        <div *ngFor="let m of macros(); let last = last"
             class="grid gap-4 px-5 py-4 items-center hover:bg-gray-50 transition-colors"
             [class.border-b]="!last"
             style="grid-template-columns:2fr 2fr 3fr 80px 100px;border-color:#F1F5F9">
          <p class="text-sm font-semibold text-gray-900">{{ m.name }}</p>
          <p class="text-xs text-slate-500 truncate">{{ m.description || '—' }}</p>
          <div class="flex flex-wrap gap-1.5">
            <span *ngFor="let action of parseActions(m.actions)"
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  [style.background]="actionColor(action.type)">
              {{ action.type | titlecase }} — {{ action.value }}
            </span>
          </div>
          <div class="flex justify-center">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold"
                  [ngClass]="m.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'">
              {{ m.active ? 'Active' : 'Off' }}
            </span>
          </div>
          <div class="flex items-center justify-center gap-1">
            <button pButton type="button" (click)="openEdit(m)"
                    icon="pi pi-pencil" severity="secondary"
                    [text]="true" [rounded]="true" size="small"
                    pTooltip="Edit" tooltipPosition="top"></button>
            <button pButton type="button" (click)="confirmDelete(m)"
                    icon="pi pi-trash" severity="danger"
                    [text]="true" [rounded]="true" size="small"
                    pTooltip="Delete" tooltipPosition="top"></button>
          </div>
        </div>

        <!-- Empty state -->
        <div *ngIf="macros().length === 0" class="py-16 text-center">
          <i class="pi pi-bolt text-gray-200 mb-3" style="font-size:48px;display:block;margin:0 auto 12px"></i>
          <p class="text-sm font-medium text-gray-400">No macros yet</p>
          <p class="text-xs text-gray-300 mt-1">Create your first macro using the button above</p>
        </div>
      </div>

      <!-- Create / Edit Dialog -->
      <p-dialog [header]="editing() ? 'Edit Macro' : 'New Macro'"
                [(visible)]="dialogVisible"
                [modal]="true"
                [style]="{width:'620px'}"
                [draggable]="false"
                styleClass="!rounded-2xl">
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4 pt-2">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Name <span class="text-red-500">*</span></label>
            <input pInputText formControlName="name" class="w-full" placeholder="e.g. Resolve & Close Ticket" />
            <div *ngIf="form.get('name')?.invalid && form.get('name')?.touched"
                 class="text-xs text-red-500 mt-1">Name is required</div>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea pTextarea formControlName="description" rows="2" class="w-full"
                      placeholder="Describe what this macro does..."></textarea>
          </div>

          <!-- Action Builder -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="block text-sm font-semibold text-gray-700">Actions</label>
              <button pButton type="button" (click)="addAction()" icon="pi pi-plus" label="Add Action"
                      severity="secondary" size="small" styleClass="!rounded-lg"></button>
            </div>
            <div formArrayName="actionList" class="space-y-2">
              <div *ngFor="let action of actionList.controls; let i = index"
                   [formGroupName]="i"
                   class="flex items-center gap-2 p-3 rounded-xl border border-gray-100 bg-gray-50">
                <p-select formControlName="type" [options]="actionTypes"
                          optionLabel="label" optionValue="value"
                          placeholder="Action type" class="flex-1" styleClass="!rounded-lg text-sm" />
                <input pInputText formControlName="value" class="flex-1"
                       placeholder="Value (e.g. RESOLVED, agent-id, tag-name)" />
                <button pButton type="button" (click)="removeAction(i)"
                        icon="pi pi-times" severity="danger"
                        [text]="true" [rounded]="true" size="small"></button>
              </div>
              <p *ngIf="actionList.length === 0" class="text-xs text-gray-400 italic py-1">
                No actions added yet. Click "Add Action" to build this macro.
              </p>
            </div>
          </div>

          <div class="flex gap-3 justify-end pt-2">
            <button pButton type="button" (click)="closeDialog()" label="Cancel"
                    variant="outlined" styleClass="!rounded-xl"></button>
            <button pButton type="submit" [label]="saving() ? 'Saving…' : 'Save'"
                    [disabled]="saving()" styleClass="!rounded-xl !font-semibold"></button>
          </div>
        </form>
      </p-dialog>

      <!-- Delete Confirmation Dialog -->
      <p-dialog header="Delete Macro" [(visible)]="deleteDialogVisible"
                [modal]="true" [style]="{width:'400px'}" [draggable]="false"
                styleClass="!rounded-2xl">
        <p class="text-sm text-gray-600 py-2">
          Are you sure you want to delete
          <strong class="text-gray-900">{{ deletingMacro()?.name }}</strong>?
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
export class MacrosComponent implements OnInit {
  macros = signal<Macro[]>([]);
  editing = signal<Macro | null>(null);
  deletingMacro = signal<Macro | null>(null);
  saving = signal(false);
  dialogVisible = false;
  deleteDialogVisible = false;

  actionTypes = ACTION_TYPES;

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    actionList: this.fb.array([]),
  });

  get actionList(): FormArray {
    return this.form.get('actionList') as FormArray;
  }

  constructor(
    private macroService: MacroService,
    private fb: FormBuilder,
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.macroService.getAll().subscribe(list => this.macros.set(list));
  }

  parseActions(actionsJson: string): MacroAction[] {
    try { return JSON.parse(actionsJson) as MacroAction[]; } catch { return []; }
  }

  actionColor(type: string): string {
    return ACTION_COLORS[type] ?? '#6366F1';
  }

  openNew() {
    this.editing.set(null);
    this.form.reset();
    this.actionList.clear();
    this.dialogVisible = true;
  }

  openEdit(m: Macro) {
    this.editing.set(m);
    this.form.patchValue({ name: m.name, description: m.description ?? '' });
    this.actionList.clear();
    const actions = this.parseActions(m.actions);
    actions.forEach(a => this.actionList.push(this.fb.group({ type: [a.type], value: [a.value] })));
    this.dialogVisible = true;
  }

  closeDialog() {
    this.dialogVisible = false;
    this.editing.set(null);
    this.form.reset();
    this.actionList.clear();
  }

  addAction() {
    this.actionList.push(this.fb.group({ type: ['SET_STATUS'], value: [''] }));
  }

  removeAction(i: number) {
    this.actionList.removeAt(i);
  }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    const raw = this.form.value;
    const actions = (raw.actionList as { type: string; value: string }[]).map(a => ({ type: a.type, value: a.value }));
    const data: MacroRequest = {
      name: raw.name!,
      description: raw.description || undefined,
      actions: JSON.stringify(actions),
    };
    const e = this.editing();
    const req = e
      ? this.macroService.update(e.id, data)
      : this.macroService.create(data);
    req.subscribe({
      next: () => { this.load(); this.closeDialog(); this.saving.set(false); },
      error: () => { this.saving.set(false); },
    });
  }

  confirmDelete(m: Macro) {
    this.deletingMacro.set(m);
    this.deleteDialogVisible = true;
  }

  doDelete() {
    const m = this.deletingMacro();
    if (!m) return;
    this.macroService.delete(m.id).subscribe(() => {
      this.load();
      this.deleteDialogVisible = false;
      this.deletingMacro.set(null);
    });
  }
}
