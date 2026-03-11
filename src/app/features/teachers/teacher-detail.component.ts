import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-teacher-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- Elegant Header -->
    <header class="profile-header">
      <div class="header-left">
        <a routerLink="/teachers" class="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Teachers</span>
        </a>
      </div>
      @if (teacher()) {
        <div class="header-right">
          <a [routerLink]="['/teachers', teacher()._id, 'assignments']" class="btn-outline">
            View Assignments
          </a>
        </div>
      }
    </header>

    @if (loading()) {
      <div class="loading-state">
        <div class="loader"></div>
        <p>Loading profile...</p>
      </div>
    } @else if (teacher()) {
      <!-- Profile Card -->
      <section class="profile-card fade-in">
        <div class="profile-main">
          <div class="avatar">
            <span class="avatar-initials">{{ teacher().firstName?.charAt(0) }}{{ teacher().lastName?.charAt(0) }}</span>
            <span class="status-indicator" [class.active]="teacher().isActive !== false"></span>
          </div>
          <div class="profile-info">
            <h1 class="name">{{ teacher().firstName }} {{ teacher().lastName }}</h1>
            <p class="role">{{ teacher().designation || 'Teacher' }}</p>
            <div class="meta-row">
              @if (teacher().department) {
                <span class="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>
                  {{ teacher().department }}
                </span>
              }
              @if (teacher().employeeId) {
                <span class="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {{ teacher().employeeId }}
                </span>
              }
            </div>
          </div>
        </div>
        <div class="profile-stats">
          <div class="stat-item slide-up" style="--delay: 0.1s">
            <span class="stat-number">{{ getExperience() }}</span>
            <span class="stat-label">Years</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item slide-up" style="--delay: 0.15s">
            <span class="stat-number">{{ getSubjectCount() }}</span>
            <span class="stat-label">Subjects</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item slide-up" style="--delay: 0.2s">
            <span class="stat-number">{{ getClassCount() }}</span>
            <span class="stat-label">Classes</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item slide-up" style="--delay: 0.25s">
            <span class="stat-number">{{ classTeacherAssignments().length }}</span>
            <span class="stat-label">Class Teacher</span>
          </div>
        </div>
      </section>

      <!-- Content Grid -->
      <div class="content-grid">
        <!-- Personal Details -->
        <section class="content-card slide-up" style="--delay: 0.3s">
          <h2 class="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            Personal Details
          </h2>
          <div class="details-list">
            <div class="detail-row">
              <span class="detail-label">Full Name</span>
              <span class="detail-value">{{ teacher().firstName }} {{ teacher().lastName }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Email</span>
              <span class="detail-value">{{ teacher().email }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone</span>
              <span class="detail-value">{{ teacher().phone || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Gender</span>
              <span class="detail-value">{{ teacher().gender || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date of Birth</span>
              <span class="detail-value">{{ teacher().dateOfBirth ? (teacher().dateOfBirth | date:'mediumDate') : '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Joining Date</span>
              <span class="detail-value">{{ teacher().joiningDate ? (teacher().joiningDate | date:'mediumDate') : '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Designation</span>
              <span class="detail-value">{{ teacher().designation || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Department</span>
              <span class="detail-value">{{ teacher().department || '—' }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Employee ID</span>
              <span class="detail-value highlight">{{ teacher().employeeId || '—' }}</span>
            </div>
          </div>
        </section>

        <!-- Subject Assignments -->
        <section class="content-card slide-up" style="--delay: 0.35s">
          <h2 class="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Teaching Assignments
            <span class="badge">{{ subjectAssignments().length }}</span>
          </h2>
          @if (subjectAssignments().length > 0) {
            <div class="assignments-list">
              @for (sa of subjectAssignments(); track sa; let i = $index) {
                <div class="assignment-item" [style.--delay]="(0.4 + i * 0.05) + 's'">
                  <div class="assignment-header">
                    <span class="subject-name">{{ getSubjectName(sa.subject) }}</span>
                    <span class="class-badge">{{ getClassName(sa.class) }}</span>
                  </div>
                  <div class="assignment-details">
                    @if (sa.sections && sa.sections.length > 0) {
                      <div class="sections">
                        @for (sec of sa.sections; track sec) {
                          <span class="section-chip">{{ sec }}</span>
                        }
                      </div>
                    }
                    @if (sa.academicYear) {
                      <span class="year-info">{{ getAcademicYearName(sa.academicYear) }}</span>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <p>No teaching assignments yet</p>
            </div>
          }
        </section>
      </div>

      <!-- Class Teacher History -->
      @if (classTeacherAssignments().length > 0) {
        <section class="content-card full-width slide-up" style="--delay: 0.45s">
          <h2 class="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Class Teacher History
          </h2>
          <div class="timeline">
            @for (ct of classTeacherAssignments(); track ct._id; let i = $index; let last = $last) {
              <div class="timeline-item" [style.--delay]="(0.5 + i * 0.08) + 's'">
                <div class="timeline-marker" [class.last]="last">
                  <span class="marker-dot"></span>
                  @if (!last) { <span class="marker-line"></span> }
                </div>
                <div class="timeline-content">
                  <div class="timeline-header">
                    <h4>{{ ct.class?.name || ct.class || 'Class' }}</h4>
                    @if (ct.class?.sections && ct.class.sections.length > 0) {
                      <div class="timeline-sections">
                        @for (sec of ct.class.sections; track sec.name) {
                          <span class="section-chip">{{ sec.name }}</span>
                        }
                      </div>
                    }
                  </div>
                  <p class="timeline-year">{{ ct.academicYear?.name || ct.academicYear || 'N/A' }}</p>
                  @if (ct.assignedAt) {
                    <p class="timeline-date">Assigned {{ ct.assignedAt | date:'mediumDate' }}</p>
                  }
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- Events -->
      @if (events().length > 0) {
        <section class="content-card full-width slide-up" style="--delay: 0.55s">
          <h2 class="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Assigned Events
          </h2>
          <div class="events-grid">
            @for (ev of events(); track ev._id; let i = $index) {
              <div class="event-card" [style.--delay]="(0.6 + i * 0.05) + 's'">
                <span class="event-type" [attr.data-type]="ev.type">{{ ev.type }}</span>
                <h4 class="event-title">{{ ev.title }}</h4>
                <p class="event-date">{{ ev.startDate | date:'mediumDate' }}</p>
              </div>
            }
          </div>
        </section>
      }
    }
  `,
  styles: [`
    /* ===== CSS Variables (from global theme) ===== */
    :host {
      --accent: var(--primary, #2563eb);
      --accent-light: var(--primary-hover, #eff6ff);
      --text-primary: var(--text-primary, #111827);
      --text-secondary: var(--text-secondary, #6b7280);
      --text-muted: var(--text-tertiary, #9ca3af);
      --bg-primary: var(--bg-surface, #ffffff);
      --bg-secondary: var(--bg-secondary, #f9fafb);
      --border: var(--border-color, #e5e7eb);
      --shadow-sm: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05));
      --shadow-md: var(--shadow-md, 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04));
      --shadow-lg: var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -2px rgba(0,0,0,0.04));
      --radius: 12px;
      --transition: 0.2s ease;
    }

    /* ===== Animations ===== */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

    .fade-in { animation: fadeIn 0.4s ease forwards; }
    .slide-up { animation: slideUp 0.5s ease forwards; animation-delay: var(--delay, 0s); opacity: 0; }

    /* ===== Header ===== */
    .profile-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 0; margin-bottom: 24px;
    }
    .back-link {
      display: inline-flex; align-items: center; gap: 8px;
      color: var(--text-secondary); text-decoration: none;
      font-size: 14px; font-weight: 500;
      transition: color var(--transition);
    }
    .back-link:hover { color: var(--text-primary); }
    .back-link svg { transition: transform var(--transition); }
    .back-link:hover svg { transform: translateX(-4px); }

    .btn-outline {
      padding: 10px 20px; border-radius: 8px;
      border: 1px solid var(--border); background: var(--bg-primary);
      color: var(--text-primary); font-size: 14px; font-weight: 500;
      text-decoration: none; transition: all var(--transition);
    }
    .btn-outline:hover { border-color: var(--accent); color: var(--accent); }

    /* ===== Loading ===== */
    .loading-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 80px 0; color: var(--text-muted);
    }
    .loader {
      width: 32px; height: 32px; border: 3px solid var(--border);
      border-top-color: var(--accent); border-radius: 50%;
      animation: spin 0.8s linear infinite; margin-bottom: 16px;
    }

    /* ===== Profile Card ===== */
    .profile-card {
      background: var(--bg-primary); border-radius: var(--radius);
      border: 1px solid var(--border); padding: 32px;
      margin-bottom: 24px; box-shadow: var(--shadow-sm);
    }
    .profile-main { display: flex; align-items: center; gap: 24px; margin-bottom: 32px; }
    .avatar {
      position: relative; width: 88px; height: 88px; border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .avatar-initials { color: white; font-size: 28px; font-weight: 600; letter-spacing: 1px; }
    .status-indicator {
      position: absolute; bottom: 4px; right: 4px;
      width: 16px; height: 16px; border-radius: 50%;
      background: #9ca3af; border: 3px solid var(--bg-primary);
    }
    .status-indicator.active { background: #22c55e; }

    .profile-info { flex: 1; }
    .name { font-size: 28px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; letter-spacing: -0.5px; }
    .role { font-size: 16px; color: var(--text-secondary); margin: 0 0 12px; }
    .meta-row { display: flex; flex-wrap: wrap; gap: 16px; }
    .meta-item {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 13px; color: var(--text-muted);
    }
    .meta-item svg { stroke: var(--text-muted); }

    .profile-stats {
      display: flex; align-items: center; justify-content: center;
      padding-top: 24px; border-top: 1px solid var(--border);
    }
    .stat-item { text-align: center; padding: 0 32px; }
    .stat-number { display: block; font-size: 32px; font-weight: 700; color: var(--text-primary); line-height: 1; }
    .stat-label { display: block; font-size: 13px; color: var(--text-muted); margin-top: 4px; }
    .stat-divider { width: 1px; height: 40px; background: var(--border); }

    /* ===== Content Grid ===== */
    .content-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 24px; }
    .content-card {
      background: var(--bg-primary); border-radius: var(--radius);
      border: 1px solid var(--border); padding: 24px;
      box-shadow: var(--shadow-sm); transition: box-shadow var(--transition);
    }
    .content-card:hover { box-shadow: var(--shadow-md); }
    .content-card.full-width { grid-column: 1 / -1; }

    .section-title {
      display: flex; align-items: center; gap: 10px;
      font-size: 16px; font-weight: 600; color: var(--text-primary);
      margin: 0 0 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border);
    }
    .section-title svg { stroke: var(--accent); }
    .section-title .badge {
      margin-left: auto; background: var(--accent-light);
      color: var(--accent); font-size: 12px; font-weight: 600;
      padding: 2px 10px; border-radius: 12px;
    }

    /* ===== Details List ===== */
    .details-list { display: flex; flex-direction: column; }
    .detail-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 0; border-bottom: 1px solid var(--border);
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-size: 14px; color: var(--text-muted); }
    .detail-value { font-size: 14px; color: var(--text-primary); font-weight: 500; }
    .detail-value.highlight {
      background: var(--bg-secondary); padding: 4px 12px;
      border-radius: 6px; font-family: 'SF Mono', monospace; font-size: 13px;
    }

    /* ===== Assignments ===== */
    .assignments-list { display: flex; flex-direction: column; gap: 12px; max-height: 400px; overflow-y: auto; }
    .assignment-item {
      padding: 16px; background: var(--bg-secondary);
      border-radius: 10px; border: 1px solid transparent;
      transition: all var(--transition); animation: slideUp 0.4s ease forwards;
      animation-delay: var(--delay, 0s); opacity: 0;
    }
    .assignment-item:hover { border-color: var(--accent); background: var(--accent-light); }
    .assignment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .subject-name { font-weight: 600; color: var(--text-primary); }
    .class-badge {
      background: var(--accent); color: white;
      padding: 4px 12px; border-radius: 6px;
      font-size: 12px; font-weight: 600;
    }
    .assignment-details { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .sections { display: flex; gap: 6px; }
    .section-chip {
      background: var(--bg-primary); border: 1px solid var(--border);
      padding: 2px 10px; border-radius: 6px;
      font-size: 12px; color: var(--text-secondary);
    }
    .year-info { font-size: 12px; color: var(--text-muted); }

    /* ===== Empty State ===== */
    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 40px; text-align: center; color: var(--text-muted);
    }
    .empty-state svg { margin-bottom: 12px; stroke: var(--border); }
    .empty-state p { margin: 0; font-size: 14px; }

    /* ===== Timeline ===== */
    .timeline { display: flex; flex-direction: column; }
    .timeline-item {
      display: flex; gap: 20px; animation: slideUp 0.4s ease forwards;
      animation-delay: var(--delay, 0s); opacity: 0;
    }
    .timeline-marker { display: flex; flex-direction: column; align-items: center; width: 20px; }
    .marker-dot {
      width: 12px; height: 12px; border-radius: 50%;
      background: var(--accent); flex-shrink: 0;
    }
    .marker-line { flex: 1; width: 2px; background: var(--border); margin-top: 8px; }
    .timeline-content { flex: 1; padding-bottom: 24px; }
    .timeline-item:last-child .timeline-content { padding-bottom: 0; }
    .timeline-header { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 4px; }
    .timeline-header h4 { margin: 0; font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .timeline-sections { display: flex; gap: 6px; }
    .timeline-year { font-size: 13px; color: var(--text-secondary); margin: 4px 0; }
    .timeline-date { font-size: 12px; color: var(--text-muted); margin: 0; }

    /* ===== Events Grid ===== */
    .events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
    .event-card {
      padding: 20px; background: var(--bg-secondary);
      border-radius: 10px; border: 1px solid transparent;
      transition: all var(--transition); animation: slideUp 0.4s ease forwards;
      animation-delay: var(--delay, 0s); opacity: 0;
    }
    .event-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .event-type {
      display: inline-block; padding: 4px 10px; border-radius: 6px;
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      margin-bottom: 12px; background: var(--bg-primary); color: var(--text-secondary);
    }
    .event-type[data-type="academic"] { background: #dbeafe; color: #1e40af; }
    .event-type[data-type="cultural"] { background: #fce7f3; color: #be185d; }
    .event-type[data-type="sports"] { background: #dcfce7; color: #166534; }
    .event-type[data-type="exam"] { background: #fef3c7; color: #92400e; }
    .event-title { margin: 0 0 8px; font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .event-date { margin: 0; font-size: 13px; color: var(--text-muted); }

    /* ===== Responsive ===== */
    @media (max-width: 900px) {
      .content-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .profile-main { flex-direction: column; text-align: center; }
      .meta-row { justify-content: center; }
      .profile-stats { flex-wrap: wrap; gap: 16px; }
      .stat-divider { display: none; }
      .stat-item { padding: 16px; flex: 1; min-width: 100px; }
      .profile-header { flex-direction: column; gap: 16px; align-items: flex-start; }
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

  getSubjectName(subject: any): string {
    if (!subject) return '-';
    return typeof subject === 'string' ? subject : (subject.name || subject.subjectName || '-');
  }

  getClassName(classObj: any): string {
    if (!classObj) return '-';
    return typeof classObj === 'string' ? classObj : (classObj.name || classObj.className || '-');
  }

  getAcademicYearName(year: any): string {
    if (!year) return '-';
    return typeof year === 'string' ? year : (year.name || year.academicYear || `${year.startYear}-${year.endYear}` || '-');
  }
}
