import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    InputTextModule, PasswordModule, ButtonModule, MessageModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      tenantId: ['']
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading  = true;
    this.errorMsg = '';

    const { email, password, tenantId } = this.form.value;
    const req$ = tenantId
      ? this.auth.loginTenant({ email, password, tenantId })
      : this.auth.loginPlatform({ email, password });

    req$.subscribe({
      next: () => this.router.navigate(['/dashboard/home']),
      error: err => {
        this.errorMsg = err.error?.detail ?? 'Login failed. Please try again.';
        this.loading  = false;
      }
    });
  }
}
