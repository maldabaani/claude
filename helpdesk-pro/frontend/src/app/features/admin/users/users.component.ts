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
    <div class="space-y-5">
      <!-- Page header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="font-heading text-2xl font-bold text-gray-900">Users</h1>
          <p class="text-sm text-gray-500 mt-0.5">{{ totalElements() }} users registered</p>
        </div>
      </div>

      <!-- Filters bar -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 flex-wrap">
        <mat-icon class="text-gray-400 shrink-0" style="font-size:18px;width:18px;height:18px">filter_list</mat-icon>
        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filter:</span>
        <mat-form-field appearance="outline" style="width:160px;margin-bottom:-1.25em">
          <mat-label>Role</mat-label>
          <mat-select [formControl]="roleFilter" (selectionChange)="load()">
            <mat-option value="">All roles</mat-option>
            <mat-option *ngFor="let r of roles" [value]="r">{{ r }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <!-- Table header -->
        <div class="grid gap-4 px-6 py-3 bg-gray-50/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide"
             style="grid-template-columns:1fr 120px 100px 120px 60px">
          <span>User</span>
          <span>Role</span>
          <span>Status</span>
          <span>Joined</span>
          <span></span>
        </div>

        <app-skeleton-loader *ngIf="loading()" type="table" [count]="8" class="block px-6 py-2" />

        <div *ngIf="!loading()">
          <div *ngFor="let user of users(); let last = last"
               class="grid gap-4 items-center px-6 py-4 hover:bg-gray-50/80 transition-colors"
               style="grid-template-columns:1fr 120px 100px 120px 60px"
               [class.border-b]="!last" [class.border-gray-100]="!last">
            <!-- User info -->
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {{ user.fullName.charAt(0) || '?' }}
              </div>
              <div class="min-w-0">
                <p class="font-medium text-gray-900 text-sm truncate">{{ user.fullName }}</p>
                <p class="text-xs text-gray-400 truncate">{{ user.email }}</p>
              </div>
            </div>

            <!-- Role badge -->
            <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 w-fit">
              {{ user.role }}
            </span>

            <!-- Status badge -->
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold w-fit"
                  [ngClass]="user.active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'">
              <span class="w-1.5 h-1.5 rounded-full"
                    [ngClass]="user.active ? 'bg-green-500' : 'bg-gray-400'"></span>
              {{ user.active ? 'Active' : 'Inactive' }}
            </span>

            <span class="text-xs text-gray-400">{{ user.createdAt | timeAgo }}</span>

            <!-- Actions -->
            <div class="flex justify-end">
              <button mat-icon-button [matMenuTriggerFor]="menu" class="!text-gray-400 hover:!text-gray-600">
                <mat-icon style="font-size:18px;width:18px;height:18px">more_horiz</mat-icon>
              </button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="toggleActive(user)">
                  <mat-icon class="text-gray-500">{{ user.active ? 'block' : 'check_circle' }}</mat-icon>
                  {{ user.active ? 'Deactivate' : 'Activate' }}
                </button>
                <button mat-menu-item (click)="deleteUser(user)" style="color:#DC2626">
                  <mat-icon style="color:#DC2626">delete_outline</mat-icon>
                  Delete user
                </button>
              </mat-menu>
            </div>
          </div>

          <div *ngIf="users().length === 0" class="py-16 text-center">
            <mat-icon class="text-gray-200 mb-3" style="font-size:48px;width:48px;height:48px">group</mat-icon>
            <p class="text-sm font-medium text-gray-400">No users found</p>
          </div>
        </div>
      </div>

      <mat-paginator [length]="totalElements()" [pageSize]="pageSize" (page)="onPage($event)"
                     class="bg-white rounded-xl border border-gray-100 shadow-sm" />
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
