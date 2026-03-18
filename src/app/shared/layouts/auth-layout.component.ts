import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="auth-layout">
      <!-- Animated Background Panel -->
      <div class="auth-brand">
        <div class="brand-bg-shapes">
          <div class="shape shape-1"></div>
          <div class="shape shape-2"></div>
          <div class="shape shape-3"></div>
          <div class="shape shape-4"></div>
        </div>
        <div class="brand-content">
          <div class="brand-logo">
            <div class="logo-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect width="48" height="48" rx="14" fill="rgba(255,255,255,0.2)"/>
                <path d="M14 34V20l10-7 10 7v14" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20 34v-8h8v8" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="24" cy="16" r="2" fill="#fff" opacity="0.8"/>
              </svg>
            </div>
          </div>
          <h1 class="brand-title">Your School,<br>Your Platform</h1>
          <p class="brand-subtitle">A complete digital ecosystem to manage academics, students, staff, and operations — all in one place.</p>
          <div class="brand-features">
            <div class="feature fade-in" style="--i:0">
              <div class="feature-icon">📊</div>
              <div class="feature-text">
                <strong>Smart Analytics</strong>
                <span>Real-time insights & reports</span>
              </div>
            </div>
            <div class="feature fade-in" style="--i:1">
              <div class="feature-icon">🔒</div>
              <div class="feature-text">
                <strong>Secure Access</strong>
                <span>Role-based permissions</span>
              </div>
            </div>
            <div class="feature fade-in" style="--i:2">
              <div class="feature-icon">📱</div>
              <div class="feature-text">
                <strong>Mobile Ready</strong>
                <span>Manage from anywhere</span>
              </div>
            </div>
            <div class="feature fade-in" style="--i:3">
              <div class="feature-icon">🚀</div>
              <div class="feature-text">
                <strong>All-in-One</strong>
                <span>Fees, attendance, exams & more</span>
              </div>
            </div>
          </div>
        </div>
        <div class="brand-footer">
          <a routerLink="/guide" class="guide-banner">
            Explore how it works →
          </a>
        </div>
      </div>

      <!-- Form Area -->
      <div class="auth-form-area">
        <div class="form-container">
          <router-outlet />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      min-height: 100vh;
      min-height: 100dvh;
    }

    /* ─── Brand Panel ─── */
    .auth-brand {
      background: linear-gradient(160deg, #4f46e5 0%, #7c3aed 40%, #2563eb 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: var(--space-8) var(--space-6);
      position: relative;
      overflow: hidden;
    }

    /* Animated floating shapes */
    .brand-bg-shapes {
      position: absolute;
      inset: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.06);
      animation: float 20s ease-in-out infinite;
    }
    .shape-1 { width: 300px; height: 300px; top: -80px; right: -60px; animation-delay: 0s; }
    .shape-2 { width: 200px; height: 200px; bottom: 10%; left: -40px; animation-delay: -5s; }
    .shape-3 { width: 150px; height: 150px; top: 40%; right: 20%; animation-delay: -10s; background: rgba(255,255,255,0.04); }
    .shape-4 { width: 100px; height: 100px; bottom: 20%; right: 10%; animation-delay: -15s; background: rgba(255,255,255,0.08); }
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
      33% { transform: translateY(-20px) rotate(5deg) scale(1.05); }
      66% { transform: translateY(10px) rotate(-3deg) scale(0.97); }
    }

    .brand-content {
      position: relative;
      z-index: 1;
      color: #fff;
      max-width: 440px;
      width: 100%;
    }
    .brand-logo { margin-bottom: var(--space-6); }
    .logo-icon {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.12);
      border-radius: var(--radius-xl);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.15);
      animation: fadeInDown 0.6s ease-out both;
    }

    .brand-title {
      font-size: 2.25rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: var(--space-4);
      letter-spacing: -0.02em;
      animation: fadeInDown 0.6s ease-out 0.1s both;
    }
    .brand-subtitle {
      font-size: var(--text-base);
      opacity: 0.85;
      line-height: 1.7;
      margin-bottom: var(--space-8);
      animation: fadeInDown 0.6s ease-out 0.2s both;
    }

    .brand-features {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }
    .feature {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: rgba(255,255,255,0.08);
      border-radius: var(--radius-lg);
      backdrop-filter: blur(4px);
      border: 1px solid rgba(255,255,255,0.08);
      transition: all 0.3s ease;
      animation: fadeInLeft 0.5s ease-out calc(0.3s + var(--i) * 0.1s) both;
    }
    .feature:hover {
      background: rgba(255,255,255,0.14);
      transform: translateX(6px);
    }
    .feature-icon {
      font-size: 1.3rem;
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255,255,255,0.1);
      border-radius: var(--radius-md);
    }
    .feature-text {
      display: flex;
      flex-direction: column;
    }
    .feature-text strong {
      font-size: var(--text-sm);
      font-weight: 600;
    }
    .feature-text span {
      font-size: var(--text-xs);
      opacity: 0.7;
    }

    .brand-footer {
      position: relative;
      z-index: 1;
      margin-top: var(--space-8);
      width: 100%;
      max-width: 440px;
    }
    .guide-banner {
      display: block;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      background: rgba(255,255,255,0.1);
      color: #fff;
      text-decoration: none;
      font-size: var(--text-sm);
      font-weight: 600;
      text-align: center;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.12);
      transition: all 0.3s ease;
      animation: fadeInUp 0.6s ease-out 0.8s both;
    }
    .guide-banner:hover {
      background: rgba(255,255,255,0.18);
      transform: translateY(-2px);
      color: #fff;
    }

    /* ─── Form Area ─── */
    .auth-form-area {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-8) var(--space-6);
      background: var(--bg-body);
      overflow-y: auto;
    }
    .form-container {
      width: 100%;
      max-width: 460px;
    }

    /* ─── Animations ─── */
    @keyframes fadeInDown {
      from { opacity: 0; transform: translateY(-16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInLeft {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ─── Responsiveness ─── */
    @media (max-width: 1024px) {
      .auth-layout { grid-template-columns: 1fr; }
      .auth-brand {
        display: none;
      }
      .auth-form-area {
        padding: var(--space-6) var(--space-4);
        min-height: 100vh;
        min-height: 100dvh;
      }
    }

    @media (max-width: 480px) {
      .auth-form-area {
        padding: var(--space-4) var(--space-3);
        align-items: flex-start;
        padding-top: var(--space-8);
      }
      .form-container {
        max-width: 100%;
      }
    }
  `]
})
export class AuthLayoutComponent {}
