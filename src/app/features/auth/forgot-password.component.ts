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
    <div class="auth-card animate-in">
      @if (!sent()) {
        <div class="auth-header">
          <div class="icon-circle">🔑</div>
          <h1>{{ 'auth.forgot_password' | translate }}</h1>
          <p>Enter your email and we'll send you a reset link</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label>{{ 'auth.email' | translate }}</label>
            <input type="email" class="form-input" [(ngModel)]="email" name="email"
              placeholder="name@school.com" required autofocus />
          </div>

          <button type="submit" class="btn btn-primary btn-lg" style="width:100%" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> }
            Send Reset Link
          </button>
        </form>
      } @else {
        <div class="auth-header">
          <div class="icon-circle success">✅</div>
          <h1>Check your email</h1>
          <p>We sent a password reset link to <strong>{{ email }}</strong></p>
        </div>

        <button class="btn btn-secondary btn-lg" style="width:100%" (click)="sent.set(false)">
          Didn't receive? Try again
        </button>
      }

      <p class="auth-footer">
        <a routerLink="/auth/login">← Back to Login</a>
      </p>
    </div>
  `,
  styles: [`
    .auth-card { width: 100%; max-width: 420px; }
    .auth-header { margin-bottom: var(--space-6); text-align: center; }
    .auth-header h1 { font-size: var(--text-2xl); font-weight: 700; margin-bottom: var(--space-2); }
    .auth-header p { color: var(--text-secondary); }
    .icon-circle {
      width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 28px; margin: 0 auto var(--space-4);
      background: var(--surface-hover);
    }
    .icon-circle.success { background: rgba(34, 197, 94, 0.15); }
    .auth-form { display: flex; flex-direction: column; gap: var(--space-5); }
    .auth-footer { text-align: center; margin-top: var(--space-6); font-size: var(--text-sm); color: var(--text-secondary); }
    .auth-footer a { font-weight: 600; }
    .spinner {
      width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.6s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ForgotPasswordComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  email = '';
  loading = signal(false);
  sent = signal(false);

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
