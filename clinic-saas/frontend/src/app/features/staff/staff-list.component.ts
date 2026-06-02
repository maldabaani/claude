import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

interface StaffUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  active: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule,
            TableModule, ButtonModule, TagModule, CardModule,
            DialogModule, DropdownModule, InputTextModule,
            ToastModule, ToggleButtonModule],
  providers: [MessageService],
  templateUrl: './staff-list.component.html'
})
export class StaffListComponent implements OnInit {
  staff   = signal<StaffUser[]>([]);
  loading = signal(true);
  showCreate = signal(false);
  creating   = signal(false);

  roles = [
    { label: 'Admin',         value: 'ADMIN' },
    { label: 'Doctor',        value: 'DOCTOR' },
    { label: 'Nurse',         value: 'NURSE' },
    { label: 'Receptionist',  value: 'RECEPTIONIST' }
  ];

  createForm: FormGroup;

  constructor(
    private http: HttpClient,
    private msg: MessageService,
    private fb: FormBuilder
  ) {
    this.createForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName:  ['', Validators.required],
      email:     ['', [Validators.required, Validators.email]],
      password:  ['', [Validators.required, Validators.minLength(8)]],
      role:      ['DOCTOR', Validators.required]
    });
  }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<StaffUser[]>('/api/v1/users').pipe(catchError(() => of([]))).subscribe(users => {
      this.staff.set(users);
      this.loading.set(false);
    });
  }

  createUser() {
    if (this.createForm.invalid) return;
    this.creating.set(true);
    this.http.post<StaffUser>('/api/v1/users', this.createForm.value).subscribe({
      next: (user) => {
        this.staff.update(list => [...list, user]);
        this.createForm.reset({ role: 'DOCTOR' });
        this.msg.add({ severity: 'success', summary: 'User created' });
        this.showCreate.set(false);
        this.creating.set(false);
      },
      error: (err) => {
        const detail = err?.error?.detail ?? 'Failed to create user';
        this.msg.add({ severity: 'error', summary: detail });
        this.creating.set(false);
      }
    });
  }

  toggleStatus(user: StaffUser) {
    const newStatus = !user.active;
    this.http.put(`/api/v1/users/${user.id}/status`, null, { params: { active: String(newStatus) } })
      .subscribe({
        next: () => {
          this.staff.update(list => list.map(u => u.id === user.id ? { ...u, active: newStatus } : u));
          this.msg.add({ severity: 'success', summary: `User ${newStatus ? 'activated' : 'deactivated'}` });
        },
        error: () => this.msg.add({ severity: 'error', summary: 'Failed to update status' })
      });
  }

  roleSev(role: string): 'success' | 'info' | 'warning' | 'danger' | undefined {
    const m: Record<string, any> = { ADMIN: 'danger', DOCTOR: 'success', NURSE: 'info', RECEPTIONIST: 'warning' };
    return m[role] ?? 'info';
  }
}
