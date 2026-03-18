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
    <div class="auth-card animate-in">
      <!-- Role Selection Step -->
      @if (showRoleSelection()) {
        <div class="auth-header">
          <button class="back-btn" (click)="backToLogin()">← Back</button>
          <h1>Choose Your Account</h1>
          <p>You have multiple accounts with this email. Select one to continue:</p>
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

        <button class="btn btn-primary btn-lg" style="width:100%"
                [disabled]="!selectedOption() || loading()"
                (click)="loginWithSelectedRole()">
          @if (loading()) { <span class="spinner"></span> }
          Continue as {{ selectedOption()?.displayRole || 'Selected Role' }}
        </button>
      } @else {
        <!-- Normal Login Step -->
        <div class="auth-header">
          <h1>{{ 'auth.login' | translate }}</h1>
          <p>Enter your credentials to access your account</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group">
            <label>{{ 'auth.email' | translate }}</label>
            <input type="email" class="form-input" [(ngModel)]="email" name="email"
              placeholder="name@school.com" required autofocus />
          </div>

          <div class="form-group">
            <label>{{ 'auth.password' | translate }}</label>
            <div class="password-field">
              <input [type]="showPassword() ? 'text' : 'password'" class="form-input" [(ngModel)]="password"
                name="password" placeholder="••••••••" required />
              <button type="button" class="toggle-pw" (click)="showPassword.set(!showPassword())">
                {{ showPassword() ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          <div class="form-options">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="rememberMe" name="remember" />
              {{ 'auth.remember_me' | translate }}
            </label>
            <a routerLink="/auth/forgot-password">{{ 'auth.forgot_password' | translate }}</a>
          </div>

          <button type="submit" class="btn btn-primary btn-lg" style="width:100%" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> }
            {{ 'auth.login' | translate }}
          </button>
        </form>

        <p class="auth-footer">
          {{ 'auth.no_account' | translate }}
          <a routerLink="/auth/register">{{ 'auth.sign_up' | translate }}</a>
        </p>

        <div class="student-register-cta">
          <span>🎓</span>
          <div>
            <strong>Student?</strong>
            <a routerLink="/auth/register-student">Register for your school →</a>
          </div>
        </div>

        <div class="teacher-register-cta">
          <span>👨‍🏫</span>
          <div>
            <strong>Teacher?</strong>
            <a routerLink="/auth/register-teacher">Apply to teach at a school →</a>
          </div>
        </div>

        <div class="guide-cta">
          <a routerLink="/guide" class="guide-link">
            📖 New here? View the interactive setup guide →
          </a>
        </div>
      }
    </div>
  `,
  styles: [`
    .auth-card { width: 100%; max-width: 420px; }
    .auth-header { margin-bottom: var(--space-8); }
    .auth-header h1 { font-size: var(--text-3xl); font-weight: 700; margin-bottom: var(--space-2); }
    .auth-header p { color: var(--text-secondary); }
    .auth-form { display: flex; flex-direction: column; gap: var(--space-5); }
    .password-field { position: relative; }
    .toggle-pw {
      position: absolute; right: var(--space-3); top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; font-size: 16px;
    }
    .form-options { display: flex; justify-content: space-between; align-items: center; font-size: var(--text-sm); }
    .checkbox-label { display: flex; align-items: center; gap: var(--space-2); color: var(--text-secondary); cursor: pointer; }
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
    .student-register-cta {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-4); border-radius: var(--radius-lg);
      background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.08));
      border: 1px solid rgba(16,185,129,0.2);
      margin-top: var(--space-4);
    }
    .student-register-cta span { font-size: 1.5rem; }
    .student-register-cta div { display: flex; flex-direction: column; gap: 2px; }
    .student-register-cta strong { font-size: var(--text-sm); color: var(--text-primary); }
    .student-register-cta a {
      font-size: var(--text-sm); font-weight: 600; text-decoration: none;
      color: #10b981; transition: opacity 0.2s;
    }
    .student-register-cta a:hover { opacity: 0.8; }
    .teacher-register-cta {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-4); border-radius: var(--radius-lg);
      background: linear-gradient(135deg, rgba(16,185,129,0.08), rgba(52,211,153,0.08));
      border: 1px solid rgba(16,185,129,0.2);
      margin-top: var(--space-2);
    }
    .teacher-register-cta span { font-size: 1.5rem; }
    .teacher-register-cta div { display: flex; flex-direction: column; gap: 2px; }
    .teacher-register-cta strong { font-size: var(--text-sm); color: var(--text-primary); }
    .teacher-register-cta a {
      font-size: var(--text-sm); font-weight: 600; text-decoration: none;
      color: #10b981; transition: opacity 0.2s;
    }
    .teacher-register-cta a:hover { opacity: 0.8; }
    .spinner {
      width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff; border-radius: 50%;
      animation: spin 0.6s linear infinite; display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    /* Role Selection Styles */
    .back-btn {
      background: none; border: none; color: var(--text-secondary);
      font-size: var(--text-sm); cursor: pointer; padding: 0; margin-bottom: var(--space-3);
    }
    .back-btn:hover { color: var(--text-primary); }
    .role-options { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-6); }
    .role-card {
      display: flex; align-items: center; gap: var(--space-4);
      padding: var(--space-4); border-radius: var(--radius-lg);
      border: 2px solid var(--border-color); background: var(--bg-surface);
      cursor: pointer; transition: all 0.2s; text-align: left;
    }
    .role-card:hover { border-color: var(--color-primary); background: var(--bg-surface-hover); }
    .role-card.selected { border-color: var(--color-primary); background: rgba(59,130,246,0.08); }
    .role-avatar {
      width: 48px; height: 48px; border-radius: var(--radius-full);
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      color: #fff; display: flex; align-items: center; justify-content: center;
      font-weight: 600; font-size: var(--text-lg); flex-shrink: 0;
    }
    .role-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .role-info strong { font-size: var(--text-base); color: var(--text-primary); }
    .role-badge {
      font-size: var(--text-xs); color: var(--color-primary); font-weight: 600;
      background: rgba(59,130,246,0.1); padding: 2px 8px; border-radius: 12px;
      width: fit-content;
    }
    .school-name { font-size: var(--text-sm); color: var(--text-muted); }
    .role-check {
      width: 24px; height: 24px; border-radius: 50%;
      background: var(--color-primary); color: #fff;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; opacity: 0; transition: opacity 0.2s;
    }
    .role-check.visible { opacity: 1; }
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
