import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
    MatButtonModule, MatInputModule, MatIconModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-500/30">
            <mat-icon class="text-white text-3xl">support_agent</mat-icon>
          </div>
          <h1 class="font-heading text-3xl font-bold text-white">Create Account</h1>
          <p class="text-slate-400 mt-1">Get help from our support team</p>
        </div>

        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Full Name</mat-label>
              <input matInput formControlName="fullName">
              <mat-error>Full name is required</mat-error>
            </mat-form-field>

            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email">
              <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email</mat-error>
            </mat-form-field>

            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password">
              <mat-error>Password must be at least 8 characters</mat-error>
            </mat-form-field>

            <div *ngIf="error" class="p-3 bg-red-50 rounded-lg border border-red-200 text-red-700 text-sm">{{ error }}</div>

            <button mat-raised-button color="primary" type="submit"
                    class="w-full !h-12 !text-base !font-semibold !rounded-xl" [disabled]="loading || form.invalid">
              {{ loading ? 'Creating account...' : 'Create account' }}
            </button>
          </form>

          <p class="text-center text-sm text-gray-500 mt-6">
            Already have an account? <a routerLink="/login" class="text-blue-600 font-medium hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  form = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    const { fullName, email, password } = this.form.value;
    this.auth.register(fullName!, email!, password!).subscribe({
      next: () => this.auth.redirectAfterLogin(),
      error: (err) => { this.error = err.error?.message || 'Registration failed'; this.loading = false; },
    });
  }
}
