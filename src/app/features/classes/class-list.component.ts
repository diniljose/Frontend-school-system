import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ClassModel } from '../../core/models';
import { ClassTeacherAssignmentComponent } from './class-teacher-assignment.component';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, ClassTeacherAssignmentComponent],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.classes' | translate }}</h1><p>Manage classes, sections, and view student distribution</p></div>
      <button class="btn btn-primary" routerLink="/classes/new">+ Add Class</button>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="st"><span class="st-val">{{ classes().length }}</span><span class="st-lbl">Total Classes</span></div>
      <div class="st"><span class="st-val">{{ getTotalSections() }}</span><span class="st-lbl">Total Sections</span></div>
      <div class="st"><span class="st-val">{{ getClassesWithoutSections() }}</span><span class="st-lbl">No Sections</span></div>
      <div class="st"><span class="st-val">{{ getTotalCapacity() }}</span><span class="st-lbl">Total Capacity</span></div>
    </div>

    <div class="card">
      @if (loading()) {
        @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:80px;margin-bottom:12px;border-radius:8px"></div> }
      } @else {
        @for (c of classes(); track c._id) {
          <div class="class-row" [class.expanded]="expandedClass === c._id">
            <div class="class-header" (click)="toggleExpand(c._id)">
              <div class="class-main">
                <div class="class-icon">🏫</div>
                <div>
                  <h3>{{ c.name }}</h3>
                  <div class="class-sub">
                    @if (c.sections?.length) {
                      <span>{{ c.sections?.length }} section{{ (c.sections?.length || 0) > 1 ? 's' : '' }}: {{ getSectionNames(c) }}</span>
                    } @else {
                      <span class="no-section-tag">No sections</span>
                    }
                    <span>·</span>
                    <span>Capacity: {{ getClassCapacity(c) }}</span>
                  </div>
                </div>
              </div>
              <div class="class-actions">
                <a [routerLink]="['/students']" [queryParams]="{classId: c._id}" class="act-btn" title="View Students" (click)="$event.stopPropagation()">👨‍🎓 Students</a>
                <a [routerLink]="['/enrollments']" [queryParams]="{classId: c._id}" class="act-btn" title="View Enrollments" (click)="$event.stopPropagation()">📋 Enrollments</a>
                <a [routerLink]="['/classes', c._id]" class="act-btn act-edit" title="Edit Class" (click)="$event.stopPropagation()">✏️ Edit</a>
                <span class="expand-arrow" [class.rotated]="expandedClass === c._id">▼</span>
              </div>
            </div>

            @if (expandedClass === c._id) {
              <div class="sections-panel">
                @if (c.sections?.length) {
                  <div class="sections-grid">
                    @for (s of c.sections; track s.name) {
                      <div class="section-card">
                        <div class="sec-top">
                          <span class="sec-name">Section {{ s.name }}</span>
                          <span class="sec-cap">{{ s.capacity || '∞' }} cap</span>
                        </div>
                        <div class="sec-teacher">
                          @if (getAssignmentForSection(c._id, s.name); as assignment) {
                            <div class="assigned-teacher-info">
                              <span class="teacher-avatar">{{ (assignment.teacher.firstName || 'T')[0] }}</span>
                              <div class="teacher-details">
                                <span class="teacher-name">{{ assignment.teacher.firstName }} {{ assignment.teacher.lastName }}</span>
                                <span class="assigned-date">Since {{ formatAssignedDate(assignment.assignedAt) }}</span>
                              </div>
                            </div>
                          } @else {
                            <span class="unassigned">👨‍🏫 Unassigned</span>
                          }
                        </div>
                        <!-- Subject Teachers for this section -->
                        @if (getSectionTeachers(c._id, s.name).length > 0) {
                          <div class="subject-teachers">
                            <div class="st-label">Subject Teachers:</div>
                            <div class="st-list">
                              @for (st of getSectionTeachers(c._id, s.name); track st.teacherId + st.subjectId) {
                                <div class="st-item" [title]="st.teacherName + ' teaches ' + st.subjectName">
                                  <span class="st-subject">{{ st.subjectCode || st.subjectName }}</span>
                                  <span class="st-teacher">{{ st.teacherName }}</span>
                                </div>
                              }
                            </div>
                          </div>
                        }
                        <!-- Upcoming Exams for Section -->
                        @if (getSectionExams(c._id, s.name).length) {
                          <div class="sec-exams">
                            <div class="sec-exams-title">📅 Upcoming Exams</div>
                            <div class="sec-exams-list">
                              @for (exam of getSectionExams(c._id, s.name).slice(0, 3); track exam._id) {
                                <div class="sec-exam-item">
                                  <span class="sec-exam-date">{{ exam.startDate | date:'d MMM' }}</span>
                                  <span class="sec-exam-name">{{ exam.name }}</span>
                                  <span class="sec-exam-type">{{ formatExamType(exam.examType) }}</span>
                                </div>
                              }
                            </div>
                            <a [routerLink]="['/exams']" [queryParams]="{classId: c._id, section: s.name}" class="sec-link">View All Exams →</a>
                          </div>
                        }
                        <div class="sec-actions">
                          <a [routerLink]="['/students']" [queryParams]="{classId: c._id, section: s.name}" class="sec-link">View Students</a>
                          <a [routerLink]="['/enrollments']" [queryParams]="{classId: c._id, section: s.name}" class="sec-link">Enrollments</a>
                          <a [routerLink]="['/exams']" [queryParams]="{classId: c._id, section: s.name}" class="sec-link">Exams</a>
                          <button class="sec-link sec-assign-btn" (click)="openAssignModal(c, s)">Assign Class Teacher</button>
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <div class="no-sections">
                    <p>This class has no sections. Students enroll directly into the class.</p>
                    <a [routerLink]="['/classes', c._id]" class="btn btn-secondary btn-sm">+ Add Sections</a>
                  </div>
                }
              </div>
            }
          </div>
        } @empty {
          <div class="empty-state">
            <div style="font-size:48px;margin-bottom:8px">🏫</div>
            <h3>No classes yet</h3>
            <p>Create your first class to get started.</p>
            <a routerLink="/classes/new" class="btn btn-primary" style="margin-top:12px">+ Add Class</a>
          </div>
        }
      }
    </div>

    <!-- Class Teacher Assignment Modal -->
    <app-class-teacher-assignment 
      [isOpen]="assignModalOpen()"
      [preSelectedClass]="selectedClassId()"
      [preSelectedSection]="selectedSectionName()"
      (onOpenChange)="assignModalOpen.set($event)"
      (onAssigned)="onAssignmentSuccess()">
    </app-class-teacher-assignment>
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
    .st { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-4); text-align: center; }
    .st-val { display: block; font-size: var(--text-2xl); font-weight: 700; color: var(--primary); }
    .st-lbl { font-size: var(--text-xs); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }

    .class-row { border-bottom: 1px solid var(--border); }
    .class-row:last-child { border-bottom: none; }
    .class-row.expanded { background: var(--bg-secondary); }
    .class-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4); cursor: pointer; transition: background 0.15s; }
    .class-header:hover { background: var(--bg-secondary); }
    .class-main { display: flex; align-items: center; gap: var(--space-3); }
    .class-icon { font-size: 28px; }
    .class-main h3 { font-size: var(--text-base); font-weight: 600; margin-bottom: 2px; }
    .class-sub { display: flex; gap: var(--space-2); font-size: var(--text-xs); color: var(--text-tertiary); align-items: center; }
    .no-section-tag { background: #fef3c7; color: #92400e; padding: 0 6px; border-radius: 4px; font-weight: 500; }
    .class-actions { display: flex; align-items: center; gap: var(--space-2); }
    .act-btn { font-size: var(--text-xs); padding: 4px 10px; border-radius: var(--radius-sm); background: var(--bg-secondary); color: var(--text-secondary); text-decoration: none; transition: all 0.15s; white-space: nowrap; }
    .act-btn:hover { background: var(--primary); color: white; }
    .act-edit { background: transparent; }
    .expand-arrow { font-size: 10px; color: var(--text-tertiary); transition: transform 0.2s; margin-left: var(--space-2); }
    .expand-arrow.rotated { transform: rotate(180deg); }

    .sections-panel { padding: 0 var(--space-4) var(--space-4); }
    .sections-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-3); }
    .section-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-3); }
    .sec-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .sec-name { font-weight: 600; font-size: var(--text-sm); }
    .sec-cap { font-size: var(--text-xs); color: var(--text-tertiary); background: var(--bg-secondary); padding: 1px 6px; border-radius: 4px; }
    .sec-teacher { margin-bottom: 8px; }
    .assigned-teacher-info { display: flex; align-items: center; gap: 8px; }
    .teacher-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; flex-shrink: 0; }
    .teacher-details { display: flex; flex-direction: column; }
    .teacher-name { font-size: var(--text-xs); font-weight: 600; color: var(--text-primary); }
    .assigned-date { font-size: 10px; color: var(--text-tertiary); }
    .unassigned { font-size: var(--text-xs); color: var(--text-tertiary); }
    .subject-teachers { margin-bottom: 8px; padding: 8px; background: var(--bg-secondary); border-radius: var(--radius-sm); }
    .st-label { font-size: 10px; color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
    .st-list { display: flex; flex-wrap: wrap; gap: 4px; }
    .st-item { display: inline-flex; align-items: center; gap: 4px; padding: 2px 6px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; font-size: 10px; }
    .st-subject { font-weight: 600; color: var(--primary); }
    .st-teacher { color: var(--text-secondary); }
    .sec-actions { display: flex; gap: var(--space-2); }
    .sec-link { font-size: 11px; color: var(--primary); text-decoration: none; font-weight: 500; cursor: pointer; background: none; border: none; padding: 0; }
    .sec-link:hover { text-decoration: underline; }
    .sec-assign-btn { color: #059669; font-weight: 600; }
    .sec-assign-btn:hover { color: #047857; }
    .sec-exams { margin-bottom: 8px; padding: 8px; background: #eff6ff; border-radius: var(--radius-sm); border: 1px solid #dbeafe; }
    .sec-exams-title { font-size: 10px; color: #1e40af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 6px; font-weight: 600; }
    .sec-exams-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 6px; }
    .sec-exam-item { display: flex; align-items: center; gap: 6px; font-size: 11px; padding: 2px 0; }
    .sec-exam-date { font-weight: 600; color: #3b82f6; min-width: 45px; }
    .sec-exam-name { flex: 1; color: var(--text-primary); }
    .sec-exam-type { font-size: 10px; background: #dbeafe; color: #1e40af; padding: 1px 6px; border-radius: 4px; }
    .no-sections { text-align: center; padding: var(--space-4); color: var(--text-tertiary); font-size: var(--text-sm); }
    .no-sections p { margin-bottom: var(--space-3); }
    .empty-state { text-align: center; padding: var(--space-8); color: var(--text-tertiary); }
    .empty-state h3 { color: var(--text-secondary); margin-bottom: 4px; }
    .empty-state p { font-size: var(--text-sm); }
    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .class-header { flex-direction: column; align-items: flex-start; gap: var(--space-2); }
      .class-actions { flex-wrap: wrap; }
    }
  `]
})
export class ClassListComponent implements OnInit {
  private api = inject(ApiService);
  loading = signal(true);
  classes = signal<ClassModel[]>([]);
  expandedClass = '';
  currentAcademicYear = signal<any>(null);
  // Map key: classId-sectionName, value: { teacher, assignedAt }
  classTeacherAssignments = signal<Map<string, any>>(new Map());
  // Map key: classId-section, value: array of { teacherId, teacherName, subjectId, subjectName, subjectCode }
  sectionSubjectTeachers = signal<Map<string, any[]>>(new Map());
  // Map key: classId-section, value: array of exams
  sectionExams = signal<Map<string, any[]>>(new Map());
  assignModalOpen = signal(false);
  selectedClassId = signal<string>('');
  selectedSectionName = signal<string>('');

  ngOnInit(): void {
    this.loadCurrentAcademicYear();
    this.loadClasses();
    this.loadSubjectTeacherAssignments();
    this.loadUpcomingExams();
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
              const classId = typeof asgn.class === 'object' ? asgn.class._id : asgn.class;
              const subjectName = typeof asgn.subject === 'object' ? asgn.subject.name : asgn.subject;
              const subjectCode = typeof asgn.subject === 'object' ? asgn.subject.code : '';
              const subjectId = typeof asgn.subject === 'object' ? asgn.subject._id : asgn.subject;
              const sections = asgn.sections || [''];
              
              sections.forEach((section: string) => {
                const key = `${classId}-${section}`;
                const existing = map.get(key) || [];
                existing.push({
                  teacherId: teacher._id,
                  teacherName: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim(),
                  subjectId,
                  subjectName,
                  subjectCode,
                });
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
    this.selectedClassId.set(classData._id || '');
    this.selectedSectionName.set(section?.name || '');
    this.assignModalOpen.set(true);
  }

  onAssignmentSuccess(): void {
    // Reload class teacher assignments after successful assignment
    if (this.currentAcademicYear()) {
      this.loadClassTeacherAssignments(this.currentAcademicYear()._id);
    }
  }

  private loadUpcomingExams(): void {
    this.api.get<any>('/exams/upcoming').subscribe({
      next: (res: any) => {
        const exams = res.data || [];
        const map = new Map<string, any[]>();
        
        exams.forEach((exam: any) => {
          // Map exams to classes and sections
          const examClasses = exam.classes || [];
          const examSections = exam.sections || [];
          const scheduleItems = exam.schedule || [];
          
          // If schedule has class/section info, use that
          if (scheduleItems.length > 0) {
            scheduleItems.forEach((item: any) => {
              const classId = typeof item.class === 'object' ? item.class._id : item.class;
              const section = item.section || '';
              if (classId) {
                const key = `${classId}-${section}`;
                const existing = map.get(key) || [];
                if (!existing.find((e: any) => e._id === exam._id)) {
                  existing.push(exam);
                }
                map.set(key, existing);
              }
            });
          } else if (examClasses.length > 0) {
            // Map to all assigned classes and sections
            examClasses.forEach((cls: any) => {
              const classId = typeof cls === 'object' ? cls._id : cls;
              if (examSections.length > 0) {
                examSections.forEach((sec: string) => {
                  const key = `${classId}-${sec}`;
                  const existing = map.get(key) || [];
                  if (!existing.find((e: any) => e._id === exam._id)) {
                    existing.push(exam);
                  }
                  map.set(key, existing);
                });
              } else {
                const key = `${classId}-`;
                const existing = map.get(key) || [];
                if (!existing.find((e: any) => e._id === exam._id)) {
                  existing.push(exam);
                }
                map.set(key, existing);
              }
            });
          }
        });
        
        this.sectionExams.set(map);
      },
    });
  }

  getSectionExams(classId: string, sectionName: string): any[] {
    // Try section-specific first
    const sectionKey = `${classId}-${sectionName}`;
    const sectionExams = this.sectionExams().get(sectionKey);
    if (sectionExams?.length) return sectionExams;
    
    // Fallback to class-level exams
    const classKey = `${classId}-`;
    return this.sectionExams().get(classKey) || [];
  }

  formatExamType(type: string): string {
    if (!type) return 'Exam';
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
}
