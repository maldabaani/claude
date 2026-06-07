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
    <div class="min-h-screen flex">
      <!-- Left panel: branding -->
      <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#0F172A] flex-col items-center justify-center p-16 relative overflow-hidden">
        <!-- Decorative rings -->
        <div class="absolute inset-0 opacity-5">
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white"></div>
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white"></div>
          <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-white"></div>
        </div>
        <div class="relative text-center">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-600 mb-8 shadow-2xl shadow-blue-600/40">
            <mat-icon class="text-white" style="font-size:40px;width:40px;height:40px">support_agent</mat-icon>
          </div>
          <h1 class="font-heading text-4xl font-bold text-white mb-4">HelpDesk Pro</h1>
          <p class="text-slate-400 text-lg leading-relaxed max-w-xs">Streamline customer support with a modern, powerful helpdesk platform.</p>
          <div class="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <p class="text-2xl font-heading font-bold text-white">99%</p>
              <p class="text-xs text-slate-400 mt-1">Uptime SLA</p>
            </div>
            <div>
              <p class="text-2xl font-heading font-bold text-white">2min</p>
              <p class="text-xs text-slate-400 mt-1">Avg Response</p>
            </div>
            <div>
              <p class="text-2xl font-heading font-bold text-white">10k+</p>
              <p class="text-xs text-slate-400 mt-1">Tickets Resolved</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Right panel: form -->
      <div class="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div class="w-full max-w-sm">
          <!-- Mobile logo -->
          <div class="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <mat-icon class="text-white">support_agent</mat-icon>
            </div>
            <span class="font-heading text-xl font-bold text-gray-900">HelpDesk Pro</span>
          </div>

          <div class="mb-8">
            <h2 class="font-heading text-3xl font-bold text-gray-900">Welcome back</h2>
            <p class="text-gray-500 mt-2">Sign in to your account to continue</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Email address</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email">
              <mat-icon matPrefix class="text-slate-400 mr-1" style="font-size:18px">alternate_email</mat-icon>
              <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email format</mat-error>
            </mat-form-field>

            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPassword ? 'text' : 'password'" formControlName="password" autocomplete="current-password">
              <mat-icon matPrefix class="text-slate-400 mr-1" style="font-size:18px">lock_outline</mat-icon>
              <button type="button" matSuffix mat-icon-button (click)="showPassword = !showPassword" class="!text-slate-400">
                <mat-icon style="font-size:18px">{{ showPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error>Password is required</mat-error>
            </mat-form-field>

            <div *ngIf="error" class="flex items-center gap-2.5 p-3.5 bg-red-50 rounded-xl border border-red-200">
              <mat-icon class="text-red-500 shrink-0" style="font-size:18px">error_outline</mat-icon>
              <span class="text-red-700 text-sm font-medium">{{ error }}</span>
            </div>

            <button mat-raised-button color="primary" type="submit"
                    class="w-full !h-12 !text-base !font-semibold !rounded-xl !tracking-wide"
                    [disabled]="loading || form.invalid">
              <mat-spinner *ngIf="loading" diameter="18" class="inline-block mr-2 align-middle"></mat-spinner>
              <span>{{ loading ? 'Signing in...' : 'Sign in' }}</span>
            </button>
          </form>

          <p class="text-center text-sm text-gray-500 mt-6">
            Don't have an account?
            <a routerLink="/register" class="text-blue-600 font-semibold hover:text-blue-700">Create one</a>
          </p>

          <div class="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p class="text-xs font-semibold text-blue-700 mb-1">Demo credentials</p>
            <p class="text-xs text-blue-600 font-mono">admin&#64;helpdesk.com / Admin&#64;123</p>
          </div>
        </div>
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
