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
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <div class="logo">👨‍🏫</div>
          <h1>Teacher Registration</h1>
          <p>Join your school as a teacher</p>
        </div>

        @if (registrationComplete()) {
          <div class="success-message">
            <div class="success-icon">✅</div>
            <h2>Registration Submitted!</h2>
            <p>Your registration has been submitted successfully.</p>
            <p class="admission-number">Employee ID: <strong>{{ submittedData()?.employeeId }}</strong></p>
            <p class="info-text">The school principal will review your registration. You will receive a notification once approved.</p>
            <a routerLink="/login" class="btn btn-primary btn-full">Back to Login</a>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <!-- Step 1: School Selection -->
            @if (step() === 1) {
              <div class="step-content animate-in">
                <h3>Step 1: Select Your School</h3>
                @if (loadingSchools()) {
                  <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading schools...</p>
                  </div>
                } @else {
                  <div class="school-grid">
                    @for (school of schools(); track school.code) {
                      <div 
                        class="school-card" 
                        [class.selected]="selectedSchool()?.code === school.code"
                        (click)="selectSchool(school)">
                        <div class="school-logo">{{ school.name.charAt(0) }}</div>
                        <div class="school-info">
                          <div class="school-name">{{ school.name }}</div>
                          <div class="school-code">{{ school.code }}</div>
                        </div>
                        @if (selectedSchool()?.code === school.code) {
                          <div class="check-mark">✓</div>
                        }
                      </div>
                    } @empty {
                      <div class="empty-state">No schools available for registration</div>
                    }
                  </div>
                  
                  <div class="step-actions">
                    <button type="button" class="btn btn-primary btn-full" [disabled]="!selectedSchool()" (click)="nextStep()">
                      Continue →
                    </button>
                  </div>
                }
              </div>
            }

            <!-- Step 2: Personal Information -->
            @if (step() === 2) {
              <div class="step-content animate-in">
                <h3>Step 2: Personal Information</h3>
                <p class="selected-school">School: <strong>{{ selectedSchool()?.name }}</strong></p>
                
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">First Name *</label>
                    <input type="text" class="form-input" formControlName="firstName" placeholder="Enter first name" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Last Name *</label>
                    <input type="text" class="form-input" formControlName="lastName" placeholder="Enter last name" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Email *</label>
                    <input type="email" class="form-input" formControlName="email" placeholder="your.email@example.com" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Password *</label>
                    <input type="password" class="form-input" formControlName="password" placeholder="Create a password" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Phone Number</label>
                    <input type="tel" class="form-input" formControlName="phone" placeholder="+1234567890" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Gender</label>
                    <select class="form-select" formControlName="gender">
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Date of Birth</label>
                  <input type="date" class="form-input" formControlName="dateOfBirth" />
                </div>

                <div class="step-actions">
                  <button type="button" class="btn btn-ghost" (click)="prevStep()">← Back</button>
                  <button type="button" class="btn btn-primary" [disabled]="!isStep2Valid()" (click)="nextStep()">
                    Continue →
                  </button>
                </div>
              </div>
            }

            <!-- Step 3: Professional Information -->
            @if (step() === 3) {
              <div class="step-content animate-in">
                <h3>Step 3: Professional Information</h3>
                
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Designation</label>
                    <select class="form-select" formControlName="designation">
                      <option value="">Select designation</option>
                      <option value="Teacher">Teacher</option>
                      <option value="Senior Teacher">Senior Teacher</option>
                      <option value="Head of Department">Head of Department</option>
                      <option value="Coordinator">Coordinator</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Department</label>
                    <select class="form-select" formControlName="department">
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
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Qualifications</label>
                  <input type="text" class="form-input" formControlName="qualifications" 
                         placeholder="e.g., M.Ed, B.Sc Math, PGCE (comma-separated)" />
                  <span class="form-hint">Enter your qualifications separated by commas</span>
                </div>

                <div class="form-group">
                  <label class="form-label">Message to Principal (Optional)</label>
                  <textarea class="form-textarea" formControlName="message" rows="3"
                            placeholder="Tell us why you want to join this school..."></textarea>
                </div>

                <div class="step-actions">
                  <button type="button" class="btn btn-ghost" (click)="prevStep()">← Back</button>
                  <button type="submit" class="btn btn-primary" [disabled]="submitting()">
                    @if (submitting()) {
                      <span class="spinner-sm"></span> Submitting...
                    } @else {
                      Submit Registration ✓
                    }
                  </button>
                </div>
              </div>
            }
          </form>

          <!-- Progress Steps -->
          <div class="progress-steps">
            <div class="step" [class.active]="step() >= 1" [class.completed]="step() > 1">
              <div class="step-number">1</div>
              <span>School</span>
            </div>
            <div class="step-line" [class.completed]="step() > 1"></div>
            <div class="step" [class.active]="step() >= 2" [class.completed]="step() > 2">
              <div class="step-number">2</div>
              <span>Personal</span>
            </div>
            <div class="step-line" [class.completed]="step() > 2"></div>
            <div class="step" [class.active]="step() >= 3">
              <div class="step-number">3</div>
              <span>Professional</span>
            </div>
          </div>

          @if (error()) {
            <div class="error-message">{{ error() }}</div>
          }

          <div class="register-footer">
            <p>Already have an account? <a routerLink="/login">Sign in</a></p>
            <p>Are you a student? <a routerLink="/register-student">Register as Student</a></p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .register-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      padding: var(--space-4);
    }
    .register-card {
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      padding: var(--space-8);
      width: 100%;
      max-width: 600px;
      animation: slideUp 0.4s ease-out;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-in {
      animation: fadeIn 0.3s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateX(10px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .register-header { text-align: center; margin-bottom: var(--space-6); }
    .logo { font-size: 48px; margin-bottom: var(--space-2); }
    .register-header h1 { font-size: var(--text-2xl); font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-1); }
    .register-header p { color: var(--text-secondary); }
    
    .step-content h3 { font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-4); color: var(--text-primary); }
    .selected-school { color: var(--text-secondary); margin-bottom: var(--space-4); }
    
    .school-grid { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); max-height: 300px; overflow-y: auto; }
    .school-card {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3); border-radius: var(--radius-md);
      border: 2px solid var(--border); cursor: pointer;
      transition: var(--transition-fast);
    }
    .school-card:hover { border-color: #10b981; background: rgba(16,185,129,0.1); }
    .school-card.selected { border-color: #10b981; background: rgba(16,185,129,0.1); }
    .school-logo {
      width: 48px; height: 48px; border-radius: var(--radius-md);
      background: #10b981; color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: var(--text-xl); font-weight: 700;
    }
    .school-info { flex: 1; }
    .school-name { font-weight: 600; color: var(--text-primary); }
    .school-code { font-size: var(--text-sm); color: var(--text-tertiary); }
    .check-mark { color: #10b981; font-size: var(--text-xl); font-weight: 700; }
    
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
    
    .form-hint { font-size: var(--text-xs); color: var(--text-tertiary); margin-top: var(--space-1); display: block; }
    
    .form-textarea {
      width: 100%;
      padding: var(--space-3);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: var(--text-base);
      resize: vertical;
      font-family: inherit;
    }
    .form-textarea:focus {
      outline: none;
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
    }
    
    .step-actions { display: flex; justify-content: space-between; gap: var(--space-3); margin-top: var(--space-6); }
    .btn-full { width: 100%; }
    
    .btn-primary {
      background: #10b981;
      border-color: #10b981;
    }
    .btn-primary:hover {
      background: #059669;
      border-color: #059669;
    }
    
    .progress-steps {
      display: flex; align-items: center; justify-content: center;
      margin-top: var(--space-6); padding-top: var(--space-4);
      border-top: 1px solid var(--border);
    }
    .step { display: flex; flex-direction: column; align-items: center; gap: var(--space-1); }
    .step-number {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--border); color: var(--text-tertiary);
      display: flex; align-items: center; justify-content: center;
      font-size: var(--text-sm); font-weight: 600;
      transition: var(--transition-fast);
    }
    .step.active .step-number { background: #10b981; color: white; }
    .step.completed .step-number { background: var(--success); color: white; }
    .step span { font-size: var(--text-xs); color: var(--text-tertiary); }
    .step.active span { color: #10b981; font-weight: 500; }
    .step-line { flex: 1; height: 2px; background: var(--border); max-width: 60px; margin: 0 var(--space-2); }
    .step-line.completed { background: var(--success); }
    
    .loading-state { text-align: center; padding: var(--space-8); }
    .spinner {
      width: 40px; height: 40px; border: 3px solid var(--border);
      border-top-color: #10b981; border-radius: 50%;
      animation: spin 0.8s linear infinite; margin: 0 auto var(--space-3);
    }
    .spinner-sm {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.6s linear infinite; display: inline-block; margin-right: var(--space-2);
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .error-message {
      background: rgba(239,68,68,0.1); color: var(--danger);
      padding: var(--space-3); border-radius: var(--radius-md);
      margin-top: var(--space-4); font-size: var(--text-sm);
    }
    
    .success-message {
      text-align: center; padding: var(--space-6);
    }
    .success-icon { font-size: 64px; margin-bottom: var(--space-4); }
    .success-message h2 { font-size: var(--text-xl); margin-bottom: var(--space-2); color: var(--success); }
    .admission-number { background: var(--surface-secondary); padding: var(--space-3); border-radius: var(--radius-md); margin: var(--space-4) 0; }
    .info-text { color: var(--text-secondary); font-size: var(--text-sm); margin-bottom: var(--space-4); }
    
    .register-footer { text-align: center; margin-top: var(--space-6); color: var(--text-secondary); }
    .register-footer a { color: #10b981; font-weight: 500; text-decoration: none; }
    .register-footer p { margin-bottom: var(--space-2); }
    
    .empty-state { text-align: center; padding: var(--space-8); color: var(--text-tertiary); }
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

    // Parse qualifications from comma-separated string to array
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
