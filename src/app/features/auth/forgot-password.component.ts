import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="premium-auth-card">
      @if (!sent()) {
        <div class="auth-section">
          <div class="card-header">
            <div class="header-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
            </div>
            <h1>{{ 'auth.forgot_password' | translate }}</h1>
            <p>{{ 'auth.forgot_subtitle' | translate }}</p>
          </div>

          <form (ngSubmit)="onSubmit()" class="premium-form">
            <div class="premium-input-group" [class.focused]="emailFocused()" [class.has-value]="email">
              <div class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <input 
                type="email" 
                class="premium-input has-icon" 
                [(ngModel)]="email" 
                name="email"
                placeholder=" "
                required 
                autofocus
                (focus)="emailFocused.set(true)"
                (blur)="emailFocused.set(false)" />
              <label class="floating-label">{{ 'auth.email' | translate }}</label>
              <div class="input-highlight"></div>
            </div>

            <button type="submit" class="premium-submit-btn" [disabled]="loading()">
              @if (loading()) {
                <span class="btn-spinner"></span>
              }
              <span>{{ 'auth.send_reset_link' | translate }}</span>
              <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </form>
        </div>
      } @else {
        <div class="auth-section success-section">
          <div class="card-header">
            <div class="header-icon success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h1>{{ 'auth.check_email' | translate }}</h1>
            <p class="success-message">
              {{ 'auth.reset_link_sent' | translate }} 
              <strong>{{ email }}</strong>
            </p>
          </div>
          
          <div class="email-tips">
            <div class="tip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Link expires in 1 hour</span>
            </div>
            <div class="tip">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <span>Check your spam folder</span>
            </div>
          </div>

          <button class="premium-secondary-btn" (click)="sent.set(false)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
            <span>{{ 'auth.try_again' | translate }}</span>
          </button>
        </div>
      }

      <p class="auth-footer">
        <a routerLink="/auth/login" class="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          {{ 'auth.back_to_login' | translate }}
        </a>
      </p>
    </div>
  `,
  styles: [`
    .premium-auth-card {
      width: 100%;
      max-width: 440px;
      animation: cardEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    
    @keyframes cardEntrance {
      from {
        opacity: 0;
        transform: translateY(24px) scale(0.96);
      }
      60% {
        transform: translateY(-4px) scale(1.01);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    .auth-section {
      animation: sectionFade 0.4s ease-out both;
    }
    
    @keyframes sectionFade {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .card-header {
      text-align: center;
      margin-bottom: 28px;
    }
    
    .header-icon {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.08));
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: var(--color-primary);
      animation: iconBounce 0.6s ease-out 0.2s both;
    }
    
    @keyframes iconBounce {
      from {
        opacity: 0;
        transform: scale(0.8) translateY(-10px);
      }
      60% {
        transform: scale(1.05) translateY(2px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    
    .header-icon.success-icon {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.08));
      color: #10b981;
      animation: successPulse 2s ease-in-out infinite;
    }
    
    @keyframes successPulse {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.2);
      }
      50% {
        box-shadow: 0 0 0 12px rgba(16, 185, 129, 0);
      }
    }
    
    .card-header h1 {
      font-size: 1.75rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.03em;
      margin-bottom: 8px;
    }
    
    .card-header p {
      font-size: 15px;
      color: var(--text-secondary);
      line-height: 1.5;
    }
    
    .success-message {
      strong {
        display: block;
        color: var(--text-primary);
        margin-top: 4px;
      }
    }

    .premium-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .premium-input-group {
      position: relative;
    }
    
    .premium-input {
      width: 100%;
      height: 58px;
      padding: 22px 16px 8px 50px;
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      background: var(--bg-surface);
      border: 2px solid var(--border-color);
      border-radius: 16px;
      outline: none;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      
      &::placeholder { opacity: 0; }
    }
    
    .premium-input-group .input-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      transition: color 0.3s;
      z-index: 1;
    }
    
    .floating-label {
      position: absolute;
      left: 50px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 15px;
      color: var(--text-muted);
      pointer-events: none;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform-origin: left center;
      background: var(--bg-surface);
      padding: 0 6px;
    }
    
    .input-highlight {
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, var(--color-primary), #8b5cf6);
      transition: all 0.3s ease;
      transform: translateX(-50%);
      border-radius: 2px;
    }
    
    .premium-input-group.focused .premium-input {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
    }
    
    .premium-input-group.focused .input-icon {
      color: var(--color-primary);
    }
    
    .premium-input-group.focused .floating-label,
    .premium-input-group.has-value .floating-label {
      top: 8px;
      transform: translateY(0) scale(0.75);
      color: var(--color-primary);
      font-weight: 600;
    }
    
    .premium-input-group.focused .input-highlight {
      width: calc(100% - 32px);
    }

    .premium-submit-btn {
      width: 100%;
      height: 58px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 25%, #8b5cf6 50%, #7c3aed 100%);
      background-size: 200% 200%;
      color: #fff;
      border: none;
      border-radius: 16px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      
      &:hover:not(:disabled) {
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(79, 70, 229, 0.4);
        
        .btn-icon { transform: translateX(4px); }
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .btn-spinner {
        width: 22px;
        height: 22px;
        border: 2.5px solid rgba(255,255,255,0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      
      .btn-icon { transition: transform 0.3s; }
    }
    
    @keyframes spin { to { transform: rotate(360deg); } }

    .email-tips {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px;
      background: var(--bg-muted);
      border-radius: 14px;
      margin-bottom: 20px;
      
      .tip {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
        color: var(--text-secondary);
        
        svg {
          color: var(--color-primary);
          flex-shrink: 0;
        }
      }
    }
    
    .premium-secondary-btn {
      width: 100%;
      height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: var(--bg-surface);
      color: var(--text-primary);
      border: 2px solid var(--border-color);
      border-radius: 14px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: var(--color-primary);
        background: var(--bg-surface-hover);
        
        svg { transform: rotate(-45deg); }
      }
      
      svg { transition: transform 0.3s; }
    }

    .auth-footer {
      text-align: center;
      margin-top: 28px;
      
      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 600;
        color: var(--color-primary);
        text-decoration: none;
        transition: all 0.2s;
        
        &:hover {
          svg { transform: translateX(-4px); }
        }
        
        svg { transition: transform 0.2s; }
      }
    }

    @media (max-width: 480px) {
      .premium-auth-card { max-width: 100%; }
      .card-header h1 { font-size: 1.5rem; }
      .header-icon { width: 64px; height: 64px; }
      .premium-input { height: 54px; font-size: 16px; }
      .premium-submit-btn { height: 54px; }
    }
  `]
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  email = '';
  loading = signal(false);
  sent = signal(false);
  emailFocused = signal(false);

  onSubmit(): void {
    if (!this.email) return;
    this.loading.set(true);
    this.auth.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
      },
      error: () => {
        this.loading.set(false);
        this.sent.set(true); // Still show success for security
      },
    });
  }
}
