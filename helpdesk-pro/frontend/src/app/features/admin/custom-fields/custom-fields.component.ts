import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { CustomFieldService, CustomField } from '../../../core/services/custom-field.service';

@Component({
  selector: 'app-custom-fields',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, ToggleSwitchModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Custom Fields</h1>
          <p class="text-slate-400 text-sm mt-0.5">Define extra fields shown on every ticket</p>
        </div>
        <button (click)="toggleForm()"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style="background:linear-gradient(135deg,#6366F1,#4F46E5)">
          <i class="pi pi-plus" style="font-size:14px"></i>
          Add Field
        </button>
      </div>

      <!-- Add Form -->
      <div *ngIf="showForm()" class="bg-white rounded-2xl border border-gray-100 p-6"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <h3 class="font-bold text-gray-900 mb-4 text-sm">New Custom Field</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Field Name</label>
            <input pInputText [(ngModel)]="newField.name" (ngModelChange)="onNameChange($event)"
                   class="w-full" placeholder="e.g. Customer ID" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Field Key</label>
            <input pInputText [(ngModel)]="newField.fieldKey" class="w-full" placeholder="e.g. customer_id" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Field Type</label>
            <p-select [options]="typeOptions" [(ngModel)]="newField.fieldType"
                      optionLabel="label" optionValue="value" class="w-full" />
          </div>
          <div *ngIf="newField.fieldType === 'DROPDOWN'">
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Options (comma-separated)</label>
            <input pInputText [(ngModel)]="optionsInput" class="w-full" placeholder="Option 1, Option 2, Option 3" />
          </div>
          <div class="flex items-center gap-3">
            <p-toggleswitch [(ngModel)]="newField.required" />
            <span class="text-sm font-medium text-gray-700">Required</span>
          </div>
        </div>
        <div class="flex gap-3 mt-5">
          <button (click)="saveField()"
                  class="px-5 py-2 rounded-xl text-sm font-bold text-white"
                  style="background:#6366F1">
            Save Field
          </button>
          <button (click)="toggleForm()"
                  class="px-5 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>

      <!-- Fields Table -->
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <div *ngIf="loading()" class="p-8 text-center text-slate-400 text-sm">Loading...</div>
        <div *ngIf="!loading() && fields().length === 0" class="p-12 text-center">
          <i class="pi pi-sliders-h text-4xl text-slate-200 mb-3 block"></i>
          <p class="text-slate-400 text-sm">No custom fields defined yet</p>
        </div>
        <table *ngIf="!loading() && fields().length > 0" class="w-full">
          <thead>
            <tr style="border-bottom:1px solid #F1F5F9;background:#FAFAFA">
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Key</th>
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Required</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let field of fields()" style="border-bottom:1px solid #F8FAFC"
                class="hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3.5 text-sm font-semibold text-gray-800">{{ field.name }}</td>
              <td class="px-5 py-3.5">
                <span class="text-xs font-mono px-2 py-1 rounded" style="background:#F1F5F9;color:#475569">
                  {{ field.fieldKey }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <span class="text-xs font-semibold px-2.5 py-1 rounded-full"
                      [ngStyle]="typeBadgeStyle(field.fieldType)">
                  {{ field.fieldType }}
                </span>
              </td>
              <td class="px-5 py-3.5">
                <span *ngIf="field.required"
                      class="text-xs font-bold px-2.5 py-1 rounded-full"
                      style="background:#FEF2F2;color:#DC2626">Required</span>
                <span *ngIf="!field.required"
                      class="text-xs font-medium text-slate-400">Optional</span>
              </td>
              <td class="px-5 py-3.5 text-right">
                <button (click)="deleteField(field)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <i class="pi pi-trash" style="font-size:14px"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
})
export class CustomFieldsComponent implements OnInit {
  fields = signal<CustomField[]>([]);
  loading = signal(true);
  showForm = signal(false);
  optionsInput = '';

  newField: Partial<CustomField> = {
    name: '', fieldKey: '', fieldType: 'TEXT', required: false, displayOrder: 0, options: []
  };

  typeOptions = [
    { label: 'Text', value: 'TEXT' },
    { label: 'Dropdown', value: 'DROPDOWN' },
    { label: 'Date', value: 'DATE' },
    { label: 'Checkbox', value: 'CHECKBOX' },
  ];

  constructor(
    private customFieldService: CustomFieldService,
    private messageService: MessageService,
  ) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.customFieldService.getFields().subscribe({
      next: fields => { this.fields.set(fields); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleForm() {
    this.showForm.update(v => !v);
    this.newField = { name: '', fieldKey: '', fieldType: 'TEXT', required: false, displayOrder: 0, options: [] };
    this.optionsInput = '';
  }

  onNameChange(name: string) {
    this.newField.fieldKey = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }

  saveField() {
    if (!this.newField.name || !this.newField.fieldKey) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Name and key are required' });
      return;
    }
    if (this.newField.fieldType === 'DROPDOWN') {
      this.newField.options = this.optionsInput.split(',').map(o => o.trim()).filter(Boolean);
    }
    this.customFieldService.createField(this.newField).subscribe({
      next: field => {
        this.fields.update(list => [...list, field]);
        this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Custom field created' });
        this.toggleForm();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create field' }),
    });
  }

  deleteField(field: CustomField) {
    this.customFieldService.deleteField(field.id).subscribe({
      next: () => {
        this.fields.update(list => list.filter(f => f.id !== field.id));
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Field removed' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete field' }),
    });
  }

  typeBadgeStyle(type: string): Record<string, string> {
    const map: Record<string, Record<string, string>> = {
      TEXT: { background: '#EFF6FF', color: '#1D4ED8' },
      DROPDOWN: { background: '#F0FDF4', color: '#16A34A' },
      DATE: { background: '#FFF7ED', color: '#C2410C' },
      CHECKBOX: { background: '#FAF5FF', color: '#7C3AED' },
    };
    return map[type] || { background: '#F1F5F9', color: '#475569' };
  }
}
