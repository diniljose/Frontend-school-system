import { Component, inject, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
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
    <div class="auth-wrapper">
      <!-- Animated Background Canvas -->
      <div class="bg-canvas">
        <div class="gradient-bg"></div>
        <div class="particle" style="--x: 15%; --y: 20%; --delay: 0s;"></div>
        <div class="particle" style="--x: 85%; --y: 70%; --delay: 2s;"></div>
        <div class="particle" style="--x: 25%; --y: 80%; --delay: 4s;"></div>
        <div class="particle" style="--x: 75%; --y: 15%; --delay: 1s;"></div>
      </div>

      <!-- Main Content Container -->
      <div class="content-container">
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="hero-wrapper">
            <div class="glow-sphere"></div>
            <div class="auth-image-card">
              <img src="assets/mobile-Login-Image.png" alt="Login Visual" class="auth-card-image" />
            </div>
          </div>
          <div class="floating-elements">
               <div class="float-card" style="--duration: 7.5s; --delay: 1.5s; --x: 120px; --y: 20px;">
           
               <div class="float-icon">👥</div>
                <span>Students</span>
      
            </div>
            <div class="float-card" style="--duration: 7s; --delay: 1s; --x: 100px; --y: 60px;">
              <div class="float-icon">👨‍🏫</div>
              <span>Teachers</span>
            </div>
            <div class="float-card" style="--duration: 8s; --delay: 2s; --x: 80px; --y: -70px;">
              <div class="float-icon">✓</div>
              <span>Attendance</span>
            </div>
            <div class="float-card" style="--duration: 6.5s; --delay: 0.5s; --x: -60px; --y: 80px;">
              <div class="float-icon">📝</div>
              <span>Exams</span>
            </div>
        
            <div class="float-card" style="--duration: 6s; --delay: 0s; --x: -80px; --y: -40px;">
                <div class="float-icon">💰</div>
                     <span>Fees</span>
            </div>
            <div class="float-card" style="--duration: 8.5s; --delay: 2.5s; --x: -100px; --y: 40px;">
              <div class="float-icon">📊</div>
              <span>Reports</span>
            </div>
          </div>
          <svg class="connection-lines" viewBox="0 0 400 400" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.6"/>
                <stop offset="100%" stop-color="#6366f1" stop-opacity="0.1"/>
              </linearGradient>
            </defs>
            <path class="connection-path" d="M 200 100 Q 300 200 320 350" stroke="url(#lineGrad)" stroke-width="1.5" fill="none"/>
            <path class="connection-path" d="M 200 100 Q 100 200 80 350" stroke="url(#lineGrad)" stroke-width="1.5" fill="none"/>
            <path class="connection-path" d="M 200 100 L 200 350" stroke="url(#lineGrad)" stroke-width="1" fill="none" opacity="0.3"/>
          </svg>
        </div>

        <!-- Glassmorphic Auth Card -->
        <div class="premium-auth-card glass-card" [class.selecting-role]="showRoleSelection()">
      <!-- Role Selection Step -->
      @if (showRoleSelection()) {
        <div class="auth-section role-selection">
          <button class="back-button" (click)="backToLogin()">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>{{ 'auth.back_to_login' | translate }}</span>
          </button>
          
          <div class="card-header">
            <div class="header-icon role-select-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <h1>{{ 'auth.choose_account' | translate }}</h1>
            <p>{{ 'auth.multiple_accounts_msg' | translate }}</p>
          </div>

          <div class="role-options-grid">
            @for (option of roleOptions(); track option.userId) {
              <button class="role-option-card" 
                      [class.selected]="selectedOption()?.userId === option.userId"
                      (click)="selectOption(option)">
                <div class="role-avatar-premium">
                  <span>{{ option.firstName.charAt(0) }}{{ option.lastName.charAt(0) }}</span>
                </div>
                <div class="role-details">
                  <strong class="role-name">{{ option.firstName }} {{ option.lastName }}</strong>
                  <span class="role-badge-premium">{{ option.displayRole }}</span>
                  <span class="role-school">{{ option.schoolName }}</span>
                </div>
                <div class="role-selector">
                  <div class="selector-ring"></div>
                  <svg class="selector-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              </button>
            }
          </div>

          <button class="premium-submit-btn" 
                  [disabled]="!selectedOption() || loading()"
                  (click)="loginWithSelectedRole()">
            @if (loading()) {
              <span class="btn-spinner"></span>
            }
            <span>{{ 'auth.continue_as' | translate }} {{ selectedOption()?.displayRole || '' }}</span>
            <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      } @else {
        <!-- Normal Login Step -->
        <div class="auth-section login-form">
          <div class="card-header">
            <div class="header-icon">
              <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                <path d="M14 34V20l10-7 10 7v14" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M20 34v-8h8v8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="24" cy="16" r="2" fill="currentColor" opacity="0.6"/>
              </svg>
            </div>
            <h1>{{ 'auth.welcome_back' | translate }}</h1>
            <p>{{ 'auth.login_subtitle' | translate }}</p>
          </div>

          <form (ngSubmit)="onSubmit()" class="premium-form">
            <!-- Email Input -->
            <div class="premium-input-group" [class.focused]="emailFocused()" [class.has-value]="email">
              <div class="input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <input 
                #emailInput
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

            <!-- Password Input -->
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

            <!-- Form Options -->
            <div class="form-options">
              <label class="premium-checkbox">
                <input type="checkbox" [(ngModel)]="rememberMe" name="remember" />
                <span class="checkbox-indicator"></span>
                <span class="checkbox-text">{{ 'auth.remember_me' | translate }}</span>
              </label>
              <a routerLink="/auth/forgot-password" class="forgot-link">
                {{ 'auth.forgot_password' | translate }}
              </a>
            </div>

            <!-- Submit Button -->
            <button type="submit" class="premium-submit-btn" [disabled]="loading()">
              @if (loading()) {
                <span class="btn-spinner"></span>
              }
              <span>{{ 'auth.sign_in' | translate }}</span>
              <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </form>

          <!-- Divider -->
          <div class="premium-divider">
            <span>{{ 'auth.or' | translate }}</span>
          </div>

          <!-- Registration CTAs -->
          <div class="registration-cta-grid">
            <a routerLink="/auth/register-student" class="cta-card">
              <div class="cta-icon student">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
              </div>
              <div class="cta-content">
                <span class="cta-title">{{ 'auth.student_register_title' | translate }}</span>
                <span class="cta-description">{{ 'auth.student_register_desc' | translate }}</span>
              </div>
              <svg class="cta-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>

            <a routerLink="/auth/register-teacher" class="cta-card">
              <div class="cta-icon teacher">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div class="cta-content">
                <span class="cta-title">{{ 'auth.teacher_register_title' | translate }}</span>
                <span class="cta-description">{{ 'auth.teacher_register_desc' | translate }}</span>
              </div>
              <svg class="cta-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </a>
          </div>

          <!-- Footer -->
          <p class="auth-footer">
            {{ 'auth.admin_register_prompt' | translate }}
            <a routerLink="/auth/register" class="register-link">{{ 'auth.register_school' | translate }}</a>
          </p>
        </div>
      }
        </div>
        <!-- End Auth Form Card -->
      </div>
      <!-- End Content Container -->
    </div>
    <!-- End Auth Wrapper -->
  `,
  styles: [`
    /* ═══════════════════════════════════════════════════════════════════════════════
       COMPONENT HOST & ROOT STYLES
    ═══════════════════════════════════════════════════════════════════════════════ */
    :host {
      display: block;
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       AUTH WRAPPER - Immersive Container
    ═══════════════════════════════════════════════════════════════════════════════ */
    .auth-wrapper {
      width: 100%;
      height: 100vh;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      margin: 0;
      padding: 0;
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       BACKGROUND CANVAS - Immersive Gradient & Particles
    ═══════════════════════════════════════════════════════════════════════════════ */
    .bg-canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      z-index: 0;
    }

    .gradient-bg {
      position: absolute;
      inset: 0;
      // background: linear-gradient(135deg, 
      //   #b4a9f3 0%,
      //   #f0e8ff 20%,
      //   #f5ebff 40%,
      //   #e8dcf9 60%,
      //   #ddd4f5 80%,
      //   #e5dcff 100%);
      animation: gradientShift 15s ease infinite;
    }

    @keyframes gradientShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }

    .particle {
      position: absolute;
      width: 80px;
      height: 80px;
      left: var(--x);
      top: var(--y);
      background: radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent 70%);
      border-radius: 50%;
      filter: blur(40px);
      animation: floatParticle 20s ease-in-out infinite;
      animation-delay: var(--delay);
      z-index: 1;
    }

    @keyframes floatParticle {
      0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
      50% { transform: translate(20px, 30px) scale(1.2); opacity: 0.6; }
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       CONTENT CONTAINER - Main Layout
    ═══════════════════════════════════════════════════════════════════════════════ */
    .content-container {
      position: relative;
      z-index: 10;
      border-radius: 32px;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.8);
      display: grid;
      grid-template-columns: 1fr;
      grid-template-rows: .2fr .8fr;
      align-items: center;
      justify-items: center;
      gap: clamp(20px, 4vw, 40px);
      padding: clamp(12px, 5vw, 30px);
      animation: contentFadeIn 0.8s ease-out both;
      overflow-y: auto;
    }

    @keyframes contentFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       HERO SECTION - Left Side with Floating Elements
    ═══════════════════════════════════════════════════════════════════════════════ */
    .hero-section {
      position: relative;
      grid-column: 1;
      grid-row: 1;
      width: 100%;
      min-height: clamp(180px, 35vh, 350px);
      display: grid;
      align-items: center;
      justify-items: center;
      max-width: 500px;
    }

    .hero-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      display: grid;
      align-items: center;
      justify-items: center;
    }

    .glow-sphere {
      position: absolute;
      width: clamp(180px, 35vw, 350px);
      height: clamp(180px, 35vw, 350px);
      background: radial-gradient(circle, rgba(139, 92, 246, 0.2), transparent 70%);
      border-radius: 50%;
      filter: blur(70px);
      animation: glowPulse 4s ease-in-out infinite;
      z-index: 0;
      opacity: 0.6;
    }

    @keyframes glowPulse {
      0%, 100% { transform: scale(1); opacity: 0.5; }
      50% { transform: scale(1.1); opacity: 0.8; }
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       IMAGE CARD - Hero Illustration
    ═══════════════════════════════════════════════════════════════════════════════ */
    .auth-image-card {
      position: relative;
      width: clamp(200px, 100%, 450px);
      height: auto;
      aspect-ratio: 1 / 1;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: heroImageEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      z-index: 5;
      filter: drop-shadow(0 20px 50px rgba(139, 92, 246, 0.25));
      overflow: visible;
    }

    @keyframes heroImageEntrance {
      from {
        opacity: 0;
        transform: translateY(-40px) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .auth-card-image {
      width: 100%;
      height: 100%;
      display: block;
      border-radius: 24px;
      object-fit: contain;
      user-select: none;
      pointer-events: none;
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       PREMIUM AUTH CARD - Glassmorphic
    ═══════════════════════════════════════════════════════════════════════════════ */
    .premium-auth-card {
      position: relative;
      grid-column: 1;
      grid-row: 2;
      width: 100%;
      max-width: 500px;
      min-height: auto;
      max-height: calc(100vh - 300px);
      overflow-y: auto;
      overflow-x: hidden;
      animation: glassCardEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
      border-radius: 24px;
      padding: clamp(24px, 4vw, 40px);
      backdrop-filter: blur(0px);
      -webkit-backdrop-filter: blur(0px);
      background: transparent;
      border: none;
      box-shadow: none;
      z-index: 20;
    }

    .premium-auth-card.glass-card {
      background: transparent;
      backdrop-filter: blur(0px);
      border: none;
    }
    
    @keyframes glassCardEntrance {
      from {
        opacity: 0;
        transform: translateX(60px) scale(0.9);
        backdrop-filter: blur(0px);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
        backdrop-filter: blur(40px);
      }
    }
    
    .auth-section {
      animation: sectionFade 0.4s ease-out both;
    }
    
    @keyframes sectionFade {
      from {
        opacity: 0;
        transform: translateX(20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       CARD HEADER
    ═══════════════════════════════════════════════════════════════════════════════ */
    .card-header {
      margin-bottom: 28px;
      animation: headerEntrance 0.5s ease-out 0.1s both;
    }
    
    @keyframes headerEntrance {
      from {
        opacity: 0;
        transform: translateY(-16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .header-icon {
      width: 50px;
      height: 50px;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.08));
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 12px;
      color: var(--color-primary);
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.1));
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      &:hover::before {
        opacity: 1;
      }
    }
    
    .header-icon.role-select-icon {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.08));
      color: #10b981;
    }
    
    .card-header h1 {
      font-size: 1.625rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.03em;
      margin-bottom: 4px;
      line-height: 1.2;
    }
    
    .card-header p {
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.4;
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       PREMIUM FORM INPUTS
    ═══════════════════════════════════════════════════════════════════════════════ */
    .premium-form {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }
    
    .premium-input-group {
      position: relative;
      animation: inputEntrance 0.5s ease-out both;
      
      &:nth-child(1) { animation-delay: 0.15s; }
      &:nth-child(2) { animation-delay: 0.2s; }
    }
    
    @keyframes inputEntrance {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .premium-input {
      width: 100%;
      height: 56px;
      padding: 20px 16px 8px;
      padding-left: 48px;
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 14px;
      outline: none;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      
      &::placeholder {
        opacity: 0;
      }
    }
    
    .premium-input-group .input-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      transition: all 0.3s;
      z-index: 1;
      width: 16px;
      height: 16px;
    }
    
    .floating-label {
      position: absolute;
      left: 48px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 14px;
      color: var(--text-muted);
      pointer-events: none;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform-origin: left center;
      background: rgba(255, 255, 255, 0.7);
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
    
    /* Focused State */
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
      top: 8px;
      transform: translateY(0) scale(0.75);
      color: var(--color-primary);
      font-weight: 600;
    }
    
    .premium-input-group.focused .input-highlight {
      width: calc(100% - 32px);
    }
    
    /* Toggle Password */
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
      
      &:active {
        transform: translateY(-50%) scale(0.95);
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       FORM OPTIONS
    ═══════════════════════════════════════════════════════════════════════════════ */
    .form-options {
      display: grid;
      grid-template-columns: auto 1fr;
      align-items: center;
      gap: 8px;
      animation: inputEntrance 0.5s ease-out 0.25s both;
    }
    
    .premium-checkbox {
      display: grid;
      grid-template-columns: auto auto;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      user-select: none;
      
      input[type="checkbox"] {
        display: none;
        
        &:checked + .checkbox-indicator {
          background: var(--color-primary);
          border-color: var(--color-primary);
          
          &::after {
            opacity: 1;
            transform: scale(1) rotate(45deg);
          }
        }
      }
      
      .checkbox-indicator {
        width: 22px;
        height: 22px;
        border: 2px solid var(--border-color);
        border-radius: 7px;
        position: relative;
        transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        flex-shrink: 0;
        
        &::after {
          content: '';
          position: absolute;
          left: 6px;
          top: 2px;
          width: 6px;
          height: 12px;
          border: solid #fff;
          border-width: 0 2.5px 2.5px 0;
          opacity: 0;
          transform: scale(0) rotate(45deg);
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        &:hover {
          border-color: var(--color-primary);
        }
      }
      
      .checkbox-text {
        font-size: 12px;
        color: var(--text-secondary);
      }
    }
    
    .forgot-link {
      font-size: 12px;
      font-weight: 600;
      color: var(--color-primary);
      text-decoration: none;
      transition: all 0.2s;
      padding: 2px 0;
      position: relative;
      white-space: nowrap;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background: var(--color-primary);
        transition: width 0.3s ease;
      }
      
      &:hover::after {
        width: 100%;
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       PREMIUM SUBMIT BUTTON
    ═══════════════════════════════════════════════════════════════════════════════ */
    .premium-submit-btn {
      position: relative;
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
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      animation: inputEntrance 0.5s ease-out 0.3s both;
      flex-shrink: 0;
      
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transform: translateX(-100%);
        transition: transform 0.6s ease;
      }
      
      &:hover:not(:disabled) {
        transform: translateY(-3px);
        box-shadow: 
          0 10px 30px rgba(79, 70, 229, 0.4),
          0 4px 12px rgba(79, 70, 229, 0.2);
        background-position: 100% 50%;
        
        &::before {
          transform: translateX(100%);
        }
        
        .btn-icon {
          transform: translateX(4px);
        }
      }
      
      &:active:not(:disabled) {
        transform: translateY(-1px) scale(0.98);
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
      
      .btn-spinner {
        width: 22px;
        height: 22px;
        border: 2.5px solid rgba(255,255,255,0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      
      .btn-icon {
        transition: transform 0.3s;
      }
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       DIVIDER
    ═══════════════════════════════════════════════════════════════════════════════ */
    .premium-divider {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 28px 0;
      animation: inputEntrance 0.5s ease-out 0.35s both;
      
      &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--border-color), transparent);
      }
      
      span {
        font-size: 10px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       REGISTRATION CTA CARDS
    ═══════════════════════════════════════════════════════════════════════════════ */
    .registration-cta-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      animation: inputEntrance 0.5s ease-out 0.4s both;
    }
    
    .cta-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(10px);
      text-decoration: none;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, transparent, rgba(99, 102, 241, 0.03));
        opacity: 0;
        transition: opacity 0.3s;
      }
      
      &:hover {
        border-color: var(--color-primary);
        transform: translateX(6px);
        box-shadow: 0 4px 20px rgba(99, 102, 241, 0.1);
        
        &::before {
          opacity: 1;
        }
        
        .cta-arrow {
          transform: translateX(4px);
          color: var(--color-primary);
        }
        
        .cta-icon {
          transform: scale(1.05);
        }
      }
      
      &:active {
        transform: translateX(6px) scale(0.98);
      }
    }
    
    .cta-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: transform 0.3s;
      
      svg {
        width: 18px;
        height: 18px;
      }
      
      &.student {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05));
        color: #10b981;
      }
      
      &.teacher {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.05));
        color: #3b82f6;
      }
    }
    
    .cta-content {
      flex: 1;
      min-width: 0;
      
      .cta-title {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 2px;
      }
      
      .cta-description {
        display: block;
        font-size: 11px;
        color: var(--text-muted);
      }
    }
    
    .cta-arrow {
      color: var(--text-muted);
      transition: all 0.3s;
      flex-shrink: 0;
      width: 16px;
      height: 16px;
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       FOOTER
    ═══════════════════════════════════════════════════════════════════════════════ */
    .auth-footer {
      text-align: center;
      margin-top: 28px;
      font-size: 14px;
      color: var(--text-secondary);
      animation: inputEntrance 0.5s ease-out 0.45s both;
      
      .register-link {
        font-weight: 600;
        color: var(--color-primary);
        text-decoration: none;
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--color-primary);
          transition: width 0.3s ease;
        }
        
        &:hover::after {
          width: 100%;
        }
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       ROLE SELECTION
    ═══════════════════════════════════════════════════════════════════════════════ */
    .back-button {
      display: grid;
      grid-template-columns: auto auto;
      align-items: center;
      gap: 8px;
      background: none;
      border: none;
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      padding: 8px 0;
      margin-bottom: 20px;
      transition: all 0.2s;
      
      &:hover {
        color: var(--text-primary);
        
        svg {
          transform: translateX(-3px);
        }
      }
      
      svg {
        transition: transform 0.2s;
      }
    }
    
    .role-options-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      margin-bottom: 28px;
    }
    
    .role-option-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 14px;
      padding: 16px 18px;
      border-radius: 16px;
      border: 2px solid var(--border-color);
      background: var(--bg-surface);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      text-align: left;
      width: 100%;
      
      &:hover {
        border-color: var(--color-primary);
        background: var(--bg-surface-hover);
        transform: translateX(4px);
      }
      
      &.selected {
        border-color: var(--color-primary);
        background: rgba(99, 102, 241, 0.06);
        
        .role-selector .selector-ring {
          border-color: var(--color-primary);
          background: var(--color-primary);
        }
        
        .role-selector .selector-check {
          opacity: 1;
          transform: scale(1);
        }
      }
    }
    
    .role-avatar-premium {
      width: 50px;
      height: 50px;
      border-radius: 14px;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 16px;
      flex-shrink: 0;
    }
    
    .role-details {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr;
      gap: 4px;
      
      .role-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary);
      }
      
      .role-badge-premium {
        font-size: 12px;
        font-weight: 600;
        color: var(--color-primary);
        background: rgba(99, 102, 241, 0.1);
        padding: 3px 10px;
        border-radius: 8px;
        width: fit-content;
      }
      
      .role-school {
        font-size: 13px;
        color: var(--text-muted);
      }
    }
    
    .role-selector {
      position: relative;
      width: 26px;
      height: 26px;
      flex-shrink: 0;
      
      .selector-ring {
        width: 100%;
        height: 100%;
        border: 2px solid var(--border-color);
        border-radius: 50%;
        transition: all 0.25s;
      }
      
      .selector-check {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) scale(0);
        color: #fff;
        opacity: 0;
        transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       FLOATING EDUCATIONAL ELEMENTS
    ═══════════════════════════════════════════════════════════════════════════════ */
    .floating-elements {
      position: absolute;
      inset: -100px;
      pointer-events: none;
      display: grid;
    }

    .float-card {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      animation: floatElement var(--duration) ease-in-out infinite;
      animation-delay: var(--delay);
      opacity: 0.6;
      backdrop-filter: blur(10px);
      background: rgba(255, 255, 255, 0.15);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-secondary);
      z-index: 3;
      transform-origin: center;
    }

    @keyframes floatElement {
      0%, 100% {
        transform: translateY(0) translateX(0) rotate(-2deg);
        opacity: 0.4;
      }
      50% {
        transform: translateY(var(--y)) translateX(var(--x)) rotate(2deg);
        opacity: 0.8;
      }
    }

    .float-icon {
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 32px;
    }

    /* Connection Lines */
    .connection-lines {
      position: absolute;
      width: 100%;
      height: 100%;
      top: 0;
      left: 0;
      z-index: 2;
      pointer-events: none;
    }

    .connection-path {
      stroke-dasharray: 200;
      stroke-dashoffset: 200;
      animation: drawConnection 3s ease-out forwards;
    }

    .connection-path:nth-child(2) {
      animation-delay: 0.2s;
    }

    .connection-path:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes drawConnection {
      from {
        stroke-dashoffset: 200;
        opacity: 0;
      }
      to {
        stroke-dashoffset: 0;
        opacity: 1;
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       MOBILE RESPONSIVE - Stacked Layout
    ═══════════════════════════════════════════════════════════════════════════════ */
    @media (max-width: 1024px) {
      .content-container {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto;
        gap: clamp(16px, 4vw, 30px);
        padding-top: clamp(12px, 3vh, 20px);
        justify-items: center;
      }

      .hero-section {
        grid-column: 1;
        grid-row: 1;
        min-height: clamp(160px, 30vh, 300px);
        max-width: 100%;
      }

      .glow-sphere {
        width: clamp(150px, 30vw, 280px);
        height: clamp(150px, 30vw, 280px);
      }

      .premium-auth-card {
        grid-column: 1;
        grid-row: 2;
        max-width: 100%;
        max-height: none;
        width: 100%;
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       TABLET RESPONSIVE
    ═══════════════════════════════════════════════════════════════════════════════ */
    @media (max-width: 768px) {
      .content-container {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto;
        padding: clamp(12px, 3vw, 20px);
        gap: clamp(12px, 3vw, 24px);
        justify-items: center;
      }

      .hero-section {
        grid-column: 1;
        grid-row: 1;
        min-height: clamp(140px, 25vh, 260px);
        max-width: 100%;
      }

      .glow-sphere {
        width: clamp(120px, 25vw, 220px);
        height: clamp(120px, 25vw, 220px);
      }

      .auth-image-card {
        width: clamp(160px, 85%, 280px);
      }

      .floating-elements {
        inset: clamp(-30px, -8vw, -50px);
      }

      .float-card {
        font-size: 9px;
        padding: 6px 10px;
      }

      .float-icon {
        font-size: 18px;
        height: 24px;
      }

      .premium-auth-card {
        grid-column: 1;
        grid-row: 2;
        padding: clamp(16px, 3vw, 28px);
        max-width: 100%;
      }
    }

    @media (max-width: 480px) {
      .content-container {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto;
        padding: clamp(8px, 2vw, 12px);
        gap: clamp(8px, 2vw, 16px);
        justify-items: center;
      }

      .hero-section {
        grid-column: 1;
        grid-row: 1;
        min-height: clamp(120px, 22vh, 200px);
        max-width: 100%;
      }

      .glow-sphere {
        width: clamp(100px, 20vw, 160px);
        height: clamp(100px, 20vw, 160px);
      }

      .auth-image-card {
        width: clamp(140px, 80%, 200px);
      }

      .floating-elements {
        inset: clamp(-20px, -5vw, -30px);
      }

      .float-card {
        font-size: 8px;
        padding: 4px 8px;
      }

      .float-icon {
        font-size: 14px;
        height: 18px;
      }

      .premium-auth-card {
        grid-column: 1;
        grid-row: 2;
        padding: clamp(12px, 2vw, 20px);
        max-width: 100%;
      }
    }

    /* ═══════════════════════════════════════════════════════════════════════════════
       REDUCED MOTION
    ═══════════════════════════════════════════════════════════════════════════════ */
    @media (prefers-reduced-motion: reduce) {
      .auth-wrapper,
      .auth-image-card,
      .premium-auth-card,
      .auth-section,
      .card-header,
      .premium-input-group,
      .form-options,
      .premium-submit-btn,
      .premium-divider,
      .registration-cta-grid,
      .auth-footer {
        animation: none !important;
        opacity: 1;
        transform: none;
      }
      
      .auth-card-image,
      .premium-input,
      .toggle-password,
      .cta-card,
      .role-option-card,
      .premium-submit-btn {
        transition: none !important;
      }
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
  
  // Focus states for premium inputs
  emailFocused = signal(false);
  passwordFocused = signal(false);
  
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
    
    // Reload auth state and navigate via Angular router (avoids full page reload)
    this.auth.loadUser();
    this.router.navigate(['/dashboard']);
  }
}
