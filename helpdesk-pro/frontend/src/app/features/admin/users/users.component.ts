import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UserService } from '../../../core/services/user.service';
import { User, Role } from '../../../core/models';
import { SkeletonLoaderComponent } from '../../../shared/components/skeleton-loader/skeleton-loader.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,
    MatButtonModule, MatCardModule, MatIconModule, MatInputModule, MatMenuModule,
    MatPaginatorModule, MatSelectModule, MatSlideToggleModule, MatDialogModule,
    SkeletonLoaderComponent, TimeAgoPipe],
  template: `
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="font-heading text-2xl font-bold text-gray-900">Users</h1>
        <span class="text-sm text-gray-500">{{ totalElements() }} total</span>
      </div>

      <!-- Filter -->
      <mat-card class="!rounded-xl !shadow-sm">
        <mat-card-content class="!p-4">
          <mat-form-field appearance="outline" style="width:160px">
            <mat-label>Role</mat-label>
            <mat-select [formControl]="roleFilter" (selectionChange)="load()">
              <mat-option value="">All</mat-option>
              <mat-option *ngFor="let r of roles" [value]="r">{{ r }}</mat-option>
            </mat-select>
          </mat-form-field>
        </mat-card-content>
      </mat-card>

      <!-- Table -->
      <mat-card class="!rounded-xl !shadow-sm overflow-hidden">
        <div class="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>User</span><span>Role</span><span>Status</span><span>Created</span><span>Actions</span>
        </div>

        <app-skeleton-loader *ngIf="loading()" type="table" [count]="8" class="block px-6 py-2" />

        <div *ngIf="!loading()">
          <div *ngFor="let user of users()"
               class="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-6 py-4 border-b border-gray-100 hover:bg-gray-50">
            <div>
              <p class="font-medium text-gray-900 text-sm">{{ user.fullName }}</p>
              <p class="text-xs text-gray-400">{{ user.email }}</p>
            </div>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700">
              {{ user.role }}
            </span>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  [ngClass]="user.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'">
              {{ user.active ? 'Active' : 'Inactive' }}
            </span>
            <span class="text-xs text-gray-400">{{ user.createdAt | timeAgo }}</span>
            <div class="flex gap-1">
              <button mat-icon-button [matMenuTriggerFor]="menu" class="!w-8 !h-8">
                <mat-icon class="text-base">more_vert</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="toggleActive(user)">
                  <mat-icon>{{ user.active ? 'block' : 'check_circle' }}</mat-icon>
                  {{ user.active ? 'Deactivate' : 'Activate' }}
                </button>
                <button mat-menu-item (click)="deleteUser(user)" class="!text-red-600">
                  <mat-icon class="!text-red-600">delete</mat-icon> Delete
                </button>
              </mat-menu>
            </div>
          </div>
          <p *ngIf="users().length === 0" class="text-center py-12 text-gray-400">No users found.</p>
        </div>
      </mat-card>

      <mat-paginator [length]="totalElements()" [pageSize]="pageSize" (page)="onPage($event)" />
    </div>
  `,
})
export class UsersComponent implements OnInit {
  users = signal<User[]>([]);
  loading = signal(true);
  totalElements = signal(0);
  pageSize = 15;
  currentPage = 0;
  roles: Role[] = ['CUSTOMER', 'AGENT', 'TEAM_LEAD', 'ADMIN'];
  roleFilter = this.fb.control('');

  constructor(private userService: UserService, private fb: FormBuilder) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    const role = this.roleFilter.value as Role | undefined;
    this.userService.getUsers(role || undefined, this.currentPage, this.pageSize).subscribe({
      next: (p) => { this.users.set(p.content); this.totalElements.set(p.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleActive(user: User) {
    this.userService.updateUser(user.id, { active: !user.active } as any).subscribe(() => this.load());
  }

  deleteUser(user: User) {
    if (!confirm(`Delete user ${user.fullName}?`)) return;
    this.userService.deleteUser(user.id).subscribe(() => this.load());
  }

  onPage(e: PageEvent) { this.currentPage = e.pageIndex; this.load(); }
}
