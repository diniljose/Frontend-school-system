import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h1>Teacher Profile</h1>
        <p>Complete professional history and assignments</p>
      </div>
      <div class="header-actions">
        <a routerLink="/teachers" class="btn btn-secondary">← Back</a>
        @if (teacher()) {
          <a [routerLink]="['/teachers', teacher()._id, 'assignments']" class="btn btn-primary">View Assignments</a>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="skeleton" style="height:500px;border-radius:12px"></div>
    } @else if (teacher()) {
      <!-- Profile Hero -->
      <div class="profile-hero">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <div class="avatar-xl">{{ teacher().firstName?.charAt(0) }}{{ teacher().lastName?.charAt(0) }}</div>
          <div class="hero-info">
            <h2>{{ teacher().firstName }} {{ teacher().lastName }}</h2>
            <div class="hero-meta">
              <span class="meta-chip">🏫 {{ teacher().designation || 'Teacher' }}</span>
              <span class="meta-chip">📧 {{ teacher().email }}</span>
              @if (teacher().employeeId) { <span class="meta-chip id-chip">ID: {{ teacher().employeeId }}</span> }
              @if (teacher().department) { <span class="meta-chip">🏛 {{ teacher().department }}</span> }
            </div>
            <span class="status-pill" [class]="teacher().isActive !== false ? 'status-active' : 'status-inactive'">
              {{ teacher().isActive !== false ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats">
        <div class="qs-card">
          <div class="qs-icon" style="background:#dbeafe;color:#3b82f6">📅</div>
          <div><div class="qs-value">{{ getExperience() }}</div><div class="qs-label">Years of Service</div></div>
        </div>
        <div class="qs-card">
          <div class="qs-icon" style="background:#dcfce7;color:#22c55e">📚</div>
          <div><div class="qs-value">{{ getSubjectCount() }}</div><div class="qs-label">Subjects</div></div>
        </div>
        <div class="qs-card">
          <div class="qs-icon" style="background:#fef3c7;color:#f59e0b">🏫</div>
          <div><div class="qs-value">{{ getClassCount() }}</div><div class="qs-label">Assigned Classes</div></div>
        </div>
        <div class="qs-card">
          <div class="qs-icon" style="background:#f3e8ff;color:#8b5cf6">👨‍🏫</div>
          <div><div class="qs-value">{{ classTeacherAssignments().length }}</div><div class="qs-label">Class Teacher Of</div></div>
        </div>
      </div>

      <!-- Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Personal Details -->
        <div class="card info-card">
          <h3 class="card-title">Personal Information</h3>
          <div class="info-list">
            <div class="info-row"><span class="label">Full Name</span><span>{{ teacher().firstName }} {{ teacher().lastName }}</span></div>
            <div class="info-row"><span class="label">Email</span><span>{{ teacher().email }}</span></div>
            <div class="info-row"><span class="label">Phone</span><span>{{ teacher().phone || '—' }}</span></div>
            <div class="info-row"><span class="label">Gender</span><span>{{ teacher().gender || '—' }}</span></div>
            <div class="info-row"><span class="label">Date of Birth</span><span>{{ teacher().dateOfBirth ? (teacher().dateOfBirth | date:'mediumDate') : '—' }}</span></div>
            <div class="info-row"><span class="label">Joining Date</span><span>{{ teacher().joiningDate ? (teacher().joiningDate | date:'mediumDate') : '—' }}</span></div>
            <div class="info-row"><span class="label">Designation</span><span>{{ teacher().designation || '—' }}</span></div>
            <div class="info-row"><span class="label">Department</span><span>{{ teacher().department || '—' }}</span></div>
            <div class="info-row"><span class="label">Employee ID</span><span>{{ teacher().employeeId || '—' }}</span></div>
          </div>
        </div>

        <!-- Subject Assignments with Academic Years -->
        <div class="card">
          <h3 class="card-title">Subject & Class Assignments</h3>
          @if (subjectAssignments().length > 0) {
            <div class="assignment-list">
              @for (sa of subjectAssignments(); track sa) {
                <div class="assignment-card">
                  <div class="asgn-header">
                    <span class="asgn-subject">{{ getSubjectName(sa.subject) }}</span>
                    <span class="asgn-class">{{ getClassName(sa.class) }}</span>
                  </div>
                  <div class="asgn-meta">
                    @if (sa.academicYear) {
                      <span class="meta-tag">📅 {{ getAcademicYearName(sa.academicYear) }}</span>
                    }
                    @if (sa.assignedAt) {
                      <span class="meta-tag">⏰ {{ sa.assignedAt | date:'mediumDate' }}</span>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-section">
              <p>No subject assignments yet.</p>
            </div>
          }
        </div>
      </div>

      <!-- Class Teacher Assignments -->
      @if (classTeacherAssignments().length > 0) {
        <div class="card" style="margin-bottom:var(--space-6)">
          <h3 class="card-title">Class Teacher History</h3>
          <div class="ct-timeline">
            @for (ct of classTeacherAssignments(); track ct._id) {
              <div class="ct-item">
                <div class="ct-marker">👨‍🏫</div>
                <div class="ct-content">
                  <div class="ct-class">{{ getClassName(ct.class) }} — Section {{ getSectionName(ct.section) }}</div>
                  <div class="ct-year">{{ getAcademicYearName(ct.academicYear) }}</div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Events -->
      @if (events().length > 0) {
        <div class="card">
          <h3 class="card-title">Assigned Events</h3>
          <div class="event-grid">
            @for (ev of events(); track ev._id) {
              <div class="event-card">
                <div class="event-type" [class]="'type-' + ev.type">{{ ev.type }}</div>
                <h4>{{ ev.title }}</h4>
                <div class="event-date">{{ ev.startDate | date:'mediumDate' }}</div>
              </div>
            }
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
    .header-actions { display: flex; gap: var(--space-3); }

    .profile-hero { position: relative; border-radius: var(--radius-xl); overflow: hidden; margin-bottom: var(--space-6); background: var(--surface); border: 1px solid var(--border); }
    .hero-bg { height: 120px; background: linear-gradient(135deg, #059669, #3b82f6, #8b5cf6); }
    .hero-content { display: flex; align-items: flex-end; gap: var(--space-5); padding: 0 var(--space-6) var(--space-5); margin-top: -48px; }
    .avatar-xl {
      width: 96px; height: 96px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: #059669; color: white; font-size: var(--text-3xl); font-weight: 700; border: 4px solid var(--surface);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); flex-shrink: 0;
    }
    .hero-info h2 { font-size: var(--text-xl); font-weight: 700; margin-bottom: 4px; }
    .hero-meta { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-2); }
    .meta-chip { background: var(--bg-secondary); padding: 2px 10px; border-radius: 12px; font-size: var(--text-xs); font-weight: 500; }
    .id-chip { background: #dbeafe; color: #1e40af; font-family: monospace; }
    .status-pill { display: inline-block; padding: 2px 12px; border-radius: 12px; font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; }
    .status-active { background: #dcfce7; color: #166534; }
    .status-inactive { background: #fee2e2; color: #991b1b; }

    .quick-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
    .qs-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-4); display: flex; align-items: center; gap: var(--space-3); }
    .qs-icon { width: 44px; height: 44px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .qs-value { font-size: var(--text-xl); font-weight: 700; }
    .qs-label { font-size: var(--text-xs); color: var(--text-tertiary); }

    .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); margin-bottom: var(--space-6); }
    .card-title { font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--border); }
    .info-list { display: flex; flex-direction: column; }
    .info-row { display: flex; justify-content: space-between; padding: var(--space-2) 0; border-bottom: 1px solid var(--border); font-size: var(--text-sm); }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: var(--text-tertiary); font-weight: 500; }

    .assignment-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .assignment-card { padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .asgn-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .asgn-subject { font-weight: 600; color: var(--primary); }
    .asgn-class { font-size: var(--text-sm); color: var(--text-secondary); background: var(--bg-secondary); padding: 1px 8px; border-radius: 8px; }
    .asgn-meta { display: flex; gap: var(--space-2); }
    .meta-tag { font-size: var(--text-xs); color: var(--text-tertiary); background: var(--bg-secondary); padding: 1px 6px; border-radius: 6px; }
    .empty-section { text-align: center; color: var(--text-tertiary); padding: var(--space-6); }

    .ct-timeline { display: flex; flex-direction: column; gap: var(--space-3); }
    .ct-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .ct-marker { font-size: 20px; }
    .ct-class { font-weight: 500; }
    .ct-year { font-size: var(--text-xs); color: var(--text-tertiary); }

    .event-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--space-3); }
    .event-card { padding: var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .event-card h4 { font-size: var(--text-sm); margin: var(--space-1) 0; }
    .event-date { font-size: var(--text-xs); color: var(--text-tertiary); }
    .event-type { display: inline-block; padding: 1px 8px; border-radius: 8px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .type-academic { background: #dbeafe; color: #1e40af; }
    .type-cultural { background: #fce7f3; color: #be185d; }
    .type-sports { background: #dcfce7; color: #166534; }
    .type-exam { background: #fef3c7; color: #92400e; }

    @media (max-width: 900px) {
      .dashboard-grid { grid-template-columns: 1fr; }
      .quick-stats { grid-template-columns: repeat(2, 1fr); }
      .hero-content { flex-direction: column; align-items: center; text-align: center; }
    }
  `]
})
export class TeacherDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  teacher = signal<any>(null);
  subjectAssignments = signal<any[]>([]);
  classTeacherAssignments = signal<any[]>([]);
  events = signal<any[]>([]);

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadTeacher(id);
    this.loadClassTeacherAssignments(id);
    this.loadEvents(id);
  }

  loadTeacher(id: string): void {
    this.api.get<any>(`/teachers/${id}`).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || {};
        this.teacher.set(data);
        this.subjectAssignments.set(data.subjectAssignments || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadClassTeacherAssignments(teacherId: string): void {
    this.api.get<any>('/class-teacher-assignments', { teacherId }).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.classTeacherAssignments.set(Array.isArray(data) ? data : []);
      },
      error: () => {}
    });
  }

  loadEvents(teacherId: string): void {
    this.api.get<any>(`/events/teacher/${teacherId}`).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.events.set(Array.isArray(data) ? data : []);
      },
      error: () => {}
    });
  }

  getExperience(): string {
    const t = this.teacher();
    if (!t?.joiningDate) return '-';
    const years = Math.floor((Date.now() - new Date(t.joiningDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return String(Math.max(years, 0));
  }

  getSubjectCount(): number {
    return this.subjectAssignments().length || (this.teacher()?.subjects?.length || 0);
  }

  getClassCount(): number {
    const uniqueClasses = new Set(this.subjectAssignments().map((sa: any) => {
      if (typeof sa.class === 'object') return sa.class?._id;
      return sa.class;
    }).filter(Boolean));
    return uniqueClasses.size || (this.teacher()?.assignedClasses?.length || 0);
  }

  getSubjectName(s: any): string {
    if (!s) return '-';
    if (typeof s === 'string') return s;
    return s.name || '-';
  }

  getClassName(c: any): string {
    if (!c) return '-';
    if (typeof c === 'string') return c;
    return c.name || '-';
  }

  getSectionName(s: any): string {
    if (!s) return '-';
    if (typeof s === 'string') return s;
    return s.name || s.division || '-';
  }

  getAcademicYearName(ay: any): string {
    if (!ay) return '-';
    if (typeof ay === 'string') return ay;
    return ay.name || '-';
  }
}
