import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Student, ClassModel, AcademicYear } from '../../core/models';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ isEdit() ? 'Edit Student' : 'Add New Student' }}</h1>
        <p>{{ isEdit() ? 'Update student information' : 'Register a new student and enroll in a class' }}</p>
      </div>
      <a routerLink="/students" class="btn btn-secondary">← Back</a>
    </div>

    <form (ngSubmit)="onSubmit()" class="form-card card">
      <h3 class="section-title" style="margin-top:0;border-top:none;padding-top:0">Personal Information</h3>
      <div class="grid grid-3">
        <div class="form-group">
          <label>First Name *</label>
          <input type="text" class="form-input" [(ngModel)]="student.firstName" name="firstName" required />
        </div>
        <div class="form-group">
          <label>Last Name *</label>
          <input type="text" class="form-input" [(ngModel)]="student.lastName" name="lastName" required />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" class="form-input" [(ngModel)]="student.email" name="email" />
        </div>
      </div>

      <div class="grid grid-3">
        <div class="form-group">
          <label>Date of Birth</label>
          <input type="date" class="form-input" [(ngModel)]="student.dateOfBirth" name="dob" />
        </div>
        <div class="form-group">
          <label>Gender</label>
          <select class="form-select" [(ngModel)]="student.gender" name="gender">
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="tel" class="form-input" [(ngModel)]="student.phone" name="phone" />
        </div>
      </div>

      <h3 class="section-title">Guardian Information</h3>
      <div class="grid grid-3">
        <div class="form-group">
          <label>Guardian Name</label>
          <input type="text" class="form-input" [(ngModel)]="student.guardianName" name="guardianName" />
        </div>
        <div class="form-group">
          <label>Guardian Relation</label>
          <select class="form-select" [(ngModel)]="student.guardianRelation" name="guardianRelation">
            <option value="">Select</option>
            <option value="father">Father</option>
            <option value="mother">Mother</option>
            <option value="guardian">Guardian</option>
          </select>
        </div>
        <div class="form-group">
          <label>Guardian Phone</label>
          <input type="tel" class="form-input" [(ngModel)]="student.guardianPhone" name="guardianPhone" />
        </div>
      </div>

      <h3 class="section-title">Academic Information</h3>
      <div class="grid grid-3">
        <div class="form-group">
          <label>Admission Number</label>
          <input type="text" class="form-input" [(ngModel)]="student.admissionNumber" name="admissionNumber" placeholder="Auto-generated if empty" />
        </div>
        <div class="form-group">
          <label>Admission Date</label>
          <input type="date" class="form-input" [(ngModel)]="student.admissionDate" name="admissionDate" />
        </div>
        <div class="form-group">
          <label>Academic Year {{ isEdit() ? '' : '*' }}</label>
          <select class="form-select" [(ngModel)]="selectedAcademicYear" name="academicYear" (change)="onAcademicYearChange()">
            <option value="">Select Academic Year</option>
            @for (ay of academicYears(); track ay._id) {
              <option [value]="ay._id">{{ ay.name }} {{ ay.isCurrent ? '(Current)' : '' }}</option>
            }
          </select>
        </div>
      </div>
      <div class="grid grid-3">
        <div class="form-group">
          <label>Class {{ isEdit() ? '' : '*' }}</label>
          <select class="form-select" [(ngModel)]="selectedClass" name="class" (change)="onClassChange()">
            <option value="">Select Class</option>
            @for (c of classes(); track c._id) { <option [value]="c._id">{{ c.name }}</option> }
          </select>
        </div>
        <div class="form-group">
          <label>Section {{ !isEdit() && classHasSections() ? '*' : classHasSections() ? '' : '(no sections)' }}</label>
          <select class="form-select" [(ngModel)]="selectedSection" name="section" [disabled]="!classHasSections()">
            @if (classHasSections()) {
              <option value="">Select Section</option>
              @for (s of availableSections(); track s) { <option [value]="s">{{ s }}</option> }
            } @else {
              <option value="">Not needed</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label>Roll Number</label>
          <input type="text" class="form-input" [(ngModel)]="student.rollNumber" name="rollNumber" placeholder="Auto-generated" />
        </div>
      </div>
      @if (!isEdit()) {
        <div class="enrollment-hint">
          <span class="hint-icon">ℹ️</span>
          Selecting class and academic year will automatically create an enrollment record. Section is optional for classes without sections.
        </div>
      }

      <div class="form-actions">
        <a routerLink="/students" class="btn btn-secondary">Cancel</a>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          @if (saving()) { <span class="spinner"></span> }
          {{ isEdit() ? 'Update Student' : 'Create Student' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .form-card { max-width: 900px; }
    .section-title { font-size: var(--text-lg); font-weight: 600; margin-top: var(--space-6); margin-bottom: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border); }
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--border); }
    .enrollment-hint { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); background: #dbeafe; border-radius: var(--radius-md); font-size: var(--text-sm); color: #1e40af; margin-top: var(--space-2); }
    .hint-icon { font-size: 16px; }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class StudentFormComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit = signal(false);
  saving = signal(false);
  classes = signal<ClassModel[]>([]);
  academicYears = signal<AcademicYear[]>([]);
  availableSections = signal<string[]>([]);
  student: any = {};
  selectedAcademicYear = '';
  selectedClass = '';
  selectedSection = '';

  classHasSections(): boolean { return this.availableSections().length > 0; }

  ngOnInit(): void {
    this.loadClasses();
    this.loadAcademicYears();
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit.set(true);
      this.api.get<Student>(`/students/${id}`).subscribe({
        next: (s) => {
          const data: any = s.data || s;
          this.student = {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone || '',
            dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth).substring(0, 10) : '',
            gender: data.gender || '',
            admissionNumber: data.admissionNumber || '',
            rollNumber: data.rollNumber || '',
            address: data.address || '',
            _id: data._id,
          };
          this.selectedClass = typeof data.currentClass === 'object' ? data.currentClass?._id : (data.currentClass || '');
          this.selectedSection = data.currentSection || '';
          this.selectedAcademicYear = typeof data.currentAcademicYear === 'object' ? data.currentAcademicYear?._id : (data.currentAcademicYear || '');
          if (this.selectedClass) {
            setTimeout(() => this.onClassChange(), 300);
          }
        },
        error: () => this.toast.error('Failed to load student'),
      });
    }
  }

  loadClasses(): void {
    this.api.get<any>('/classes', { limit: 100 }).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.classes.set(Array.isArray(data) ? data : []);
      }
    });
  }

  loadAcademicYears(): void {
    this.api.get<any>('/academic-years').subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        const years = Array.isArray(data) ? data : [];
        this.academicYears.set(years);
        if (!this.isEdit() && !this.selectedAcademicYear) {
          const current = years.find((y: any) => y.isCurrent);
          if (current) this.selectedAcademicYear = current._id;
        }
      }
    });
  }

  onAcademicYearChange(): void {}

  onClassChange(): void {
    const cls = this.classes().find(c => c._id === this.selectedClass);
    this.availableSections.set(cls?.sections?.map((s: any) => s.name) || []);
    if (this.availableSections().length > 0 && !this.availableSections().includes(this.selectedSection)) {
      this.selectedSection = this.availableSections()[0];
    } else if (this.availableSections().length === 0) {
      this.selectedSection = '';
    }
  }

  onSubmit(): void {
    this.saving.set(true);

    // Build clean payload with only DTO-valid fields
    const payload: any = {
      firstName: this.student.firstName,
      lastName: this.student.lastName,
      email: this.student.email,
    };
    if (this.student.phone) payload.phone = this.student.phone;
    if (this.student.dateOfBirth) payload.dateOfBirth = this.student.dateOfBirth;
    if (this.student.gender) payload.gender = this.student.gender;
    if (this.student.admissionNumber) payload.admissionNumber = this.student.admissionNumber;
    if (this.student.rollNumber) payload.rollNumber = this.student.rollNumber;
    if (this.student.address) payload.address = typeof this.student.address === 'string' ? { street: this.student.address } : this.student.address;
    if (this.selectedClass) payload.currentClass = this.selectedClass;
    if (this.selectedSection) payload.currentSection = this.selectedSection;
    if (this.selectedAcademicYear) payload.currentAcademicYear = this.selectedAcademicYear;

    const obs = this.isEdit()
      ? this.api.patch(`/students/${this.student._id}`, payload)
      : this.api.post('/students', payload);

    obs.subscribe({
      next: (res: any) => {
        // After creating a student, auto-enroll if class and year are set
        if (!this.isEdit() && this.selectedClass && this.selectedAcademicYear) {
          const studentId = res.data?._id || res.data?.data?._id;
          if (studentId) {
            this.api.post('/enrollments', {
              studentId,
              academicYearId: this.selectedAcademicYear,
              classId: this.selectedClass,
              section: this.selectedSection || undefined,
              rollNumber: this.student.rollNumber || undefined,
            }).subscribe({
              next: () => {
                this.toast.success('Student created and enrolled successfully');
                this.saving.set(false);
                this.router.navigate(['/students']);
              },
              error: () => {
                this.toast.success('Student created (enrollment may need manual setup)');
                this.saving.set(false);
                this.router.navigate(['/students']);
              }
            });
          } else {
            this.toast.success('Student created');
            this.saving.set(false);
            this.router.navigate(['/students']);
          }
        } else {
          this.toast.success(this.isEdit() ? 'Student updated' : 'Student created');
          this.saving.set(false);
          this.router.navigate(['/students']);
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message?.join?.(', ') || err?.error?.message || 'Failed to save student');
      }
    });
  }
}
