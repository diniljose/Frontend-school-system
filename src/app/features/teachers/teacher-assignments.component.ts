import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

interface SubjectAssignment {
  subject: { _id: string; name: string; code: string };
  class: { _id: string; name: string; grade: number };
  sections: string[];
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
          <div class="assignments-grid">
            @for (a of assignments(); track a.subject._id + a.class._id) {
              <div class="assignment-card">
                <div class="assignment-header">
                  <div class="subject-info">
                    <span class="subject-name">{{ a.subject.name }}</span>
                    <span class="subject-code">{{ a.subject.code }}</span>
                  </div>
                  <button class="btn btn-ghost btn-sm btn-danger" (click)="removeAssignment(a)" title="Remove">
                    🗑️
                  </button>
                </div>
                <div class="class-info">
                  <span class="class-badge">{{ a.class.name }}</span>
                  <span class="grade-text">Grade {{ a.class.grade }}</span>
                </div>
                <div class="sections-info">
                  <span class="label">Sections:</span>
                  @for (s of a.sections; track s) {
                    <span class="section-badge">{{ s }}</span>
                  }
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

    .assignments-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-4);
    }

    .assignment-card {
      background: var(--bg-surface-hover);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    .assignment-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: var(--space-3);
    }

    .subject-info { display: flex; flex-direction: column; gap: 2px; }
    .subject-name { font-size: var(--text-lg); font-weight: 600; }
    .subject-code { font-size: var(--text-sm); color: var(--text-secondary); }

    .class-info { margin-bottom: var(--space-3); }
    .class-badge {
      display: inline-block;
      background: var(--color-primary);
      color: white;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: var(--text-sm);
      font-weight: 500;
    }
    .grade-text { margin-left: var(--space-2); color: var(--text-secondary); font-size: var(--text-sm); }

    .sections-info { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; }
    .sections-info .label { font-size: var(--text-sm); color: var(--text-secondary); }
    .section-badge {
      background: rgba(99,102,241,0.1);
      color: var(--color-primary);
      padding: 2px 10px;
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      font-weight: 500;
    }

    .btn-danger { color: var(--color-danger); }
    .btn-danger:hover { background: rgba(239,68,68,0.1); }

    .add-form-card { margin-top: var(--space-4); }

    .section-checkboxes {
      display: flex; gap: var(--space-3); flex-wrap: wrap;
    }
    .checkbox-label {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      background: var(--bg-surface-hover);
      border-radius: var(--radius-md);
      cursor: pointer;
    }
    .checkbox-label:hover { background: var(--bg-muted); }

    .form-actions {
      display: flex; justify-content: flex-end; gap: var(--space-3);
      margin-top: var(--space-4); padding-top: var(--space-4);
      border-top: 1px solid var(--border-color);
    }

    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    .spinner-lg { width: 32px; height: 32px; border: 3px solid var(--border-color); border-top-color: var(--color-primary); border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .text-muted { color: var(--text-muted); font-size: var(--text-sm); }
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
  availableSections = signal<string[]>([]);

  newAssignment = {
    subjectId: '',
    classId: '',
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
  }

  onSubjectChange(): void {
    // Could filter available classes based on subject if needed
  }

  onClassChange(): void {
    const classId = this.newAssignment.classId;
    const selectedClass = this.classes().find(c => c._id === classId);
    if (selectedClass) {
      this.availableSections.set(selectedClass.sections || ['A']);
    } else {
      this.availableSections.set([]);
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
      this.toast.error('Please fill all fields');
      return;
    }

    this.saving.set(true);
    this.api.post(`/teachers/${this.teacherId}/subject-class-assignment`, this.newAssignment).subscribe({
      next: () => {
        this.toast.success('Assignment added');
        this.showAddForm.set(false);
        this.newAssignment = { subjectId: '', classId: '', sections: [] };
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
