import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-shell">
      <div class="auth-left">
        <div class="auth-brand">
          <div class="brand-icon"><i class="pi pi-heart-fill"></i></div>
          <h1>Clinic SaaS</h1>
          <p>Modern clinic management for healthcare professionals</p>
        </div>
        <div class="auth-features">
          <div class="feature-item">
            <div class="feature-icon"><i class="pi pi-users"></i></div>
            <div>
              <strong>Patient Management</strong>
              <span>Complete patient records & history</span>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon"><i class="pi pi-calendar"></i></div>
            <div>
              <strong>Smart Scheduling</strong>
              <span>Appointments & visit tracking</span>
            </div>
          </div>
          <div class="feature-item">
            <div class="feature-icon"><i class="pi pi-chart-line"></i></div>
            <div>
              <strong>Billing & Analytics</strong>
              <span>Invoicing, payments & reports</span>
            </div>
          </div>
        </div>
      </div>
      <div class="auth-right">
        <div class="auth-card">
          <div class="auth-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to your clinic account</p>
          </div>
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    .auth-shell {
      min-height: 100vh;
      display: flex;
      font-family: 'Inter', sans-serif;
    }

    .auth-left {
      flex: 1;
      background: linear-gradient(145deg, #0f172a 0%, #1e3a5f 50%, #1a2c4e 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 3rem;
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: -30%;
        right: -20%;
        width: 500px;
        height: 500px;
        background: radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%);
        pointer-events: none;
      }
      &::after {
        content: '';
        position: absolute;
        bottom: -20%;
        left: -10%;
        width: 400px;
        height: 400px;
        background: radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%);
        pointer-events: none;
      }
    }

    .auth-brand {
      margin-bottom: 3rem;
      position: relative;
      z-index: 1;

      .brand-icon {
        width: 52px;
        height: 52px;
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 24px rgba(99,102,241,0.4);
        margin-bottom: 1.25rem;
        i { font-size: 1.4rem; color: #fff; }
      }

      h1 {
        font-size: 2rem;
        font-weight: 800;
        color: #fff;
        letter-spacing: -0.04em;
        margin-bottom: 0.5rem;
      }

      p {
        font-size: 1rem;
        color: rgba(255,255,255,0.5);
        font-weight: 400;
        line-height: 1.5;
      }
    }

    .auth-features {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      position: relative;
      z-index: 1;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 1rem;

      .feature-icon {
        width: 42px;
        height: 42px;
        background: rgba(255,255,255,0.08);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255,255,255,0.1);
        i { font-size: 1rem; color: #93c5fd; }
      }

      > div {
        display: flex;
        flex-direction: column;
        strong { font-size: 0.875rem; font-weight: 600; color: rgba(255,255,255,0.9); }
        span { font-size: 0.8rem; color: rgba(255,255,255,0.45); margin-top: 1px; }
      }
    }

    .auth-right {
      width: 480px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8fafc;
      padding: 2rem;
    }

    .auth-card {
      background: #fff;
      border-radius: 20px;
      padding: 2.5rem;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.05);
      border: 1px solid #f1f5f9;
    }

    .auth-card-header {
      margin-bottom: 2rem;
      h2 { font-size: 1.5rem; font-weight: 700; color: #0f172a; letter-spacing: -0.03em; margin: 0; }
      p { font-size: 0.875rem; color: #64748b; margin: 0.375rem 0 0; }
    }

    @media (max-width: 768px) {
      .auth-left { display: none; }
      .auth-right { width: 100%; background: #fff; }
    }
  `]
})
export class AuthLayoutComponent {}
