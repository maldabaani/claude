import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { PlatformService } from '../../../core/services/platform.service';

@Component({
  selector: 'app-tenant-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink,
            InputTextModule, PasswordModule, ButtonModule, CardModule, MessageModule, ToastModule],
  providers: [MessageService],
  templateUrl: './tenant-create.component.html'
})
export class TenantCreateComponent {
  form: FormGroup;
  loading = signal(false);
  errorMsg = signal('');

  constructor(
    private fb: FormBuilder,
    private svc: PlatformService,
    private router: Router,
    private msg: MessageService
  ) {
    this.form = this.fb.group({
      name:          ['', [Validators.required, Validators.minLength(2)]],
      dbName:        ['', [Validators.required, Validators.pattern('^[a-z0-9_]{3,50}$')]],
      adminEmail:    ['', [Validators.required, Validators.email]],
      adminPassword: ['', [Validators.required, Validators.minLength(8)]]
    });

    // auto-generate dbName from clinic name
    this.form.get('name')!.valueChanges.subscribe((v: string) => {
      if (!this.form.get('dbName')!.dirty) {
        const slug = v.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 50);
        this.form.get('dbName')!.setValue(slug, { emitEvent: false });
      }
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.errorMsg.set('');
    this.svc.createTenant(this.form.value).subscribe({
      next: () => {
        this.msg.add({ severity: 'success', summary: 'Clinic onboarded successfully!' });
        setTimeout(() => this.router.navigate(['/dashboard/platform/tenants']), 1000);
      },
      error: err => {
        this.errorMsg.set(err.error?.detail ?? 'Failed to create clinic. Please try again.');
        this.loading.set(false);
      }
    });
  }
}
