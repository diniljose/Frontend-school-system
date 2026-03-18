import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ApiService } from '../../core/services/api.service';

interface RoleOption {
  userId: string;
  role: string;
  displayRole: string;
  schoolCode: string | null;
  schoolName: string;
  firstName: string;
  lastName: string;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="auth-card" [class.slide-out]="showRoleSelection()">
      <!-- Role Selection Step -->
      @if (showRoleSelection()) {
        <div class="auth-section animate-in">
          <button class="back-btn" (click)="backToLogin()">
            <span class="back-icon">←</span> {{ 'auth.back_to_login' | translate }}
          </button>
          <div class="auth-header">
            <div class="header-icon role-icon">👤</div>
            <h1>{{ 'auth.choose_account' | translate }}</h1>
            <p>{{ 'auth.multiple_accounts_msg' | translate }}</p>
          </div>

          <div class="role-options">
            @for (option of roleOptions(); track option.userId) {
              <button class="role-card" 
                      [class.selected]="selectedOption()?.userId === option.userId"
                      (click)="selectOption(option)">
                <div class="role-avatar">{{ option.firstName.charAt(0) }}{{ option.lastName.charAt(0) }}</div>
                <div class="role-info">
                  <strong>{{ option.firstName }} {{ option.lastName }}</strong>
                  <span class="role-badge">{{ option.displayRole }}</span>
                  <span class="school-name">{{ option.schoolName }}</span>
                </div>
                <span class="role-check" [class.visible]="selectedOption()?.userId === option.userId">✓</span>
              </button>
            }
          </div>

          <button class="btn-submit" 
                  [disabled]="!selectedOption() || loading()"
                  (click)="loginWithSelectedRole()">
            @if (loading()) { <span class="spinner"></span> }
            {{ 'auth.continue_as' | translate }} {{ selectedOption()?.displayRole || '' }}
          </button>
        </div>
      } @else {
        <!-- Normal Login Step -->
        <div class="auth-section animate-in">
          <div class="auth-header">
            <div class="header-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M8 20V12l6-4 6 4v8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M11 20v-4h6v4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h1>{{ 'auth.welcome_back' | translate }}</h1>
            <p>{{ 'auth.login_subtitle' | translate }}</p>
          </div>

          <form (ngSubmit)="onSubmit()" class="auth-form">
            <div class="form-group">
              <label>{{ 'auth.email' | translate }}</label>
              <div class="input-wrapper">
                <span class="input-icon">✉</span>
                <input type="email" class="form-input has-icon" [(ngModel)]="email" name="email"
                  [placeholder]="'auth.email_placeholder' | translate" required autofocus />
              </div>
            </div>

            <div class="form-group">
              <label>{{ 'auth.password' | translate }}</label>
              <div class="input-wrapper">
                <span class="input-icon">🔒</span>
                <input [type]="showPassword() ? 'text' : 'password'" class="form-input has-icon" [(ngModel)]="password"
                  name="password" placeholder="••••••••" required />
                <button type="button" class="toggle-pw" (click)="showPassword.set(!showPassword())">
                  {{ showPassword() ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <div class="form-options">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="rememberMe" name="remember" />
                <span class="checkmark"></span>
                {{ 'auth.remember_me' | translate }}
              </label>
              <a routerLink="/auth/forgot-password" class="forgot-link">{{ 'auth.forgot_password' | translate }}</a>
            </div>

            <button type="submit" class="btn-submit" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> }
              {{ 'auth.sign_in' | translate }}
            </button>
          </form>

          <div class="divider">
            <span>{{ 'auth.or' | translate }}</span>
          </div>

          <div class="register-cta-group">
            <a routerLink="/auth/register-student" class="cta-card student-cta">
              <div class="cta-icon">🎓</div>
              <div class="cta-text">
                <strong>{{ 'auth.student_register_title' | translate }}</strong>
                <span>{{ 'auth.student_register_desc' | translate }}</span>
              </div>
              <span class="cta-arrow">→</span>
            </a>

            <a routerLink="/auth/register-teacher" class="cta-card teacher-cta">
              <div class="cta-icon">👨‍🏫</div>
              <div class="cta-text">
                <strong>{{ 'auth.teacher_register_title' | translate }}</strong>
                <span>{{ 'auth.teacher_register_desc' | translate }}</span>
              </div>
              <span class="cta-arrow">→</span>
            </a>
          </div>

          <p class="auth-footer">
            {{ 'auth.admin_register_prompt' | translate }}
            <a routerLink="/auth/register">{{ 'auth.register_school' | translate }}</a>
          </p>
        </div>
      }
    </div>
  `,
  styles: [`
    .auth-card {
      width: 100%;
      max-width: 440px;
    }

    .auth-section {
      animation: fadeSlideUp 0.4s ease-out both;
    }

    .auth-header {
      margin-bottom: var(--space-6);
    }
    .header-icon {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-xl);
      background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.12));
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-bottom: var(--space-4);
    }
    .header-icon.role-icon {
      background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.12));
      color: #10b981;
    }
    .auth-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: var(--space-2);
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }
    .auth-header p {
      color: var(--text-secondary);
      font-size: var(--text-sm);
      line-height: 1.5;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .input-wrapper {
      position: relative;
    }
    .input-icon {
      position: absolute;
      left: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      font-size: 14px;
      opacity: 0.5;
      pointer-events: none;
      z-index: 1;
    }
    .form-input.has-icon {
      padding-left: 2.5rem;
    }
    .toggle-pw {
      position: absolute;
      right: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      padding: 4px;
      z-index: 1;
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: var(--text-sm);
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--text-secondary);
      cursor: pointer;
      font-size: var(--text-sm);
    }
    .forgot-link {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-primary);
      text-decoration: none;
    }
    .forgot-link:hover { text-decoration: underline; }

    .btn-submit {
      width: 100%;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #fff;
      border: none;
      border-radius: var(--radius-lg);
      font-size: var(--text-base);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 14px rgba(79,70,229,0.25);
      margin-top: var(--space-2);
    }
    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(79,70,229,0.35);
    }
    .btn-submit:active:not(:disabled) {
      transform: translateY(0);
    }
    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .divider {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin: var(--space-5) 0;
      color: var(--text-muted);
      font-size: var(--text-xs);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border-color);
    }

    .register-cta-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .cta-card {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      background: var(--bg-surface);
      text-decoration: none;
      transition: all 0.25s ease;
      cursor: pointer;
    }
    .cta-card:hover {
      border-color: var(--color-primary);
      background: var(--bg-surface-hover);
      transform: translateX(4px);
    }
    .cta-icon {
      font-size: 1.3rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      flex-shrink: 0;
    }
    .student-cta .cta-icon { background: rgba(16,185,129,0.1); }
    .teacher-cta .cta-icon { background: rgba(59,130,246,0.1); }
    .cta-text {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .cta-text strong {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-primary);
    }
    .cta-text span {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }
    .cta-arrow {
      color: var(--text-muted);
      font-size: var(--text-lg);
      transition: transform 0.2s;
    }
    .cta-card:hover .cta-arrow {
      transform: translateX(3px);
      color: var(--color-primary);
    }

    .auth-footer {
      text-align: center;
      margin-top: var(--space-5);
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }
    .auth-footer a {
      font-weight: 600;
      color: var(--color-primary);
    }

    .spinner {
      width: 18px; height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Role Selection */
    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: var(--text-sm);
      cursor: pointer;
      padding: 0;
      margin-bottom: var(--space-4);
      transition: color 0.2s;
    }
    .back-btn:hover { color: var(--text-primary); }
    .back-icon { font-size: 1.1em; }

    .role-options {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      margin-bottom: var(--space-5);
    }
    .role-card {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-lg);
      border: 2px solid var(--border-color);
      background: var(--bg-surface);
      cursor: pointer;
      transition: all 0.25s ease;
      text-align: left;
    }
    .role-card:hover {
      border-color: var(--color-primary);
      background: var(--bg-surface-hover);
    }
    .role-card.selected {
      border-color: var(--color-primary);
      background: rgba(79,70,229,0.06);
    }
    .role-avatar {
      width: 44px; height: 44px;
      border-radius: var(--radius-full);
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: var(--text-sm);
      flex-shrink: 0;
    }
    .role-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .role-info strong { font-size: var(--text-sm); color: var(--text-primary); }
    .role-badge {
      font-size: var(--text-xs);
      color: var(--color-primary);
      font-weight: 600;
      background: rgba(79,70,229,0.08);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      width: fit-content;
    }
    .school-name { font-size: var(--text-xs); color: var(--text-muted); }
    .role-check {
      width: 24px; height: 24px;
      border-radius: 50%;
      background: var(--color-primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      opacity: 0;
      transition: all 0.2s ease;
      transform: scale(0.8);
    }
    .role-check.visible {
      opacity: 1;
      transform: scale(1);
    }

    /* Animations */
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-in {
      animation: fadeSlideUp 0.4s ease-out both;
    }

    /* Mobile */
    @media (max-width: 480px) {
      .auth-card { max-width: 100%; }
      .auth-header h1 { font-size: 1.5rem; }
      .header-icon { width: 48px; height: 48px; font-size: 1.25rem; }
      .btn-submit { height: 52px; }
      .form-options { flex-direction: column; gap: var(--space-2); align-items: flex-start; }
    }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private router = inject(Router);

  email = '';
  password = '';
  rememberMe = false;
  showPassword = signal(false);
  loading = signal(false);
  
  // Multi-role selection
  showRoleSelection = signal(false);
  roleOptions = signal<RoleOption[]>([]);
  selectedOption = signal<RoleOption | null>(null);

  onSubmit(): void {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    
    this.api.post<any>('auth/login', { email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        const data = res.data;
        
        // Check if role selection is required
        if (data.requireRoleSelection) {
          this.roleOptions.set(data.options);
          this.showRoleSelection.set(true);
          if (data.options.length > 0) {
            this.selectedOption.set(data.options[0]);
          }
        } else {
          // Direct login success
          this.handleLoginSuccess(data);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error('Login Failed', err.error?.message || 'Invalid credentials');
      },
    });
  }

  selectOption(option: RoleOption): void {
    this.selectedOption.set(option);
  }

  loginWithSelectedRole(): void {
    const option = this.selectedOption();
    if (!option) return;
    
    this.loading.set(true);
    this.api.post<any>('auth/login', {
      email: this.email,
      password: this.password,
      schoolCode: option.schoolCode || 'platform',
      selectedUserId: option.userId,
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.handleLoginSuccess(res.data);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.error('Login Failed', err.error?.message || 'Invalid credentials');
      },
    });
  }

  backToLogin(): void {
    this.showRoleSelection.set(false);
    this.roleOptions.set([]);
    this.selectedOption.set(null);
  }

  private handleLoginSuccess(data: any): void {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    const school = data.school || data.user?.school;
    if (school && typeof school === 'object') {
      localStorage.setItem('school', JSON.stringify(school));
    }
    
    // Force auth service to reload (use base href for sub-path deployments)
    const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
    window.location.href = `${baseHref}dashboard`;
  }
}
