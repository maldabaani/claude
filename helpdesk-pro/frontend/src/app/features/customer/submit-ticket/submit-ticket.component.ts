import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { TicketService } from '../../../core/services/ticket.service';
import { DepartmentService } from '../../../core/services/department.service';
import { Department } from '../../../core/models';

@Component({
  selector: 'app-submit-ticket',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
    MatButtonModule, MatInputModule, MatSelectModule, MatIconModule],
  template: `
    <div class="max-w-2xl mx-auto">

      <!-- Page header -->
      <div class="mb-6">
        <h1 class="text-2xl font-black text-gray-900 mb-1" style="letter-spacing:-0.03em">Submit a Ticket</h1>
        <p class="text-slate-400 text-sm">Describe your issue and we'll get back to you shortly.</p>
      </div>

      <!-- Form card -->
      <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">

        <!-- Card header -->
        <div class="px-8 py-5 flex items-center gap-3" style="border-bottom:1px solid #F1F5F9;background:#FAFAFA">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center"
               style="background:linear-gradient(135deg,#EFF6FF,#DBEAFE);border:1px solid #BFDBFE">
            <mat-icon class="text-blue-600" style="font-size:18px;width:18px;height:18px">edit_note</mat-icon>
          </div>
          <div>
            <p class="font-bold text-gray-900 text-sm">New Support Request</p>
            <p class="text-xs text-slate-400">Fill in the details to get started</p>
          </div>
          <!-- Step indicator -->
          <div class="ml-auto flex items-center gap-1.5">
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style="background:#2563EB">1</span>
            <span class="w-4 h-0.5 rounded" style="background:#E2E8F0"></span>
            <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                  style="background:#F1F5F9;color:#94A3B8">2</span>
          </div>
        </div>

        <!-- Form body -->
        <form [formGroup]="form" (ngSubmit)="submit()" class="px-8 py-7 space-y-5">

          <!-- Subject -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              Subject <span class="text-red-400">*</span>
            </label>
            <mat-form-field class="w-full" appearance="outline">
              <input matInput formControlName="title" placeholder="Brief description of your issue">
              <mat-error>Subject is required</mat-error>
            </mat-form-field>
          </div>

          <!-- Department + Priority row -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Department</label>
              <mat-form-field class="w-full" appearance="outline">
                <mat-select formControlName="departmentId">
                  <mat-option [value]="null">No preference</mat-option>
                  <mat-option *ngFor="let d of departments()" [value]="d.id">{{ d.name }}</mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1.5">Priority</label>
              <mat-form-field class="w-full" appearance="outline">
                <mat-select formControlName="priority">
                  <mat-option value="LOW">
                    <span class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-slate-400"></span> Low
                    </span>
                  </mat-option>
                  <mat-option value="MEDIUM">
                    <span class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-blue-500"></span> Medium
                    </span>
                  </mat-option>
                  <mat-option value="HIGH">
                    <span class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-orange-500"></span> High
                    </span>
                  </mat-option>
                  <mat-option value="CRITICAL">
                    <span class="flex items-center gap-2">
                      <span class="w-2 h-2 rounded-full bg-red-500"></span> Critical
                    </span>
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1.5">
              Description <span class="text-red-400">*</span>
            </label>
            <mat-form-field class="w-full" appearance="outline">
              <textarea matInput formControlName="description" rows="6"
                        placeholder="Please describe your issue in detail — include any error messages, steps to reproduce, or screenshots if applicable."></textarea>
              <mat-error>Description is required</mat-error>
              <mat-hint>The more detail you provide, the faster we can help</mat-hint>
            </mat-form-field>
          </div>

          <!-- Error state -->
          <div *ngIf="error"
               class="flex items-start gap-3 p-4 rounded-xl"
               style="background:#FEF2F2;border:1px solid #FECACA">
            <mat-icon class="shrink-0 mt-0.5" style="font-size:16px;width:16px;height:16px;color:#EF4444">error_outline</mat-icon>
            <span class="text-sm text-red-700">{{ error }}</span>
          </div>

          <!-- Success state -->
          <div *ngIf="success()"
               class="flex items-start gap-3 p-4 rounded-xl"
               style="background:#F0FDF4;border:1px solid #BBF7D0">
            <mat-icon class="shrink-0 mt-0.5" style="font-size:16px;width:16px;height:16px;color:#22C55E">check_circle_outline</mat-icon>
            <span class="text-sm font-semibold text-green-700">Ticket submitted successfully! Redirecting you now...</span>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <a routerLink="/customer"
               class="flex-1 flex items-center justify-center gap-1.5 h-11 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200">
              Cancel
            </a>
            <button type="submit"
                    class="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style="background:linear-gradient(135deg,#2563EB,#1D4ED8);box-shadow:0 2px 8px rgba(37,99,235,0.3)"
                    [disabled]="loading || form.invalid">
              <mat-icon *ngIf="!loading" style="font-size:16px;width:16px;height:16px">send</mat-icon>
              <span class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" *ngIf="loading"></span>
              {{ loading ? 'Submitting...' : 'Submit Ticket' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class SubmitTicketComponent implements OnInit {
  form = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    priority: ['MEDIUM'],
    departmentId: [null as string | null],
    category: [''],
  });

  departments = signal<Department[]>([]);
  loading = false;
  error = '';
  success = signal(false);

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private departmentService: DepartmentService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.departmentService.getDepartments().subscribe(page => this.departments.set(page.content));
  }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.ticketService.createTicket(this.form.value as any).subscribe({
      next: (ticket) => {
        this.success.set(true);
        setTimeout(() => this.router.navigate(['/customer/tickets', ticket.id]), 1500);
      },
      error: (err) => { this.error = err.error?.message || 'Failed to submit ticket. Please try again.'; this.loading = false; },
    });
  }
}
