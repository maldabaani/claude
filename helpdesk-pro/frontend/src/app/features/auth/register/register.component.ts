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

      <!-- ── Left: branding panel ── -->
      <div class="hidden lg:flex lg:w-[52%] flex-col relative overflow-hidden"
           style="background:linear-gradient(160deg,#070E1A 0%,#0D1B36 40%,#0F172A 100%)">

        <!-- Mesh grid -->
        <div class="absolute inset-0"
             style="background-image:linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px);background-size:48px 48px"></div>

        <!-- Glow orbs -->
        <div class="absolute" style="top:15%;right:20%;width:320px;height:320px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.2) 0%,transparent 70%);filter:blur(40px)"></div>
        <div class="absolute" style="bottom:20%;left:10%;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,0.18) 0%,transparent 70%);filter:blur(40px)"></div>

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
          <div class="mt-auto mb-auto pt-16">
            <h1 class="text-4xl font-black text-white leading-tight mb-4" style="letter-spacing:-0.04em">
              Join thousands of<br>
              <span style="background:linear-gradient(90deg,#818CF8,#60A5FA);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">support teams</span>
            </h1>
            <p class="text-slate-400 text-base leading-relaxed max-w-sm mb-10">
              Get started in minutes. No credit card required. Cancel anytime.
            </p>

            <!-- Feature list -->
            <div class="space-y-4">
              <div *ngFor="let f of features" class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                     style="background:rgba(37,99,235,0.2);border:1px solid rgba(37,99,235,0.3)">
                  <mat-icon class="text-blue-400" style="font-size:15px;width:15px;height:15px">check</mat-icon>
                </div>
                <p class="text-slate-300 text-sm">{{ f }}</p>
              </div>
            </div>
          </div>

          <!-- Bottom badge -->
          <div class="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08)">
            <div class="flex -space-x-1.5">
              <div class="w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold" style="background:#2563EB">A</div>
              <div class="w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold" style="background:#7C3AED">M</div>
              <div class="w-7 h-7 rounded-full border-2 border-slate-900 flex items-center justify-center text-white text-xs font-bold" style="background:#059669">J</div>
            </div>
            <p class="text-slate-400 text-xs">Join <span class="text-white font-semibold">2,400+</span> teams already using HelpDesk Pro</p>
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
            <h2 class="text-3xl font-black text-gray-900 mb-2" style="letter-spacing:-0.04em">Create your account</h2>
            <p class="text-slate-500 text-sm">Start delivering exceptional support today</p>
          </div>

          <!-- Form card -->
          <div class="bg-white rounded-2xl border border-gray-200 p-8" style="box-shadow:0 1px 3px rgba(0,0,0,0.07),0 8px 24px rgba(0,0,0,0.04)">
            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
                <mat-form-field class="w-full" appearance="outline">
                  <input matInput formControlName="fullName" autocomplete="name" placeholder="John Smith">
                  <mat-error>Full name is required</mat-error>
                </mat-form-field>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                <mat-form-field class="w-full" appearance="outline">
                  <input matInput type="email" formControlName="email" autocomplete="email" placeholder="you&#64;company.com">
                  <mat-error *ngIf="form.get('email')?.hasError('required')">Email is required</mat-error>
                  <mat-error *ngIf="form.get('email')?.hasError('email')">Enter a valid email</mat-error>
                </mat-form-field>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <mat-form-field class="w-full" appearance="outline">
                  <input matInput type="password" formControlName="password" autocomplete="new-password" placeholder="Min. 8 characters">
                  <mat-hint>At least 8 characters</mat-hint>
                  <mat-error>Password must be at least 8 characters</mat-error>
                </mat-form-field>
              </div>

              <!-- Error alert -->
              <div *ngIf="error"
                   class="flex items-center gap-3 p-3.5 rounded-xl"
                   style="background:#FEF2F2;border:1px solid #FECACA">
                <mat-icon class="shrink-0" style="font-size:16px;width:16px;height:16px;color:#EF4444">error_outline</mat-icon>
                <span class="text-sm font-medium" style="color:#B91C1C">{{ error }}</span>
              </div>

              <button mat-raised-button color="primary" type="submit"
                      class="w-full !h-12 !text-sm !font-semibold !rounded-xl !mt-2"
                      [disabled]="loading || form.invalid">
                {{ loading ? 'Creating account...' : 'Create free account' }}
              </button>
            </form>
          </div>

          <!-- Footer -->
          <p class="text-center text-sm text-gray-500 mt-6">
            Already have an account?
            <a routerLink="/login" class="font-semibold" style="color:#2563EB">Sign in →</a>
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

  features = [
    'Real-time ticket tracking & notifications',
    'Smart auto-assignment & routing',
    'SLA monitoring and breach alerts',
    'Team collaboration & internal notes',
    'Detailed analytics & reporting',
  ];

  constructor(private fb: FormBuilder, private auth: AuthService) {}

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    const { fullName, email, password } = this.form.value;
    this.auth.register(fullName!, email!, password!).subscribe({
      next: () => this.auth.redirectAfterLogin(),
      error: (err) => { this.error = err.error?.message || 'Registration failed. Please try again.'; this.loading = false; },
    });
  }
}
