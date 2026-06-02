import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="auth-shell">

      <!-- Left panel: dramatic dark purple with landscape feel -->
      <div class="auth-left">
        <div class="left-overlay"></div>

        <!-- top bar -->
        <div class="left-topbar">
          <div class="brand">
            <div class="brand-icon"><i class="pi pi-heart-fill"></i></div>
            <span class="brand-name">Clinic SaaS</span>
          </div>
        </div>

        <!-- abstract medical visual -->
        <div class="left-visual">
          <div class="visual-ring ring-1"></div>
          <div class="visual-ring ring-2"></div>
          <div class="visual-ring ring-3"></div>
          <div class="pulse-icon">
            <i class="pi pi-heart-fill"></i>
          </div>
          <div class="ecg-line">
            <svg viewBox="0 0 300 60" preserveAspectRatio="none">
              <polyline points="0,30 40,30 55,8 65,50 75,15 90,30 130,30 145,10 158,48 168,20 180,30 300,30"
                fill="none" stroke="rgba(167,139,250,0.7)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- bottom tagline -->
        <div class="left-tagline">
          <h2>Modern Healthcare.<br/><span>Simplified.</span></h2>
          <p>Trusted by clinics worldwide to manage patients,<br/>scheduling, and billing — securely.</p>
          <div class="nav-dots">
            <span class="dot active"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      </div>

      <!-- Right panel: dark form area -->
      <div class="auth-right">
        <div class="form-wrapper">

          <div class="form-header">
            <h2>Welcome back</h2>
            <p>Sign in to access your clinic dashboard</p>
          </div>

          <router-outlet />

          <div class="form-footer">
            <i class="pi pi-lock"></i>
            <span>Secured with 256-bit SSL encryption</span>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; margin: 0; padding: 0; }

    .auth-shell {
      min-height: 100vh;
      display: flex;
      font-family: 'Inter', 'Segoe UI', sans-serif;
      background: #0c0c1d;
    }

    /* ════════════════════════════════
       LEFT PANEL
    ════════════════════════════════ */
    .auth-left {
      flex: 1;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 2rem 2.5rem 2.5rem;
      overflow: hidden;

      /* Dark purple landscape gradient */
      background:
        radial-gradient(ellipse 80% 60% at 50% 20%, rgba(109,40,217,0.35) 0%, transparent 65%),
        radial-gradient(ellipse 60% 50% at 20% 80%, rgba(76,29,149,0.4) 0%, transparent 60%),
        radial-gradient(ellipse 50% 40% at 80% 70%, rgba(30,10,60,0.6) 0%, transparent 60%),
        linear-gradient(170deg, #1a0b38 0%, #0e0728 30%, #06041a 60%, #030210 100%);
    }

    /* subtle noise-like texture overlay */
    .left-overlay {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(ellipse 100% 50% at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 70%),
        radial-gradient(ellipse 70% 40% at 0% 100%, rgba(109,40,217,0.18) 0%, transparent 60%);
      pointer-events: none;
    }

    /* TOP BAR */
    .left-topbar {
      position: relative;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 0.625rem;

      .brand-icon {
        width: 34px; height: 34px;
        background: linear-gradient(135deg, #7c3aed, #a855f7);
        border-radius: 9px;
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 4px 14px rgba(124,58,237,0.5);
        i { font-size: 0.875rem; color: #fff; }
      }

      .brand-name {
        font-size: 1rem;
        font-weight: 700;
        color: #fff;
        letter-spacing: -0.02em;
      }
    }

    /* CENTER VISUAL */
    .left-visual {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -52%);
      width: 280px;
      height: 280px;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }

    .visual-ring {
      position: absolute;
      border-radius: 50%;
      border: 1px solid rgba(167,139,250,0.15);
    }
    .ring-1 { width: 280px; height: 280px; }
    .ring-2 { width: 200px; height: 200px; border-color: rgba(167,139,250,0.22); }
    .ring-3 { width: 120px; height: 120px; border-color: rgba(167,139,250,0.3); background: rgba(124,58,237,0.08); }

    .pulse-icon {
      width: 72px; height: 72px;
      background: linear-gradient(135deg, #7c3aed, #a855f7);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 0 10px rgba(124,58,237,0.15), 0 0 40px rgba(124,58,237,0.4);
      z-index: 1;
      i { font-size: 1.75rem; color: #fff; }
    }

    .ecg-line {
      position: absolute;
      bottom: -20px;
      left: -30px;
      width: 340px;
      height: 60px;
      opacity: 0.65;
    }

    /* BOTTOM TAGLINE */
    .left-tagline {
      position: relative;
      z-index: 2;

      h2 {
        font-size: clamp(1.5rem, 2.8vw, 2.125rem);
        font-weight: 800;
        color: #fff;
        letter-spacing: -0.04em;
        line-height: 1.2;
        margin-bottom: 0.75rem;

        span {
          background: linear-gradient(90deg, #a78bfa, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }

      p {
        font-size: 0.8375rem;
        color: rgba(255,255,255,0.38);
        line-height: 1.6;
        margin-bottom: 1.5rem;
      }

      .nav-dots {
        display: flex;
        gap: 0.4rem;

        .dot {
          width: 6px; height: 6px;
          border-radius: 3px;
          background: rgba(255,255,255,0.25);
          transition: all 0.2s;

          &.active {
            width: 20px;
            background: #a78bfa;
          }
        }
      }
    }

    /* ════════════════════════════════
       RIGHT PANEL
    ════════════════════════════════ */
    .auth-right {
      width: 480px;
      background: #0f0f23;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 2rem;
      border-left: 1px solid rgba(255,255,255,0.05);
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: 0; right: 0;
        width: 200px; height: 200px;
        background: radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%);
        pointer-events: none;
      }
    }

    .form-wrapper {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 360px;
    }

    .form-header {
      margin-bottom: 2rem;

      h2 {
        font-size: 1.875rem;
        font-weight: 800;
        color: #fff;
        letter-spacing: -0.04em;
        margin-bottom: 0.4rem;
      }

      p {
        font-size: 0.875rem;
        color: rgba(255,255,255,0.4);
        font-weight: 400;
      }
    }

    :host ::ng-deep .login-form {
      width: 100%;
    }

    .form-footer {
      margin-top: 1.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      color: rgba(255,255,255,0.2);
      font-size: 0.7375rem;

      i { font-size: 0.7rem; }
    }

    /* ── RESPONSIVE ── */
    @media (max-width: 900px) {
      .auth-left { display: none; }
      .auth-right { width: 100%; border-left: none; }
    }

    @media (max-width: 480px) {
      .auth-right { padding: 2rem 1.25rem; }
    }
  `]
})
export class AuthLayoutComponent {}
