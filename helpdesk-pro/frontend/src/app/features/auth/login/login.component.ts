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

      <!-- ── Left: dark branding panel ── -->
      <div class="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
           style="background:linear-gradient(160deg,#070E1A 0%,#0D1B36 40%,#0F172A 100%)">

        <!-- Mesh grid -->
        <div class="absolute inset-0"
             style="background-image:linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px);background-size:48px 48px"></div>

        <!-- Glow orbs -->
        <div class="absolute" style="top:20%;left:15%;width:380px;height:380px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,0.22) 0%,transparent 70%);filter:blur(40px)"></div>
        <div class="absolute" style="bottom:15%;right:10%;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%);filter:blur(40px)"></div>

        <!-- Content -->
        <div class="relative z-10 flex flex-col h-full px-14 py-12">

          <!-- Logo -->
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center"
                 style="background:linear-gradient(135deg,#2563EB,#4F46E5);box-shadow:0 0 20px rgba(37,99,235,0.5)">
              <mat-icon class="text-white" style="font-size:20px;width:20px;height:20px">support_agent</mat-icon>
            </div>
            <span class="font-bold text-white text-lg" style="letter-spacing:-0.02em">HelpDesk Pro</span>
          </div>

          <!-- Main copy -->
          <div class="mt-auto mb-auto pt-20">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
                 style="background:rgba(37,99,235,0.2);border:1px solid rgba(37,99,235,0.35)">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span class="text-blue-300 text-xs font-semibold tracking-wide">Enterprise Support Platform</span>
            </div>

            <h1 class="text-5xl font-black text-white leading-tight mb-5"
                style="letter-spacing:-0.04em;line-height:1.1">
              Resolve issues<br>
              <span style="background:linear-gradient(90deg,#60A5FA,#818CF8);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">10x faster</span>
            </h1>
            <p class="text-slate-400 text-base leading-relaxed max-w-sm">
              Streamline your support workflow with intelligent ticket routing, real-time collaboration, and automated SLA tracking.
            </p>

            <!-- Stats row -->
            <div class="flex gap-5 mt-10">
              <div class="rounded-2xl px-5 py-4 flex-1" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)">
                <p class="text-2xl font-black text-white" style="letter-spacing:-0.04em">99.9%</p>
                <p class="text-slate-500 text-xs mt-0.5 font-medium">Uptime SLA</p>
              </div>
              <div class="rounded-2xl px-5 py-4 flex-1" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)">
                <p class="text-2xl font-black text-white" style="letter-spacing:-0.04em">&lt;2 min</p>
                <p class="text-slate-500 text-xs mt-0.5 font-medium">Avg Response</p>
              </div>
              <div class="rounded-2xl px-5 py-4 flex-1" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)">
                <p class="text-2xl font-black text-white" style="letter-spacing:-0.04em">10k+</p>
                <p class="text-slate-500 text-xs mt-0.5 font-medium">Tickets/mo</p>
              </div>
            </div>
          </div>

          <!-- Testimonial -->
          <div class="rounded-2xl p-5 mt-auto" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)">
            <div class="flex gap-0.5 mb-3">
              <mat-icon style="font-size:14px;width:14px;height:14px;color:#F59E0B">star</mat-icon>
              <mat-icon style="font-size:14px;width:14px;height:14px;color:#F59E0B">star</mat-icon>
              <mat-icon style="font-size:14px;width:14px;height:14px;color:#F59E0B">star</mat-icon>
              <mat-icon style="font-size:14px;width:14px;height:14px;color:#F59E0B">star</mat-icon>
              <mat-icon style="font-size:14px;width:14px;height:14px;color:#F59E0B">star</mat-icon>
            </div>
            <p class="text-slate-300 text-sm leading-relaxed">"HelpDesk Pro cut our response time by 60% in the first month. The SLA tracking alone is worth it."</p>
            <div class="flex items-center gap-3 mt-3">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                   style="background:linear-gradient(135deg,#2563EB,#7C3AED)">S</div>
              <div>
                <p class="text-white text-sm font-semibold">Sarah Chen</p>
                <p class="text-slate-500 text-xs">Head of Support, Acme Corp</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ── Right: form panel ── -->
      <div class="flex-1 flex items-center justify-center px-8 py-12" style="background:#F8FAFC">
        <div class="w-full max-w-[400px]">

          <!-- Mobile logo -->
          <div class="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                 style="background:linear-gradient(135deg,#2563EB,#4F46E5)">
              <mat-icon class="text-white">support_agent</mat-icon>
            </div>
            <span class="text-xl font-bold text-gray-900" style="letter-spacing:-0.03em">HelpDesk Pro</span>
          </div>

          <!-- Heading -->
          <div class="mb-8">
            <h2 class="text-3xl font-black text-gray-900 mb-2" style="letter-spacing:-0.04em">Welcome back</h2>
            <p class="text-slate-500 text-sm">Sign in to your account to continue</p>
          </div>

          <!-- Form card -->
          <div class="bg-white rounded-2xl border border-gray-200 p-8" style="box-shadow:0 1px 3px rgba(0,0,0,0.07),0 8px 24px rgba(0,0,0,0.04)">
            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                <mat-form-field class="w-full" appearance="outline">
                  <input matInput type="email" formControlName="email" autocomplete="email" placeholder="you&#64;company.com">
                  <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
                  <mat-error *ngIf="form.get('email')?.hasError('email')">Enter a valid email</mat-error>
                </mat-form-field>
              </div>

              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-sm font-semibold text-gray-700">Password</label>
                </div>
                <mat-form-field class="w-full" appearance="outline">
                  <input matInput [type]="showPassword ? 'text' : 'password'"
                         formControlName="password" autocomplete="current-password" placeholder="••••••••">
                  <button type="button" matSuffix mat-icon-button (click)="togglePassword()"
                          class="!text-slate-400 hover:!text-slate-600">
                    <mat-icon style="font-size:18px;width:18px;height:18px">
                      {{ showPassword ? 'visibility_off' : 'visibility' }}
                    </mat-icon>
                  </button>
                  <mat-error>Password is required</mat-error>
                </mat-form-field>
              </div>

              <!-- Error alert -->
              <div *ngIf="error"
                   class="flex items-center gap-3 p-3.5 rounded-xl"
                   style="background:#FEF2F2;border:1px solid #FECACA">
                <mat-icon class="shrink-0" style="font-size:16px;width:16px;height:16px;color:#EF4444">error_outline</mat-icon>
                <span class="text-sm font-medium" style="color:#B91C1C">{{ error }}</span>
              </div>

              <!-- Submit -->
              <button mat-raised-button color="primary" type="submit"
                      class="w-full !h-12 !text-sm !font-semibold !rounded-xl !mt-2"
                      [disabled]="loading || form.invalid">
                <mat-spinner *ngIf="loading" diameter="18" class="!inline-block !mr-2"
                             style="display:inline-block;vertical-align:middle"></mat-spinner>
                <span>{{ loading ? 'Signing in...' : 'Sign in' }}</span>
              </button>
            </form>
          </div>

          <!-- Footer link -->
          <p class="text-center text-sm text-gray-500 mt-6">
            Don't have an account?
            <a routerLink="/register" class="font-semibold" style="color:#2563EB">Create account →</a>
          </p>

          <!-- Demo credentials -->
          <div class="mt-6 rounded-xl p-4" style="background:#EFF6FF;border:1px solid #BFDBFE">
            <div class="flex items-center gap-2 mb-2">
              <mat-icon style="font-size:14px;width:14px;height:14px;color:#2563EB">info</mat-icon>
              <p class="text-xs font-bold" style="color:#1D4ED8">Demo credentials</p>
            </div>
            <div class="space-y-0.5">
              <p class="text-xs font-mono" style="color:#1E40AF">admin&#64;helpdesk.com / Admin&#64;123</p>
              <p class="text-xs font-mono" style="color:#1E40AF">agent&#64;helpdesk.com / Agent&#64;123</p>
            </div>
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
