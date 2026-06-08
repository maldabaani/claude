import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, Validators, FormGroup } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/auth/auth.service';
import { User } from '../../core/models';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../../core/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, ButtonModule, InputTextModule, PasswordModule],
  template: `
    <div class="max-w-xl mx-auto py-8 space-y-6">

      <!-- Header -->
      <div>
        <h1 class="text-2xl font-black text-gray-900" style="letter-spacing:-0.03em">My Profile</h1>
        <p class="text-sm text-slate-400 mt-0.5">Update your name and password</p>
      </div>

      <!-- Avatar -->
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
             style="background:linear-gradient(135deg,#6366F1,#4F46E5)">
          {{ initials() }}
        </div>
        <div>
          <p class="font-bold text-gray-900">{{ user()?.fullName }}</p>
          <p class="text-sm text-slate-400">{{ user()?.email }}</p>
          <span class="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold"
                style="background:#EFF6FF;color:#1D4ED8">{{ user()?.role }}</span>
        </div>
      </div>

      <!-- Form -->
      <div class="bg-white rounded-2xl border border-gray-100 p-6 space-y-5"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <h3 class="font-bold text-gray-900 text-sm">Profile Information</h3>

        <div>
          <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
          <input pInputText [formControl]="fullNameControl" class="w-full" placeholder="Your full name" />
        </div>

        <div style="border-top:1px solid #F1F5F9;padding-top:20px">
          <h3 class="font-bold text-gray-900 text-sm mb-4">Change Password</h3>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Password</label>
              <p-password [formControl]="currentPasswordControl" class="w-full" [feedback]="false" [toggleMask]="true" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
              <p-password [formControl]="newPasswordControl" class="w-full" [feedback]="true" [toggleMask]="true" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm New Password</label>
              <p-password [formControl]="confirmPasswordControl" class="w-full" [feedback]="false" [toggleMask]="true" />
              <p *ngIf="passwordMismatch()" class="text-xs text-red-500 mt-1">Passwords do not match</p>
            </div>
          </div>
        </div>

        <!-- Messages -->
        <div *ngIf="successMessage()"
             class="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
             style="background:#F0FDF4;border:1px solid #BBF7D0;color:#166534">
          <i class="pi pi-check-circle" style="font-size:16px"></i>
          {{ successMessage() }}
        </div>
        <div *ngIf="errorMessage()"
             class="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
             style="background:#FEF2F2;border:1px solid #FECACA;color:#991B1B">
          <i class="pi pi-exclamation-circle" style="font-size:16px"></i>
          {{ errorMessage() }}
        </div>

        <div class="flex justify-end">
          <button (click)="save()"
                  [disabled]="saving() || passwordMismatch()"
                  class="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style="background:linear-gradient(135deg,#2563EB,#1D4ED8);box-shadow:0 2px 8px rgba(37,99,235,0.3)">
            <i class="pi pi-save" style="font-size:16px"></i>
            {{ saving() ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>

      <!-- 2FA Section -->
      <div class="bg-white rounded-2xl border border-gray-100 p-6 space-y-5"
           style="box-shadow:0 2px 8px rgba(0,0,0,0.06)">
        <div class="flex items-center justify-between">
          <h3 class="font-bold text-gray-900 text-sm">Two-Factor Authentication</h3>
          <span *ngIf="twoFaEnabled()"
                class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                style="background:#F0FDF4;color:#166534;border:1px solid #BBF7D0">
            <i class="pi pi-check-circle" style="font-size:12px"></i>
            2FA Active
          </span>
        </div>
        <p class="text-sm text-slate-500">Protect your account with a time-based one-time password (TOTP) authenticator app.</p>

        <!-- Not enabled -->
        <div *ngIf="!twoFaEnabled() && !setupSecret()">
          <button (click)="setup2FA()"
                  class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
            <i class="pi pi-shield" style="font-size:15px"></i>
            Enable Two-Factor Authentication
          </button>
        </div>

        <!-- Setup flow -->
        <div *ngIf="setupSecret() && !twoFaEnabled()" class="space-y-4">
          <div class="p-4 rounded-xl" style="background:#F8FAFC;border:1px solid #E2E8F0">
            <p class="text-xs font-bold text-slate-500 mb-2">Step 1: Scan QR or enter secret key</p>
            <div class="flex items-start gap-4">
              <div class="text-xs font-mono bg-white border border-gray-200 rounded-lg px-3 py-2 break-all select-all"
                   style="max-width:280px">{{ setupSecret() }}</div>
            </div>
            <p class="text-xs text-slate-400 mt-2">Copy this key into your authenticator app (Google Authenticator, Authy, etc.)</p>
            <p class="text-xs text-slate-400 mt-1 break-all">Or use the otpauth URL: <span class="font-mono text-blue-600">{{ setupQrUrl() }}</span></p>
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Step 2: Enter verification code</label>
            <div class="flex gap-2">
              <input pInputText [(ngModel)]="twoFaCode" placeholder="6-digit code" class="w-40 text-center tracking-widest font-mono" maxlength="6" />
              <button (click)="enable2FA()" [disabled]="twoFaCode.length < 6 || twoFaSaving()"
                      class="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                      style="background:#2563EB">
                {{ twoFaSaving() ? 'Activating...' : 'Activate' }}
              </button>
              <button (click)="cancelSetup()"
                      class="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
          <div *ngIf="twoFaError()" class="text-xs text-red-500 font-medium">{{ twoFaError() }}</div>
        </div>

        <!-- Enabled, show disable -->
        <div *ngIf="twoFaEnabled()" class="space-y-3">
          <div class="text-xs text-slate-500">To disable 2FA, enter your current authenticator code.</div>
          <div class="flex gap-2">
            <input pInputText [(ngModel)]="twoFaCode" placeholder="6-digit code" class="w-40 text-center tracking-widest font-mono" maxlength="6" />
            <button (click)="disable2FA()" [disabled]="twoFaCode.length < 6 || twoFaSaving()"
                    class="px-4 py-2 rounded-xl text-sm font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
              {{ twoFaSaving() ? 'Disabling...' : 'Disable 2FA' }}
            </button>
          </div>
          <div *ngIf="twoFaError()" class="text-xs text-red-500 font-medium">{{ twoFaError() }}</div>
        </div>
      </div>
    </div>
  `,
})
export class ProfileComponent implements OnInit {
  user = signal<User | null>(null);
  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  fullNameControl = new FormControl('');
  currentPasswordControl = new FormControl('');
  newPasswordControl = new FormControl('');
  confirmPasswordControl = new FormControl('');

  // 2FA state
  twoFaEnabled = signal(false);
  setupSecret = signal('');
  setupQrUrl = signal('');
  twoFaCode = '';
  twoFaSaving = signal(false);
  twoFaError = signal('');

  constructor(private userService: UserService, public auth: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.userService.getMe().subscribe(u => {
      this.user.set(u);
      this.fullNameControl.setValue(u.fullName);
    });
    this.loadTwoFaStatus();
  }

  loadTwoFaStatus() {
    this.http.get<ApiResponse<{totpEnabled: boolean}>>(`${environment.apiUrl}/users/me/2fa-status`).pipe(
      map(r => r.data)
    ).subscribe({
      next: data => this.twoFaEnabled.set(data?.totpEnabled ?? false),
      error: () => {}
    });
  }

  initials(): string {
    const name = this.user()?.fullName || this.user()?.email || '?';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  passwordMismatch(): boolean {
    const np = this.newPasswordControl.value;
    const cp = this.confirmPasswordControl.value;
    if (!np && !cp) return false;
    return np !== cp;
  }

  setup2FA() {
    this.http.post<ApiResponse<{secret: string; qrUrl: string}>>(`${environment.apiUrl}/auth/2fa/setup`, {}).pipe(
      map(r => r.data)
    ).subscribe(data => {
      this.setupSecret.set(data.secret);
      this.setupQrUrl.set(data.qrUrl);
      this.twoFaCode = '';
      this.twoFaError.set('');
    });
  }

  cancelSetup() {
    this.setupSecret.set('');
    this.setupQrUrl.set('');
    this.twoFaCode = '';
    this.twoFaError.set('');
  }

  enable2FA() {
    this.twoFaSaving.set(true);
    this.twoFaError.set('');
    this.http.post<ApiResponse<void>>(`${environment.apiUrl}/auth/2fa/enable`, { code: this.twoFaCode }).subscribe({
      next: () => {
        this.twoFaSaving.set(false);
        this.twoFaEnabled.set(true);
        this.setupSecret.set('');
        this.setupQrUrl.set('');
        this.twoFaCode = '';
      },
      error: err => {
        this.twoFaSaving.set(false);
        this.twoFaError.set(err?.error?.message || 'Invalid code. Try again.');
      }
    });
  }

  disable2FA() {
    this.twoFaSaving.set(true);
    this.twoFaError.set('');
    this.http.post<ApiResponse<void>>(`${environment.apiUrl}/auth/2fa/disable`, { code: this.twoFaCode }).subscribe({
      next: () => {
        this.twoFaSaving.set(false);
        this.twoFaEnabled.set(false);
        this.twoFaCode = '';
      },
      error: err => {
        this.twoFaSaving.set(false);
        this.twoFaError.set(err?.error?.message || 'Invalid code. Try again.');
      }
    });
  }

  save() {
    if (this.passwordMismatch()) return;
    this.saving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const payload: any = {};
    if (this.fullNameControl.value) payload.fullName = this.fullNameControl.value;
    if (this.newPasswordControl.value) {
      payload.currentPassword = this.currentPasswordControl.value;
      payload.newPassword = this.newPasswordControl.value;
    }

    this.userService.updateProfile(payload).subscribe({
      next: u => {
        this.user.set(u);
        this.saving.set(false);
        this.successMessage.set('Profile updated successfully!');
        this.currentPasswordControl.reset();
        this.newPasswordControl.reset();
        this.confirmPasswordControl.reset();
        setTimeout(() => this.successMessage.set(''), 3000);
      },
      error: err => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.message || 'Failed to update profile. Please try again.');
      }
    });
  }
}
