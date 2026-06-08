import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TemplateService, TicketTemplate } from '../../../core/services/template.service';

@Component({
  selector: 'app-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, TextareaModule, SelectModule, ToastModule],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">Ticket Templates</h1>
          <p class="text-slate-400 text-sm mt-0.5">Pre-filled forms for common request types</p>
        </div>
        <button (click)="toggleForm()"
                class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
                style="background:linear-gradient(135deg,#6366F1,#4F46E5)">
          <i class="pi pi-plus" style="font-size:14px"></i>
          Add Template
        </button>
      </div>

      <!-- Add/Edit Form -->
      <div *ngIf="showForm()" class="bg-white rounded-2xl border border-gray-100 p-6"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <h3 class="font-bold text-gray-900 mb-4 text-sm">{{ editingId ? 'Edit Template' : 'New Template' }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Template Name</label>
            <input pInputText [(ngModel)]="formData.name" class="w-full" placeholder="e.g. Password Reset" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Subject</label>
            <input pInputText [(ngModel)]="formData.subject" class="w-full" placeholder="Ticket subject" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Priority</label>
            <p-select [options]="priorityOptions" [(ngModel)]="formData.priority"
                      optionLabel="label" optionValue="value" class="w-full" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Category</label>
            <input pInputText [(ngModel)]="formData.category" class="w-full" placeholder="e.g. Account" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-xs font-semibold text-slate-500 mb-1.5">Description</label>
            <textarea pTextarea [(ngModel)]="formData.description" rows="3" class="w-full"
                      placeholder="Default description text..."></textarea>
          </div>
        </div>
        <div class="flex gap-3 mt-5">
          <button (click)="saveTemplate()"
                  class="px-5 py-2 rounded-xl text-sm font-bold text-white"
                  style="background:#6366F1">
            {{ editingId ? 'Update' : 'Save' }} Template
          </button>
          <button (click)="cancelForm()"
                  class="px-5 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>

      <!-- Templates Table -->
      <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <div *ngIf="loading()" class="p-8 text-center text-slate-400 text-sm">Loading...</div>
        <div *ngIf="!loading() && templates().length === 0" class="p-12 text-center">
          <i class="pi pi-file text-4xl text-slate-200 mb-3 block"></i>
          <p class="text-slate-400 text-sm">No templates defined yet</p>
        </div>
        <table *ngIf="!loading() && templates().length > 0" class="w-full">
          <thead>
            <tr style="border-bottom:1px solid #F1F5F9;background:#FAFAFA">
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Subject</th>
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Priority</th>
              <th class="px-5 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of templates()" style="border-bottom:1px solid #F8FAFC"
                class="hover:bg-slate-50 transition-colors">
              <td class="px-5 py-3.5 text-sm font-semibold text-gray-800">{{ t.name }}</td>
              <td class="px-5 py-3.5 text-sm text-gray-600 max-w-xs truncate">{{ t.subject }}</td>
              <td class="px-5 py-3.5">
                <span class="text-xs font-bold px-2.5 py-1 rounded-full"
                      [ngStyle]="priorityStyle(t.priority)">
                  {{ t.priority }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-sm text-gray-500">{{ t.category }}</td>
              <td class="px-5 py-3.5 text-right flex items-center justify-end gap-1">
                <button (click)="editTemplate(t)"
                        class="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                  <i class="pi pi-pencil" style="font-size:14px"></i>
                </button>
                <button (click)="deleteTemplate(t)"
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
export class TemplatesComponent implements OnInit {
  templates = signal<TicketTemplate[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId: string | null = null;

  formData: Partial<TicketTemplate> = {
    name: '', subject: '', description: '', priority: 'MEDIUM', category: ''
  };

  priorityOptions = [
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Critical', value: 'CRITICAL' },
  ];

  constructor(
    private templateService: TemplateService,
    private messageService: MessageService,
  ) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.templateService.getTemplates().subscribe({
      next: templates => { this.templates.set(templates); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleForm() {
    this.showForm.set(true);
    this.editingId = null;
    this.formData = { name: '', subject: '', description: '', priority: 'MEDIUM', category: '' };
  }

  editTemplate(t: TicketTemplate) {
    this.showForm.set(true);
    this.editingId = t.id;
    this.formData = { name: t.name, subject: t.subject, description: t.description, priority: t.priority, category: t.category };
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingId = null;
  }

  saveTemplate() {
    if (!this.formData.name) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Name is required' });
      return;
    }
    const action = this.editingId
      ? this.templateService.updateTemplate(this.editingId, this.formData)
      : this.templateService.createTemplate(this.formData);

    action.subscribe({
      next: template => {
        if (this.editingId) {
          this.templates.update(list => list.map(t => t.id === template.id ? template : t));
        } else {
          this.templates.update(list => [...list, template]);
        }
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Template saved' });
        this.cancelForm();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save template' }),
    });
  }

  deleteTemplate(t: TicketTemplate) {
    this.templateService.deleteTemplate(t.id).subscribe({
      next: () => {
        this.templates.update(list => list.filter(tmpl => tmpl.id !== t.id));
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'Template deleted' });
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete' }),
    });
  }

  priorityStyle(priority: string): Record<string, string> {
    const map: Record<string, Record<string, string>> = {
      CRITICAL: { background: '#FEF2F2', color: '#DC2626' },
      HIGH: { background: '#FFF7ED', color: '#C2410C' },
      MEDIUM: { background: '#FFF7ED', color: '#D97706' },
      LOW: { background: '#F0FDF4', color: '#16A34A' },
    };
    return map[priority] || { background: '#F1F5F9', color: '#475569' };
  }
}
