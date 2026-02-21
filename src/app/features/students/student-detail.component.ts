import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Student, Enrollment } from '../../core/models';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Student Profile</h1>
        <p>Complete academic journey and history</p>
      </div>
      <div class="header-actions">
        <a routerLink="/students" class="btn btn-secondary">← Back</a>
        @if (student()) {
          <a [routerLink]="['/students', student()!._id, 'edit']" class="btn btn-primary">Edit Student</a>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="skeleton" style="height:500px;border-radius:12px"></div>
    } @else if (student()) {
      <!-- Profile Hero -->
      <div class="profile-hero">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <div class="avatar-xl">{{ student()!.firstName?.charAt(0) }}{{ student()!.lastName?.charAt(0) }}</div>
          <div class="hero-info">
            <h2>{{ student()!.firstName }} {{ student()!.middleName || '' }} {{ student()!.lastName }}</h2>
            <div class="hero-meta">
              <span class="meta-chip">🎓 {{ getClassName(student()!.currentClass) }}</span>
              @if (student()!.currentSection) { <span class="meta-chip">📍 Section {{ student()!.currentSection }}</span> }
              @if (student()!.rollNumber) { <span class="meta-chip">📋 Roll #{{ student()!.rollNumber }}</span> }
              <span class="meta-chip adm-chip">{{ student()!.admissionNumber }}</span>
            </div>
            <span class="status-pill" [class]="'status-' + student()!.status">{{ student()!.status }}</span>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="quick-stats">
        <div class="qs-card">
          <div class="qs-icon" style="background:#dbeafe;color:#3b82f6">📅</div>
          <div><div class="qs-value">{{ yearsInSchool() }}</div><div class="qs-label">Years in School</div></div>
        </div>
        <div class="qs-card">
          <div class="qs-icon" style="background:#dcfce7;color:#22c55e">📈</div>
          <div><div class="qs-value">{{ enrollmentHistory().length }}</div><div class="qs-label">Enrollments</div></div>
        </div>
        <div class="qs-card">
          <div class="qs-icon" style="background:#fef3c7;color:#f59e0b">🏆</div>
          <div><div class="qs-value">{{ getPassCount() }}</div><div class="qs-label">Years Passed</div></div>
        </div>
        <div class="qs-card">
          <div class="qs-icon" style="background:#f3e8ff;color:#8b5cf6">📊</div>
          <div><div class="qs-value">{{ getCurrentAcademicYear() }}</div><div class="qs-label">Current Year</div></div>
        </div>
      </div>

      <!-- Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Left: Personal Details -->
        <div class="card info-card">
          <h3 class="card-title">Personal Information</h3>
          <div class="info-list">
            <div class="info-row"><span class="label">Full Name</span><span>{{ student()!.firstName }} {{ student()!.middleName || '' }} {{ student()!.lastName }}</span></div>
            <div class="info-row"><span class="label">Gender</span><span>{{ student()!.gender || '—' }}</span></div>
            <div class="info-row"><span class="label">Date of Birth</span><span>{{ student()!.dateOfBirth ? (student()!.dateOfBirth | date:'mediumDate') : '—' }}</span></div>
            <div class="info-row"><span class="label">Blood Group</span><span>{{ $any(student()).bloodGroup || '—' }}</span></div>
            <div class="info-row"><span class="label">Email</span><span>{{ student()!.contact?.phone || student()!.email || '—' }}</span></div>
            <div class="info-row"><span class="label">Phone</span><span>{{ student()!.contact?.phone || '—' }}</span></div>
            <div class="info-row"><span class="label">Admission Date</span><span>{{ student()!.admissionDate ? (student()!.admissionDate | date:'mediumDate') : '—' }}</span></div>
            <div class="info-row"><span class="label">Nationality</span><span>{{ $any(student()).nationality || '—' }}</span></div>
          </div>
        </div>

        <!-- Right: Academic Journey Timeline -->
        <div class="card timeline-card">
          <h3 class="card-title">Academic Journey</h3>
          @if (enrollmentHistory().length > 0) {
            <div class="timeline">
              @for (e of enrollmentHistory(); track e._id; let i = $index) {
                <div class="timeline-item" [class.current]="e.status === 'active'">
                  <div class="timeline-marker" [class]="'marker-' + (e.result || e.status)">
                    @if (e.result === 'pass' || e.result === 'promoted') { ✓ }
                    @else if (e.result === 'fail' || e.result === 'retained') { ✗ }
                    @else { {{ enrollmentHistory().length - i }} }
                  </div>
                  <div class="timeline-content">
                    <div class="tl-header">
                      <span class="tl-year">{{ getAcademicYearName(e.academicYear) }}</span>
                      @if (e.status === 'active') { <span class="tl-current-badge">CURRENT</span> }
                    </div>
                    <div class="tl-class">{{ getClassName(e.class) }} — Section {{ e.section }}</div>
                    <div class="tl-details">
                      <span class="tl-roll">Roll #{{ e.rollNumber || '-' }}</span>
                      @if (e.result) {
                        <span class="tl-result" [class]="'result-' + e.result">{{ e.result | titlecase }}</span>
                      }
                      @if (e.percentage) {
                        <span class="tl-pct">{{ e.percentage }}%</span>
                      }
                      @if (e.rank) {
                        <span class="tl-rank">Rank #{{ e.rank }}</span>
                      }
                    </div>
                    @if (e.remarks) {
                      <div class="tl-remarks">{{ e.remarks }}</div>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-timeline">
              <div style="font-size:48px;margin-bottom:8px">📚</div>
              <p>No enrollment history found.</p>
              <a routerLink="/enrollments" class="btn btn-primary btn-sm">Enroll Student</a>
            </div>
          }
        </div>
      </div>

      <!-- Tab Section -->
      <div class="card tab-section">
        <div class="tab-bar">
          @for (tab of tabs; track tab.key) {
            <button class="tab-btn" [class.active]="activeTab() === tab.key" (click)="activeTab.set(tab.key)">{{ tab.icon }} {{ tab.label }}</button>
          }
        </div>

        @switch (activeTab()) {
          @case ('attendance') {
            <div class="tab-content animate-in">
              <h3>Attendance Summary</h3>
              @if (attendanceData().length > 0) {
                <div class="grid grid-3">
                  @for (a of attendanceData(); track a.label) {
                    <div class="stat-mini"><div class="stat-mini-val" [style.color]="a.color">{{ a.value }}</div><div class="stat-mini-label">{{ a.label }}</div></div>
                  }
                </div>
              } @else {
                <p class="tab-empty">No attendance data available yet.</p>
              }
            </div>
          }
          @case ('results') {
            <div class="tab-content animate-in">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4)">
                <h3>Exam Results</h3>
                <a [routerLink]="['/results/report-card', student()!._id]" class="btn btn-primary btn-sm">📄 Report Card</a>
              </div>
              @if (resultsData().length > 0) {
                <table class="data-table">
                  <thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead>
                  <tbody>
                    @for (r of resultsData(); track r) {
                      <tr>
                        <td>{{ r.examName }}</td>
                        <td>{{ r.subjectName }}</td>
                        <td>{{ r.obtained }}/{{ r.max }}</td>
                        <td><span class="badge badge-success">{{ r.grade }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <p class="tab-empty">No exam results available yet.</p>
              }
            </div>
          }
          @case ('fees') {
            <div class="tab-content animate-in">
              <h3>Fee Records</h3>
              @if (feeData().length > 0) {
                <table class="data-table">
                  <thead><tr><th>Fee Type</th><th>Amount</th><th>Due Date</th><th>Status</th></tr></thead>
                  <tbody>
                    @for (f of feeData(); track f) {
                      <tr>
                        <td>{{ f.type }}</td>
                        <td>{{ f.amount }}</td>
                        <td>{{ f.dueDate | date:'mediumDate' }}</td>
                        <td><span class="badge" [class]="f.status === 'paid' ? 'badge-success' : 'badge-warning'">{{ f.status }}</span></td>
                      </tr>
                    }
                  </tbody>
                </table>
              } @else {
                <p class="tab-empty">No fee records available yet.</p>
              }
            </div>
          }
          @case ('parents') {
            <div class="tab-content animate-in">
              <h3>Parent / Guardian Information</h3>
              @if (parents().length > 0) {
                <div class="parent-grid">
                  @for (p of parents(); track p._id || p) {
                    <div class="parent-card">
                      <div class="parent-avatar">{{ getInitials(p) }}</div>
                      <div>
                        <div class="parent-name">{{ p.firstName }} {{ p.lastName }}</div>
                        <div class="parent-detail">{{ p.relationship || p.relation || 'Parent' }}</div>
                        <div class="parent-detail">{{ p.phone || p.email || '' }}</div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p class="tab-empty">No parent records linked.</p>
              }
            </div>
          }
        }
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
    .header-actions { display: flex; gap: var(--space-3); }

    /* Profile Hero */
    .profile-hero { position: relative; border-radius: var(--radius-xl); overflow: hidden; margin-bottom: var(--space-6); background: var(--surface); border: 1px solid var(--border); }
    .hero-bg { height: 120px; background: linear-gradient(135deg, var(--primary), #8b5cf6, #ec4899); }
    .hero-content { display: flex; align-items: flex-end; gap: var(--space-5); padding: 0 var(--space-6) var(--space-5); margin-top: -48px; }
    .avatar-xl {
      width: 96px; height: 96px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: var(--primary); color: white; font-size: var(--text-3xl); font-weight: 700; border: 4px solid var(--surface);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15); flex-shrink: 0;
    }
    .hero-info h2 { font-size: var(--text-xl); font-weight: 700; margin-bottom: 4px; }
    .hero-meta { display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-2); }
    .meta-chip { background: var(--bg-secondary); padding: 2px 10px; border-radius: 12px; font-size: var(--text-xs); font-weight: 500; }
    .adm-chip { background: #dbeafe; color: #1e40af; font-family: monospace; }
    .status-pill { display: inline-block; padding: 2px 12px; border-radius: 12px; font-size: var(--text-xs); font-weight: 600; text-transform: uppercase; }
    .status-active { background: #dcfce7; color: #166534; }
    .status-inactive { background: #fee2e2; color: #991b1b; }

    /* Quick Stats */
    .quick-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
    .qs-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-4); display: flex; align-items: center; gap: var(--space-3); }
    .qs-icon { width: 44px; height: 44px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 18px; }
    .qs-value { font-size: var(--text-xl); font-weight: 700; }
    .qs-label { font-size: var(--text-xs); color: var(--text-tertiary); }

    /* Dashboard Grid */
    .dashboard-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); margin-bottom: var(--space-6); }
    .card-title { font-size: var(--text-lg); font-weight: 600; margin-bottom: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--border); }
    .info-list { display: flex; flex-direction: column; }
    .info-row { display: flex; justify-content: space-between; padding: var(--space-2) 0; border-bottom: 1px solid var(--border); font-size: var(--text-sm); }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: var(--text-tertiary); font-weight: 500; }

    /* Timeline */
    .timeline { position: relative; padding-left: 32px; }
    .timeline::before { content: ''; position: absolute; left: 14px; top: 0; bottom: 0; width: 2px; background: var(--border); }
    .timeline-item { position: relative; margin-bottom: var(--space-5); }
    .timeline-item.current .timeline-content { border-color: var(--primary); background: rgba(59,130,246,0.04); }
    .timeline-marker {
      position: absolute; left: -32px; top: 4px; width: 28px; height: 28px; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; font-size: 11px; font-weight: 700; z-index: 1;
      background: var(--surface); border: 2px solid var(--border); color: var(--text-secondary);
    }
    .marker-pass, .marker-promoted { border-color: #22c55e; color: #22c55e; background: #f0fdf4; }
    .marker-fail, .marker-retained { border-color: #ef4444; color: #ef4444; background: #fef2f2; }
    .marker-active { border-color: var(--primary); color: var(--primary); background: #eff6ff; }
    .timeline-content { padding: var(--space-3) var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .tl-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
    .tl-year { font-weight: 600; font-size: var(--text-sm); color: var(--primary); }
    .tl-current-badge { background: var(--primary); color: white; padding: 1px 8px; border-radius: 8px; font-size: 10px; font-weight: 700; }
    .tl-class { font-weight: 500; margin-bottom: 4px; }
    .tl-details { display: flex; gap: var(--space-3); flex-wrap: wrap; font-size: var(--text-xs); }
    .tl-roll { color: var(--text-secondary); }
    .tl-result { padding: 1px 8px; border-radius: 8px; font-weight: 600; }
    .result-pass, .result-promoted { background: #dcfce7; color: #166534; }
    .result-fail, .result-retained { background: #fee2e2; color: #991b1b; }
    .tl-pct { color: var(--text-secondary); }
    .tl-rank { color: #f59e0b; font-weight: 600; }
    .tl-remarks { font-size: var(--text-xs); color: var(--text-tertiary); margin-top: 4px; font-style: italic; }
    .empty-timeline { text-align: center; padding: var(--space-8); }
    .empty-timeline p { color: var(--text-tertiary); margin-bottom: var(--space-3); }

    /* Tabs */
    .tab-section { margin-bottom: var(--space-6); }
    .tab-bar { display: flex; gap: var(--space-2); border-bottom: 1px solid var(--border); margin-bottom: var(--space-4); }
    .tab-btn {
      padding: var(--space-2) var(--space-4); background: none; border: none; border-bottom: 2px solid transparent;
      cursor: pointer; font-size: var(--text-sm); font-weight: 500; color: var(--text-secondary); transition: all 0.2s;
    }
    .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
    .tab-content h3 { margin-bottom: var(--space-4); }
    .tab-empty { text-align: center; color: var(--text-tertiary); padding: var(--space-6); }
    .stat-mini { text-align: center; padding: var(--space-4); background: var(--bg-secondary); border-radius: var(--radius-md); }
    .stat-mini-val { font-size: var(--text-2xl); font-weight: 700; }
    .stat-mini-label { font-size: var(--text-xs); color: var(--text-tertiary); margin-top: 2px; }
    .animate-in { animation: slideIn 0.3s ease; }
    @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    /* Parents */
    .parent-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); }
    .parent-card { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .parent-avatar { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #f3e8ff; color: #8b5cf6; font-weight: 700; flex-shrink: 0; }
    .parent-name { font-weight: 500; }
    .parent-detail { font-size: var(--text-xs); color: var(--text-tertiary); }

    .grid { display: grid; gap: var(--space-4); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    @media (max-width: 900px) {
      .dashboard-grid { grid-template-columns: 1fr; }
      .quick-stats { grid-template-columns: repeat(2, 1fr); }
      .hero-content { flex-direction: column; align-items: center; text-align: center; }
    }
  `]
})
export class StudentDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  student = signal<Student | null>(null);
  enrollmentHistory = signal<any[]>([]);
  parents = signal<any[]>([]);
  attendanceData = signal<any[]>([]);
  resultsData = signal<any[]>([]);
  feeData = signal<any[]>([]);
  activeTab = signal('attendance');

  tabs = [
    { key: 'attendance', icon: '📋', label: 'Attendance' },
    { key: 'results', icon: '📝', label: 'Results' },
    { key: 'fees', icon: '💰', label: 'Fees' },
    { key: 'parents', icon: '👨‍👩‍👧', label: 'Parents' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadStudent(id);
    this.loadEnrollmentHistory(id);
  }

  loadStudent(id: string): void {
    this.api.get<any>(`/students/${id}`).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || {};
        this.student.set(data);
        // Extract parents from populated data
        if (data.parents && Array.isArray(data.parents)) {
          this.parents.set(data.parents.filter((p: any) => typeof p === 'object'));
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadEnrollmentHistory(studentId: string): void {
    this.api.get<any>(`/enrollments/student/${studentId}/history`).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || {};
        const enrollments = data.enrollments || data || [];
        this.enrollmentHistory.set(Array.isArray(enrollments) ? enrollments : []);
      },
      error: () => {} // Silently fail - enrollment history may not exist yet
    });
  }

  yearsInSchool(): number {
    const s = this.student();
    if (!s?.admissionDate) return this.enrollmentHistory().length || 0;
    const start = new Date(s.admissionDate);
    const years = Math.ceil((Date.now() - start.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return Math.max(years, 1);
  }

  getPassCount(): number {
    return this.enrollmentHistory().filter(e =>
      e.result === 'pass' || e.result === 'promoted'
    ).length;
  }

  getCurrentAcademicYear(): string {
    const s = this.student();
    if (!s?.currentAcademicYear) return '-';
    if (typeof s.currentAcademicYear === 'object') return (s.currentAcademicYear as any).name || '-';
    // Try from enrollment history
    const active = this.enrollmentHistory().find(e => e.status === 'active');
    if (active) return this.getAcademicYearName(active.academicYear);
    return '-';
  }

  getClassName(c: any): string {
    if (!c) return '-';
    if (typeof c === 'string') return c;
    return c.name || '-';
  }

  getAcademicYearName(ay: any): string {
    if (!ay) return '-';
    if (typeof ay === 'string') return ay;
    return ay.name || '-';
  }

  getInitials(p: any): string {
    if (!p) return '?';
    return `${p.firstName?.charAt(0) || ''}${p.lastName?.charAt(0) || ''}`;
  }
}
