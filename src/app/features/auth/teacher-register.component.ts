import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../environments/environment';

interface School {
  code: string;
  name: string;
  logo?: string;
  address?: string;
}

@Component({
  selector: 'app-teacher-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, TranslateModule],
  template: `
    <div class="premium-auth-card wizard-card">
      <div class="card-header">
        <div class="header-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <h1>Teacher Registration</h1>
        <p>Join your school as an educator</p>
      </div>

      @if (registrationComplete()) {
        <div class="success-section">
          <div class="success-icon-wrapper">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2>Registration Submitted!</h2>
          <p>Your registration has been submitted successfully.</p>
          
          <div class="registration-id-card">
            <span class="label">Employee ID</span>
            <span class="value">{{ submittedData()?.employeeId }}</span>
          </div>
          
          <p class="info-text">The school principal will review your registration. You will receive a notification once approved.</p>
          
          <a routerLink="/login" class="premium-submit-btn">
            <span>Back to Login</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>
      } @else {
        <!-- Premium Progress Steps -->
        <div class="premium-progress">
          <div class="progress-track">
            <div class="progress-fill" [style.width.%]="((step() - 1) / 2) * 100"></div>
          </div>
          <div class="progress-steps">
            @for (s of [1,2,3]; track s) {
              <div class="progress-step" [class.active]="step() >= s" [class.completed]="step() > s">
                <div class="step-marker">
                  @if (step() > s) {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  } @else {
                    {{ s }}
                  }
                </div>
                <span class="step-label">{{ ['School', 'Personal', 'Professional'][s-1] }}</span>
              </div>
            }
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <!-- Step 1: School Selection -->
          @if (step() === 1) {
            <div class="step-content">
              <div class="step-header">
                <h3>Select Your School</h3>
                <p>Choose the school you want to join</p>
              </div>
              
              @if (loadingSchools()) {
                <div class="loading-state">
                  <div class="premium-spinner"></div>
                  <p>Loading schools...</p>
                </div>
              } @else {
                <div class="school-grid">
                  @for (school of schools(); track school.code) {
                    <div 
                      class="premium-school-card" 
                      [class.selected]="selectedSchool()?.code === school.code"
                      (click)="selectSchool(school)">
                      <div class="school-avatar">
                        <span>{{ school.name.charAt(0) }}</span>
                      </div>
                      <div class="school-details">
                        <span class="school-name">{{ school.name }}</span>
                        <span class="school-code">{{ school.code }}</span>
                      </div>
                      <div class="selection-indicator">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                    </div>
                  } @empty {
                    <div class="empty-state">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      <p>No schools available for registration</p>
                    </div>
                  }
                </div>
                
                <div class="step-actions single">
                  <button type="button" class="premium-submit-btn" [disabled]="!selectedSchool()" (click)="nextStep()">
                    <span>Continue</span>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="5" y1="12" x2="19" y2="12"/>
                      <polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </button>
                </div>
              }
            </div>
          }

          <!-- Step 2: Personal Information -->
          @if (step() === 2) {
            <div class="step-content">
              <div class="step-header">
                <h3>Personal Information</h3>
                <p class="selected-info">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  </svg>
                  {{ selectedSchool()?.name }}
                </p>
              </div>
              
              <div class="form-grid">
                <div class="premium-input-group" [class.focused]="firstNameFocused()" [class.has-value]="form.get('firstName')?.value">
                  <div class="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <input type="text" class="premium-input has-icon" formControlName="firstName" placeholder=" "
                    (focus)="firstNameFocused.set(true)" (blur)="firstNameFocused.set(false)" />
                  <label class="floating-label">First Name *</label>
                </div>
                
                <div class="premium-input-group" [class.focused]="lastNameFocused()" [class.has-value]="form.get('lastName')?.value">
                  <div class="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <input type="text" class="premium-input has-icon" formControlName="lastName" placeholder=" "
                    (focus)="lastNameFocused.set(true)" (blur)="lastNameFocused.set(false)" />
                  <label class="floating-label">Last Name *</label>
                </div>
              </div>

              <div class="form-grid">
                <div class="premium-input-group" [class.focused]="emailFocused()" [class.has-value]="form.get('email')?.value">
                  <div class="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <input type="email" class="premium-input has-icon" formControlName="email" placeholder=" "
                    (focus)="emailFocused.set(true)" (blur)="emailFocused.set(false)" />
                  <label class="floating-label">Email *</label>
                </div>
                
                <div class="premium-input-group" [class.focused]="passwordFocused()" [class.has-value]="form.get('password')?.value">
                  <div class="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <input type="password" class="premium-input has-icon" formControlName="password" placeholder=" "
                    (focus)="passwordFocused.set(true)" (blur)="passwordFocused.set(false)" />
                  <label class="floating-label">Password *</label>
                </div>
              </div>

              <div class="form-grid">
                <div class="premium-input-group" [class.focused]="phoneFocused()" [class.has-value]="form.get('phone')?.value">
                  <div class="input-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </div>
                  <input type="tel" class="premium-input has-icon" formControlName="phone" placeholder=" "
                    (focus)="phoneFocused.set(true)" (blur)="phoneFocused.set(false)" />
                  <label class="floating-label">Phone Number</label>
                </div>
                
                <div class="premium-select-group" [class.has-value]="form.get('gender')?.value">
                  <select class="premium-select" formControlName="gender">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <label class="select-label">Gender</label>
                </div>
              </div>

              <div class="premium-input-group" [class.has-value]="form.get('dateOfBirth')?.value">
                <div class="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <input type="date" class="premium-input has-icon" formControlName="dateOfBirth" />
                <label class="floating-label static">Date of Birth</label>
              </div>

              <div class="step-actions">
                <button type="button" class="premium-back-btn" (click)="prevStep()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                  </svg>
                  <span>Back</span>
                </button>
                <button type="button" class="premium-submit-btn" [disabled]="!isStep2Valid()" (click)="nextStep()">
                  <span>Continue</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </div>
          }

          <!-- Step 3: Professional Information -->
          @if (step() === 3) {
            <div class="step-content">
              <div class="step-header">
                <h3>Professional Information</h3>
                <p>Tell us about your expertise</p>
              </div>
              
              <div class="form-grid">
                <div class="premium-select-group" [class.has-value]="form.get('designation')?.value">
                  <select class="premium-select" formControlName="designation">
                    <option value="">Select designation</option>
                    <option value="Teacher">Teacher</option>
                    <option value="Senior Teacher">Senior Teacher</option>
                    <option value="Head of Department">Head of Department</option>
                    <option value="Coordinator">Coordinator</option>
                  </select>
                  <label class="select-label">Designation</label>
                  <div class="select-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="8.5" cy="7" r="4"/>
                      <polyline points="17 11 19 13 23 9"/>
                    </svg>
                  </div>
                </div>
                
                <div class="premium-select-group" [class.has-value]="form.get('department')?.value">
                  <select class="premium-select" formControlName="department">
                    <option value="">Select department</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="Social Studies">Social Studies</option>
                    <option value="Languages">Languages</option>
                    <option value="Arts">Arts</option>
                    <option value="Physical Education">Physical Education</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Other">Other</option>
                  </select>
                  <label class="select-label">Department</label>
                  <div class="select-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="premium-input-group" [class.focused]="qualificationsFocused()" [class.has-value]="form.get('qualifications')?.value">
                <div class="input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="8" r="7"/>
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
                  </svg>
                </div>
                <input type="text" class="premium-input has-icon" formControlName="qualifications" placeholder=" "
                  (focus)="qualificationsFocused.set(true)" (blur)="qualificationsFocused.set(false)" />
                <label class="floating-label">Qualifications</label>
              </div>
              <p class="input-hint">e.g., M.Ed, B.Sc Math, PGCE (comma-separated)</p>

              <div class="premium-textarea-group" [class.focused]="messageFocused()" [class.has-value]="form.get('message')?.value">
                <textarea class="premium-textarea" formControlName="message" rows="3" placeholder=" "
                  (focus)="messageFocused.set(true)" (blur)="messageFocused.set(false)"></textarea>
                <label class="textarea-label">Message to Principal</label>
              </div>
              <p class="input-hint">Optional: Tell us why you want to join this school</p>

              <div class="step-actions">
                <button type="button" class="premium-back-btn" (click)="prevStep()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="19" y1="12" x2="5" y2="12"/>
                    <polyline points="12 19 5 12 12 5"/>
                  </svg>
                  <span>Back</span>
                </button>
                <button type="submit" class="premium-submit-btn" [disabled]="submitting()">
                  @if (submitting()) {
                    <span class="btn-spinner"></span>
                  }
                  <span>Submit Registration</span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        </form>

        @if (error()) {
          <div class="error-toast">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {{ error() }}
          </div>
        }

        <div class="auth-footer">
          <p>Already have an account? <a routerLink="/login">Sign in</a></p>
          <p>Are you a student? <a routerLink="/register-student">Register as Student</a></p>
        </div>
      }
    </div>
  `,
  styles: [`
    .premium-auth-card {
      width: 100%;
      max-width: 560px;
      animation: cardEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    
    .wizard-card { max-width: 600px; }
    
    @keyframes cardEntrance {
      from { opacity: 0; transform: translateY(24px) scale(0.96); }
      60% { transform: translateY(-4px) scale(1.01); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .card-header {
      text-align: center;
      margin-bottom: 24px;
    }
    
    .header-icon {
      width: 72px;
      height: 72px;
      border-radius: 20px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.08));
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      color: var(--color-primary);
    }
    
    .card-header h1 {
      font-size: 1.625rem;
      font-weight: 800;
      color: var(--text-primary);
      letter-spacing: -0.03em;
      margin-bottom: 6px;
    }
    
    .card-header p {
      font-size: 14px;
      color: var(--text-secondary);
    }

    /* Premium Progress */
    .premium-progress { margin-bottom: 28px; }
    
    .progress-track {
      height: 4px;
      background: var(--border-color);
      border-radius: 4px;
      margin-bottom: 16px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--color-primary), #8b5cf6);
      border-radius: 4px;
      transition: width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    
    .progress-steps {
      display: flex;
      justify-content: space-between;
    }
    
    .progress-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    
    .step-marker {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      font-weight: 700;
      background: var(--bg-muted);
      color: var(--text-muted);
      border: 2px solid var(--border-color);
      transition: all 0.3s ease;
    }
    
    .progress-step.active .step-marker {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: #fff;
    }
    
    .progress-step.completed .step-marker {
      background: #10b981;
      border-color: #10b981;
      color: #fff;
    }
    
    .step-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .progress-step.active .step-label { color: var(--color-primary); }

    /* Step Content */
    .step-content {
      animation: stepFade 0.4s ease-out both;
    }
    
    @keyframes stepFade {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    .step-header {
      margin-bottom: 24px;
      
      h3 {
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 4px;
      }
      
      p { font-size: 14px; color: var(--text-secondary); }
      
      .selected-info {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(99, 102, 241, 0.08);
        border-radius: 8px;
        font-size: 13px;
        color: var(--color-primary);
        
        svg { opacity: 0.7; }
      }
    }

    /* School Grid */
    .school-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 280px;
      overflow-y: auto;
      margin-bottom: 24px;
      padding-right: 8px;
      
      &::-webkit-scrollbar { width: 6px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 3px; }
    }
    
    .premium-school-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      background: var(--bg-surface);
      border: 2px solid var(--border-color);
      border-radius: 14px;
      cursor: pointer;
      transition: all 0.25s ease;
      
      &:hover {
        border-color: rgba(99, 102, 241, 0.4);
        transform: translateY(-2px);
      }
      
      &.selected {
        border-color: var(--color-primary);
        background: rgba(99, 102, 241, 0.04);
        
        .selection-indicator { opacity: 1; transform: scale(1); }
        .school-avatar { background: var(--color-primary); color: #fff; }
      }
    }
    
    .school-avatar {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1));
      color: var(--color-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 700;
      flex-shrink: 0;
      transition: all 0.3s;
    }
    
    .school-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      
      .school-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
      .school-code { font-size: 12px; color: var(--text-muted); }
    }
    
    .selection-indicator {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--color-primary);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transform: scale(0.7);
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    /* Form Grid */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    @media (max-width: 560px) { .form-grid { grid-template-columns: 1fr; } }

    /* Premium Inputs */
    .premium-input-group {
      position: relative;
      margin-bottom: 16px;
    }
    
    .premium-input {
      width: 100%;
      height: 56px;
      padding: 22px 16px 8px 16px;
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      background: var(--bg-surface);
      border: 2px solid var(--border-color);
      border-radius: 14px;
      outline: none;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      
      &.has-icon { padding-left: 48px; }
      &::placeholder { opacity: 0; }
    }
    
    .input-icon {
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
      left: 48px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 15px;
      color: var(--text-muted);
      pointer-events: none;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform-origin: left center;
      background: var(--bg-surface);
      padding: 0 6px;
      
      &.static {
        top: 10px;
        transform: translateY(0) scale(0.75);
        color: var(--text-muted);
        font-weight: 600;
      }
    }
    
    .premium-input-group.focused .premium-input,
    .premium-input:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
    }
    
    .premium-input-group.focused .input-icon { color: var(--color-primary); }
    
    .premium-input-group.focused .floating-label,
    .premium-input-group.has-value .floating-label {
      top: 10px;
      transform: translateY(0) scale(0.75);
      color: var(--color-primary);
      font-weight: 600;
    }
    
    .input-hint {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: -12px;
      margin-bottom: 16px;
      padding-left: 4px;
    }

    /* Premium Selects */
    .premium-select-group {
      position: relative;
      margin-bottom: 16px;
    }
    
    .premium-select {
      width: 100%;
      height: 56px;
      padding: 22px 16px 8px 48px;
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      background: var(--bg-surface);
      border: 2px solid var(--border-color);
      border-radius: 14px;
      outline: none;
      appearance: none;
      cursor: pointer;
      transition: all 0.3s;
      
      &:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
      }
    }
    
    .select-label {
      position: absolute;
      left: 48px;
      top: 10px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      pointer-events: none;
      background: var(--bg-surface);
      padding: 0 6px;
    }
    
    .select-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      pointer-events: none;
    }

    /* Premium Textarea */
    .premium-textarea-group {
      position: relative;
      margin-bottom: 16px;
    }
    
    .premium-textarea {
      width: 100%;
      min-height: 100px;
      padding: 32px 16px 12px;
      font-size: 15px;
      font-weight: 500;
      color: var(--text-primary);
      background: var(--bg-surface);
      border: 2px solid var(--border-color);
      border-radius: 14px;
      outline: none;
      resize: vertical;
      font-family: inherit;
      transition: all 0.3s;
      
      &::placeholder { opacity: 0; }
      
      &:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
      }
    }
    
    .textarea-label {
      position: absolute;
      left: 16px;
      top: 12px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      pointer-events: none;
      background: var(--bg-surface);
      padding: 0 6px;
    }
    
    .premium-textarea-group.focused .textarea-label {
      color: var(--color-primary);
    }

    /* Step Actions */
    .step-actions {
      display: flex;
      gap: 12px;
      margin-top: 28px;
      
      &.single { justify-content: stretch; }
    }
    
    .premium-back-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 0 24px;
      height: 52px;
      background: var(--bg-surface);
      border: 2px solid var(--border-color);
      border-radius: 14px;
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        border-color: var(--text-muted);
        svg { transform: translateX(-3px); }
      }
      
      svg { transition: transform 0.3s; }
    }
    
    .premium-submit-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      height: 52px;
      background: linear-gradient(135deg, #4f46e5 0%, #6366f1 25%, #8b5cf6 50%, #7c3aed 100%);
      background-size: 200% 200%;
      color: #fff;
      border: none;
      border-radius: 14px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(79, 70, 229, 0.35);
        svg:last-child { transform: translateX(4px); }
      }
      
      &:disabled { opacity: 0.5; cursor: not-allowed; }
      
      svg:last-child { transition: transform 0.3s; }
      
      .btn-spinner {
        width: 20px;
        height: 20px;
        border: 2.5px solid rgba(255,255,255,0.3);
        border-top-color: #fff;
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
    }
    
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 48px 24px;
      
      p { color: var(--text-secondary); font-size: 14px; margin-top: 16px; }
    }
    
    .premium-spinner {
      width: 44px;
      height: 44px;
      border: 3px solid var(--border-color);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: var(--text-muted);
      
      svg { margin-bottom: 16px; opacity: 0.5; }
      p { font-size: 14px; }
    }

    /* Success Section */
    .success-section {
      text-align: center;
      animation: successIn 0.5s ease-out both;
    }
    
    @keyframes successIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    
    .success-icon-wrapper {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.08));
      color: #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      animation: successPulse 2s ease-in-out infinite;
    }
    
    @keyframes successPulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.2); }
      50% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
    }
    
    .success-section h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #10b981;
      margin-bottom: 8px;
    }
    
    .success-section > p {
      color: var(--text-secondary);
      margin-bottom: 20px;
    }
    
    .registration-id-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 20px;
      background: var(--bg-muted);
      border-radius: 14px;
      margin-bottom: 20px;
      
      .label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .value {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text-primary);
        font-family: monospace;
      }
    }
    
    .info-text {
      font-size: 14px;
      color: var(--text-secondary);
      margin-bottom: 24px;
    }

    /* Error Toast */
    .error-toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 14px 18px;
      background: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 12px;
      margin-top: 20px;
      font-size: 14px;
      color: #dc2626;
      animation: shakeIn 0.4s ease-out;
    }
    
    @keyframes shakeIn {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-4px); }
      40%, 80% { transform: translateX(4px); }
    }

    /* Auth Footer */
    .auth-footer {
      text-align: center;
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border-color);
      
      p {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 8px;
        
        &:last-child { margin-bottom: 0; }
      }
      
      a {
        color: var(--color-primary);
        font-weight: 600;
        text-decoration: none;
        
        &:hover { text-decoration: underline; }
      }
    }

    @media (max-width: 560px) {
      .premium-auth-card { max-width: 100%; }
      .card-header h1 { font-size: 1.375rem; }
      .header-icon { width: 64px; height: 64px; }
      .step-marker { width: 28px; height: 28px; font-size: 12px; }
      .step-label { font-size: 10px; }
      .school-grid { max-height: 220px; }
      .step-actions { flex-direction: column-reverse; }
      .premium-back-btn { width: 100%; }
      .premium-submit-btn { width: 100%; }
    }
  `]
})
export class TeacherRegisterComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private readonly apiUrl = environment.apiUrl.replace(/\/+$/, '');

  step = signal(1);
  loadingSchools = signal(true);
  submitting = signal(false);
  registrationComplete = signal(false);
  error = signal('');
  
  // Focus states for premium inputs
  firstNameFocused = signal(false);
  lastNameFocused = signal(false);
  emailFocused = signal(false);
  passwordFocused = signal(false);
  phoneFocused = signal(false);
  qualificationsFocused = signal(false);
  messageFocused = signal(false);
  
  schools = signal<School[]>([]);
  selectedSchool = signal<School | null>(null);
  submittedData = signal<any>(null);

  form: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    phone: [''],
    gender: [''],
    dateOfBirth: [''],
    designation: [''],
    department: [''],
    qualifications: [''],
    message: [''],
  });

  ngOnInit(): void {
    this.loadSchools();
  }

  loadSchools(): void {
    this.loadingSchools.set(true);
    this.http.get<any>(`${this.apiUrl}/auth/public/schools`).subscribe({
      next: (res) => {
        this.schools.set(res.data || []);
        this.loadingSchools.set(false);
      },
      error: () => {
        this.error.set('Failed to load schools. Please try again.');
        this.loadingSchools.set(false);
      }
    });
  }

  selectSchool(school: School): void {
    this.selectedSchool.set(school);
    this.error.set('');
  }

  isStep2Valid(): boolean {
    const f = this.form;
    return !!(f.get('firstName')?.valid && 
           f.get('lastName')?.valid && 
           f.get('email')?.valid && 
           f.get('password')?.valid);
  }

  nextStep(): void {
    if (this.step() === 1 && this.selectedSchool()) {
      this.step.set(2);
    } else if (this.step() === 2 && this.isStep2Valid()) {
      this.step.set(3);
    }
    this.error.set('');
  }

  prevStep(): void {
    if (this.step() > 1) {
      this.step.update(s => s - 1);
    }
    this.error.set('');
  }

  onSubmit(): void {
    if (this.form.invalid || !this.selectedSchool()) return;
    
    this.submitting.set(true);
    this.error.set('');

    const qualificationsStr = this.form.get('qualifications')?.value || '';
    const qualifications = qualificationsStr
      .split(',')
      .map((q: string) => q.trim())
      .filter((q: string) => q.length > 0);

    const payload = {
      schoolCode: this.selectedSchool()?.code,
      firstName: this.form.get('firstName')?.value,
      lastName: this.form.get('lastName')?.value,
      email: this.form.get('email')?.value,
      password: this.form.get('password')?.value,
      phone: this.form.get('phone')?.value,
      gender: this.form.get('gender')?.value,
      dateOfBirth: this.form.get('dateOfBirth')?.value,
      designation: this.form.get('designation')?.value,
      department: this.form.get('department')?.value,
      qualifications,
      message: this.form.get('message')?.value,
    };

    this.http.post<any>(`${this.apiUrl}/auth/register-teacher`, payload).subscribe({
      next: (res) => {
        this.submittedData.set(res.data);
        this.registrationComplete.set(true);
        this.submitting.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Registration failed. Please try again.');
        this.submitting.set(false);
      }
    });
  }
}
