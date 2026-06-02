import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-shell">

      <!-- Left panel -->
      <div class="auth-left">
        <div class="glow glow-1"></div>
        <div class="glow glow-2"></div>
        <div class="glow glow-3"></div>

        <div class="left-content">
          <div class="brand">
            <div class="brand-icon"><i class="pi pi-heart-fill"></i></div>
            <div class="brand-text">
              <span class="brand-name">Clinic SaaS</span>
              <span class="brand-tag">Healthcare Platform</span>
            </div>
          </div>

          <div class="hero-copy">
            <h1>Modern clinic<br/>management,<br/><span class="accent">simplified.</span></h1>
            <p>Everything your clinic needs — patients, scheduling, billing, and analytics — in one secure platform.</p>
          </div>

          <div class="feature-list">
            <div class="feat">
              <div class="feat-dot"></div>
              <span>Complete patient records &amp; visit history</span>
            </div>
            <div class="feat">
              <div class="feat-dot"></div>
              <span>Smart appointment scheduling</span>
            </div>
            <div class="feat">
              <div class="feat-dot"></div>
              <span>Lab, radiology &amp; prescription management</span>
            </div>
            <div class="feat">
              <div class="feat-dot"></div>
              <span>Invoicing, payments &amp; insurance claims</span>
            </div>
          </div>

          <div class="stats-row">
            <div class="stat-card">
              <span class="stat-val">500+</span>
              <span class="stat-lbl">Clinics</span>
            </div>
            <div class="stat-card">
              <span class="stat-val">99.9%</span>
              <span class="stat-lbl">Uptime</span>
            </div>
            <div class="stat-card">
              <span class="stat-val">HIPAA</span>
              <span class="stat-lbl">Compliant</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right panel: centered form -->
      <div class="auth-right">
        <div class="form-wrapper">

          <div class="form-logo">
            <div class="logo-icon"><i class="pi pi-heart-fill"></i></div>
          </div>

          <div class="form-header">
            <h2>Welcome back</h2>
            <p>Sign in to your clinic account</p>
          </div>

          <router-outlet />

          <div class="form-footer">
            <span>Protected by 256-bit encryption</span>
            <i class="pi pi-lock"></i>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    .auth-shell {
      min-height: 100vh;
      display: flex;
      font-family: 'Inter', sans-serif;
    }

    /* ── LEFT PANEL ────────────────────────────────────────────── */
    .auth-left {
      flex: 1.1;
      background: linear-gradient(155deg, #080f1f 0%, #0d1f3c 40%, #112240 70%, #0a1628 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      position: relative;
      overflow: hidden;
    }

    .glow {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      pointer-events: none;
      opacity: 0.55;
    }
    .glow-1 {
      width: 420px; height: 420px;
      background: radial-gradient(circle, rgba(59,130,246,0.35) 0%, transparent 70%);
      top: -10%; right: -5%;
    }
    .glow-2 {
      width: 320px; height: 320px;
      background: radial-gradient(circle, rgba(99,102,241,0.28) 0%, transparent 70%);
      bottom: 5%; left: -8%;
    }
    .glow-3 {
      width: 200px; height: 200px;
      background: radial-gradient(circle, rgba(56,189,248,0.2) 0%, transparent 70%);
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
    }

    .left-content {
      position: relative;
      z-index: 1;
      max-width: 460px;
      width: 100%;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      margin-bottom: 3rem;

      .brand-icon {
        width: 44px; height: 44px;
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 6px 20px rgba(99,102,241,0.45);
        i { font-size: 1.2rem; color: #fff; }
      }

      .brand-text {
        display: flex; flex-direction: column;
        .brand-name { font-size: 1.125rem; font-weight: 700; color: #fff; letter-spacing: -0.02em; line-height: 1.2; }
        .brand-tag  { font-size: 0.7rem; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px; }
      }
    }

    .hero-copy {
      margin-bottom: 2.5rem;

      h1 {
        font-size: clamp(1.875rem, 3.5vw, 2.625rem);
        font-weight: 800;
        color: #fff;
        letter-spacing: -0.04em;
        line-height: 1.15;
        margin: 0 0 1rem;

        .accent {
          background: linear-gradient(90deg, #60a5fa, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }

      p {
        font-size: 0.9375rem;
        color: rgba(255,255,255,0.45);
        line-height: 1.65;
        max-width: 380px;
      }
    }

    .feature-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 2.75rem;

      .feat {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .feat-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: linear-gradient(135deg, #60a5fa, #818cf8);
          flex-shrink: 0;
        }

        span {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.58);
          font-weight: 400;
        }
      }
    }

    .stats-row {
      display: flex;
      gap: 0.875rem;

      .stat-card {
        flex: 1;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 14px;
        padding: 1rem 0.875rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        backdrop-filter: blur(12px);
        gap: 0.25rem;

        .stat-val {
          font-size: 1.125rem;
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.02em;
        }
        .stat-lbl {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.38);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
      }
    }

    /* ── RIGHT PANEL ───────────────────────────────────────────── */
    .auth-right {
      width: 500px;
      background: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, #f8faff 0%, #ffffff 100%);
      }
    }

    .form-wrapper {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 380px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .form-logo {
      margin-bottom: 1.75rem;

      .logo-icon {
        width: 56px; height: 56px;
        background: linear-gradient(135deg, #3b82f6, #6366f1);
        border-radius: 16px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 8px 24px rgba(99,102,241,0.3);
        i { font-size: 1.5rem; color: #fff; }
      }
    }

    .form-header {
      text-align: center;
      margin-bottom: 2.25rem;
      width: 100%;

      h2 {
        font-size: 1.75rem;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.04em;
        margin: 0 0 0.375rem;
      }

      p {
        font-size: 0.9rem;
        color: #64748b;
        margin: 0;
        font-weight: 400;
      }
    }

    /* inject full width into router-outlet child */
    :host ::ng-deep .login-form {
      width: 100%;
    }

    .form-footer {
      margin-top: 2rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      color: #94a3b8;
      font-size: 0.75rem;

      i { font-size: 0.75rem; }
    }

    /* ── RESPONSIVE ────────────────────────────────────────────── */
    @media (max-width: 900px) {
      .auth-left { display: none; }
      .auth-right { width: 100%; }
    }

    @media (max-width: 480px) {
      .auth-right { padding: 1.5rem; background: #f8fafc; }
      .form-wrapper {
        background: #fff;
        border-radius: 24px;
        padding: 2rem 1.5rem;
        box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      }
    }
  `]
})
export class AuthLayoutComponent {}
