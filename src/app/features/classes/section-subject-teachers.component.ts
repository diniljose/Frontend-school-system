import { Component, inject, input, output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

interface SubjectTeacherAssignment {
  subject: { _id: string; name: string; code: string };
  teacher: { _id: string; firstName: string; lastName: string };
  sections: string[];
  academicYear?: { _id: string; name: string; isCurrent?: boolean };
  assignedDate?: string;
  startDate?: string;
}

@Component({
  selector: 'app-section-subject-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen()" (click)="onClose()">
      <div class="modal-content large" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2>Manage Subject Teachers</h2>
            <p class="modal-subtitle" *ngIf="classData()">
              {{ classData()?.name }} - Section {{ sectionName() }}
            </p>
          </div>
          <button class="close-btn" (click)="onClose()">✕</button>
        </div>

        <div class="modal-body">
          @if (loading()) {
            <div class="loading-state">
              <div class="spinner-lg"></div>
              <p>Loading assignments...</p>
            </div>
          } @else {
            <!-- Current Assignments -->
            <div class="assignments-section">
              <div class="section-header">
                <h3>📚 Current Subject Assignments</h3>
                <button class="btn btn-primary btn-sm" (click)="showAddForm.set(true)" [disabled]="showAddForm()">
                  + Assign Subject Teacher
                </button>
              </div>

              @if (assignments().length === 0) {
                <div class="empty-state">
                  <span class="empty-icon">📋</span>
                  <p>No subjects assigned to this section yet.</p>
                </div>
              } @else {
                <div class="assignments-list">
                  @for (a of assignments(); track a.subject._id) {
                    <div class="assignment-card">
                      <div class="card-main">
                        <div class="subject-info">
                          <span class="subject-name">{{ a.subject.name }}</span>
                          <span class="subject-code">{{ a.subject.code }}</span>
                        </div>
                        <div class="teacher-info">
                          <div class="teacher-avatar">{{ a.teacher.firstName[0] }}{{ a.teacher.lastName[0] }}</div>
                          <div class="teacher-details">
                            <span class="teacher-name">{{ a.teacher.firstName }} {{ a.teacher.lastName }}</span>
                            @if (a.assignedDate) {
                              <span class="assigned-date">Since {{ a.assignedDate | date:'mediumDate' }}</span>
                            }
                          </div>
                        </div>
                      </div>
                      <div class="card-actions">
                        <button class="btn btn-ghost btn-sm" (click)="editAssignment(a)" title="Change Teacher">
                          ✏️ Change
                        </button>
                        <button class="btn btn-ghost btn-sm btn-danger" (click)="removeAssignment(a)" title="Remove">
                          🗑️
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Add/Edit Form -->
            @if (showAddForm()) {
              <div class="add-form-section">
                <div class="section-header">
                  <h3>{{ editingAssignment() ? '✏️ Change Teacher' : '➕ Add New Assignment' }}</h3>
                  <button class="btn btn-ghost btn-sm" (click)="cancelForm()">✕</button>
                </div>

                <div class="form-grid">
                  <div class="form-group">
                    <label>Subject *</label>
                    <select class="form-select" [(ngModel)]="newAssignment.subjectId" [disabled]="!!editingAssignment()">
                      <option value="">Select Subject</option>
                      @for (s of availableSubjects(); track s._id) {
                        <option [value]="s._id">{{ s.name }} ({{ s.code }})</option>
                      }
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Teacher *</label>
                    <select class="form-select" [(ngModel)]="newAssignment.teacherId">
                      <option value="">Select Teacher</option>
                      @for (t of teachers(); track t._id) {
                        <option [value]="t._id">{{ t.firstName }} {{ t.lastName }}</option>
                      }
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Academic Year</label>
                    <select class="form-select" [(ngModel)]="newAssignment.academicYearId">
                      @for (ay of academicYears(); track ay._id) {
                        <option [value]="ay._id">{{ ay.name }} @if (ay.isCurrent) { (Current) }</option>
                      }
                    </select>
                  </div>

                  <div class="form-group">
                    <label>Effective From</label>
                    <input type="date" class="form-input" [(ngModel)]="newAssignment.startDate" />
                    <small>When this assignment becomes active</small>
                  </div>
                </div>

                <div class="form-actions">
                  <button class="btn btn-secondary" (click)="cancelForm()">Cancel</button>
                  <button class="btn btn-primary" (click)="saveAssignment()" 
                          [disabled]="!newAssignment.subjectId || !newAssignment.teacherId || saving()">
                    @if (saving()) { <span class="spinner"></span> }
                    {{ editingAssignment() ? 'Update Assignment' : 'Add Assignment' }}
                  </button>
                </div>
              </div>
            }

            <!-- Assignment History -->
            @if (assignmentHistory().length > 0) {
              <div class="history-section">
                <h3>📅 Assignment History</h3>
                <div class="history-timeline">
                  @for (h of assignmentHistory(); track h._id) {
                    <div class="history-item">
                      <div class="history-marker"></div>
                      <div class="history-content">
                        <div class="history-header">
                          <span class="history-subject">{{ h.subject?.name || 'Subject' }}</span>
                          <span class="history-action">{{ h.action }}</span>
                        </div>
                        <p class="history-teacher">{{ h.teacher?.firstName }} {{ h.teacher?.lastName }}</p>
                        <p class="history-date">{{ h.date | date:'medium' }}</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          }
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="onClose()">Close</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
    }

    .modal-content {
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
      max-width: 720px;
      width: 95%;
      max-height: 90vh;
      overflow-y: auto;
      border: 1px solid var(--border);
    }

    .modal-content.large {
      max-width: 800px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 0;
      background: var(--surface);
      z-index: 10;
    }

    .modal-header h2 {
      margin: 0;
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--text-primary);
    }

    .modal-subtitle {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--text-tertiary);
      padding: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      transition: all 0.15s;
    }

    .close-btn:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .modal-body {
      padding: var(--space-6);
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: var(--space-8);
      color: var(--text-secondary);
    }

    .spinner-lg {
      width: 32px;
      height: 32px;
      border: 3px solid var(--border);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: var(--space-4);
    }

    .assignments-section {
      margin-bottom: var(--space-6);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
    }

    .section-header h3 {
      margin: 0;
      font-size: var(--text-base);
      font-weight: 600;
    }

    .empty-state {
      text-align: center;
      padding: var(--space-6);
      background: var(--bg-secondary);
      border-radius: var(--radius-lg);
      color: var(--text-secondary);
    }

    .empty-icon {
      font-size: 2.5rem;
      display: block;
      margin-bottom: var(--space-2);
    }

    .assignments-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .assignment-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4);
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      transition: all 0.15s;
    }

    .assignment-card:hover {
      border-color: var(--primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .card-main {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .subject-info {
      min-width: 120px;
    }

    .subject-name {
      display: block;
      font-weight: 600;
      color: var(--text-primary);
    }

    .subject-code {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .teacher-info {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .teacher-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }

    .teacher-details {
      display: flex;
      flex-direction: column;
    }

    .teacher-name {
      font-weight: 500;
      color: var(--text-primary);
    }

    .assigned-date {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .card-actions {
      display: flex;
      gap: var(--space-2);
    }

    .btn-danger {
      color: var(--color-danger, #ef4444);
    }

    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.1);
    }

    .add-form-section {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
      margin-top: var(--space-4);
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .form-group label {
      font-weight: 600;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .form-select, .form-input {
      width: 100%;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      background: var(--surface);
      color: var(--text-primary);
    }

    .form-select:focus, .form-input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    .form-group small {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--border);
    }

    .history-section {
      margin-top: var(--space-6);
      padding-top: var(--space-6);
      border-top: 1px solid var(--border);
    }

    .history-section h3 {
      margin: 0 0 var(--space-4);
      font-size: var(--text-base);
      font-weight: 600;
    }

    .history-timeline {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .history-item {
      display: flex;
      gap: var(--space-3);
    }

    .history-marker {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--border);
      flex-shrink: 0;
      margin-top: 4px;
    }

    .history-content {
      flex: 1;
    }

    .history-header {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .history-subject {
      font-weight: 600;
      color: var(--text-primary);
    }

    .history-action {
      font-size: var(--text-xs);
      padding: 2px 8px;
      border-radius: 4px;
      background: var(--bg-secondary);
      color: var(--text-secondary);
    }

    .history-teacher {
      margin: 2px 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .history-date {
      margin: 0;
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      display: inline-block;
      margin-right: var(--space-2);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 640px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .card-main {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }
    }
  `]
})
export class SectionSubjectTeachersComponent implements OnChanges {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  // Inputs/Outputs
  isOpen = input<boolean>(false);
  classData = input<any>(null);
  sectionName = input<string>('');
  onOpenChange = output<boolean>();
  onUpdated = output<void>();

  // State
  loading = signal(true);
  saving = signal(false);
  showAddForm = signal(false);
  editingAssignment = signal<SubjectTeacherAssignment | null>(null);

  assignments = signal<SubjectTeacherAssignment[]>([]);
  assignmentHistory = signal<any[]>([]);
  subjects = signal<any[]>([]);
  teachers = signal<any[]>([]);
  academicYears = signal<any[]>([]);
  availableSubjects = signal<any[]>([]);

  newAssignment = {
    subjectId: '',
    teacherId: '',
    academicYearId: '',
    startDate: '',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen()) {
      this.loadData();
    }
  }

  loadData(): void {
    this.loading.set(true);

    Promise.all([
      this.api.get<any>('/subjects', { limit: 500 }).toPromise(),
      this.api.get<any>('/teachers', { limit: 500, isActive: true }).toPromise(),
      this.api.get<any>('/academic-years').toPromise(),
    ]).then(([subjectsRes, teachersRes, yearsRes]) => {
      this.subjects.set(subjectsRes?.data?.data || subjectsRes?.data || []);
      this.teachers.set(teachersRes?.data?.data || teachersRes?.data || []);
      
      const yearsData = yearsRes?.data?.data || yearsRes?.data || [];
      this.academicYears.set(Array.isArray(yearsData) ? yearsData : []);
      
      // Set default to current academic year
      const currentYear = yearsData.find((y: any) => y.isCurrent);
      if (currentYear) {
        this.newAssignment.academicYearId = currentYear._id;
      }
      
      this.loadAssignments();
    }).catch(() => {
      this.toast.error('Failed to load data');
      this.loading.set(false);
    });
  }

  loadAssignments(): void {
    const classId = this.classData()?._id;
    const section = this.sectionName();
    
    if (!classId) {
      this.loading.set(false);
      return;
    }

    // Get assignments by finding teachers with subjectAssignments matching this class/section
    this.api.get<any>('/teachers', { limit: 500 }).subscribe({
      next: (res: any) => {
        const teachers = res.data?.data || res.data || [];
        const assignmentList: SubjectTeacherAssignment[] = [];
        const assignedSubjectIds = new Set<string>();
        
        teachers.forEach((teacher: any) => {
          const teacherAssignments = teacher.subjectAssignments || [];
          teacherAssignments.forEach((asgn: any) => {
            const aClassId = typeof asgn.class === 'object' ? asgn.class?._id : asgn.class;
            const sections = asgn.sections || [];
            
            if (aClassId === classId && sections.includes(section)) {
              const subjectObj = typeof asgn.subject === 'object' ? asgn.subject : null;
              if (subjectObj) {
                assignmentList.push({
                  subject: subjectObj,
                  teacher: {
                    _id: teacher._id,
                    firstName: teacher.firstName,
                    lastName: teacher.lastName,
                  },
                  sections: asgn.sections,
                  academicYear: asgn.academicYear,
                  assignedDate: asgn.assignedDate || asgn.startDate,
                });
                assignedSubjectIds.add(subjectObj._id);
              }
            }
          });
        });
        
        this.assignments.set(assignmentList);
        
        // Calculate available subjects (not yet assigned)
        const allSubjects = this.subjects();
        const available = allSubjects.filter((s: any) => !assignedSubjectIds.has(s._id));
        this.availableSubjects.set(available);
        
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load assignments');
        this.loading.set(false);
      }
    });
  }

  editAssignment(assignment: SubjectTeacherAssignment): void {
    this.editingAssignment.set(assignment);
    this.newAssignment = {
      subjectId: assignment.subject._id,
      teacherId: assignment.teacher._id,
      academicYearId: assignment.academicYear?._id || '',
      startDate: '',
    };
    this.showAddForm.set(true);
  }

  cancelForm(): void {
    this.showAddForm.set(false);
    this.editingAssignment.set(null);
    this.newAssignment = {
      subjectId: '',
      teacherId: '',
      academicYearId: this.academicYears().find((y: any) => y.isCurrent)?._id || '',
      startDate: '',
    };
  }

  saveAssignment(): void {
    if (!this.newAssignment.subjectId || !this.newAssignment.teacherId) {
      this.toast.error('Please fill all required fields');
      return;
    }

    this.saving.set(true);
    const classId = this.classData()?._id;
    const section = this.sectionName();

    // If editing (changing teacher), first remove old assignment, then add new
    const editing = this.editingAssignment();
    
    const addNew = () => {
      const payload = {
        subjectId: this.newAssignment.subjectId,
        classId: classId,
        sections: [section],
        ...(this.newAssignment.academicYearId && { academicYearId: this.newAssignment.academicYearId }),
        ...(this.newAssignment.startDate && { startDate: this.newAssignment.startDate }),
      };

      this.api.post(`/teachers/${this.newAssignment.teacherId}/subject-class-assignment`, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success(editing ? 'Teacher updated successfully' : 'Assignment added successfully');
          this.cancelForm();
          this.loadAssignments();
          this.onUpdated.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err?.error?.message || 'Failed to save assignment');
        }
      });
    };

    if (editing && editing.teacher._id !== this.newAssignment.teacherId) {
      // Remove old assignment first
      this.api.post(`/teachers/${editing.teacher._id}/remove-subject-class-assignment`, {
        subjectId: editing.subject._id,
        classId: classId,
      }).subscribe({
        next: () => addNew(),
        error: () => addNew() // Continue even if removal fails
      });
    } else {
      addNew();
    }
  }

  removeAssignment(assignment: SubjectTeacherAssignment): void {
    if (!confirm(`Remove ${assignment.subject.name} assignment from ${assignment.teacher.firstName} ${assignment.teacher.lastName}?`)) {
      return;
    }

    const classId = this.classData()?._id;
    
    this.api.post(`/teachers/${assignment.teacher._id}/remove-subject-class-assignment`, {
      subjectId: assignment.subject._id,
      classId: classId,
    }).subscribe({
      next: () => {
        this.toast.success('Assignment removed');
        this.loadAssignments();
        this.onUpdated.emit();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to remove assignment');
      }
    });
  }

  onClose(): void {
    this.onOpenChange.emit(false);
    this.cancelForm();
  }
}
