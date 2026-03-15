import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ClassModel } from '../../core/models';
import { ClassTeacherAssignmentComponent } from './class-teacher-assignment.component';
import { SectionSubjectTeachersComponent } from './section-subject-teachers.component';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, ClassTeacherAssignmentComponent, SectionSubjectTeachersComponent],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ 'nav.classes' | translate }}</h1>
        <p class="page-subtitle">Manage classes, sections, and assignments</p>
      </div>
      <button class="btn btn-primary" routerLink="/classes/new">+ Add Class</button>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon primary">📚</div>
        <div>
          <div class="stat-label">Total Classes</div>
          <div class="stat-value">{{ classes().length }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon success">📑</div>
        <div>
          <div class="stat-label">Total Sections</div>
          <div class="stat-value">{{ getTotalSections() }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon warning">⚠️</div>
        <div>
          <div class="stat-label">Without Sections</div>
          <div class="stat-value">{{ getClassesWithoutSections() }}</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon danger">👥</div>
        <div>
          <div class="stat-label">Total Capacity</div>
          <div class="stat-value">{{ getTotalCapacity() }}</div>
        </div>
      </div>
    </div>

    <!-- Classes List -->
    <div class="card classes-card">
      @if (loading()) {
        <div class="loading-rows">
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-row">
              <div class="skeleton" style="width:40px;height:40px;border-radius:8px"></div>
              <div style="flex:1">
                <div class="skeleton" style="width:120px;height:16px;margin-bottom:8px"></div>
                <div class="skeleton" style="width:200px;height:12px"></div>
              </div>
            </div>
          }
        </div>
      } @else if (classes().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🏫</div>
          <h3>No classes yet</h3>
          <p>Create your first class to get started</p>
          <a routerLink="/classes/new" class="btn btn-primary">+ Add Class</a>
        </div>
      } @else {
        @for (c of classes(); track c._id) {
          <div class="class-item" [class.expanded]="expandedClass === c._id">
            <!-- Class Header -->
            <div class="class-header" (click)="toggleExpand(c._id)">
              <div class="class-info">
                <div class="class-badge">{{ getClassInitial(c.name) }}</div>
                <div>
                  <h3 class="class-name">{{ c.name }}</h3>
                  <div class="class-meta">
                    @if (c.sections?.length) {
                      <span class="badge badge-info">{{ c.sections?.length }} section{{ (c.sections?.length || 0) > 1 ? 's' : '' }}</span>
                    } @else {
                      <span class="badge badge-warning">No sections</span>
                    }
                    <span class="meta-sep">•</span>
                    <span class="meta-text">Capacity: {{ getClassCapacity(c) }}</span>
                  </div>
                </div>
              </div>
              <div class="class-actions">
                <a [routerLink]="['/classes', c._id]" class="btn btn-ghost btn-sm" (click)="$event.stopPropagation()">
                  ✏️ Edit
                </a>
                <button class="expand-btn" [class.rotated]="expandedClass === c._id">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Expanded Sections -->
            @if (expandedClass === c._id) {
              <div class="sections-panel">
                @if (c.sections?.length) {
                  <div class="sections-list">
                    @for (s of c.sections; track s.name) {
                      <div class="section-card">
                        <div class="section-header">
                          <div class="section-title">
                            <span class="section-badge">{{ s.name }}</span>
                            <span class="section-name">Section {{ s.name }}</span>
                            <span class="section-cap">{{ s.capacity || '∞' }} seats</span>
                          </div>
                        </div>

                        <!-- Class Teacher -->
                        <div class="section-row">
                          <span class="row-label">Class Teacher:</span>
                          @if (getAssignmentForSection(c._id, s.name); as assignment) {
                            <div class="teacher-chip">
                              <span class="teacher-avatar">{{ (assignment.teacher.firstName || 'T')[0] }}</span>
                              <span>{{ assignment.teacher.firstName }} {{ assignment.teacher.lastName }}</span>
                            </div>
                          } @else {
                            <span class="unassigned">Not assigned</span>
                          }
                          <button class="btn btn-ghost btn-sm" (click)="openAssignModal(c, s)">
                            {{ getAssignmentForSection(c._id, s.name) ? 'Change' : 'Assign' }}
                          </button>
                        </div>

                        <!-- Subject Teachers -->
                        <div class="section-row subjects-row">
                          <span class="row-label">Subjects:</span>
                          <div class="subjects-area">
                            @if (getSectionTeachers(c._id, s.name).length > 0) {
                              <div class="subject-tags">
                                @for (st of getSectionTeachers(c._id, s.name); track st.teacherId + st.subjectId) {
                                  <span class="subject-tag" [title]="st.teacherName">
                                    {{ st.subjectCode || st.subjectName }}
                                  </span>
                                }
                              </div>
                            } @else {
                              <span class="unassigned">No subjects</span>
                            }
                          </div>
                          <button class="btn btn-ghost btn-sm" (click)="openSubjectTeachersModal(c, s)">
                            Manage
                          </button>
                        </div>

                        <!-- Section Actions -->
                        <div class="section-actions">
                          <a [routerLink]="['/students']" [queryParams]="{classId: c._id, section: s.name}" class="action-link">
                            👨‍🎓 Students
                          </a>
                          <a [routerLink]="['/enrollments']" [queryParams]="{classId: c._id, section: s.name}" class="action-link">
                            📋 Enrollments
                          </a>
                          <a [routerLink]="['/exams']" [queryParams]="{classId: c._id, section: s.name}" class="action-link">
                            📝 Exams
                          </a>
                          <a [routerLink]="['/attendance']" [queryParams]="{classId: c._id, section: s.name}" class="action-link">
                            ✅ Attendance
                          </a>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="no-sections">
                    <p>No sections in this class. Add sections to organize students.</p>
                    <a [routerLink]="['/classes', c._id]" class="btn btn-secondary btn-sm">+ Add Sections</a>
                  </div>
                }
              </div>
            }
          </div>
        }
      }
    </div>

    <!-- Modals -->
    <app-class-teacher-assignment 
      [isOpen]="assignModalOpen()"
      [preSelectedClass]="selectedClass()"
      [preSelectedSection]="selectedSectionName()"
      (onOpenChange)="assignModalOpen.set($event)"
      (onAssigned)="onAssignmentSuccess()">
    </app-class-teacher-assignment>

    <app-section-subject-teachers
      [isOpen]="subjectTeachersModalOpen()"
      [classData]="selectedClassForSubjects()"
      [sectionName]="selectedSectionForSubjects()"
      (onOpenChange)="subjectTeachersModalOpen.set($event)"
      (onUpdated)="onSubjectTeachersUpdated()">
    </app-section-subject-teachers>
  `,
  styles: [`
    .page-subtitle {
      color: var(--text-secondary);
      font-size: var(--text-sm);
      margin-top: 4px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .classes-card {
      padding: 0;
      overflow: hidden;
    }

    .loading-rows {
      padding: var(--space-4);
    }

    .skeleton-row {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4);
      border-bottom: 1px solid var(--border);
    }

    .empty-state {
      text-align: center;
      padding: var(--space-12);
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: var(--space-4);
    }

    .empty-state h3 {
      margin: 0 0 var(--space-2);
      color: var(--text-secondary);
    }

    .empty-state p {
      color: var(--text-muted);
      margin-bottom: var(--space-4);
    }

    /* Class Item */
    .class-item {
      border-bottom: 1px solid var(--border);
    }

    .class-item:last-child {
      border-bottom: none;
    }

    .class-item.expanded {
      background: var(--bg-muted);
    }

    .class-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-5);
      cursor: pointer;
      transition: background var(--transition-fast);
    }

    .class-header:hover {
      background: var(--bg-surface-hover);
    }

    .class-info {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .class-badge {
      width: 44px;
      height: 44px;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-lg);
      font-weight: 700;
      flex-shrink: 0;
    }

    .class-name {
      font-size: var(--text-base);
      font-weight: 600;
      margin: 0 0 4px;
    }

    .class-meta {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
    }

    .meta-sep {
      color: var(--text-muted);
    }

    .meta-text {
      color: var(--text-secondary);
    }

    .class-actions {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .expand-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: var(--bg-muted);
      border-radius: var(--radius-md);
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
    }

    .expand-btn:hover {
      background: var(--bg-surface-active);
    }

    .expand-btn.rotated {
      transform: rotate(180deg);
      background: var(--color-primary);
      color: white;
    }

    /* Sections Panel */
    .sections-panel {
      padding: 0 var(--space-5) var(--space-5);
    }

    .sections-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .section-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
    }

    .section-header {
      margin-bottom: var(--space-3);
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--border);
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .section-badge {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-md);
      background: var(--color-success);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-sm);
      font-weight: 600;
    }

    .section-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .section-cap {
      color: var(--text-muted);
      font-size: var(--text-sm);
      margin-left: auto;
    }

    /* Section Rows */
    .section-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2) 0;
      flex-wrap: wrap;
    }

    .row-label {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      min-width: 100px;
      flex-shrink: 0;
    }

    .teacher-chip {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: 4px var(--space-3);
      background: var(--bg-muted);
      border-radius: var(--radius-full);
      font-size: var(--text-sm);
      flex: 1;
      min-width: 0;
    }

    .teacher-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .unassigned {
      color: var(--text-muted);
      font-size: var(--text-sm);
      font-style: italic;
      flex: 1;
    }

    .subjects-row {
      align-items: flex-start;
    }

    .subjects-area {
      flex: 1;
      min-width: 0;
    }

    .subject-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .subject-tag {
      display: inline-flex;
      padding: 4px 10px;
      background: rgba(59, 130, 246, 0.1);
      color: var(--color-primary);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 500;
    }

    /* Section Actions */
    .section-actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-top: var(--space-3);
      padding-top: var(--space-3);
      border-top: 1px solid var(--border);
    }

    .action-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      background: var(--bg-muted);
      color: var(--text-secondary);
      border-radius: var(--radius-md);
      font-size: var(--text-xs);
      font-weight: 500;
      text-decoration: none;
      transition: all var(--transition-fast);
    }

    .action-link:hover {
      background: var(--color-primary);
      color: white;
    }

    /* No Sections */
    .no-sections {
      text-align: center;
      padding: var(--space-6);
      color: var(--text-muted);
    }

    .no-sections p {
      margin-bottom: var(--space-3);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .class-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .class-actions {
        width: 100%;
        justify-content: flex-end;
      }

      .section-row {
        flex-direction: column;
        align-items: flex-start;
      }

      .row-label {
        min-width: auto;
      }

      .teacher-chip,
      .subjects-area {
        width: 100%;
      }

      .section-row .btn {
        margin-top: var(--space-2);
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .section-actions {
        flex-direction: column;
      }

      .action-link {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class ClassListComponent implements OnInit {
  private api = inject(ApiService);
  loading = signal(true);
  classes = signal<ClassModel[]>([]);
  expandedClass = '';
  currentAcademicYear = signal<any>(null);
  classTeacherAssignments = signal<Map<string, any>>(new Map());
  sectionSubjectTeachers = signal<Map<string, any[]>>(new Map());
  assignModalOpen = signal(false);
  selectedClass = signal<any>(null);
  selectedSectionName = signal<string>('');
  subjectTeachersModalOpen = signal(false);
  selectedClassForSubjects = signal<any>(null);
  selectedSectionForSubjects = signal<string>('');

  ngOnInit(): void {
    this.loadCurrentAcademicYear();
    this.loadClasses();
    this.loadSubjectTeacherAssignments();
  }

  getClassInitial(name: string): string {
    if (!name) return '?';
    const match = name.match(/\d+/);
    if (match) return match[0];
    return name.charAt(0).toUpperCase();
  }

  private loadCurrentAcademicYear(): void {
    this.api.get<any>('/academic-years', { isCurrent: true }).subscribe({
      next: (res: any) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        const currentYear = Array.isArray(data) ? data[0] : null;
        if (currentYear) {
          this.currentAcademicYear.set(currentYear);
          this.loadClassTeacherAssignments(currentYear._id);
        }
      },
    });
  }

  private loadSubjectTeacherAssignments(): void {
    // Load all teachers with their subject-class assignments
    this.api.get<any>('/teachers', { limit: 1000 }).subscribe({
      next: (res: any) => {
        const teachers = res.data?.data || res.data?.items || res.data || [];
        const map = new Map<string, any[]>();
        
        if (Array.isArray(teachers)) {
          teachers.forEach((teacher: any) => {
            const assignments = teacher.subjectAssignments || [];
            assignments.forEach((asgn: any) => {
              // Handle both populated objects and raw IDs
              const classObj = asgn.class;
              const subjectObj = asgn.subject;
              
              // Skip if class is just an ID without being populated
              const classId = typeof classObj === 'object' ? classObj?._id : classObj;
              if (!classId) return;
              
              // Get subject info (handle populated or ID)
              const subjectName = typeof subjectObj === 'object' ? subjectObj?.name : '';
              const subjectCode = typeof subjectObj === 'object' ? subjectObj?.code : '';
              const subjectId = typeof subjectObj === 'object' ? subjectObj?._id : subjectObj;
              
              // Skip entries without subject name (likely unpopulated data)
              if (!subjectName && !subjectCode) return;
              
              const sections = asgn.sections || [''];
              const teacherName = `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim();
              
              sections.forEach((section: string) => {
                const key = `${classId}-${section}`;
                const existing = map.get(key) || [];
                
                // Avoid duplicates
                const alreadyExists = existing.some(
                  e => e.teacherId === teacher._id && e.subjectId === subjectId
                );
                if (!alreadyExists) {
                  existing.push({
                    teacherId: teacher._id,
                    teacherName,
                    subjectId,
                    subjectName,
                    subjectCode,
                  });
                }
                map.set(key, existing);
              });
            });
          });
        }
        
        this.sectionSubjectTeachers.set(map);
      },
    });
  }

  getSectionTeachers(classId: string, sectionName: string): any[] {
    const key = `${classId}-${sectionName}`;
    return this.sectionSubjectTeachers().get(key) || [];
  }

  private loadClassTeacherAssignments(academicYearId: string): void {
    this.api.get<any>('/class-teacher-assignments', { academicYear: academicYearId }).subscribe({
      next: (res: any) => {
        const assignments = res.data?.data || res.data?.items || res.data || [];
        const map = new Map<string, any>();
        
        if (Array.isArray(assignments)) {
          assignments.forEach((assignment: any) => {
            if (assignment.class?._id && assignment.teacher) {
              // Key by classId-sectionName to support per-section assignments
              const section = assignment.section || '';
              const key = `${assignment.class._id}-${section}`;
              map.set(key, {
                teacher: assignment.teacher,
                assignedAt: assignment.createdAt || assignment.assignedAt,
              });
            }
          });
        }
        
        this.classTeacherAssignments.set(map);
      },
    });
  }

  getAssignmentForSection(classId: string, sectionName: string): any {
    // Try to find assignment for specific section first
    const sectionKey = `${classId}-${sectionName}`;
    const sectionAssignment = this.classTeacherAssignments().get(sectionKey);
    if (sectionAssignment) return sectionAssignment;
    
    // Fallback to class-level assignment
    const classKey = `${classId}-`;
    return this.classTeacherAssignments().get(classKey) || null;
  }

  private loadClasses(): void {
    this.api.get<any>('/classes', { limit: 100 }).subscribe({
      next: (res: any) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.classes.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  formatAssignedDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  toggleExpand(id: string): void {
    this.expandedClass = this.expandedClass === id ? '' : id;
  }

  getSectionNames(c: any): string {
    if (!c.sections?.length) return '';
    return c.sections.map((s: any) => typeof s === 'string' ? s : s.name).join(', ');
  }

  getTotalSections(): number {
    return this.classes().reduce((sum, c) => sum + (c.sections?.length || 0), 0);
  }

  getClassesWithoutSections(): number {
    return this.classes().filter(c => !c.sections?.length).length;
  }

  getTotalCapacity(): number {
    return this.classes().reduce((sum, c) => {
      if (c.sections?.length) return sum + c.sections.reduce((ss: number, s: any) => ss + (s.capacity || 0), 0);
      return sum + ((c as any).capacity || 0);
    }, 0);
  }

  getClassCapacity(c: any): number {
    if (c.sections?.length) return c.sections.reduce((sum: number, s: any) => sum + (s.capacity || 0), 0);
    return c.capacity || 0;
  }

  getTeacherDisplay(t: any): string {
    if (!t) return 'Unassigned';
    if (typeof t === 'string') return 'Assigned';
    return `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Unassigned';
  }

  openAssignModal(classData: any, section: any): void {
    this.selectedClass.set(classData);
    this.selectedSectionName.set(section?.name || '');
    this.assignModalOpen.set(true);
  }

  onAssignmentSuccess(): void {
    // Reload class teacher assignments after successful assignment
    if (this.currentAcademicYear()) {
      this.loadClassTeacherAssignments(this.currentAcademicYear()._id);
    }
  }

  openSubjectTeachersModal(classData: any, section: any): void {
    this.selectedClassForSubjects.set(classData);
    this.selectedSectionForSubjects.set(section?.name || '');
    this.subjectTeachersModalOpen.set(true);
  }

  onSubjectTeachersUpdated(): void {
    this.loadSubjectTeacherAssignments();
  }
}
