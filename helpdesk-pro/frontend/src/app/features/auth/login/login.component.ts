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

      <!-- ── Left panel: branding ── -->
      <div class="hidden lg:flex lg:w-[52%] flex-col items-center justify-center relative overflow-hidden"
           style="background:linear-gradient(145deg,#0F172A 0%,#1E2D4F 50%,#0F172A 100%)">

        <!-- Background grid pattern -->
        <div class="absolute inset-0 opacity-[0.04]"
             style="background-image:linear-gradient(#ffffff 1px,transparent 1px),linear-gradient(90deg,#ffffff 1px,transparent 1px);background-size:40px 40px"></div>

        <!-- Gradient orbs -->
        <div class="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style="background:radial-gradient(circle,#2563EB,transparent 70%)"></div>
        <div class="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl"
             style="background:radial-gradient(circle,#6366F1,transparent 70%)"></div>

        <div class="relative z-10 px-16 text-center max-w-lg">
          <!-- Logo -->
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-8 shadow-2xl"
               style="background:linear-gradient(135deg,#2563EB,#4F46E5);box-shadow:0 0 40px rgb(37 99 235/0.4)">
            <mat-icon class="text-white" style="font-size:32px;width:32px;height:32px">support_agent</mat-icon>
          </div>

          <h1 class="text-4xl font-bold text-white mb-3" style="letter-spacing:-0.03em">HelpDesk Pro</h1>
          <p class="text-slate-400 text-lg leading-relaxed">
            Your all-in-one platform for delivering exceptional customer support experiences.
          </p>

          <!-- Stats row -->
          <div class="mt-12 grid grid-cols-3 gap-4">
            <div class="rounded-2xl p-4" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08)">
              <p class="text-2xl font-bold text-white" style="letter-spacing:-0.03em">99.9%</p>
              <p class="text-xs text-slate-400 mt-1 font-medium">Uptime SLA</p>
            </div>
            <div class="rounded-2xl p-4" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08)">
              <p class="text-2xl font-bold text-white" style="letter-spacing:-0.03em">&lt;2min</p>
              <p class="text-xs text-slate-400 mt-1 font-medium">Avg Response</p>
            </div>
            <div class="rounded-2xl p-4" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08)">
              <p class="text-2xl font-bold text-white" style="letter-spacing:-0.03em">10k+</p>
              <p class="text-xs text-slate-400 mt-1 font-medium">Tickets Solved</p>
            </div>
          </div>

          <!-- Testimonial -->
          <div class="mt-10 rounded-2xl p-5 text-left"
               style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)">
            <p class="text-slate-300 text-sm leading-relaxed italic">"HelpDesk Pro transformed how we handle customer issues. Response times dropped by 60% in the first month."</p>
            <div class="flex items-center gap-3 mt-4">
              <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">S</div>
              <div>
                <p class="text-white text-sm font-semibold">Sarah Chen</p>
                <p class="text-slate-500 text-xs">Head of Support, Acme Corp</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Right panel: form ── -->
      <div class="flex-1 flex items-center justify-center px-6 py-12" style="background:#F8FAFC">
        <div class="w-full max-w-[400px]">

          <!-- Mobile logo -->
          <div class="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                 style="background:linear-gradient(135deg,#2563EB,#4F46E5)">
              <mat-icon class="text-white" style="font-size:20px;width:20px;height:20px">support_agent</mat-icon>
            </div>
            <span class="text-xl font-bold text-gray-900" style="letter-spacing:-0.03em">HelpDesk Pro</span>
          </div>

          <!-- Heading -->
          <div class="mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-2" style="letter-spacing:-0.03em">Welcome back</h2>
            <p class="text-gray-500 text-sm">Sign in to your account to continue</p>
          </div>

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">

            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Email address</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email">
              <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="form.get('email')?.hasError('email')">Invalid email format</mat-error>
            </mat-form-field>

            <mat-form-field class="w-full" appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPassword ? 'text' : 'password'"
                     formControlName="password" autocomplete="current-password">
              <button type="button" matSuffix mat-icon-button (click)="togglePassword()"
                      class="!text-slate-400 hover:!text-slate-600">
                <mat-icon style="font-size:18px;width:18px;height:18px">
                  {{ showPassword ? 'visibility_off' : 'visibility' }}
                </mat-icon>
              </button>
              <mat-error>Password is required</mat-error>
            </mat-form-field>

            <!-- Error alert -->
            <div *ngIf="error"
                 class="flex items-center gap-3 p-4 rounded-xl border"
                 style="background:#FEF2F2;border-color:#FECACA">
              <mat-icon class="shrink-0" style="font-size:18px;width:18px;height:18px;color:#EF4444">error_outline</mat-icon>
              <span class="text-sm font-medium" style="color:#B91C1C">{{ error }}</span>
            </div>

            <!-- Submit -->
            <button mat-raised-button color="primary" type="submit"
                    class="w-full !h-12 !text-sm !font-semibold !rounded-xl"
                    [disabled]="loading || form.invalid">
              <mat-spinner *ngIf="loading" diameter="18" class="inline-block mr-2 align-middle"
                           style="display:inline-block"></mat-spinner>
              <span>{{ loading ? 'Signing in...' : 'Sign in' }}</span>
            </button>
          </form>

          <!-- Footer link -->
          <p class="text-center text-sm text-gray-500 mt-6">
            Don't have an account?
            <a routerLink="/register" class="font-semibold hover:underline" style="color:#2563EB">Create account</a>
          </p>

          <!-- Demo credentials -->
          <div class="mt-8 rounded-xl p-4" style="background:#EFF6FF;border:1px solid #BFDBFE">
            <div class="flex items-center gap-2 mb-2">
              <mat-icon style="font-size:14px;width:14px;height:14px;color:#2563EB">info</mat-icon>
              <p class="text-xs font-bold" style="color:#1D4ED8">Demo credentials</p>
            </div>
            <p class="text-xs font-mono" style="color:#2563EB">admin&#64;helpdesk.com / Admin&#64;123</p>
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

  togglePassword() { this.showPassword = !this.showPassword; }

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, password } = this.form.value;
    this.auth.login(email!, password!).subscribe({
      next: () => this.auth.redirectAfterLogin(),
      error: () => { this.error = 'Invalid email or password. Please try again.'; this.loading = false; },
    });
  }
}
