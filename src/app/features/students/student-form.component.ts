import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Student, ClassModel } from '../../core/models';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ isEdit() ? 'Edit Student' : 'Add New Student' }}</h1>
        <p>{{ isEdit() ? 'Update student information' : 'Register a new student' }}</p>
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
          <input type="text" class="form-input" [(ngModel)]="student.admissionNumber" name="admissionNumber" />
        </div>
        <div class="form-group">
          <label>Class</label>
          <select class="form-select" [(ngModel)]="student.currentClass" name="class">
            <option value="">Select Class</option>
            @for (c of classes(); track c._id) { <option [value]="c._id">{{ c.name }}</option> }
          </select>
        </div>
        <div class="form-group">
          <label>Admission Date</label>
          <input type="date" class="form-input" [(ngModel)]="student.admissionDate" name="admissionDate" />
        </div>
      </div>

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
  student: any = {};

  ngOnInit(): void {
    this.loadClasses();
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit.set(true);
      this.api.get<Student>(`/students/${id}`).subscribe({
        next: (s) => this.student = { ...(s.data || s) },
        error: () => this.toast.error('Failed to load student'),
      });
    }
  }

  loadClasses(): void {
    this.api.get<any>('/classes').subscribe({ next: (res) => this.classes.set(res.data?.items || []) });
  }

  onSubmit(): void {
    this.saving.set(true);
    const obs = this.isEdit()
      ? this.api.patch(`/students/${this.student._id}`, this.student)
      : this.api.post('/students', this.student);
    obs.subscribe({
      next: () => {
        this.toast.success(this.isEdit() ? 'Student updated' : 'Student created');
        this.router.navigate(['/students']);
      },
      error: (err) => { this.saving.set(false); this.toast.error(err?.error?.message?.join?.(', ') || 'Failed to save student'); }
    });
  }
}
