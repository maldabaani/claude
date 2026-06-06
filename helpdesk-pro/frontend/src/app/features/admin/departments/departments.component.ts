import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { DepartmentService } from '../../../core/services/department.service';
import { Department } from '../../../core/models';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    MatButtonModule, MatCardModule, MatIconModule, MatInputModule, MatMenuModule],
  template: `
    <div class="space-y-6">
      <h1 class="font-heading text-2xl font-bold text-gray-900">Departments</h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- List -->
        <div class="lg:col-span-2 space-y-3">
          <div *ngFor="let dept of departments()"
               class="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <mat-icon class="text-blue-600">business</mat-icon>
            </div>
            <div class="flex-1">
              <p class="font-semibold text-gray-900">{{ dept.name }}</p>
              <p class="text-sm text-gray-500">{{ dept.description }}</p>
              <p class="text-xs text-gray-400">{{ dept.inboundEmail }}</p>
            </div>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  [ngClass]="dept.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'">
              {{ dept.active ? 'Active' : 'Inactive' }}
            </span>
            <button mat-icon-button [matMenuTriggerFor]="menu">
              <mat-icon>more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="editDept(dept)">
                <mat-icon>edit</mat-icon> Edit
              </button>
              <button mat-menu-item (click)="deleteDept(dept)" class="!text-red-600">
                <mat-icon class="!text-red-600">delete</mat-icon> Delete
              </button>
            </mat-menu>
          </div>
          <p *ngIf="departments().length === 0" class="text-center py-8 text-gray-400">No departments found.</p>
        </div>

        <!-- Form -->
        <mat-card class="!rounded-xl !shadow-sm">
          <mat-card-header class="!px-5 !pt-5">
            <mat-card-title class="!text-base !font-semibold">{{ editing() ? 'Edit Department' : 'New Department' }}</mat-card-title>
          </mat-card-header>
          <mat-card-content class="!p-5">
            <form [formGroup]="form" (ngSubmit)="save()" class="space-y-3">
              <mat-form-field class="w-full" appearance="outline">
                <mat-label>Name *</mat-label>
                <input matInput formControlName="name">
              </mat-form-field>
              <mat-form-field class="w-full" appearance="outline">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="2"></textarea>
              </mat-form-field>
              <mat-form-field class="w-full" appearance="outline">
                <mat-label>Inbound Email</mat-label>
                <input matInput formControlName="inboundEmail" type="email">
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
export class DepartmentsComponent implements OnInit {
  departments = signal<Department[]>([]);
  editing = signal<Department | null>(null);

  form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    inboundEmail: [''],
  });

  constructor(private deptService: DepartmentService, private fb: FormBuilder) {}

  ngOnInit() { this.load(); }

  load() {
    this.deptService.getDepartments().subscribe(p => this.departments.set(p.content));
  }

  editDept(dept: Department) {
    this.editing.set(dept);
    this.form.patchValue({ name: dept.name, description: dept.description, inboundEmail: dept.inboundEmail });
  }

  save() {
    if (this.form.invalid) return;
    const data = this.form.value as Partial<Department>;
    const e = this.editing();
    const req = e
      ? this.deptService.updateDepartment(e.id, data)
      : this.deptService.createDepartment(data);
    req.subscribe(() => { this.load(); this.reset(); });
  }

  deleteDept(dept: Department) {
    if (!confirm(`Delete ${dept.name}?`)) return;
    this.deptService.deleteDepartment(dept.id).subscribe(() => this.load());
  }

  reset() { this.editing.set(null); this.form.reset(); }
}
