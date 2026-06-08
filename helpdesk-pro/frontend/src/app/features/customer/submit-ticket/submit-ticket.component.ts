import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TicketService } from '../../../core/services/ticket.service';
import { DepartmentService } from '../../../core/services/department.service';
import { TemplateService, TicketTemplate } from '../../../core/services/template.service';
import { Department } from '../../../core/models';

@Component({
  selector: 'app-submit-ticket',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, FormsModule,
    ButtonModule, InputTextModule, SelectModule, TextareaModule],
  template: `
    <div class="max-w-2xl mx-auto">

      <!-- Page header -->
      <div class="mb-6">
        <h1 class="text-2xl font-black text-gray-900 mb-1" style="letter-spacing:-0.03em">Submit a Ticket</h1>
        <p class="text-slate-400 text-sm">Describe your issue and we'll get back to you shortly.</p>
      </div>

      <!-- Form card -->
      <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">

        <!-- Card header -->
        <div class="px-8 py-5 flex items-center gap-3" style="border-bottom:1px solid #F1F5F9;background:#FAFAFA">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center"
               style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:1px solid #BFDBFE">
            <i class="pi pi-file-edit text-blue-600" style="font-size:18px"></i>
          </div>
          <div>
            <p class="font-bold text-gray-900 text-sm">New Support Request</p>
            <p class="text-xs text-slate-400">Fill in the details to get started</p>
          </div>
          <!-- Step indicator -->
          <div class="ml-auto flex items-center gap-1.5">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style="background:#2563EB">1</span>
            <span class="w-4 h-0.5 rounded" style="background:#E2E8F0"></span>
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                  style="background:#F1F5F9;color:#94A3B8">2</span>
          </div>
        </div>

        <!-- Form body -->
        <form [formGroup]="form" (ngSubmit)="submit()" class="px-8 py-7 space-y-5">

          <!-- Template selector -->
          <div *ngIf="templates().length > 0">
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              <i class="pi pi-file text-blue-500 mr-1" style="font-size:14px"></i>
              Use a template
            </label>
            <p-select [options]="templateOptions" [(ngModel)]="selectedTemplateId"
                      (ngModelChange)="applyTemplate($event)"
                      [ngModelOptions]="{standalone: true}"
                      optionLabel="label" optionValue="value"
                      placeholder="Select a template to pre-fill the form"
                      class="w-full" />
          </div>

          <!-- Subject -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              Subject <span class="text-red-400">*</span>
            </label>
            <input pInputText formControlName="title" class="w-full"
                   placeholder="Brief description of your issue" />
            <div *ngIf="form.get('title')?.invalid && form.get('title')?.touched" class="text-xs text-red-500 mt-1">
              Subject is required
            </div>
          </div>

          <!-- Department + Priority row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Department</label>
              <p-select [options]="departmentOptions" formControlName="departmentId"
                        optionLabel="label" optionValue="value" placeholder="No preference"
                        class="w-full" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
              <p-select [options]="priorityOptions" formControlName="priority"
                        optionLabel="label" optionValue="value" class="w-full" />
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              Description <span class="text-red-400">*</span>
            </label>
            <textarea pTextarea formControlName="description" rows="6" class="w-full"
                      placeholder="Please describe your issue in detail — include any error messages, steps to reproduce, or screenshots if applicable."></textarea>
            <p class="text-xs text-slate-400 mt-1">The more detail you provide, the faster we can help</p>
            <div *ngIf="form.get('description')?.invalid && form.get('description')?.touched" class="text-xs text-red-500 mt-1">
              Description is required
            </div>
          </div>

          <!-- Error state -->
          <div *ngIf="error"
               class="flex items-start gap-3 p-4 rounded-xl"
               style="background:#FEF2F2;border:1px solid #FECACA">
            <i class="pi pi-exclamation-circle shrink-0 mt-0.5" style="font-size:16px;color:#EF4444"></i>
            <span class="text-sm text-red-700">{{ error }}</span>
          </div>

          <!-- Success state -->
          <div *ngIf="success()"
               class="flex items-start gap-3 p-4 rounded-xl"
               style="background:#F0FDF4;border:1px solid #BBF7D0">
            <i class="pi pi-check-circle shrink-0 mt-0.5" style="font-size:16px;color:#22C55E"></i>
            <span class="text-sm font-semibold text-green-700">Ticket submitted successfully! Redirecting you now...</span>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <a routerLink="/customer"
               class="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200">
              Cancel
            </a>
            <button type="submit"
                    class="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style="background:linear-gradient(135deg,#2563EB,#1D4ED8);box-shadow:0 2px 8px rgba(37,99,235,0.3)"
                    [disabled]="loading || form.invalid">
              <i *ngIf="!loading" class="pi pi-send" style="font-size:16px"></i>
              <span *ngIf="loading" class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {{ loading ? 'Submitting...' : 'Submit Ticket' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class SubmitTicketComponent implements OnInit {
  form = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    priority: ['MEDIUM'],
    departmentId: [null as string | null],
    category: [''],
  });

  departments = signal<Department[]>([]);
  templates = signal<TicketTemplate[]>([]);
  selectedTemplateId: string | null = null;
  templateOptions: { label: string; value: string }[] = [];
  loading = false;
  error = '';
  success = signal(false);

  departmentOptions: { label: string; value: string | null }[] = [{ label: 'No preference', value: null }];

  priorityOptions = [
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Critical', value: 'CRITICAL' },
  ];

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private departmentService: DepartmentService,
    private templateService: TemplateService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.departmentService.getDepartments().subscribe(page => {
      this.departments.set(page.content);
      this.departmentOptions = [
        { label: 'No preference', value: null },
        ...page.content.map((d: Department) => ({ label: d.name, value: d.id }))
      ];
    });
    this.templateService.getTemplates().subscribe(tmplList => {
      this.templates.set(tmplList);
      this.templateOptions = tmplList.map(t => ({ label: t.name, value: t.id }));
    });
  }

  applyTemplate(templateId: string | null) {
    if (!templateId) return;
    const tmpl = this.templates().find(t => t.id === templateId);
    if (!tmpl) return;
    this.form.patchValue({
      title: tmpl.subject || '',
      description: tmpl.description || '',
      priority: tmpl.priority || 'MEDIUM',
      category: tmpl.category || '',
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.ticketService.createTicket(this.form.value as any).subscribe({
      next: (ticket) => {
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/customer/tickets', ticket.id]), 1500);
      },
      error: (err) => { this.error = err.error?.message || 'Failed to submit ticket. Please try again.'; this.loading = false; },
    });
  }
}
