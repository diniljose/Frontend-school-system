import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="auth-card animate-in">
      <div class="auth-header">
        <h1>{{ 'auth.register' | translate }}</h1>
        <p>{{ 'auth.register_subtitle' | translate }}</p>
      </div>

      <form (ngSubmit)="onSubmit()" class="auth-form">
        <div class="name-row">
          <div class="form-group">
            <label>{{ 'auth.first_name' | translate }}</label>
            <input type="text" class="form-input" [(ngModel)]="firstName" name="firstName" placeholder="John" required />
          </div>
          <div class="form-group">
            <label>{{ 'auth.last_name' | translate }}</label>
            <input type="text" class="form-input" [(ngModel)]="lastName" name="lastName" placeholder="Doe" required />
          </div>
        </div>

        <div class="form-group">
          <label>{{ 'auth.email' | translate }}</label>
          <input type="email" class="form-input" [(ngModel)]="email" name="email" placeholder="name@school.com" required />
        </div>

        <div class="form-group">
          <label>{{ 'auth.password' | translate }}</label>
          <div class="password-field">
            <input [type]="showPassword() ? 'text' : 'password'" class="form-input" [(ngModel)]="password"
              name="password" placeholder="Minimum 8 characters" required minlength="8" />
            <button type="button" class="toggle-pw" (click)="showPassword.set(!showPassword())">
              {{ showPassword() ? '🙈' : '👁️' }}
            </button>
          </div>
          @if (password.length > 0) {
            <div class="strength-bar">
              <div class="strength-fill" [style.width.%]="passwordStrength()" [class]="strengthClass()"></div>
            </div>
            <small class="pw-hint">Must include uppercase, lowercase, number &amp; special character</small>
          }
        </div>
        <div class="form-group">
            <label>{{ 'auth.confirm_password' | translate }}</label>
          <input type="password" class="form-input" [(ngModel)]="confirmPassword" name="confirmPassword"
            placeholder="Confirm your password" required />
          @if (confirmPassword && confirmPassword !== password) {
            <span class="form-error">{{ 'auth.passwords_no_match' | translate }}</span>
          }
        </div>

        <div class="form-group">
          <label>{{ 'auth.school_name' | translate }}</label>
          <input type="text" class="form-input" [(ngModel)]="schoolName" name="schoolName" placeholder="ABC International School" required />
        </div>

        <button type="submit" class="btn btn-primary btn-lg" style="width:100%" [disabled]="loading() || confirmPassword !== password">
          @if (loading()) { <span class="spinner"></span> }
          {{ 'auth.sign_up' | translate }}
        </button>
      </form>

      <p class="auth-footer">
        {{ 'auth.have_account' | translate }}
        <a routerLink="/auth/login">{{ 'auth.login' | translate }}</a>
      </p>

      <div class="guide-cta">
        <a routerLink="/guide" class="guide-link">
          📖 {{ 'auth.setup_guide_cta' | translate }} →
        </a>
      </div>
    </div>
  `,
  styles: [`
    .auth-card { width: 100%; max-width: 480px; }
    .auth-header { margin-bottom: var(--space-6); }
    .auth-header h1 { font-size: var(--text-3xl); font-weight: 700; margin-bottom: var(--space-2); }
    .auth-header p { color: var(--text-secondary); }
    .auth-form { display: flex; flex-direction: column; gap: var(--space-4); }
    .name-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .password-field { position: relative; }
    .toggle-pw {
      position: absolute; right: var(--space-3); top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 16px;
    }
    .strength-bar {
      height: 4px; background: var(--border); border-radius: 2px; margin-top: var(--space-2); overflow: hidden;
    }
    .strength-fill { height: 100%; border-radius: 2px; transition: width 0.3s, background 0.3s; }
    .strength-fill.weak { background: #ef4444; }
    .strength-fill.medium { background: #f59e0b; }
    .strength-fill.strong { background: #22c55e; }
    .form-error { color: #ef4444; font-size: var(--text-xs); margin-top: var(--space-1); }
    .pw-hint { display: block; color: var(--text-secondary); font-size: var(--text-xs); margin-top: var(--space-1); opacity: 0.7; }
    .auth-footer { text-align: center; margin-top: var(--space-6); font-size: var(--text-sm); color: var(--text-secondary); }
    .auth-footer a { font-weight: 600; }
    .guide-cta {
      text-align: center; margin-top: var(--space-4);
      padding: var(--space-4); border-radius: var(--radius-lg);
      background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15);
    }
    .guide-link {
      font-size: var(--text-sm); font-weight: 600; text-decoration: none;
      color: var(--primary, #6366f1); transition: opacity 0.2s;
    }
    .guide-link:hover { opacity: 0.8; }
    .spinner {
      width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.6s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 640px) {
      .auth-card { padding: 0 var(--space-1); }
      .auth-header h1 { font-size: var(--text-xl); }
      .name-row { grid-template-columns: 1fr; gap: var(--space-3); }
    }
  `]
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';
  schoolName = '';
  showPassword = signal(false);
  loading = signal(false);

  passwordStrength(): number {
    let score = 0;
    if (this.password.length >= 8) score += 25;
    if (/[a-z]/.test(this.password) && /[A-Z]/.test(this.password)) score += 25;
    if (/\d/.test(this.password)) score += 25;
    if (/[^a-zA-Z\d]/.test(this.password)) score += 25;
    return score;
  }

  strengthClass(): string {
    const s = this.passwordStrength();
    if (s <= 25) return 'weak';
    if (s <= 50) return 'medium';
    return 'strong';
  }

  onSubmit(): void {
    if (this.password !== this.confirmPassword) return;
    this.loading.set(true);
    this.auth.registerSchool({
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password,
      schoolName: this.schoolName,
    }).subscribe({
      next: (response: any) => {
        this.loading.set(false);
        // Check if this is the new pending approval flow
        if (response.status === 'pending_approval') {
          this.toast.success('School registration submitted! Pending admin approval.');
          this.router.navigate(['/auth/pending-approval'], {
            queryParams: { email: this.email, school: this.schoolName }
          });
        } else {
          // Legacy flow with tokens (if any)
          this.toast.success('School registered successfully! Welcome aboard.');
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        const msg = err.error?.message;
        this.toast.error('Registration Failed', Array.isArray(msg) ? msg.join(', ') : msg || 'Unable to create account');
      },
    });
  }
}
