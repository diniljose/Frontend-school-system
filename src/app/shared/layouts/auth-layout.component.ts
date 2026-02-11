import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink],
  template: `
    <div class="auth-layout">
      <div class="auth-brand">
        <div class="brand-content">
          <div class="brand-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="var(--color-primary)"/><path d="M12 28V16l8-5 8 5v12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 28v-6h6v6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <h1>EduCore</h1>
          <p>Modern school management platform for the digital age</p>
          <div class="brand-features">
            <div class="feature"><span class="dot"></span> Multi-tenant architecture</div>
            <div class="feature"><span class="dot"></span> Real-time bus tracking</div>
            <div class="feature"><span class="dot"></span> Smart analytics & reports</div>
            <div class="feature"><span class="dot"></span> Role-based access control</div>
          </div>
          <a routerLink="/guide" class="guide-banner">
            📖 Interactive Setup Guide — See how it works →
          </a>
        </div>
      </div>
      <div class="auth-form-area">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .auth-layout {
      display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh;
    }
    .auth-brand {
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      display: flex; align-items: center; justify-content: center; padding: var(--space-8);
      position: relative; overflow: hidden;
    }
    .auth-brand::before {
      content: ''; position: absolute; inset: 0;
      background: radial-gradient(circle at 30% 70%, rgba(255,255,255,0.1) 0%, transparent 60%);
    }
    .brand-content { position: relative; z-index: 1; color: #fff; max-width: 440px; }
    .brand-logo { margin-bottom: var(--space-6); }
    .brand-content h1 { font-size: var(--text-4xl); font-weight: 800; margin-bottom: var(--space-3); }
    .brand-content p { font-size: var(--text-lg); opacity: 0.9; margin-bottom: var(--space-8); line-height: 1.6; }
    .brand-features { display: flex; flex-direction: column; gap: var(--space-3); }
    .feature { display: flex; align-items: center; gap: var(--space-3); font-size: var(--text-sm); opacity: 0.85; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.7); flex-shrink: 0; }
    .guide-banner {
      display: block; margin-top: var(--space-8); padding: var(--space-4);
      border-radius: var(--radius-lg); background: rgba(255,255,255,0.12);
      color: #fff; text-decoration: none; font-size: var(--text-sm); font-weight: 600;
      text-align: center; backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.15); transition: all 0.2s;
    }
    .guide-banner:hover { background: rgba(255,255,255,0.18); transform: translateY(-1px); }
    .auth-form-area {
      display: flex; align-items: center; justify-content: center; padding: var(--space-8);
      background: var(--bg-body);
    }
    @media (max-width: 900px) {
      .auth-layout { grid-template-columns: 1fr; }
      .auth-brand { display: none; }
    }
  `]
})
export class AuthLayoutComponent {}
