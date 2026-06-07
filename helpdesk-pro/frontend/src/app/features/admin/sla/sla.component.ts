import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { SlaPolicy } from '../../../core/models';

@Component({
  selector: 'app-sla',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule,
    ButtonModule, InputTextModule, SelectModule, MenuModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-heading text-2xl font-bold text-gray-900">SLA Policies</h1>
        <p class="text-sm text-gray-500 mt-0.5">Define response and resolution time targets</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- List -->
        <div class="lg:col-span-2 space-y-3">
          <div *ngFor="let sla of policies()"
               class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all">
            <div class="flex items-start justify-between mb-4">
              <div>
                <p class="font-semibold text-gray-900">{{ sla.name }}</p>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold mt-1.5"
                      [ngClass]="priorityClass(sla.priority)">{{ sla.priority }}</span>
              </div>
              <button (click)="setSlaMenuItems(sla); slaMenu.toggle($event)"
                      class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <i class="pi pi-ellipsis-v" style="font-size:18px"></i>
              </button>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div class="bg-gray-50 rounded-lg p-3 text-center">
                <i class="pi pi-stopwatch text-blue-500 mb-1" style="font-size:18px;display:block"></i>
                <p class="text-xs text-gray-500 mb-0.5">First Response</p>
                <p class="text-lg font-heading font-bold text-gray-900">{{ sla.responseTimeHours }}<span class="text-xs font-normal text-gray-400">h</span></p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3 text-center">
                <i class="pi pi-check-circle text-green-500 mb-1" style="font-size:18px;display:block"></i>
                <p class="text-xs text-gray-500 mb-0.5">Resolution</p>
                <p class="text-lg font-heading font-bold text-gray-900">{{ sla.resolutionTimeHours }}<span class="text-xs font-normal text-gray-400">h</span></p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3 text-center">
                <i class="pi pi-clock text-purple-500 mb-1" style="font-size:18px;display:block"></i>
                <p class="text-xs text-gray-500 mb-0.5">Schedule</p>
                <p class="text-xs font-semibold text-gray-700 mt-1">{{ sla.businessHoursOnly ? 'Biz hours' : '24/7' }}</p>
              </div>
            </div>
          </div>

          <div *ngIf="policies().length === 0" class="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
            <i class="pi pi-stopwatch text-gray-200 mb-3" style="font-size:48px;display:block;margin:0 auto 12px"></i>
            <p class="text-sm font-medium text-gray-400">No SLA policies configured</p>
            <p class="text-xs text-gray-300 mt-1">Create your first policy using the form</p>
          </div>
        </div>

        <!-- Form -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                <i [class]="'pi ' + (editing() ? 'pi-pencil' : 'pi-plus') + ' text-indigo-600'" style="font-size:14px"></i>
              </div>
              <h2 class="font-semibold text-gray-900 text-sm">{{ editing() ? 'Edit SLA Policy' : 'New SLA Policy' }}</h2>
            </div>
          </div>
          <div class="p-5">
            <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Policy name</label>
                <input pInputText formControlName="name" class="w-full" placeholder="Policy name" />
                <div *ngIf="form.get('name')?.invalid && form.get('name')?.touched" class="text-xs text-red-500 mt-1">Name is required</div>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
                <p-select [options]="priorityOptions" formControlName="priority"
                          optionLabel="label" optionValue="value" class="w-full" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">Response (h)</label>
                  <input pInputText type="number" formControlName="responseTimeHours" class="w-full" />
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-1.5">Resolution (h)</label>
                  <input pInputText type="number" formControlName="resolutionTimeHours" class="w-full" />
                </div>
              </div>
              <div class="flex gap-2 pt-1">
                <button *ngIf="editing()" pButton type="button" (click)="reset()" label="Cancel"
                        variant="outlined" class="flex-1"></button>
                <button pButton type="submit" [disabled]="form.invalid"
                        [label]="editing() ? 'Save changes' : 'Create'"
                        class="flex-1"></button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <p-menu #slaMenu [model]="slaMenuItems" [popup]="true" />
    </div>
  `,
})
export class SlaComponent implements OnInit {
  policies = signal<SlaPolicy[]>([]);
  editing = signal<SlaPolicy | null>(null);
  slaMenuItems: MenuItem[] = [];

  priorityOptions = [
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Critical', value: 'CRITICAL' },
  ];

  form = this.fb.group({
    name: ['', Validators.required],
    priority: ['MEDIUM', Validators.required],
    responseTimeHours: [8, [Validators.required, Validators.min(1)]],
    resolutionTimeHours: [24, [Validators.required, Validators.min(1)]],
    businessHoursOnly: [false],
  });

  constructor(private fb: FormBuilder, private http: HttpClient) {}

  ngOnInit() { this.load(); }

  load() {
    this.http.get<any>(`${environment.apiUrl}/sla`).subscribe(r => this.policies.set(r.data?.content || []));
  }

  setSlaMenuItems(sla: SlaPolicy) {
    this.slaMenuItems = [
      { label: 'Edit', icon: 'pi pi-pencil', command: () => this.edit(sla) },
      { label: 'Delete', icon: 'pi pi-trash', styleClass: 'text-red-600', command: () => this.delete(sla) }
    ];
  }

  edit(sla: SlaPolicy) {
    this.editing.set(sla);
    this.form.patchValue(sla as any);
  }

  save() {
    if (this.form.invalid) return;
    const e = this.editing();
    const req = e
      ? this.http.put(`${environment.apiUrl}/sla/${e.id}`, this.form.value)
      : this.http.post(`${environment.apiUrl}/sla`, this.form.value);
    req.subscribe(() => { this.load(); this.reset(); });
  }

  delete(sla: SlaPolicy) {
    if (!confirm(`Delete ${sla.name}?`)) return;
    this.http.delete(`${environment.apiUrl}/sla/${sla.id}`).subscribe(() => this.load());
  }

  reset() { this.editing.set(null); this.form.reset({ priority: 'MEDIUM', responseTimeHours: 8, resolutionTimeHours: 24, businessHoursOnly: false }); }

  priorityClass(p: string) {
    const m: Record<string, string> = { CRITICAL: 'badge-critical', HIGH: 'badge-high', MEDIUM: 'badge-medium', LOW: 'badge-low' };
    return m[p] || '';
  }
}
