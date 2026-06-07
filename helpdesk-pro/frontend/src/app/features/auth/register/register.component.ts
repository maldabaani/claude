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
    <div class="min-h-screen flex">
      <!-- Left panel: branding -->
      <div class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#0F172A] flex-col items-center justify-center p-16 relative overflow-hidden">
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
          <p class="text-slate-400 text-lg leading-relaxed max-w-xs">Join thousands of teams delivering exceptional customer support.</p>
          <div class="mt-12 space-y-4">
            <div class="flex items-center gap-3 text-left">
              <div class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                <mat-icon class="text-blue-400" style="font-size:18px">check</mat-icon>
              </div>
              <p class="text-slate-300 text-sm">Real-time ticket tracking</p>
            </div>
            <div class="flex items-center gap-3 text-left">
              <div class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                <mat-icon class="text-blue-400" style="font-size:18px">check</mat-icon>
              </div>
              <p class="text-slate-300 text-sm">Email & in-app notifications</p>
            </div>
            <div class="flex items-center gap-3 text-left">
              <div class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                <mat-icon class="text-blue-400" style="font-size:18px">check</mat-icon>
              </div>
              <p class="text-slate-300 text-sm">SLA compliance monitoring</p>
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
            <h2 class="font-heading text-3xl font-bold text-gray-900">Create account</h2>
            <p class="text-gray-500 mt-2">Start getting support in minutes</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Full name</mat-label>
              <input matInput formControlName="fullName" autocomplete="name">
              <mat-error>Full name is required</mat-error>
            </mat-form-field>

            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Email address</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email">
              <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email format</mat-error>
            </mat-form-field>

            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password" autocomplete="new-password">
              <mat-hint>At least 8 characters</mat-hint>
              <mat-error>Password must be at least 8 characters</mat-error>
            </mat-form-field>

            <div *ngIf="error" class="flex items-center gap-2.5 p-3.5 bg-red-50 rounded-xl border border-red-200">
              <mat-icon class="text-red-500 shrink-0" style="font-size:18px">error_outline</mat-icon>
              <span class="text-red-700 text-sm font-medium">{{ error }}</span>
            </div>

            <button mat-raised-button color="primary" type="submit"
                    class="w-full !h-12 !text-base !font-semibold !rounded-xl !tracking-wide" [disabled]="loading || form.invalid">
              {{ loading ? 'Creating account...' : 'Create account' }}
            </button>
          </form>

          <p class="text-center text-sm text-gray-500 mt-6">
            Already have an account?
            <a routerLink="/login" class="text-blue-600 font-semibold hover:text-blue-700">Sign in</a>
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
