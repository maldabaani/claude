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
      <div class="mb-6">
        <h1 class="font-heading text-2xl font-bold text-gray-900">Submit a Ticket</h1>
        <p class="text-gray-500 mt-1">Describe your issue and we'll get back to you shortly.</p>
      </div>

      <mat-card class="!rounded-2xl !shadow-sm">
        <mat-card-content class="!p-8">
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Subject *</mat-label>
              <input matInput formControlName="title" placeholder="Brief description of your issue">
              <mat-error>Subject is required</mat-error>
            </mat-form-field>

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

            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Description *</mat-label>
              <textarea matInput formControlName="description" rows="6"
                        placeholder="Please provide as much detail as possible..."></textarea>
              <mat-error>Description is required</mat-error>
            </mat-form-field>

            <div *ngIf="error" class="p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-sm">{{ error }}</div>
            <div *ngIf="success()" class="p-3 bg-green-50 rounded-lg border border-green-200 text-green-700 text-sm">
              Ticket submitted successfully! Redirecting...
            </div>

            <div class="flex gap-3">
              <a routerLink="/customer" mat-stroked-button class="!rounded-xl !flex-1">Cancel</a>
              <button mat-raised-button color="primary" type="submit"
                      class="!rounded-xl !flex-1 !font-semibold" [disabled]="loading || form.invalid">
                {{ loading ? 'Submitting...' : 'Submit Ticket' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
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
