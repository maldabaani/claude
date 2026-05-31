import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-shell">
      <div class="auth-card">
        <div class="auth-logo">
          <i class="pi pi-heart-fill" style="font-size:2rem;color:var(--primary-color)"></i>
          <h1>Clinic SaaS</h1>
        </div>
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .auth-shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-ground);
    }
    .auth-card {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 2.5rem;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    }
    .auth-logo {
      text-align: center;
      margin-bottom: 2rem;
      h1 { font-size: 1.5rem; margin-top: 0.5rem; color: var(--primary-color); }
    }
  `]
})
export class AuthLayoutComponent {}
