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
    <div class="premium-auth-card">
      <div class="auth-section">
        <div class="card-header">
          <div class="header-icon school-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <h1>{{ 'auth.register' | translate }}</h1>
          <p>{{ 'auth.register_subtitle' | translate }}</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="premium-form">
          <!-- Name Row -->
          <div class="form-row">
            <div class="premium-input-group" [class.focused]="firstNameFocused()" [class.has-value]="firstName">
              <input 
                type="text" 
                class="premium-input" 
                [(ngModel)]="firstName" 
                name="firstName" 
                placeholder=" "
                required
                (focus)="firstNameFocused.set(true)"
                (blur)="firstNameFocused.set(false)" />
              <label class="floating-label">{{ 'auth.first_name' | translate }}</label>
              <div class="input-highlight"></div>
            </div>
            <div class="premium-input-group" [class.focused]="lastNameFocused()" [class.has-value]="lastName">
              <input 
                type="text" 
                class="premium-input" 
                [(ngModel)]="lastName" 
                name="lastName" 
                placeholder=" "
                required
                (focus)="lastNameFocused.set(true)"
                (blur)="lastNameFocused.set(false)" />
              <label class="floating-label">{{ 'auth.last_name' | translate }}</label>
              <div class="input-highlight"></div>
            </div>
          </div>

          <!-- Email -->
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
              (focus)="emailFocused.set(true)"
              (blur)="emailFocused.set(false)" />
            <label class="floating-label">{{ 'auth.email' | translate }}</label>
            <div class="input-highlight"></div>
          </div>

          <!-- Password -->
          <div class="premium-input-group" [class.focused]="passwordFocused()" [class.has-value]="password">
            <div class="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <input 
              [type]="showPassword() ? 'text' : 'password'" 
              class="premium-input has-icon" 
              [(ngModel)]="password"
              name="password" 
              placeholder=" "
              required 
              minlength="8"
              (focus)="passwordFocused.set(true)"
              (blur)="passwordFocused.set(false)" />
            <label class="floating-label">{{ 'auth.password' | translate }}</label>
            <button type="button" class="toggle-password" (click)="showPassword.set(!showPassword())">
              @if (showPassword()) {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              } @else {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              }
            </button>
            <div class="input-highlight"></div>
          </div>
          
          <!-- Password Strength -->
          @if (password.length > 0) {
            <div class="password-strength">
              <div class="strength-bar">
                <div class="strength-fill" [style.width.%]="passwordStrength()" [class]="strengthClass()"></div>
              </div>
              <div class="strength-requirements">
                <span [class.met]="password.length >= 8">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  8+ characters
                </span>
                <span [class.met]="hasUpperLower()">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Upper & lowercase
                </span>
                <span [class.met]="hasNumber()">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Number
                </span>
                <span [class.met]="hasSpecial()">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Special character
                </span>
              </div>
            </div>
          }

          <!-- Confirm Password -->
          <div class="premium-input-group" [class.focused]="confirmPasswordFocused()" [class.has-value]="confirmPassword" [class.has-error]="confirmPassword && confirmPassword !== password">
            <div class="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <input 
              type="password" 
              class="premium-input has-icon" 
              [(ngModel)]="confirmPassword" 
              name="confirmPassword"
              placeholder=" "
              required
              (focus)="confirmPasswordFocused.set(true)"
              (blur)="confirmPasswordFocused.set(false)" />
            <label class="floating-label">{{ 'auth.confirm_password' | translate }}</label>
            @if (confirmPassword && confirmPassword === password) {
              <div class="validation-badge valid">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
            }
            <div class="input-highlight"></div>
          </div>
          @if (confirmPassword && confirmPassword !== password) {
            <span class="field-error">{{ 'auth.passwords_no_match' | translate }}</span>
          }

          <!-- School Name -->
          <div class="premium-input-group" [class.focused]="schoolNameFocused()" [class.has-value]="schoolName">
            <div class="input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <input 
              type="text" 
              class="premium-input has-icon" 
              [(ngModel)]="schoolName" 
              name="schoolName" 
              placeholder=" "
              required
              (focus)="schoolNameFocused.set(true)"
              (blur)="schoolNameFocused.set(false)" />
            <label class="floating-label">{{ 'auth.school_name' | translate }}</label>
            <div class="input-highlight"></div>
          </div>

          <button type="submit" class="premium-submit-btn" [disabled]="loading() || confirmPassword !== password">
            @if (loading()) {
              <span class="btn-spinner"></span>
            }
            <span>{{ 'auth.sign_up' | translate }}</span>
            <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </form>

        <p class="auth-footer">
          {{ 'auth.have_account' | translate }}
          <a routerLink="/auth/login" class="login-link">{{ 'auth.login' | translate }}</a>
        </p>

        <div class="guide-cta">
          <a routerLink="/guide" class="guide-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
            <span>{{ 'auth.setup_guide_cta' | translate }}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .premium-auth-card {
      width: 100%;
      max-width: 520px;
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
      margin-bottom: 28px;
    }
    
    .header-icon {
      width: 60px;
      height: 60px;
      border-radius: 18px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.08));
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      color: var(--color-primary);
    }
    
    .header-icon.school-icon {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.08));
      color: #10b981;
    }
    
    .card-header h1 {
      font-size: 1.875rem;
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

    .premium-form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }

    .premium-input-group {
      position: relative;
    }
    
    .premium-input {
      width: 100%;
      height: 56px;
      padding: 20px 16px 8px;
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      background: var(--bg-surface);
      border: 2px solid var(--border-color);
      border-radius: 14px;
      outline: none;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      
      &::placeholder { opacity: 0; }
      
      &.has-icon {
        padding-left: 48px;
      }
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
      left: 16px;
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
    
    .premium-input-group .premium-input.has-icon ~ .floating-label {
      left: 48px;
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
    
    .premium-input-group.focused .premium-input,
    .premium-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
    }
    
    .premium-input-group.focused .input-icon {
      color: var(--color-primary);
    }
    
    .premium-input-group.focused .floating-label,
    .premium-input-group.has-value .floating-label {
      top: 6px;
      transform: translateY(0) scale(0.75);
      color: var(--color-primary);
      font-weight: 600;
    }
    
    .premium-input-group.focused .input-highlight {
      width: calc(100% - 28px);
    }
    
    .premium-input-group.has-error .premium-input {
      border-color: var(--color-danger);
    }
    
    .toggle-password {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      padding: 8px;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.2s;
      border-radius: 8px;
      
      &:hover {
        color: var(--text-primary);
        background: var(--bg-surface-hover);
      }
    }
    
    .validation-badge {
      position: absolute;
      right: 14px;
      top: 50%;
      transform: translateY(-50%);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &.valid {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
      }
    }
    
    .field-error {
      font-size: 12px;
      color: var(--color-danger);
      margin-top: -8px;
      padding-left: 4px;
    }

    .password-strength {
      margin-top: -8px;
    }
    
    .strength-bar {
      height: 4px;
      background: var(--border-color);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 10px;
    }
    
    .strength-fill {
      height: 100%;
      border-radius: 2px;
      transition: all 0.3s ease;
      
      &.weak { background: #ef4444; }
      &.medium { background: #f59e0b; }
      &.strong { background: #10b981; }
    }
    
    .strength-requirements {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      
      span {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        color: var(--text-muted);
        transition: color 0.2s;
        
        svg {
          opacity: 0.3;
          transition: all 0.2s;
        }
        
        &.met {
          color: #10b981;
          
          svg {
            opacity: 1;
            color: #10b981;
          }
        }
      }
    }

    .premium-submit-btn {
      width: 100%;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 25%, #8b5cf6 50%, #7c3aed 100%);
      background-size: 200% 200%;
      color: #fff;
      border: none;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      margin-top: 8px;
      
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

    .auth-footer {
      text-align: center;
      margin-top: 24px;
      font-size: 14px;
      color: var(--text-secondary);
      
      .login-link {
        font-weight: 600;
        color: var(--color-primary);
        text-decoration: none;
        
        &:hover { text-decoration: underline; }
      }
    }

    .guide-cta {
      margin-top: 20px;
    }
    
    .guide-link {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px 20px;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.04));
      border: 1px solid rgba(99, 102, 241, 0.15);
      color: var(--color-primary);
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      
      &:hover {
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.08));
        transform: translateY(-2px);
        
        svg:last-child { transform: translateX(4px); }
      }
      
      svg:last-child { transition: transform 0.3s; }
    }

    @media (max-width: 640px) {
      .premium-auth-card { padding: 0; }
      .card-header h1 { font-size: 1.5rem; }
      .form-row { grid-template-columns: 1fr; gap: 16px; }
      .premium-input { height: 52px; font-size: 16px; }
      .premium-submit-btn { height: 52px; }
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
  
  // Focus states
  firstNameFocused = signal(false);
  lastNameFocused = signal(false);
  emailFocused = signal(false);
  passwordFocused = signal(false);
  confirmPasswordFocused = signal(false);
  schoolNameFocused = signal(false);

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
  
  hasUpperLower(): boolean {
    return /[a-z]/.test(this.password) && /[A-Z]/.test(this.password);
  }
  
  hasNumber(): boolean {
    return /\d/.test(this.password);
  }
  
  hasSpecial(): boolean {
    return /[^a-zA-Z\d]/.test(this.password);
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
