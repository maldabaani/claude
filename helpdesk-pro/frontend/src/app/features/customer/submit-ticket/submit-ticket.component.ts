import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { TicketService } from '../../../core/services/ticket.service';
import { DepartmentService } from '../../../core/services/department.service';
import { Department } from '../../../core/models';

@Component({
  selector: 'app-submit-ticket',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
    MatButtonModule, MatInputModule, MatSelectModule, MatIconModule,
    MatStepperModule, MatCardModule, MatChipsModule],
  template: `
    <div class="max-w-2xl mx-auto">
      <!-- Page header -->
      <div class="mb-6">
        <h1 class="font-heading text-2xl font-bold text-gray-900">Submit a Ticket</h1>
        <p class="text-gray-500 mt-1 text-sm">Describe your issue and our team will respond shortly.</p>
      </div>

      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <!-- Form header bar -->
        <div class="px-8 py-5 border-b border-gray-100 bg-gray-50/50">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
              <mat-icon class="text-blue-600" style="font-size:18px;width:18px;height:18px">edit_note</mat-icon>
            </div>
            <div>
              <p class="font-semibold text-gray-900 text-sm">New Support Request</p>
              <p class="text-xs text-gray-400">Fill in the details below</p>
            </div>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="px-8 py-6 space-y-5">
          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Subject</mat-label>
            <input matInput formControlName="title" placeholder="Brief description of your issue">
            <mat-error>Subject is required</mat-error>
          </mat-form-field>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Department</mat-label>
              <mat-select formControlName="departmentId">
                <mat-option [value]="null">No preference</mat-option>
                <mat-option *ngFor="let d of departments()" [value]="d.id">{{ d.name }}</mat-option>
              </mat-select>
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
          </div>

          <mat-form-field class="w-full" appearance="outline">
            <mat-label>Description</mat-label>
            <textarea matInput formControlName="description" rows="6"
                      placeholder="Please provide as much detail as possible..."></textarea>
            <mat-error>Description is required</mat-error>
            <mat-hint>Be as specific as possible to help us resolve your issue faster</mat-hint>
          </mat-form-field>

          <div *ngIf="error" class="flex items-start gap-3 p-4 bg-red-50 rounded-xl border border-red-200">
            <mat-icon class="text-red-500 shrink-0 mt-0.5" style="font-size:18px">error_outline</mat-icon>
            <span class="text-red-700 text-sm">{{ error }}</span>
          </div>

          <div *ngIf="success()" class="flex items-start gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
            <mat-icon class="text-green-600 shrink-0 mt-0.5" style="font-size:18px">check_circle_outline</mat-icon>
            <span class="text-green-700 text-sm font-medium">Ticket submitted successfully! Redirecting...</span>
          </div>

          <div class="flex gap-3 pt-2">
            <a routerLink="/customer" mat-stroked-button class="!rounded-lg !flex-1">
              Cancel
            </a>
            <button mat-raised-button color="primary" type="submit"
                    class="!rounded-lg !flex-1 !font-semibold" [disabled]="loading || form.invalid">
              <mat-icon *ngIf="!loading" style="font-size:18px;width:18px;height:18px">send</mat-icon>
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
    departmentId: [null],
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
      error: (err) => { this.error = err.error?.message || 'Failed to submit ticket'; this.loading = false; },
    });
  }
}
