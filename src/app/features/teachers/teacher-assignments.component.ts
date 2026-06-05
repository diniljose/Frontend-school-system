import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

interface SubjectAssignment {
  _id?: string;
  subject: { _id: string; name: string; code: string };
  class: { _id: string; name: string; grade: number };
  sections: string[];
  academicYear?: { _id: string; name: string; start: string; end: string; isCurrent?: boolean };
  assignedDate?: string;
  startDate?: string;
}

@Component({
  selector: 'app-teacher-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h1>Teaching Assignments</h1>
        <p class="subtitle">{{ teacherName() }}</p>
      </div>
      <a routerLink="/teachers" class="btn btn-secondary">← Back to Teachers</a>
    </div>

    @if (loading()) {
      <div class="card" style="padding: var(--space-8); text-align: center;">
        <span class="spinner-lg"></span>
        <p>Loading assignments...</p>
      </div>
    } @else {
      <!-- Current Assignments -->
      <div class="card">
        <div class="card-header">
          <h3>📚 Current Assignments</h3>
          <button class="btn btn-primary btn-sm" (click)="showAddForm.set(true)" [disabled]="showAddForm()">
            + Add Assignment
          </button>
        </div>

        @if (assignments().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📋</span>
            <h4>No Assignments Yet</h4>
            <p>This teacher hasn't been assigned to teach any subjects in any class yet.</p>
          </div>
        } @else {
          <div class="assignments-list">
            @for (a of assignments(); track a._id || (a.subject._id + a.class._id)) {
              <div class="assignment-card-detailed">
                <div class="card-top-section">
                  <div class="subject-header">
                    <div class="subject-info">
                      <span class="subject-name">{{ a.subject.name }}</span>
                      <span class="subject-code">{{ a.subject.code }}</span>
                    </div>
                  </div>
                  <button class="btn btn-ghost btn-sm btn-danger" (click)="removeAssignment(a)" title="Remove Assignment">
                    🗑️ Remove
                  </button>
                </div>

                <div class="card-content-grid">
                  <!-- Class & Grade -->
                  <div class="info-group">
                    <span class="info-label">📖 Class</span>
                    <div class="info-value">
                      <span class="class-badge">{{ a.class.name }}</span>
                      <span class="class-sub">Grade {{ a.class.grade }}</span>
                    </div>
                  </div>

                  <!-- Sections -->
                  <div class="info-group">
                    <span class="info-label">📑 Sections</span>
                    <div class="info-value">
                      @for (s of a.sections; track s) {
                        <span class="section-badge">{{ s }}</span>
                      } @empty {
                        <span class="text-muted">No sections</span>
                      }
                    </div>
                  </div>

                  <!-- Academic Year -->
                  @if (a.academicYear) {
                    <div class="info-group">
                      <span class="info-label">📅 Academic Year</span>
                      <div class="info-value">
                        <span class="year-badge" [class.current]="a.academicYear.isCurrent">
                          {{ a.academicYear.name }}
                          @if (a.academicYear.isCurrent) {
                            <span class="current-badge">Current</span>
                          }
                        </span>
                        <span class="year-sub">{{ a.academicYear.start | date:'MMM yyyy' }} - {{ a.academicYear.end | date:'MMM yyyy' }}</span>
                      </div>
                    </div>
                  }

                  <!-- Assignment Dates -->
                  <div class="info-group">
                    <span class="info-label">⏰ Assignment Info</span>
                    <div class="info-value dates-info">
                      @if (a.startDate) {
                        <div class="date-item">
                          <span class="date-label">Effective from:</span>
                          <span class="date-value">{{ a.startDate | date:'MMM d, yyyy' }}</span>
                        </div>
                      }
                      @if (a.assignedDate) {
                        <div class="date-item">
                          <span class="date-label">Assigned on:</span>
                          <span class="date-value">{{ a.assignedDate | date:'MMM d, yyyy' }}</span>
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Add New Assignment Form -->
      @if (showAddForm()) {
        <div class="card add-form-card">
          <div class="card-header">
            <h3>➕ Add New Assignment</h3>
            <button class="btn btn-ghost btn-sm" (click)="showAddForm.set(false)">✕</button>
          </div>

          <div class="form-section">
            <div class="grid grid-3">
              <div class="form-group">
                <label>Subject *</label>
                <select class="form-select" [(ngModel)]="newAssignment.subjectId" (change)="onSubjectChange()">
                  <option value="">Select Subject</option>
                  @for (s of subjects(); track s._id) {
                    <option [value]="s._id">{{ s.name }} ({{ s.code }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Class *</label>
                <select class="form-select" [(ngModel)]="newAssignment.classId" (change)="onClassChange()">
                  <option value="">Select Class</option>
                  @for (c of classes(); track c._id) {
                    <option [value]="c._id">{{ c.name }} - Grade {{ c.grade }}</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Academic Year</label>
                <select class="form-select" [(ngModel)]="newAssignment.academicYearId">
                  <option value="">Select Academic Year</option>
                  @for (ay of academicYears(); track ay._id) {
                    <option [value]="ay._id">{{ ay.name }} @if (ay.isCurrent) { <span>(Current)</span> }</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Sections *</label>
              <div class="section-checkboxes">
                @for (s of availableSections(); track s) {
                  <label class="checkbox-label">
                    <input type="checkbox" [checked]="newAssignment.sections.includes(s)" (change)="toggleSection(s)" />
                    {{ s }}
                  </label>
                }
                @if (availableSections().length === 0) {
                  <span class="text-muted">Select a class first</span>
                }
              </div>
            </div>

            <div class="form-group">
              <label>Assignment Start Date</label>
              <input type="date" class="form-input" [(ngModel)]="newAssignment.startDate" placeholder="Leave blank for today" />
              <small class="text-muted">When this assignment becomes effective</small>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn btn-secondary" (click)="showAddForm.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="addAssignment()" 
                    [disabled]="!newAssignment.subjectId || !newAssignment.classId || newAssignment.sections.length === 0 || saving()">
              @if (saving()) { <span class="spinner"></span> }
              Add Assignment
            </button>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .subtitle { color: var(--text-secondary); margin-top: var(--space-1); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
    .card-header h3 { margin: 0; font-size: var(--text-lg); }
    
    .empty-state {
      text-align: center; padding: var(--space-8);
      color: var(--text-secondary);
    }
    .empty-icon { font-size: 3rem; display: block; margin-bottom: var(--space-3); }
    .empty-state h4 { margin: 0 0 var(--space-2); color: var(--text-primary); }
    .empty-state p { margin: 0; }

    .assignments-list {
      display: flex; flex-direction: column;
      gap: var(--space-4);
    }

    .assignment-card-detailed {
      background: var(--bg-surface-hover);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    .card-top-section {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: var(--space-4); padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--border-color);
    }

    .subject-header { flex: 1; }
    .subject-info { display: flex; flex-direction: column; gap: 4px; }
    .subject-name { font-size: 1.125rem; font-weight: 700; color: var(--text-primary); }
    .subject-code { font-size: var(--text-sm); color: var(--text-secondary); font-weight: 500; }

    .btn-danger { color: var(--color-danger); }
    .btn-danger:hover { background: rgba(239,68,68,0.1); }

    .card-content-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--space-4);
    }

    .info-group {
      display: flex; flex-direction: column; gap: var(--space-2);
    }

    .info-label {
      font-size: var(--text-sm); font-weight: 600; text-transform: uppercase;
      color: var(--text-secondary); letter-spacing: 0.5px;
    }

    .info-value {
      display: flex; flex-direction: column; gap: var(--space-1);
    }

    .class-badge {
      display: inline-block;
      background: var(--color-primary);
      color: white;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: var(--text-sm);
      font-weight: 600;
      width: fit-content;
    }

    .class-sub { font-size: var(--text-sm); color: var(--text-secondary); }

    .section-badge {
      display: inline-block;
      background: rgba(99,102,241,0.1);
      color: var(--color-primary);
      padding: 4px 12px;
      border-radius: 12px;
      font-size: var(--text-sm);
      font-weight: 500;
      width: fit-content;
    }

    .year-badge {
      display: inline-flex; align-items: center; gap: var(--space-2);
      background: rgba(59,130,246,0.1);
      color: #2563eb;
      padding: 6px 12px;
      border-radius: 16px;
      font-size: var(--text-sm);
      font-weight: 600;
      width: fit-content;
    }

    .year-badge.current {
      background: rgba(34,197,94,0.1);
      color: #16a34a;
    }

    .current-badge {
      background: rgba(34,197,94,0.3);
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
    }

    .year-sub { font-size: var(--text-sm); color: var(--text-secondary); }

    .dates-info {
      gap: var(--space-2);
    }

    .date-item {
      display: flex; flex-direction: column; gap: 2px;
      padding: var(--space-2); background: var(--bg-surface);
      border-radius: var(--radius-md);
    }

    .date-label { font-size: var(--text-xs); color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
    .date-value { font-size: var(--text-sm); font-weight: 600; color: var(--text-primary); }

    .add-form-card { margin-top: var(--space-4); }

    .form-section {
      padding: var(--space-4) 0;
    }

    .form-group {
      margin-bottom: var(--space-4);
    }

    .form-group label {
      display: block; margin-bottom: var(--space-2);
      font-weight: 600; font-size: var(--text-sm);
    }

    .form-select, .form-input {
      width: 100%; padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
    }

    .form-select:focus, .form-input:focus {
      outline: none; border-color: var(--color-primary);
      box-shadow: inset 0 0 0 1px var(--color-primary);
    }

    .form-group small {
      display: block; margin-top: 4px;
      font-size: var(--text-xs); color: var(--text-secondary);
    }

    .section-checkboxes {
      display: flex; gap: var(--space-3); flex-wrap: wrap;
    }

    .checkbox-label {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      background: var(--bg-surface-hover);
      border-radius: var(--radius-md);
      cursor: pointer;
      user-select: none;
    }

    .checkbox-label:hover { background: var(--bg-muted); }
    .checkbox-label input { cursor: pointer; }

    .form-actions {
      display: flex; justify-content: flex-end; gap: var(--space-3);
      margin-top: var(--space-4); padding-top: var(--space-4);
      border-top: 1px solid var(--border-color);
    }

    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    .spinner-lg { width: 32px; height: 32px; border: 3px solid var(--border-color); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .text-muted { color: var(--text-muted); font-size: var(--text-sm); }

    .grid.grid-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); }
  `]
})
export class TeacherAssignmentsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  teacherId = '';
  teacherName = signal('');
  loading = signal(true);
  saving = signal(false);
  showAddForm = signal(false);

  assignments = signal<SubjectAssignment[]>([]);
  subjects = signal<any[]>([]);
  classes = signal<any[]>([]);
  academicYears = signal<any[]>([]);
  availableSections = signal<string[]>([]);

  newAssignment = {
    subjectId: '',
    classId: '',
    academicYearId: '',
    startDate: '',
    sections: [] as string[],
  };

  ngOnInit(): void {
    this.teacherId = this.route.snapshot.params['id'];
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);
    
    // Load teacher assignments
    this.api.get(`/teachers/${this.teacherId}/subject-class-assignments`).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.teacherName.set(data.teacherName);
        this.assignments.set(data.assignments || []);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load assignments');
        this.loading.set(false);
      }
    });

    // Load subjects for dropdown
    this.api.get('/subjects').subscribe({
      next: (res: any) => {
        this.subjects.set(res.data?.data || res.data || []);
      }
    });

    // Load classes for dropdown
    this.api.get('/classes').subscribe({
      next: (res: any) => {
        this.classes.set(res.data?.data || res.data || []);
      }
    });

    // Load academic years for dropdown
    this.api.get('/academic-years').subscribe({
      next: (res: any) => {
        this.academicYears.set(res.data?.data || res.data || []);
      }
    });
  }

  onSubjectChange(): void {
    // Could filter available classes based on subject if needed
  }

  onClassChange(): void {
    const classId = this.newAssignment.classId;
    const selectedClass = this.classes().find(c => c._id === classId);
    if (selectedClass && selectedClass.sections && selectedClass.sections.length > 0) {
      // Extract section names from section objects
      const sectionNames = selectedClass.sections.map((s: any) => typeof s === 'string' ? s : s.name);
      this.availableSections.set(sectionNames);
    } else {
      this.availableSections.set(['A']);
    }
    this.newAssignment.sections = [];
  }

  toggleSection(section: string): void {
    const idx = this.newAssignment.sections.indexOf(section);
    if (idx >= 0) {
      this.newAssignment.sections.splice(idx, 1);
    } else {
      this.newAssignment.sections.push(section);
    }
  }

  addAssignment(): void {
    if (!this.newAssignment.subjectId || !this.newAssignment.classId || this.newAssignment.sections.length === 0) {
      this.toast.error('Please fill all required fields');
      return;
    }

    this.saving.set(true);
    
    const payload = {
      subjectId: this.newAssignment.subjectId,
      classId: this.newAssignment.classId,
      sections: this.newAssignment.sections,
      ...(this.newAssignment.academicYearId && { academicYearId: this.newAssignment.academicYearId }),
      ...(this.newAssignment.startDate && { startDate: this.newAssignment.startDate }),
    };

    this.api.post(`/teachers/${this.teacherId}/subject-class-assignment`, payload).subscribe({
      next: () => {
        this.toast.success('Assignment added successfully');
        this.showAddForm.set(false);
        this.newAssignment = { subjectId: '', classId: '', academicYearId: '', startDate: '', sections: [] };
        this.loadData();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message || 'Failed to add assignment');
      }
    });
  }

  removeAssignment(assignment: SubjectAssignment): void {
    if (!confirm(`Remove ${assignment.subject.name} from ${assignment.class.name}?`)) return;

    // Use POST with action path since DELETE with body isn't well supported
    this.api.post(`/teachers/${this.teacherId}/remove-subject-class-assignment`, {
      subjectId: assignment.subject._id,
      classId: assignment.class._id,
    }).subscribe({
      next: () => {
        this.toast.success('Assignment removed');
        this.loadData();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to remove assignment');
      }
    });
  }
}
