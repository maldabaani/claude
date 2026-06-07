import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { DepartmentService } from '../../../core/services/department.service';
import { Department } from '../../../core/models';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    ButtonModule, InputTextModule, TextareaModule, MenuModule],
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
              <i class="pi pi-building text-blue-600" style="font-size:20px"></i>
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
            <button (click)="setDeptMenuItems(dept); deptMenu.toggle($event)"
                    class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0">
              <i class="pi pi-ellipsis-v" style="font-size:18px"></i>
            </button>
          </div>

          <div *ngIf="departments().length === 0" class="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
            <i class="pi pi-building text-gray-200 mb-3" style="font-size:48px;display:block;margin:0 auto 12px"></i>
            <p class="text-sm font-medium text-gray-400">No departments yet</p>
            <p class="text-xs text-gray-300 mt-1">Create your first department using the form</p>
          </div>
        </div>

        <!-- Form -->
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <i [class]="'pi ' + (editing() ? 'pi-pencil' : 'pi-plus') + ' text-blue-600'" style="font-size:14px"></i>
              </div>
              <h2 class="font-semibold text-gray-900 text-sm">{{ editing() ? 'Edit Department' : 'New Department' }}</h2>
            </div>
          </div>
          <div class="p-5">
            <form [formGroup]="form" (ngSubmit)="save()" class="space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Name</label>
                <input pInputText formControlName="name" class="w-full" placeholder="Department name" />
                <div *ngIf="form.get('name')?.invalid && form.get('name')?.touched" class="text-xs text-red-500 mt-1">Name is required</div>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea pTextarea formControlName="description" rows="2" class="w-full" placeholder="Description"></textarea>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Inbound Email</label>
                <input pInputText formControlName="inboundEmail" type="email" class="w-full" placeholder="support@company.com" />
              </div>
              <div class="flex gap-2 pt-1">
                <button *ngIf="editing()" pButton type="button" (click)="reset()" label="Cancel"
                        variant="outlined" class="flex-1" styleClass="!rounded-lg"></button>
                <button pButton type="submit" [disabled]="form.invalid"
                        [label]="editing() ? 'Save changes' : 'Create'"
                        class="flex-1" styleClass="!rounded-lg !font-semibold"></button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <p-menu #deptMenu [model]="deptMenuItems" [popup]="true" />
    </div>
  `,
})
export class DepartmentsComponent implements OnInit {
  departments = signal<Department[]>([]);
  editing = signal<Department | null>(null);
  deptMenuItems: MenuItem[] = [];

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

  setDeptMenuItems(dept: Department) {
    this.deptMenuItems = [
      { label: 'Edit', icon: 'pi pi-pencil', command: () => this.editDept(dept) },
      { label: 'Delete', icon: 'pi pi-trash', styleClass: 'text-red-600', command: () => this.deleteDept(dept) }
    ];
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
