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
      <div>
        <h1 class="font-heading text-2xl font-bold text-gray-900">Departments</h1>
        <p class="text-sm text-gray-500 mt-0.5">Manage support departments and routing</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- List -->
        <div class="lg:col-span-2 space-y-3">
          <div *ngFor="let dept of departments()"
               class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-all">
            <div class="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <mat-icon class="text-blue-600" style="font-size:20px;width:20px;height:20px">business</mat-icon>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <p class="font-semibold text-gray-900 text-sm">{{ dept.name }}</p>
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="dept.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'">
                  <span class="w-1.5 h-1.5 rounded-full"
                        [ngClass]="dept.active ? 'bg-green-500' : 'bg-gray-400'"></span>
                  {{ dept.active ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <p class="text-xs text-gray-500 truncate">{{ dept.description }}</p>
              <p class="text-xs text-gray-400 font-mono mt-0.5">{{ dept.inboundEmail }}</p>
            </div>
            <button mat-icon-button [matMenuTriggerFor]="menu" class="!text-gray-400 shrink-0">
              <mat-icon style="font-size:18px;width:18px;height:18px">more_vert</mat-icon>
            </button>
            <mat-menu #menu="matMenu">
              <button mat-menu-item (click)="editDept(dept)">
                <mat-icon class="text-gray-500">edit_outline</mat-icon> Edit
              </button>
              <button mat-menu-item (click)="deleteDept(dept)" style="color:#DC2626">
                <mat-icon style="color:#DC2626">delete_outline</mat-icon> Delete
              </button>
            </mat-menu>
          </div>

          <div *ngIf="departments().length === 0" class="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
            <mat-icon class="text-gray-200 mb-3" style="font-size:48px;width:48px;height:48px">business</mat-icon>
            <p class="text-sm font-medium text-gray-400">No departments yet</p>
            <p class="text-xs text-gray-300 mt-1">Create your first department using the form</p>
          </div>
        </div>

        <!-- Form -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <mat-icon class="text-blue-600" style="font-size:14px;width:14px;height:14px">{{ editing() ? 'edit' : 'add' }}</mat-icon>
              </div>
              <h2 class="font-semibold text-gray-900 text-sm">{{ editing() ? 'Edit Department' : 'New Department' }}</h2>
            </div>
          </div>
          <div class="p-5">
            <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
              <mat-form-field class="w-full" appearance="outline">
                <mat-label>Name</mat-label>
                <input matInput formControlName="name">
                <mat-error>Name is required</mat-error>
              </mat-form-field>
              <mat-form-field class="w-full" appearance="outline">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="2"></textarea>
              </mat-form-field>
              <mat-form-field class="w-full" appearance="outline">
                <mat-label>Inbound Email</mat-label>
                <input matInput formControlName="inboundEmail" type="email">
                <mat-icon matPrefix class="text-slate-400 mr-1" style="font-size:18px">alternate_email</mat-icon>
              </mat-form-field>
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
