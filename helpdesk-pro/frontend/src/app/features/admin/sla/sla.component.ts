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
      <h1 class="font-heading text-2xl font-bold text-gray-900">SLA Policies</h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- List -->
        <div class="lg:col-span-2 space-y-3">
          <div *ngFor="let sla of policies()"
               class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-start justify-between mb-3">
              <div>
                <p class="font-semibold text-gray-900">{{ sla.name }}</p>
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1"
                      [ngClass]="priorityClass(sla.priority)">{{ sla.priority }}</span>
              </div>
              <button mat-icon-button [matMenuTriggerFor]="menu">
                <mat-icon>more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="edit(sla)"><mat-icon>edit</mat-icon> Edit</button>
                <button mat-menu-item (click)="delete(sla)" class="!text-red-600"><mat-icon class="!text-red-600">delete</mat-icon> Delete</button>
              </mat-menu>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="text-gray-500 text-xs">First Response</p>
                <p class="font-semibold text-gray-900">{{ sla.responseTimeHours }}h</p>
              </div>
              <div>
                <p class="text-gray-500 text-xs">Resolution</p>
                <p class="font-semibold text-gray-900">{{ sla.resolutionTimeHours }}h</p>
              </div>
            </div>
            <p class="text-xs text-gray-400 mt-2">{{ sla.businessHoursOnly ? 'Business hours only' : '24/7' }}</p>
          </div>
        </div>

        <!-- Form -->
        <mat-card class="!rounded-xl !shadow-sm">
          <mat-card-header class="!px-5 !pt-5">
            <mat-card-title class="!text-base !font-semibold">{{ editing() ? 'Edit SLA' : 'New SLA Policy' }}</mat-card-title>
          </mat-card-header>
          <mat-card-content class="!p-5">
            <form [formGroup]="form" (ngSubmit)="save()" class="space-y-3">
              <mat-form-field class="w-full" appearance="outline">
                <mat-label>Name *</mat-label>
                <input matInput formControlName="name">
              </mat-form-field>
              <mat-form-field class="w-full" appearance="outline">
                <mat-label>Priority *</mat-label>
                <mat-select formControlName="priority">
                  <mat-option value="LOW">Low</mat-option>
                  <mat-option value="MEDIUM">Medium</mat-option>
                  <mat-option value="HIGH">High</mat-option>
                  <mat-option value="CRITICAL">Critical</mat-option>
                </mat-select>
              </mat-form-field>
              <mat-form-field class="w-full" appearance="outline">
                <mat-label>Response Time (hours) *</mat-label>
                <input matInput type="number" formControlName="responseTimeHours">
              </mat-form-field>
              <mat-form-field class="w-full" appearance="outline">
                <mat-label>Resolution Time (hours) *</mat-label>
                <input matInput type="number" formControlName="resolutionTimeHours">
              </mat-form-field>
              <div class="flex gap-2">
                <button mat-stroked-button type="button" (click)="reset()" class="!flex-1 !rounded-xl" *ngIf="editing()">Cancel</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid" class="!flex-1 !rounded-xl !font-semibold">
                  {{ editing() ? 'Save' : 'Create' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
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
