import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { environment } from '../../../../environments/environment';
import { SlaPolicy } from '../../../core/models';

@Component({
  selector: 'app-sla',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    MatButtonModule, MatCardModule, MatIconModule, MatInputModule, MatMenuModule, MatSelectModule, MatSlideToggleModule],
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
              <button mat-icon-button [matMenuTriggerFor]="menu" class="!text-gray-400">
                <mat-icon style="font-size:18px;width:18px;height:18px">more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="edit(sla)">
                  <mat-icon class="text-gray-500">edit_outline</mat-icon> Edit
                </button>
                <button mat-menu-item (click)="delete(sla)" style="color:#DC2626">
                  <mat-icon style="color:#DC2626">delete_outline</mat-icon> Delete
                </button>
              </mat-menu>
            </div>

            <div class="grid grid-cols-3 gap-4">
              <div class="bg-gray-50 rounded-lg p-3 text-center">
                <mat-icon class="text-blue-500 mb-1" style="font-size:18px;width:18px;height:18px">timer</mat-icon>
                <p class="text-xs text-gray-500 mb-0.5">First Response</p>
                <p class="text-lg font-heading font-bold text-gray-900">{{ sla.responseTimeHours }}<span class="text-xs font-normal text-gray-400">h</span></p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3 text-center">
                <mat-icon class="text-green-500 mb-1" style="font-size:18px;width:18px;height:18px">check_circle_outline</mat-icon>
                <p class="text-xs text-gray-500 mb-0.5">Resolution</p>
                <p class="text-lg font-heading font-bold text-gray-900">{{ sla.resolutionTimeHours }}<span class="text-xs font-normal text-gray-400">h</span></p>
              </div>
              <div class="bg-gray-50 rounded-lg p-3 text-center">
                <mat-icon class="text-purple-500 mb-1" style="font-size:18px;width:18px;height:18px">schedule</mat-icon>
                <p class="text-xs text-gray-500 mb-0.5">Schedule</p>
                <p class="text-xs font-semibold text-gray-700 mt-1">{{ sla.businessHoursOnly ? 'Biz hours' : '24/7' }}</p>
              </div>
            </div>
          </div>

          <div *ngIf="policies().length === 0" class="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
            <mat-icon class="text-gray-200 mb-3" style="font-size:48px;width:48px;height:48px">timer</mat-icon>
            <p class="text-sm font-medium text-gray-400">No SLA policies configured</p>
            <p class="text-xs text-gray-300 mt-1">Create your first policy using the form</p>
          </div>
        </div>

        <!-- Form -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                <mat-icon class="text-indigo-600" style="font-size:14px;width:14px;height:14px">{{ editing() ? 'edit' : 'add' }}</mat-icon>
              </div>
              <h2 class="font-semibold text-gray-900 text-sm">{{ editing() ? 'Edit SLA Policy' : 'New SLA Policy' }}</h2>
            </div>
          </div>
          <div class="p-5">
            <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
              <mat-form-field class="w-full" appearance="outline">
                <mat-label>Policy name</mat-label>
                <input matInput formControlName="name">
                <mat-error>Name is required</mat-error>
              </mat-form-field>
              <mat-form-field class="w-full" appearance="outline">
                <mat-label>Priority</mat-label>
                <mat-select formControlName="priority">
                  <mat-option value="LOW">Low</mat-option>
                  <mat-option value="MEDIUM">Medium</mat-option>
                  <mat-option value="HIGH">High</mat-option>
                  <mat-option value="CRITICAL">Critical</mat-option>
                </mat-select>
              </mat-form-field>
              <div class="grid grid-cols-2 gap-3">
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Response (h)</mat-label>
                  <input matInput type="number" formControlName="responseTimeHours">
                  <mat-error>Required</mat-error>
                </mat-form-field>
                <mat-form-field class="w-full" appearance="outline">
                  <mat-label>Resolution (h)</mat-label>
                  <input matInput type="number" formControlName="resolutionTimeHours">
                  <mat-error>Required</mat-error>
                </mat-form-field>
              </div>
              <div class="flex gap-2 pt-1">
                <button mat-stroked-button type="button" (click)="reset()" class="!rounded-lg !flex-1" *ngIf="editing()">Cancel</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid" class="!rounded-lg !flex-1 !font-semibold">
                  {{ editing() ? 'Save changes' : 'Create' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SlaComponent implements OnInit {
  policies = signal<SlaPolicy[]>([]);
  editing = signal<SlaPolicy | null>(null);

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
