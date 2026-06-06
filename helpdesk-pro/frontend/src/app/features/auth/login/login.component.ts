import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
    MatButtonModule, MatInputModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
      <div class="w-full max-w-md">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg shadow-blue-500/30">
            <mat-icon class="text-white text-3xl">support_agent</mat-icon>
          </div>
          <h1 class="font-heading text-3xl font-bold text-white">HelpDesk Pro</h1>
          <p class="text-slate-400 mt-1">Sign in to your account</p>
        </div>

        <!-- Card -->
        <div class="bg-white rounded-2xl shadow-2xl p-8">
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
            <div>
              <mat-form-field class="w-full" appearance="outline">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" autocomplete="email">
                <mat-icon matPrefix class="text-gray-400 mr-2">email</mat-icon>
                <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
                <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email format</mat-error>
              </mat-form-field>
            </div>

            <div>
              <mat-form-field class="w-full" appearance="outline">
                <mat-label>Password</mat-label>
                <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="password" autocomplete="current-password">
                <mat-icon matPrefix class="text-gray-400 mr-2">lock</mat-icon>
                <button type="button" matSuffix mat-icon-button (click)="showPassword = !showPassword">
                  <mat-icon>{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                <mat-error>Password is required</mat-error>
              </mat-form-field>
            </div>

            <div *ngIf="error" class="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <mat-icon class="text-red-500 text-sm">error</mat-icon>
              <span class="text-red-700 text-sm">{{ error }}</span>
            </div>

            <button mat-raised-button color="primary" type="submit"
                    class="w-full !h-12 !text-base !font-semibold !rounded-xl"
                    [disabled]="loading || form.invalid">
              <mat-spinner *ngIf="loading" diameter="20" class="mr-2"></mat-spinner>
              {{ loading ? 'Signing in...' : 'Sign in' }}
            </button>
          </form>

          <p class="text-center text-sm text-gray-500 mt-6">
            Don't have an account?
            <a routerLink="/register" class="text-blue-600 font-medium hover:underline">Register</a>
          </p>
        </div>

        <p class="text-center text-slate-500 text-xs mt-6">Demo: admin@helpdesk.com / Admin@123</p>
      </div>
    </div>
  `,
})
export class LoginComponent {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });
  loading = false;
  error = '';
  showPassword = false;

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => this.auth.redirectAfterLogin(),
      error: () => { this.error = 'Invalid email or password'; this.loading = false; },
    });
  }
}
