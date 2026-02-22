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
                          👨‍🏫 {{ getTeacherDisplay(s.classTeacher) }}
                          @if (currentAcademicYearTeacher(c._id); as teacher) {
                            <span class="current-year-badge">{{ teacher?.firstName }} {{ teacher?.lastName }}</span>
                          }
                        </div>
                        <div class="sec-actions">
                          <a [routerLink]="['/students']" [queryParams]="{classId: c._id, section: s.name}" class="sec-link">View Students</a>
                          <a [routerLink]="['/enrollments']" [queryParams]="{classId: c._id, section: s.name}" class="sec-link">Enrollments</a>
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
    .sec-teacher { font-size: var(--text-xs); color: var(--text-secondary); margin-bottom: 8px; }
    .current-year-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; margin-left: 8px; }
    .sec-actions { display: flex; gap: var(--space-2); }
    .sec-link { font-size: 11px; color: var(--primary); text-decoration: none; font-weight: 500; cursor: pointer; background: none; border: none; padding: 0; }
    .sec-link:hover { text-decoration: underline; }
    .sec-assign-btn { color: #059669; font-weight: 600; }
    .sec-assign-btn:hover { color: #047857; }
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
  classTeachersByClassId = signal<Map<string, any>>(new Map());
  assignModalOpen = signal(false);
  currentAcademicYear = signal<any>(null);
  classTeachersByClassId = signal<Map<string, any>>(new Map());

  ngOnInit(): void {
    this.loadCurrentAcademicYear();
    this.loadClasses();
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

  private loadClassTeacherAssignments(academicYearId: string): void {
    this.api.get<any>('/class-teacher-assignments', { academicYear: academicYearId }).subscribe({
      next: (res: any) => {
        const assignments = res.data?.data || res.data?.items || res.data || [];
        const map = new Map<string, any>();
        
        if (Array.isArray(assignments)) {
          assignments.forEach((assignment: any) => {
            if (assignment.class?._id && assignment.teacher) {
              map.set(assignment.class._id, assignment.teacher);
            }
          });
        }
        
        this.classTeachersByClassId.set(map);
      },
    });
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

  currentAcademicYearTeacher(classId: string): any {
    return this.classTeachersByClassId().get(classId) || null;
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
    // In a real scenario, you might pre-populate the modal with class/section
    // For now, just open it
    this.assignModalOpen.set(true);
  }

  onAssignmentSuccess(): void {
    // Reload class teacher assignments after successful assignment
    if (this.currentAcademicYear()) {
      this.loadClassTeacherAssignments(this.currentAcademicYear()._id);
    }
  }
}
