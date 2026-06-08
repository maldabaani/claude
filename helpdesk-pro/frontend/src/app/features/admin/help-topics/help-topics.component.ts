import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { HelpTopicService, HelpTopic } from '../../../core/services/help-topic.service';
import { DepartmentService } from '../../../core/services/department.service';
import { Department } from '../../../core/models';

@Component({
  selector: 'app-help-topics',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, InputTextModule, TextareaModule, SelectModule, ToggleSwitchModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-heading text-2xl font-bold text-gray-900">Help Topics</h1>
        <p class="text-sm text-gray-500 mt-0.5">Manage help topics shown to customers on the submit ticket form</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- List -->
        <div class="lg:col-span-2 space-y-3">
          <div *ngFor="let topic of topics()"
               class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all">
            <div class="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
              <i class="pi pi-tags text-indigo-600" style="font-size:20px"></i>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <p class="font-semibold text-gray-900 text-sm">{{ topic.name }}</p>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      [style.background]="priorityBg(topic.defaultPriority)"
                      [style.color]="priorityColor(topic.defaultPriority)">
                  {{ topic.defaultPriority }}
                </span>
              </div>
              <p class="text-xs text-gray-500 truncate">{{ topic.description }}</p>
              <p class="text-xs text-gray-400 mt-0.5">Order: {{ topic.displayOrder }}</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button (click)="editTopic(topic)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                <i class="pi pi-pencil" style="font-size:15px"></i>
              </button>
              <button (click)="deleteTopic(topic.id)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                <i class="pi pi-trash" style="font-size:15px"></i>
              </button>
            </div>
          </div>

          <div *ngIf="topics().length === 0" class="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
            <i class="pi pi-tags text-gray-200 mb-3" style="font-size:48px;display:block;margin:0 auto 12px"></i>
            <p class="text-sm font-medium text-gray-400">No help topics yet</p>
            <p class="text-xs text-gray-300 mt-1">Create your first help topic using the form</p>
          </div>
        </div>

        <!-- Form -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                <i [class]="'pi ' + (editing() ? 'pi-pencil' : 'pi-plus') + ' text-indigo-600'" style="font-size:14px"></i>
              </div>
              <h2 class="font-semibold text-gray-900 text-sm">{{ editing() ? 'Edit Topic' : 'New Help Topic' }}</h2>
            </div>
          </div>
          <div class="p-5">
            <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Name <span class="text-red-400">*</span></label>
                <input pInputText formControlName="name" class="w-full" placeholder="Topic name" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea pTextarea formControlName="description" rows="2" class="w-full" placeholder="Description"></textarea>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Department</label>
                <p-select [options]="departmentOptions" formControlName="departmentId"
                          optionLabel="label" optionValue="value" placeholder="No preference" class="w-full" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Default Priority</label>
                <p-select [options]="priorityOptions" formControlName="defaultPriority"
                          optionLabel="label" optionValue="value" class="w-full" />
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Display Order</label>
                <input pInputText type="number" formControlName="displayOrder" class="w-full" placeholder="0" />
              </div>
              <div *ngIf="error" class="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{{ error }}</div>
              <div class="flex gap-2">
                <button type="submit" [disabled]="form.invalid || saving"
                        class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                        style="background:linear-gradient(135deg,#6366F1,#4F46E5)">
                  <i class="pi pi-check" style="font-size:14px"></i>
                  {{ saving ? 'Saving...' : (editing() ? 'Update' : 'Create') }}
                </button>
                <button *ngIf="editing()" type="button" (click)="cancelEdit()"
                        class="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class HelpTopicsComponent implements OnInit {
  topics = signal<HelpTopic[]>([]);
  departments = signal<Department[]>([]);
  editing = signal<string | null>(null);
  saving = false;
  error = '';

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    departmentId: [null as string | null],
    defaultPriority: ['MEDIUM'],
    displayOrder: [0],
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
    private helpTopicService: HelpTopicService,
    private departmentService: DepartmentService,
  ) {}

  ngOnInit() {
    this.loadTopics();
    this.departmentService.getDepartments().subscribe(page => {
      this.departments.set(page.content);
      this.departmentOptions = [
        { label: 'No preference', value: null },
        ...page.content.map((d: Department) => ({ label: d.name, value: d.id })),
      ];
    });
  }

  loadTopics() {
    this.helpTopicService.getAllTopics().subscribe(list => this.topics.set(list));
  }

  editTopic(topic: HelpTopic) {
    this.editing.set(topic.id);
    this.form.patchValue({
      name: topic.name,
      description: topic.description,
      departmentId: topic.departmentId,
      defaultPriority: topic.defaultPriority,
      displayOrder: topic.displayOrder,
    });
    this.error = '';
  }

  cancelEdit() {
    this.editing.set(null);
    this.form.reset({ defaultPriority: 'MEDIUM', displayOrder: 0 });
    this.error = '';
  }

  save() {
    if (this.form.invalid) return;
    this.saving = true;
    this.error = '';
    const data = this.form.value as Partial<HelpTopic>;
    const id = this.editing();
    const obs = id ? this.helpTopicService.update(id, data) : this.helpTopicService.create(data);
    obs.subscribe({
      next: () => {
        this.saving = false;
        this.cancelEdit();
        this.loadTopics();
      },
      error: (err) => {
        this.saving = false;
        this.error = err.error?.message || 'Failed to save help topic';
      },
    });
  }

  deleteTopic(id: string) {
    if (!confirm('Delete this help topic?')) return;
    this.helpTopicService.delete(id).subscribe({ next: () => this.loadTopics() });
  }

  priorityBg(p: string): string {
    const map: Record<string, string> = { LOW: '#F0FDF4', MEDIUM: '#EFF6FF', HIGH: '#FFFBEB', CRITICAL: '#FEF2F2' };
    return map[p] || '#F3F4F6';
  }

  priorityColor(p: string): string {
    const map: Record<string, string> = { LOW: '#166534', MEDIUM: '#1D4ED8', HIGH: '#92400E', CRITICAL: '#B91C1C' };
    return map[p] || '#374151';
  }
}
