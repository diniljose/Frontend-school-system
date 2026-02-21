import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

interface School {
  code: string;
  name: string;
  logo?: string;
  address?: string;
}

interface ClassInfo {
  _id: string;
  name: string;
  grade: number;
  sections: string[];
}

interface AcademicYearInfo {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, TranslateModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <div class="logo">🎓</div>
          <h1>Student Registration</h1>
          <p>Join your school's digital learning platform</p>
        </div>

        @if (registrationComplete()) {
          <div class="success-message">
            <div class="success-icon">✅</div>
            <h2>Registration Submitted!</h2>
            <p>Your registration has been submitted successfully.</p>
            <p class="admission-number">Registration ID: <strong>{{ submittedData()?.admissionNumber }}</strong></p>
            <p class="info-text">Your class teacher will review your registration. You will receive an email notification once approved.</p>
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

            <!-- Step 2: Class & Academic Year Selection -->
            @if (step() === 2) {
              <div class="step-content animate-in">
                <h3>Step 2: Select Class & Academic Year</h3>
                <p class="selected-school">School: <strong>{{ selectedSchool()?.name }}</strong></p>
                
                @if (loadingClasses()) {
                  <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading classes and academic years...</p>
                  </div>
                } @else {
                  <div class="form-group">
                    <label class="form-label">Academic Year *</label>
                    <select class="form-select" formControlName="academicYearId">
                      <option value="">Select academic year</option>
                      @for (ay of academicYears(); track ay._id) {
                        <option [value]="ay._id">{{ ay.name }}{{ ay.isCurrent ? ' (Current)' : '' }}</option>
                      }
                    </select>
                  </div>

                  <div class="form-group">
                    <label class="form-label">Class *</label>
                    <select class="form-select" formControlName="classId" (change)="onClassChange()">
                      <option value="">Select your class</option>
                      @for (c of classes(); track c._id) {
                        <option [value]="c._id">{{ c.name }} (Grade {{ c.grade }})</option>
                      }
                    </select>
                  </div>

                  @if (selectedClass()) {
                    @if (selectedClass()?.sections && selectedClass()!.sections.length > 1) {
                      <div class="form-group">
                        <label class="form-label">Section/Division *</label>
                        <div class="section-grid">
                          @for (section of selectedClass()?.sections || []; track section) {
                            <button 
                              type="button" 
                              class="section-btn" 
                              [class.selected]="form.get('section')?.value === section"
                              (click)="selectSection(section)">
                              {{ section }}
                            </button>
                          }
                        </div>
                      </div>
                    } @else if (selectedClass()!.sections.length === 1) {
                      <div class="auto-section-note">
                        <span class="info-icon">ℹ️</span>
                        Section: <strong>{{ form.get('section')?.value }}</strong> (auto-assigned)
                      </div>
                    } @else {
                      <div class="auto-section-note">
                        <span class="info-icon">ℹ️</span>
                        This class has no sections — you'll be assigned automatically.
                      </div>
                    }
                  }

                  <div class="step-actions">
                    <button type="button" class="btn btn-ghost" (click)="prevStep()">← Back</button>
                    <button type="button" class="btn btn-primary" [disabled]="!isStep2Valid()" (click)="nextStep()">
                      Continue →
                    </button>
                  </div>
                }
              </div>
            }

            <!-- Step 3: Personal Information -->
            @if (step() === 3) {
              <div class="step-content animate-in">
                <h3>Step 3: Your Information</h3>
                
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
                    <label class="form-label">Date of Birth</label>
                    <input type="date" class="form-input" formControlName="dateOfBirth" />
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
                  <label class="form-label">Phone Number</label>
                  <input type="tel" class="form-input" formControlName="phone" placeholder="+1234567890" />
                </div>

                <div class="step-actions">
                  <button type="button" class="btn btn-ghost" (click)="prevStep()">← Back</button>
                  <button type="button" class="btn btn-primary" [disabled]="!isStep3Valid()" (click)="nextStep()">
                    Continue →
                  </button>
                </div>
              </div>
            }

            <!-- Step 4: Parent/Guardian Information (Optional) -->
            @if (step() === 4) {
              <div class="step-content animate-in">
                <h3>Step 4: Parent/Guardian Information</h3>
                <p class="optional-note">This information is optional but helps us keep your parents informed.</p>
                
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Parent's First Name</label>
                    <input type="text" class="form-input" formControlName="parentFirstName" placeholder="Parent's first name" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Parent's Last Name</label>
                    <input type="text" class="form-input" formControlName="parentLastName" placeholder="Parent's last name" />
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Parent's Email</label>
                    <input type="email" class="form-input" formControlName="parentEmail" placeholder="parent@example.com" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Parent's Phone</label>
                    <input type="tel" class="form-input" formControlName="parentPhone" placeholder="+1234567890" />
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">Relationship</label>
                  <select class="form-select" formControlName="parentRelation">
                    <option value="">Select relationship</option>
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="guardian">Guardian</option>
                    <option value="other">Other</option>
                  </select>
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
              <span>Class</span>
            </div>
            <div class="step-line" [class.completed]="step() > 2"></div>
            <div class="step" [class.active]="step() >= 3" [class.completed]="step() > 3">
              <div class="step-number">3</div>
              <span>Details</span>
            </div>
            <div class="step-line" [class.completed]="step() > 3"></div>
            <div class="step" [class.active]="step() >= 4">
              <div class="step-number">4</div>
              <span>Parent</span>
            </div>
          </div>

          @if (error()) {
            <div class="error-message">{{ error() }}</div>
          }

          <div class="register-footer">
            <p>Already have an account? <a routerLink="/login">Sign in</a></p>
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
      background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
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
    .optional-note { color: var(--text-tertiary); font-size: var(--text-sm); margin-bottom: var(--space-4); }
    
    .school-grid { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); max-height: 300px; overflow-y: auto; }
    .school-card {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3); border-radius: var(--radius-md);
      border: 2px solid var(--border); cursor: pointer;
      transition: var(--transition-fast);
    }
    .school-card:hover { border-color: var(--primary); background: var(--primary-light); }
    .school-card.selected { border-color: var(--primary); background: var(--primary-light); }
    .school-logo {
      width: 48px; height: 48px; border-radius: var(--radius-md);
      background: var(--primary); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: var(--text-xl); font-weight: 700;
    }
    .school-info { flex: 1; }
    .school-name { font-weight: 600; color: var(--text-primary); }
    .school-code { font-size: var(--text-sm); color: var(--text-tertiary); }
    .check-mark { color: var(--primary); font-size: var(--text-xl); font-weight: 700; }
    
    .section-grid { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .section-btn {
      padding: var(--space-2) var(--space-4);
      border: 2px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      cursor: pointer;
      font-weight: 500;
      transition: var(--transition-fast);
    }
    .section-btn:hover { border-color: var(--primary); }
    .section-btn.selected { background: var(--primary); color: white; border-color: var(--primary); }
    
    .auto-section-note {
      padding: var(--space-3); background: rgba(59,130,246,0.08);
      border: 1px solid rgba(59,130,246,0.2); border-radius: var(--radius-md);
      font-size: var(--text-sm); color: var(--text-secondary);
      display: flex; align-items: center; gap: var(--space-2);
    }
    .info-icon { font-size: var(--text-base); }
    
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    @media (max-width: 600px) { .form-row { grid-template-columns: 1fr; } }
    
    .step-actions { display: flex; justify-content: space-between; gap: var(--space-3); margin-top: var(--space-6); }
    .btn-full { width: 100%; }
    
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
    .step.active .step-number { background: var(--primary); color: white; }
    .step.completed .step-number { background: var(--success); color: white; }
    .step span { font-size: var(--text-xs); color: var(--text-tertiary); }
    .step.active span { color: var(--primary); font-weight: 500; }
    .step-line { flex: 1; height: 2px; background: var(--border); max-width: 40px; margin: 0 var(--space-2); }
    .step-line.completed { background: var(--success); }
    
    .loading-state { text-align: center; padding: var(--space-8); }
    .spinner {
      width: 40px; height: 40px; border: 3px solid var(--border);
      border-top-color: var(--primary); border-radius: 50%;
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
    .register-footer a { color: var(--primary); font-weight: 500; text-decoration: none; }
    
    .empty-state { text-align: center; padding: var(--space-8); color: var(--text-tertiary); }
  `]
})
export class StudentRegisterComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  step = signal(1);
  loadingSchools = signal(true);
  loadingClasses = signal(false);
  submitting = signal(false);
  registrationComplete = signal(false);
  error = signal('');
  
  schools = signal<School[]>([]);
  classes = signal<ClassInfo[]>([]);
  academicYears = signal<AcademicYearInfo[]>([]);
  selectedSchool = signal<School | null>(null);
  selectedClass = signal<ClassInfo | null>(null);
  submittedData = signal<any>(null);

  form: FormGroup = this.fb.group({
    classId: ['', Validators.required],
    academicYearId: ['', Validators.required],
    section: [''],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    dateOfBirth: [''],
    gender: [''],
    phone: [''],
    parentFirstName: [''],
    parentLastName: [''],
    parentEmail: [''],
    parentPhone: [''],
    parentRelation: [''],
  });

  ngOnInit(): void {
    this.loadSchools();
  }

  loadSchools(): void {
    this.loadingSchools.set(true);
    this.http.get<any>('/api/v1/auth/public/schools').subscribe({
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

  loadClasses(): void {
    if (!this.selectedSchool()) return;
    this.loadingClasses.set(true);
    const code = this.selectedSchool()?.code;
    
    // Load both classes and academic years in parallel
    this.http.get<any>(`/api/v1/auth/public/schools/${code}/classes`).subscribe({
      next: (res) => {
        this.classes.set(res.data || []);
        // Check if academic years are already loaded
        if (this.academicYears().length > 0 || this._ayLoaded) {
          this.loadingClasses.set(false);
        }
      },
      error: () => {
        this.error.set('Failed to load classes. Please try again.');
        this.loadingClasses.set(false);
      }
    });

    this.http.get<any>(`/api/v1/auth/public/schools/${code}/academic-years`).subscribe({
      next: (res) => {
        const years = res.data || [];
        this.academicYears.set(years);
        this._ayLoaded = true;
        // Auto-select current academic year
        const current = years.find((ay: AcademicYearInfo) => ay.isCurrent);
        if (current) {
          this.form.patchValue({ academicYearId: current._id });
        }
        if (this.classes().length > 0) {
          this.loadingClasses.set(false);
        }
      },
      error: () => {
        this._ayLoaded = true;
        this.loadingClasses.set(false);
      }
    });
  }
  private _ayLoaded = false;

  onClassChange(): void {
    const classId = this.form.get('classId')?.value;
    const cls = this.classes().find(c => c._id === classId);
    this.selectedClass.set(cls || null);
    
    // Auto-select section if only one exists, or leave empty for no-section classes
    if (cls) {
      if (!cls.sections || cls.sections.length === 0) {
        this.form.patchValue({ section: '' }); // No sections - backend will handle
      } else if (cls.sections.length === 1) {
        this.form.patchValue({ section: cls.sections[0] }); // Auto-select single section
      } else {
        this.form.patchValue({ section: '' }); // Clear for manual selection
      }
    } else {
      this.form.patchValue({ section: '' });
    }
  }

  selectSection(section: string): void {
    this.form.patchValue({ section });
  }

  isStep2Valid(): boolean {
    const classId = this.form.get('classId')?.value;
    const academicYearId = this.form.get('academicYearId')?.value;
    const section = this.form.get('section')?.value;
    const cls = this.selectedClass();
    
    if (!classId || !academicYearId) return false;
    
    // If no sections defined or only one section, we already auto-selected
    if (!cls?.sections || cls.sections.length <= 1) {
      return true;
    }
    
    // Multiple sections - require selection
    return !!section;
  }

  isStep3Valid(): boolean {
    const f = this.form;
    return !!(f.get('firstName')?.valid && 
           f.get('lastName')?.valid && 
           f.get('email')?.valid && 
           f.get('password')?.valid);
  }

  nextStep(): void {
    if (this.step() === 1 && this.selectedSchool()) {
      this.step.set(2);
      this.loadClasses();
    } else if (this.step() === 2) {
      this.step.set(3);
    } else if (this.step() === 3) {
      this.step.set(4);
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
    // Check required fields manually since section is not a required validator
    const f = this.form;
    if (!f.get('classId')?.value || !f.get('academicYearId')?.value || !f.get('firstName')?.value || !f.get('lastName')?.value ||
        !f.get('email')?.valid || !f.get('password')?.valid || !this.selectedSchool()) {
      this.error.set('Please fill all required fields');
      return;
    }
    
    this.submitting.set(true);
    this.error.set('');

    const formVal = this.form.value;
    const payload: any = {
      firstName: formVal.firstName,
      lastName: formVal.lastName,
      email: formVal.email,
      password: formVal.password,
      classId: formVal.classId,
      academicYearId: formVal.academicYearId,
      schoolCode: this.selectedSchool()?.code,
    };
    // Only send section if it has a value
    if (formVal.section) payload.section = formVal.section;
    if (formVal.dateOfBirth) payload.dateOfBirth = formVal.dateOfBirth;
    if (formVal.gender) payload.gender = formVal.gender;
    if (formVal.phone) payload.phone = formVal.phone;
    // Parent info - send as flat fields (matching RegisterStudentDto)
    if (formVal.parentFirstName) payload.parentFirstName = formVal.parentFirstName;
    if (formVal.parentLastName) payload.parentLastName = formVal.parentLastName;
    if (formVal.parentEmail) payload.parentEmail = formVal.parentEmail;
    if (formVal.parentPhone) payload.parentPhone = formVal.parentPhone;
    if (formVal.parentRelation) payload.parentRelation = formVal.parentRelation;

    this.http.post<any>('/api/v1/auth/register-student', payload).subscribe({
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
