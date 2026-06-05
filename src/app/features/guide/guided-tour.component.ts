import { Component, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface TourStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  tips: string[];
  screenType: string;
}

@Component({
  selector: 'app-guided-tour',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="tour-shell">
      <!-- Top Bar -->
      <header class="tour-header">
        <a routerLink="/auth/login" class="brand">
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none"><rect width="40" height="40" rx="10" fill="#6366f1"/><path d="M12 28V16l8-5 8 5v12" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 28v-6h6v6" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>EduCore</span>
        </a>
        <nav class="tour-nav">
          <span class="step-counter">Step {{ current() + 1 }} of {{ steps.length }}</span>
          <a routerLink="/auth/login" class="btn-cta-sm">Sign In</a>
          <a routerLink="/auth/register" class="btn-cta-sm primary">Get Started Free</a>
        </nav>
      </header>

      <!-- Progress Bar -->
      <div class="progress-track">
        <div class="progress-fill" [style.width.%]="progressPercent()"></div>
      </div>

      <!-- Main Content -->
      <main class="tour-body">
        <!-- Sidebar Steps -->
        <aside class="step-sidebar">
          <div class="sidebar-title">Setup Guide</div>
          @for (step of steps; track step.id; let i = $index) {
            <button
              class="step-nav-item"
              [class.active]="current() === i"
              [class.completed]="i < current()"
              (click)="goTo(i)">
              <span class="step-marker">
                @if (i < current()) { <span class="check">✓</span> }
                @else { {{ i + 1 }} }
              </span>
              <span class="step-nav-label">{{ step.title }}</span>
            </button>
          }
        </aside>

        <!-- Center: Animated Screen -->
        <section class="step-content">
          <div class="step-intro" [class.animate]="animating()">
            <span class="step-icon">{{ steps[current()].icon }}</span>
            <h1>{{ steps[current()].title }}</h1>
            <p class="step-subtitle">{{ steps[current()].subtitle }}</p>
          </div>

          <!-- Animated Mock Screen -->
          <div class="mock-browser" [class.animate]="animating()">
            <div class="browser-chrome">
              <div class="browser-dots"><span></span><span></span><span></span></div>
              <div class="browser-url">
                <span class="lock">🔒</span> educore.app/{{ steps[current()].screenType }}
              </div>
            </div>
            <div class="browser-body">
              @switch (steps[current()].screenType) {
                @case ('register') { @defer { <ng-container *ngTemplateOutlet="screenRegister" /> } }
                @case ('schools/new') { @defer { <ng-container *ngTemplateOutlet="screenAddSchool" /> } }
                @case ('academic-years') { @defer { <ng-container *ngTemplateOutlet="screenAcademicYear" /> } }
                @case ('classes') { @defer { <ng-container *ngTemplateOutlet="screenClasses" /> } }
                @case ('subjects') { @defer { <ng-container *ngTemplateOutlet="screenSubjects" /> } }
                @case ('teachers') { @defer { <ng-container *ngTemplateOutlet="screenTeachers" /> } }
                @case ('students') { @defer { <ng-container *ngTemplateOutlet="screenStudents" /> } }
                @case ('parents') { @defer { <ng-container *ngTemplateOutlet="screenParents" /> } }
                @case ('attendance') { @defer { <ng-container *ngTemplateOutlet="screenAttendance" /> } }
                @case ('exams') { @defer { <ng-container *ngTemplateOutlet="screenExams" /> } }
                @case ('results') { @defer { <ng-container *ngTemplateOutlet="screenResults" /> } }
                @case ('fees') { @defer { <ng-container *ngTemplateOutlet="screenFees" /> } }
                @case ('timetable') { @defer { <ng-container *ngTemplateOutlet="screenTimetable" /> } }
                @case ('transport') { @defer { <ng-container *ngTemplateOutlet="screenTransport" /> } }
                @case ('reports') { @defer { <ng-container *ngTemplateOutlet="screenReports" /> } }
                @case ('notifications') { @defer { <ng-container *ngTemplateOutlet="screenNotifs" /> } }
                @case ('dashboard') { @defer { <ng-container *ngTemplateOutlet="screenDashboard" /> } }
              }
            </div>
          </div>

          <!-- Tips -->
          <div class="tips-section" [class.animate]="animating()">
            <div class="tips-title">💡 Pro Tips</div>
            <div class="tips-grid">
              @for (tip of steps[current()].tips; track tip) {
                <div class="tip-card">
                  <span class="tip-bullet">→</span>
                  <span>{{ tip }}</span>
                </div>
              }
            </div>
          </div>
        </section>
      </main>

      <!-- Bottom Navigation -->
      <footer class="tour-footer">
        <button class="btn-nav" [disabled]="current() === 0" (click)="prev()">
          ← Previous
        </button>
        <div class="dot-indicators">
          @for (step of steps; track step.id; let i = $index) {
            <button class="dot-ind" [class.active]="current() === i" [class.done]="i < current()" (click)="goTo(i)"></button>
          }
        </div>
        @if (current() < steps.length - 1) {
          <button class="btn-nav primary" (click)="next()">
            Next Step →
          </button>
        } @else {
          <a routerLink="/auth/register" class="btn-nav primary">
            🚀 Get Started Now
          </a>
        }
      </footer>

      <!-- ============== MOCK SCREEN TEMPLATES ============== -->

      <!-- 1. Register -->
      <ng-template #screenRegister>
        <div class="mock-screen s-register">
          <div class="mock-form-card">
            <div class="mock-title">Create Your Account</div>
            <div class="mock-row">
              <div class="mock-field anim-field" style="--d:0"><label>First Name</label><div class="mock-input"><span class="typed-text">John</span><span class="cursor">|</span></div></div>
              <div class="mock-field anim-field" style="--d:1"><label>Last Name</label><div class="mock-input"><span class="typed-text">Anderson</span></div></div>
            </div>
            <div class="mock-field anim-field" style="--d:2"><label>Email</label><div class="mock-input"><span class="typed-text">john&#64;greenvalley.edu</span></div></div>
            <div class="mock-field anim-field" style="--d:3"><label>Password</label><div class="mock-input"><span class="typed-text">••••••••••</span></div></div>
            <div class="mock-field anim-field" style="--d:4">
              <label>School Name</label><div class="mock-input highlight"><span class="typed-text">Green Valley International School</span></div>
            </div>
            <div class="mock-btn anim-field" style="--d:5">Create Account →</div>
          </div>
        </div>
      </ng-template>

      <!-- 2. Add School -->
      <ng-template #screenAddSchool>
        <div class="mock-screen s-school">
          <div class="mock-page-header"><span class="mock-h1">🏫 School Profile</span><span class="mock-badge-new">New</span></div>
          <div class="mock-form-card">
            <div class="mock-row">
              <div class="mock-field anim-field" style="--d:0"><label>School Name</label><div class="mock-input highlight"><span class="typed-text">Green Valley International School</span></div></div>
              <div class="mock-field anim-field" style="--d:1"><label>School Code</label><div class="mock-input"><span class="typed-text">GVIS-2026</span></div></div>
            </div>
            <div class="mock-row">
              <div class="mock-field anim-field" style="--d:2"><label>Email</label><div class="mock-input"><span class="typed-text">info&#64;greenvalley.edu</span></div></div>
              <div class="mock-field anim-field" style="--d:3"><label>Phone</label><div class="mock-input"><span class="typed-text">+1 (555) 123-4567</span></div></div>
            </div>
            <div class="mock-field anim-field" style="--d:4"><label>Address</label><div class="mock-input"><span class="typed-text">123 Education Lane, Springfield, IL 62704</span></div></div>
            <div class="mock-row">
              <div class="mock-field anim-field" style="--d:5"><label>Website</label><div class="mock-input"><span class="typed-text">www.greenvalley.edu</span></div></div>
              <div class="mock-field anim-field" style="--d:6"><label>Logo</label><div class="mock-upload">📁 Upload logo...</div></div>
            </div>
            <div class="mock-btn anim-field" style="--d:7">💾 Save School Profile</div>
          </div>
        </div>
      </ng-template>

      <!-- 3. Academic Year -->
      <ng-template #screenAcademicYear>
        <div class="mock-screen s-academic">
          <div class="mock-page-header"><span class="mock-h1">📅 Academic Years</span><button class="mock-btn-sm anim-field" style="--d:0">+ New Year</button></div>
          <div class="mock-form-card anim-field" style="--d:1">
            <div class="mock-row">
              <div class="mock-field"><label>Year Name</label><div class="mock-input"><span class="typed-text">2026-2027</span></div></div>
              <div class="mock-field"><label>Start Date</label><div class="mock-input"><span class="typed-text">April 1, 2026</span></div></div>
              <div class="mock-field"><label>End Date</label><div class="mock-input"><span class="typed-text">March 31, 2027</span></div></div>
            </div>
            <div class="mock-btn-sm success" style="margin-top:8px">✓ Create & Set as Current</div>
          </div>
          <div class="mock-card-list anim-field" style="--d:3">
            <div class="mock-year-card active">
              <span class="mock-badge-active">● Current</span>
              <strong>2026-2027</strong>
              <span>Apr 2026 → Mar 2027</span>
            </div>
            <div class="mock-year-card">
              <strong>2025-2026</strong>
              <span>Apr 2025 → Mar 2026</span>
            </div>
          </div>
        </div>
      </ng-template>

      <!-- 4. Classes -->
      <ng-template #screenClasses>
        <div class="mock-screen s-classes">
          <div class="mock-page-header"><span class="mock-h1">🏫 Classes</span><button class="mock-btn-sm anim-field" style="--d:0">+ Add Class</button></div>
          <div class="mock-class-grid">
            @for (cls of mockClasses; track cls.name; let i = $index) {
              <div class="mock-class-card anim-field" [style]="'--d:' + (i + 1)">
                <div class="class-icon">📚</div>
                <h4>{{ cls.name }}</h4>
                <div class="class-sections">
                  @for (sec of cls.sections; track sec) {
                    <span class="section-pill">{{ sec }}</span>
                  }
                </div>
                <div class="class-meta">
                  <span>👨‍🏫 {{ cls.teacher }}</span>
                  <span>💺 {{ cls.capacity }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      </ng-template>

      <!-- 5. Subjects -->
      <ng-template #screenSubjects>
        <div class="mock-screen s-subjects">
          <div class="mock-page-header"><span class="mock-h1">📖 Subjects</span><button class="mock-btn-sm anim-field" style="--d:0">+ Add Subject</button></div>
          <div class="mock-table anim-field" style="--d:1">
            <div class="mock-thead"><span>Subject</span><span>Code</span><span>Type</span><span>Periods/Week</span></div>
            @for (subj of mockSubjects; track subj.name; let i = $index) {
              <div class="mock-trow anim-field" [style]="'--d:' + (i + 2)">
                <span class="subj-name">{{ subj.name }}</span>
                <span class="mock-code-badge">{{ subj.code }}</span>
                <span>{{ subj.type }}</span>
                <span>{{ subj.periods }}</span>
              </div>
            }
          </div>
        </div>
      </ng-template>

      <!-- 6. Teachers -->
      <ng-template #screenTeachers>
        <div class="mock-screen s-teachers">
          <div class="mock-page-header"><span class="mock-h1">👨‍🏫 Teachers</span><button class="mock-btn-sm anim-field" style="--d:0">+ Add Teacher</button></div>
          <div class="mock-table anim-field" style="--d:1">
            <div class="mock-thead"><span>Name</span><span>Email</span><span>Subjects</span><span>Status</span></div>
            @for (t of mockTeachers; track t.name; let i = $index) {
              <div class="mock-trow anim-field" [style]="'--d:' + (i + 2)">
                <span class="user-cell"><span class="avatar-mini">{{ t.name.charAt(0) }}</span> {{ t.name }}</span>
                <span class="email-text">{{ t.email }}</span>
                <span>{{ t.subjectCount }} subjects</span>
                <span class="mock-status-active">● Active</span>
              </div>
            }
          </div>
        </div>
      </ng-template>

      <!-- 7. Students -->
      <ng-template #screenStudents>
        <div class="mock-screen s-students">
          <div class="mock-page-header"><span class="mock-h1">🎓 Students</span><button class="mock-btn-sm anim-field" style="--d:0">+ Add Student</button></div>
          <div class="mock-filters anim-field" style="--d:1">
            <div class="mock-search">🔍 Search students...</div>
            <div class="mock-filter-chip">Class: All</div>
            <div class="mock-filter-chip">Status: Active</div>
          </div>
          <div class="mock-table anim-field" style="--d:2">
            <div class="mock-thead"><span>Student</span><span>Adm. No.</span><span>Class</span><span>Status</span></div>
            @for (s of mockStudents; track s.name; let i = $index) {
              <div class="mock-trow anim-field" [style]="'--d:' + (i + 3)">
                <span class="user-cell"><span class="avatar-mini" [style.background]="s.color">{{ s.name.charAt(0) }}</span> {{ s.name }}</span>
                <span>{{ s.admNo }}</span>
                <span>{{ s.cls }}</span>
                <span class="mock-status-active">● Active</span>
              </div>
            }
          </div>
        </div>
      </ng-template>

      <!-- 8. Parents -->
      <ng-template #screenParents>
        <div class="mock-screen s-parents">
          <div class="mock-page-header"><span class="mock-h1">👨‍👩‍👧 Parents</span><button class="mock-btn-sm anim-field" style="--d:0">+ Add Parent</button></div>
          <div class="mock-table anim-field" style="--d:1">
            <div class="mock-thead"><span>Parent</span><span>Email</span><span>Phone</span><span>Children</span></div>
            @for (p of mockParents; track p.name; let i = $index) {
              <div class="mock-trow anim-field" [style]="'--d:' + (i + 2)">
                <span class="user-cell"><span class="avatar-mini" style="background:#8b5cf6">{{ p.name.charAt(0) }}</span> {{ p.name }}</span>
                <span class="email-text">{{ p.email }}</span>
                <span>{{ p.phone }}</span>
                <span class="children-count">{{ p.children }} child{{ p.children > 1 ? 'ren' : '' }}</span>
              </div>
            }
          </div>
        </div>
      </ng-template>

      <!-- 9. Attendance -->
      <ng-template #screenAttendance>
        <div class="mock-screen s-attendance">
          <div class="mock-page-header"><span class="mock-h1">📋 Attendance</span></div>
          <div class="mock-row anim-field" style="--d:0">
            <div class="mock-field"><label>Date</label><div class="mock-input"><span class="typed-text">Feb 7, 2026</span></div></div>
            <div class="mock-field"><label>Class</label><div class="mock-input"><span class="typed-text">Grade 10 - A</span></div></div>
            <div class="mock-btn-sm">Load Students</div>
          </div>
          <div class="attendance-grid anim-field" style="--d:1">
            <div class="att-summary">
              <span class="att-stat present">✓ 28 Present</span>
              <span class="att-stat absent">✗ 2 Absent</span>
              <span class="att-stat late">⏰ 1 Late</span>
            </div>
            @for (s of ['Arjun Patel','Emily Chen','Carlos Rodriguez','Sofia Martinez','Liam Johnson']; track s; let i = $index) {
              <div class="att-row anim-field" [style]="'--d:' + (i + 2)">
                <span class="user-cell"><span class="avatar-mini" [style.background]="['#6366f1','#10b981','#f59e0b','#ec4899','#3b82f6'][i]">{{ s.charAt(0) }}</span> {{ s }}</span>
                <div class="att-toggle-group">
                  <button class="att-btn" [class.active-present]="i !== 3 && i !== 4" [class.active-absent]="i === 3" [class.active-late]="i === 4">
                    {{ i === 3 ? '✗ Absent' : i === 4 ? '⏰ Late' : '✓ Present' }}
                  </button>
                </div>
              </div>
            }
            <div class="mock-btn anim-field" style="--d:8">💾 Save Attendance</div>
          </div>
        </div>
      </ng-template>

      <!-- 10. Exams -->
      <ng-template #screenExams>
        <div class="mock-screen s-exams">
          <div class="mock-page-header"><span class="mock-h1">📝 Examinations</span><button class="mock-btn-sm anim-field" style="--d:0">+ Create Exam</button></div>
          <div class="exam-cards-grid">
            @for (e of mockExams; track e.name; let i = $index) {
              <div class="mock-exam-card anim-field" [style]="'--d:' + (i + 1)">
                <div class="exam-card-head">
                  <strong>{{ e.name }}</strong>
                  <span class="mock-code-badge">{{ e.type }}</span>
                </div>
                <div class="exam-card-meta">
                  <span>📅 {{ e.dates }}</span>
                  <span>📚 {{ e.classes }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      </ng-template>

      <!-- 11. Results -->
      <ng-template #screenResults>
        <div class="mock-screen s-results">
          <div class="mock-page-header"><span class="mock-h1">📊 Results & Report Cards</span></div>
          <div class="result-preview anim-field" style="--d:1">
            <div class="report-card-preview">
              <div class="rc-header">
                <div class="rc-logo">🏫</div>
                <div><strong>Green Valley International School</strong><br><small>Academic Year 2026-2027 — Midterm Examination</small></div>
              </div>
              <div class="rc-student">
                <span>Student: <strong>Arjun Patel</strong></span>
                <span>Class: <strong>Grade 10-A</strong></span>
                <span>Roll: <strong>01</strong></span>
              </div>
              <div class="rc-table">
                <div class="rc-thead"><span>Subject</span><span>Max</span><span>Obtained</span><span>Grade</span></div>
                @for (subj of [['Mathematics',100,95,'A+'],['Science',100,88,'A'],['English',100,92,'A+'],['History',100,78,'B+']]; track subj[0]; let i = $index) {
                  <div class="rc-trow anim-field" [style]="'--d:' + (i + 2)">
                    <span>{{ subj[0] }}</span><span>{{ subj[1] }}</span><span class="score">{{ subj[2] }}</span><span class="grade-cell">{{ subj[3] }}</span>
                  </div>
                }
                <div class="rc-total anim-field" style="--d:7">
                  <span>Total</span><span>400</span><span class="score">353</span><span class="grade-cell">A</span>
                </div>
              </div>
              <div class="rc-actions anim-field" style="--d:8">
                <span class="mock-btn-sm">🖨️ Print</span>
                <span class="mock-btn-sm">📥 Download PDF</span>
              </div>
            </div>
          </div>
        </div>
      </ng-template>

      <!-- 12. Fees -->
      <ng-template #screenFees>
        <div class="mock-screen s-fees">
          <div class="mock-page-header"><span class="mock-h1">💰 Fee Management</span></div>
          <div class="fee-stats anim-field" style="--d:0">
            <div class="fee-stat"><span class="fs-icon" style="background:rgba(34,197,94,0.12);color:#22c55e">💰</span><div><small>Collected</small><strong>$245,000</strong></div></div>
            <div class="fee-stat"><span class="fs-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b">⏳</span><div><small>Pending</small><strong>$38,500</strong></div></div>
            <div class="fee-stat"><span class="fs-icon" style="background:rgba(239,68,68,0.12);color:#ef4444">⚠️</span><div><small>Overdue</small><strong>$12,300</strong></div></div>
            <div class="fee-stat"><span class="fs-icon" style="background:rgba(99,102,241,0.12);color:#6366f1">📊</span><div><small>Rate</small><strong>87%</strong></div></div>
          </div>
          <div class="mock-table anim-field" style="--d:1">
            <div class="mock-thead"><span>Student</span><span>Fee Type</span><span>Amount</span><span>Status</span><span></span></div>
            @for (f of [['Arjun Patel','Tuition','$1,500','paid'],['Emily Chen','Tuition','$1,500','paid'],['Carlos Rodriguez','Tuition','$1,500','pending'],['Sofia Martinez','Transport','$200','overdue']]; track f[0]; let i = $index) {
              <div class="mock-trow anim-field" [style]="'--d:' + (i + 2)">
                <span>{{ f[0] }}</span><span>{{ f[1] }}</span><span>{{ f[2] }}</span>
                <span class="mock-status" [class]="'st-' + f[3]">{{ f[3] }}</span>
                <span class="mock-btn-xs">💳 Pay</span>
              </div>
            }
          </div>
        </div>
      </ng-template>

      <!-- 13. Timetable -->
      <ng-template #screenTimetable>
        <div class="mock-screen s-timetable">
          <div class="mock-page-header"><span class="mock-h1">🕐 Timetable</span></div>
          <div class="mock-field anim-field" style="--d:0;max-width:200px"><label>Class</label><div class="mock-input"><span class="typed-text">Grade 10 - A</span></div></div>
          <div class="tt-grid anim-field" style="--d:1">
            <div class="tt-header">
              <span class="tt-time"></span>
              @for (d of ['Mon','Tue','Wed','Thu','Fri']; track d) { <span class="tt-day">{{ d }}</span> }
            </div>
            @for (slot of mockTimetable; track slot.time; let i = $index) {
              <div class="tt-row anim-field" [style]="'--d:' + (i + 2)">
                <span class="tt-time">{{ slot.time }}</span>
                @for (cell of slot.cells; track cell) {
                  <span class="tt-cell" [class.break-cell]="cell === 'BREAK'">{{ cell }}</span>
                }
              </div>
            }
          </div>
        </div>
      </ng-template>

      <!-- 14. Transport -->
      <ng-template #screenTransport>
        <div class="mock-screen s-transport">
          <div class="mock-page-header"><span class="mock-h1">🚌 Transport & GPS</span></div>
          <div class="transport-layout anim-field" style="--d:0">
            <div class="transport-sidebar">
              @for (v of mockVehicles; track v.number; let i = $index) {
                <div class="vehicle-item anim-field" [class.online]="v.online" [style]="'--d:' + (i + 1)">
                  <span class="vehicle-icon">🚌</span>
                  <div>
                    <strong>{{ v.number }}</strong>
                    <small>{{ v.route }}</small>
                  </div>
                  <span class="online-dot" [class.on]="v.online"></span>
                </div>
              }
            </div>
            <div class="transport-map">
              <div class="fake-map">
                <div class="map-grid"></div>
                <div class="bus-marker m1 anim-field" style="--d:2">🚌</div>
                <div class="bus-marker m2 anim-field" style="--d:3">🚌</div>
                <div class="bus-marker m3 anim-field" style="--d:4">🚌</div>
                <div class="map-label">📍 Live GPS Tracking</div>
              </div>
            </div>
          </div>
        </div>
      </ng-template>

      <!-- 15. Reports -->
      <ng-template #screenReports>
        <div class="mock-screen s-reports">
          <div class="mock-page-header"><span class="mock-h1">📊 Reports</span></div>
          <div class="report-cards-grid">
            @for (r of mockReports; track r.name; let i = $index) {
              <div class="report-card anim-field" [style]="'--d:' + (i + 1)">
                <span class="report-icon">{{ r.icon }}</span>
                <h4>{{ r.name }}</h4>
                <p>{{ r.desc }}</p>
                <div class="report-actions">
                  <span class="mock-btn-xs">PDF</span>
                  <span class="mock-btn-xs">Excel</span>
                  <span class="mock-btn-xs">CSV</span>
                </div>
              </div>
            }
          </div>
        </div>
      </ng-template>

      <!-- 16. Notifications -->
      <ng-template #screenNotifs>
        <div class="mock-screen s-notifs">
          <div class="mock-page-header"><span class="mock-h1">🔔 Notifications</span><button class="mock-btn-sm anim-field" style="--d:0">+ Send Notification</button></div>
          <div class="mock-form-card anim-field" style="--d:1">
            <div class="mock-field"><label>Title</label><div class="mock-input"><span class="typed-text">Parent-Teacher Meeting</span></div></div>
            <div class="mock-field"><label>Message</label><div class="mock-input" style="height:48px"><span class="typed-text">Dear parents, PTM scheduled for Feb 15 at 10 AM.</span></div></div>
            <div class="mock-row">
              <div class="mock-field"><label>Audience</label><div class="mock-input"><span class="typed-text">👥 All Parents</span></div></div>
              <div class="mock-field"><label>Priority</label><div class="mock-input"><span class="typed-text">🟡 High</span></div></div>
            </div>
            <div class="mock-btn-sm" style="margin-top:8px">📤 Send Notification</div>
          </div>
          <div class="notif-list anim-field" style="--d:3">
            <div class="notif-item"><span class="notif-dot-icon urgent">🔴</span><div><strong>Fee Deadline Reminder</strong><small>Payment due by Feb 15</small></div></div>
            <div class="notif-item"><span class="notif-dot-icon">🔵</span><div><strong>Sports Day Announcement</strong><small>Annual sports day on March 5</small></div></div>
          </div>
        </div>
      </ng-template>

      <!-- 17. Dashboard -->
      <ng-template #screenDashboard>
        <div class="mock-screen s-dashboard">
          <div class="mock-page-header"><span class="mock-h1">👋 Welcome, Principal Anderson!</span></div>
          <div class="dash-stats">
            @for (s of dashStats; track s.label; let i = $index) {
              <div class="dash-stat anim-field" [style]="'--d:' + i">
                <span class="ds-icon" [style.background]="s.bg" [style.color]="s.color">{{ s.icon }}</span>
                <div><small>{{ s.label }}</small><strong>{{ s.value }}</strong></div>
              </div>
            }
          </div>
          <div class="dash-charts anim-field" style="--d:4">
            <div class="dash-chart-card">
              <strong>📈 Attendance Overview</strong>
              <div class="fake-chart bars">
                @for (h of [70,85,90,78,92,88,95]; track h; let i = $index) {
                  <div class="bar" [style.height.%]="h" [style]="'--d:' + (i + 5)"></div>
                }
              </div>
              <div class="chart-labels"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>
            </div>
            <div class="dash-chart-card">
              <strong>💰 Fee Collection</strong>
              <div class="fake-chart donut">
                <svg viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(99,102,241,0.15)" stroke-width="3"/>
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#6366f1" stroke-width="3" stroke-dasharray="87, 100" class="donut-anim"/>
                </svg>
                <span class="donut-label">87%</span>
              </div>
            </div>
          </div>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    /* ===== SHELL ===== */
    :host { display: block; min-height: 100vh; background: var(--bg-body, #0a0a0f); color: var(--text-primary, #e2e8f0); }
    .tour-shell { display: flex; flex-direction: column; min-height: 100vh; }

    /* ===== HEADER ===== */
    .tour-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 24px; border-bottom: 1px solid rgba(255,255,255,0.06);
      background: rgba(10,10,15,0.95); backdrop-filter: blur(20px);
      position: sticky; top: 0; z-index: 100;
    }
    .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; }
    .brand span { font-size: 18px; font-weight: 800; letter-spacing: -0.5px; }
    .tour-nav { display: flex; align-items: center; gap: 12px; }
    .step-counter { font-size: 13px; color: rgba(255,255,255,0.4); font-weight: 500; }
    .btn-cta-sm {
      padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
      text-decoration: none; color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.1);
      transition: all 0.2s;
    }
    .btn-cta-sm:hover { background: rgba(255,255,255,0.05); color: #fff; }
    .btn-cta-sm.primary { background: #6366f1; color: #fff; border-color: #6366f1; }
    .btn-cta-sm.primary:hover { background: #4f46e5; }

    /* ===== PROGRESS ===== */
    .progress-track { height: 3px; background: rgba(255,255,255,0.04); }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #a78bfa); transition: width 0.5s cubic-bezier(0.4,0,0.2,1); border-radius: 0 2px 2px 0; }

    /* ===== BODY LAYOUT ===== */
    .tour-body { display: flex; flex: 1; overflow: hidden; }

    /* ===== SIDEBAR ===== */
    .step-sidebar {
      width: 260px; flex-shrink: 0; padding: 24px 16px; border-right: 1px solid rgba(255,255,255,0.06);
      overflow-y: auto; background: rgba(255,255,255,0.01);
    }
    .sidebar-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,0.3); margin-bottom: 16px; padding: 0 8px; }
    .step-nav-item {
      display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 12px;
      background: none; border: none; border-radius: 8px; cursor: pointer;
      color: rgba(255,255,255,0.4); font-size: 13px; font-weight: 500; transition: all 0.2s;
      text-align: left; margin-bottom: 2px;
    }
    .step-nav-item:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }
    .step-nav-item.active { background: rgba(99,102,241,0.1); color: #a78bfa; }
    .step-nav-item.completed { color: rgba(255,255,255,0.5); }
    .step-marker {
      width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; flex-shrink: 0;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
    }
    .step-nav-item.active .step-marker { background: rgba(99,102,241,0.2); border-color: #6366f1; color: #a78bfa; }
    .step-nav-item.completed .step-marker { background: #22c55e; border-color: #22c55e; color: #fff; }
    .check { font-size: 14px; }

    /* ===== STEP CONTENT ===== */
    .step-content { flex: 1; overflow-y: auto; padding: 32px 40px; display: flex; flex-direction: column; gap: 24px; }
    .step-intro { text-align: center; }
    .step-icon { font-size: 48px; display: block; margin-bottom: 12px; }
    .step-intro h1 { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
    .step-subtitle { color: rgba(255,255,255,0.5); font-size: 15px; max-width: 500px; margin: 0 auto; line-height: 1.5; }

    /* ===== MOCK BROWSER ===== */
    .mock-browser {
      border-radius: 12px; overflow: hidden;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.02);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    }
    .browser-chrome {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 16px; background: rgba(255,255,255,0.03);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .browser-dots { display: flex; gap: 6px; }
    .browser-dots span { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.1); }
    .browser-dots span:first-child { background: #ef4444; }
    .browser-dots span:nth-child(2) { background: #f59e0b; }
    .browser-dots span:last-child { background: #22c55e; }
    .browser-url {
      flex: 1; padding: 5px 12px; border-radius: 6px; font-size: 12px;
      background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.5);
      display: flex; align-items: center; gap: 6px;
    }
    .lock { font-size: 10px; }
    .browser-body { padding: 20px 24px; min-height: 320px; }

    /* ===== TIPS ===== */
    .tips-section { border-radius: 12px; padding: 20px; background: rgba(99,102,241,0.04); border: 1px solid rgba(99,102,241,0.1); }
    .tips-title { font-size: 14px; font-weight: 700; margin-bottom: 12px; color: #a78bfa; }
    .tips-grid { display: flex; flex-direction: column; gap: 8px; }
    .tip-card { display: flex; gap: 8px; font-size: 13px; color: rgba(255,255,255,0.6); line-height: 1.5; }
    .tip-bullet { color: #6366f1; font-weight: 700; flex-shrink: 0; }

    /* ===== FOOTER ===== */
    .tour-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.06);
      background: rgba(10,10,15,0.95); backdrop-filter: blur(20px);
    }
    .btn-nav {
      padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;
      background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.7); cursor: pointer; transition: all 0.2s;
      text-decoration: none;
    }
    .btn-nav:hover:not(:disabled) { background: rgba(255,255,255,0.08); color: #fff; }
    .btn-nav:disabled { opacity: 0.3; cursor: not-allowed; }
    .btn-nav.primary { background: #6366f1; color: #fff; border-color: #6366f1; }
    .btn-nav.primary:hover { background: #4f46e5; transform: translateY(-1px); }
    .dot-indicators { display: flex; gap: 6px; }
    .dot-ind {
      width: 8px; height: 8px; border-radius: 50%; border: none; cursor: pointer;
      background: rgba(255,255,255,0.1); transition: all 0.3s;
    }
    .dot-ind.active { background: #6366f1; transform: scale(1.3); }
    .dot-ind.done { background: #22c55e; }

    /* ===== ANIMATIONS ===== */
    .animate { animation: fadeSlideUp 0.5s ease-out; }
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .anim-field {
      animation: fieldReveal 0.5s ease-out both;
      animation-delay: calc(var(--d, 0) * 0.12s);
    }
    @keyframes fieldReveal {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ===== MOCK SHARED ===== */
    .mock-screen { font-size: 13px; }
    .mock-page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .mock-h1 { font-size: 18px; font-weight: 700; }
    .mock-badge-new { background: #6366f1; color: #fff; font-size: 11px; padding: 2px 10px; border-radius: 20px; font-weight: 600; }
    .mock-form-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: 10px; padding: 16px; }
    .mock-title { font-size: 16px; font-weight: 700; margin-bottom: 16px; }
    .mock-row { display: flex; gap: 12px; }
    .mock-row > * { flex: 1; }
    .mock-field { margin-bottom: 12px; }
    .mock-field label { display: block; font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.4); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .mock-input {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 8px; padding: 8px 12px; font-size: 13px; color: rgba(255,255,255,0.7); min-height: 24px;
    }
    .mock-input.highlight { border-color: rgba(99,102,241,0.4); background: rgba(99,102,241,0.05); }
    .typed-text { overflow: hidden; white-space: nowrap; display: inline-block; animation: typing 1.5s steps(30) both; animation-delay: calc(var(--d, 0) * 0.12s + 0.3s); }
    .cursor { animation: blink 0.8s step-end infinite; color: #6366f1; }
    @keyframes typing { from { width: 0; } to { width: 100%; } }
    @keyframes blink { 50% { opacity: 0; } }
    .mock-upload { background: rgba(255,255,255,0.03); border: 2px dashed rgba(255,255,255,0.08); border-radius: 8px; padding: 8px 12px; text-align: center; color: rgba(255,255,255,0.3); font-size: 12px; }
    .mock-btn {
      background: #6366f1; color: #fff; border-radius: 8px; padding: 10px 20px;
      text-align: center; font-weight: 600; font-size: 13px; cursor: default; margin-top: 12px;
    }
    .mock-btn-sm { background: #6366f1; color: #fff; border-radius: 6px; padding: 6px 14px; font-size: 12px; font-weight: 600; display: inline-block; cursor: default; border: none; }
    .mock-btn-sm.success { background: #22c55e; }
    .mock-btn-xs { background: rgba(99,102,241,0.15); color: #a78bfa; border-radius: 4px; padding: 3px 10px; font-size: 11px; font-weight: 600; cursor: default; }

    /* ===== MOCK TABLE ===== */
    .mock-table { overflow: hidden; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); }
    .mock-thead {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 8px;
      padding: 8px 12px; background: rgba(255,255,255,0.03); font-size: 11px; font-weight: 700;
      color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px;
    }
    .mock-trow {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 8px;
      padding: 10px 12px; border-top: 1px solid rgba(255,255,255,0.04); align-items: center;
    }
    .mock-trow:hover { background: rgba(255,255,255,0.02); }
    .user-cell { display: flex; align-items: center; gap: 8px; }
    .avatar-mini {
      width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: #6366f1; color: #fff; font-size: 11px; font-weight: 700; flex-shrink: 0;
    }
    .email-text { color: rgba(255,255,255,0.4); font-size: 12px; }
    .mock-status-active { color: #22c55e; font-weight: 600; font-size: 12px; }
    .mock-code-badge { background: rgba(99,102,241,0.15); color: #a78bfa; border-radius: 4px; padding: 2px 8px; font-size: 11px; font-weight: 600; }
    .mock-search { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; padding: 8px 14px; color: rgba(255,255,255,0.3); font-size: 13px; flex: 1; }
    .mock-filters { display: flex; gap: 10px; margin-bottom: 12px; align-items: center; }
    .mock-filter-chip { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; padding: 6px 12px; font-size: 12px; color: rgba(255,255,255,0.5); }
    .subj-name { font-weight: 600; color: rgba(255,255,255,0.9); }

    /* ===== ACADEMIC YEAR ===== */
    .mock-card-list { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
    .mock-year-card {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02);
    }
    .mock-year-card.active { border-color: rgba(34,197,94,0.3); background: rgba(34,197,94,0.04); }
    .mock-badge-active { color: #22c55e; font-size: 12px; font-weight: 600; }

    /* ===== CLASSES ===== */
    .mock-class-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .mock-class-card {
      padding: 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02); transition: all 0.2s;
    }
    .mock-class-card:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-2px); }
    .class-icon { font-size: 24px; margin-bottom: 6px; }
    .mock-class-card h4 { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
    .class-sections { display: flex; gap: 4px; margin-bottom: 8px; }
    .section-pill { background: #6366f1; color: #fff; padding: 1px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .class-meta { font-size: 11px; color: rgba(255,255,255,0.4); display: flex; flex-direction: column; gap: 2px; }

    /* ===== ATTENDANCE ===== */
    .attendance-grid { margin-top: 12px; }
    .att-summary { display: flex; gap: 16px; margin-bottom: 12px; }
    .att-stat { font-size: 13px; font-weight: 600; padding: 6px 14px; border-radius: 6px; }
    .att-stat.present { background: rgba(34,197,94,0.1); color: #22c55e; }
    .att-stat.absent { background: rgba(239,68,68,0.1); color: #ef4444; }
    .att-stat.late { background: rgba(245,158,11,0.1); color: #f59e0b; }
    .att-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .att-toggle-group { display: flex; gap: 0; }
    .att-btn {
      padding: 4px 12px; font-size: 12px; font-weight: 600; border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.03); color: rgba(255,255,255,0.4);
      border-radius: 6px; cursor: default;
    }
    .att-btn.active-present { background: rgba(34,197,94,0.15); color: #22c55e; border-color: rgba(34,197,94,0.3); }
    .att-btn.active-absent { background: rgba(239,68,68,0.15); color: #ef4444; border-color: rgba(239,68,68,0.3); }
    .att-btn.active-late { background: rgba(245,158,11,0.15); color: #f59e0b; border-color: rgba(245,158,11,0.3); }
    .children-count { background: rgba(139,92,246,0.1); color: #a78bfa; border-radius: 4px; padding: 2px 8px; font-size: 12px; font-weight: 600; }

    /* ===== EXAMS ===== */
    .exam-cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .mock-exam-card { padding: 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); }
    .exam-card-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .exam-card-meta { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: rgba(255,255,255,0.4); }

    /* ===== REPORT CARD ===== */
    .result-preview { display: flex; justify-content: center; }
    .report-card-preview {
      width: 100%; max-width: 420px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.02); padding: 16px; font-size: 12px;
    }
    .rc-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 12px; }
    .rc-logo { font-size: 32px; }
    .rc-header small { color: rgba(255,255,255,0.4); }
    .rc-student { display: flex; gap: 16px; margin-bottom: 12px; font-size: 12px; color: rgba(255,255,255,0.6); }
    .rc-table { border-radius: 6px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }
    .rc-thead { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 6px 10px; background: rgba(99,102,241,0.08); font-weight: 700; font-size: 11px; color: rgba(255,255,255,0.5); }
    .rc-trow { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 6px 10px; border-top: 1px solid rgba(255,255,255,0.04); }
    .rc-total { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; padding: 6px 10px; border-top: 2px solid rgba(255,255,255,0.06); font-weight: 700; }
    .score { color: #6366f1; font-weight: 700; }
    .grade-cell { background: rgba(34,197,94,0.1); color: #22c55e; text-align: center; border-radius: 4px; font-weight: 700; font-size: 11px; }
    .rc-actions { display: flex; gap: 8px; margin-top: 12px; justify-content: flex-end; }

    /* ===== FEES ===== */
    .fee-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .fee-stat {
      display: flex; align-items: center; gap: 10px;
      padding: 12px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02);
    }
    .fs-icon { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 16px; flex-shrink: 0; }
    .fee-stat small { font-size: 11px; color: rgba(255,255,255,0.4); }
    .fee-stat strong { font-size: 15px; display: block; }
    .mock-status { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 4px; }
    .st-paid { background: rgba(34,197,94,0.1); color: #22c55e; }
    .st-pending { background: rgba(245,158,11,0.1); color: #f59e0b; }
    .st-overdue { background: rgba(239,68,68,0.1); color: #ef4444; }

    /* ===== TIMETABLE ===== */
    .tt-grid { border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); margin-top: 12px; }
    .tt-header { display: grid; grid-template-columns: 60px repeat(5, 1fr); background: rgba(99,102,241,0.06); }
    .tt-day { padding: 8px; text-align: center; font-size: 12px; font-weight: 700; color: #a78bfa; }
    .tt-row { display: grid; grid-template-columns: 60px repeat(5, 1fr); border-top: 1px solid rgba(255,255,255,0.04); }
    .tt-time { padding: 8px; font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 600; text-align: center; }
    .tt-cell { padding: 8px; text-align: center; font-size: 11px; border-left: 1px solid rgba(255,255,255,0.03); }
    .tt-cell:hover { background: rgba(99,102,241,0.05); }
    .break-cell { background: rgba(245,158,11,0.06); color: #f59e0b; font-style: italic; }

    /* ===== TRANSPORT ===== */
    .transport-layout { display: grid; grid-template-columns: 200px 1fr; gap: 12px; }
    .transport-sidebar { display: flex; flex-direction: column; gap: 8px; }
    .vehicle-item {
      display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); font-size: 12px;
    }
    .vehicle-item.online { border-color: rgba(34,197,94,0.2); }
    .vehicle-icon { font-size: 18px; }
    .vehicle-item small { color: rgba(255,255,255,0.4); display: block; }
    .online-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.1); margin-left: auto; }
    .online-dot.on { background: #22c55e; box-shadow: 0 0 6px #22c55e; animation: pulse-dot 2s infinite; }
    @keyframes pulse-dot { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    .transport-map { border-radius: 10px; overflow: hidden; border: 1px solid rgba(255,255,255,0.06); }
    .fake-map {
      height: 240px; position: relative;
      background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(99,102,241,0.02));
    }
    .map-grid {
      position: absolute; inset: 0;
      background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    .bus-marker { position: absolute; font-size: 24px; filter: drop-shadow(0 0 8px rgba(99,102,241,0.5)); }
    .m1 { top: 30%; left: 25%; animation: float-bus 4s ease-in-out infinite; }
    .m2 { top: 55%; left: 60%; animation: float-bus 4s ease-in-out infinite 1s; }
    .m3 { top: 40%; left: 42%; animation: float-bus 4s ease-in-out infinite 2s; }
    @keyframes float-bus { 0%,100% { transform: translate(0,0); } 50% { transform: translate(10px, -8px); } }
    .map-label { position: absolute; bottom: 12px; right: 16px; font-size: 12px; color: rgba(255,255,255,0.3); font-weight: 600; }

    /* ===== REPORTS ===== */
    .report-cards-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .report-card {
      padding: 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02); text-align: center; transition: all 0.2s;
    }
    .report-card:hover { border-color: rgba(99,102,241,0.3); transform: translateY(-2px); }
    .report-icon { font-size: 28px; display: block; margin-bottom: 6px; }
    .report-card h4 { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
    .report-card p { font-size: 11px; color: rgba(255,255,255,0.4); margin-bottom: 8px; }
    .report-actions { display: flex; gap: 4px; justify-content: center; }

    /* ===== NOTIFICATIONS ===== */
    .notif-list { display: flex; flex-direction: column; gap: 8px; margin-top: 16px; }
    .notif-item { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); }
    .notif-item strong { display: block; font-size: 13px; }
    .notif-item small { font-size: 11px; color: rgba(255,255,255,0.4); }
    .notif-dot-icon { font-size: 14px; }

    /* ===== DASHBOARD ===== */
    .dash-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
    .dash-stat {
      display: flex; align-items: center; gap: 10px;
      padding: 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02);
    }
    .ds-icon { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 10px; font-size: 18px; flex-shrink: 0; }
    .dash-stat small { font-size: 11px; color: rgba(255,255,255,0.4); }
    .dash-stat strong { font-size: 18px; font-weight: 800; display: block; }
    .dash-charts { display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; }
    .dash-chart-card {
      padding: 16px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.02);
    }
    .dash-chart-card strong { display: block; margin-bottom: 12px; font-size: 13px; }
    .fake-chart.bars { display: flex; align-items: flex-end; gap: 8px; height: 100px; padding-top: 10px; }
    .bar {
      flex: 1; background: linear-gradient(to top, #6366f1, #a78bfa); border-radius: 4px 4px 0 0;
      animation: barGrow 0.8s ease-out both; animation-delay: calc(var(--d, 0) * 0.1s);
    }
    @keyframes barGrow { from { height: 0; } }
    .chart-labels { display: flex; gap: 8px; margin-top: 6px; }
    .chart-labels span { flex: 1; text-align: center; font-size: 10px; color: rgba(255,255,255,0.3); }
    .fake-chart.donut { display: flex; align-items: center; justify-content: center; height: 100px; position: relative; }
    .fake-chart.donut svg { width: 90px; height: 90px; }
    .donut-anim { animation: donutFill 1.5s ease-out both; animation-delay: 0.5s; }
    @keyframes donutFill { from { stroke-dasharray: 0, 100; } }
    .donut-label { position: absolute; font-size: 18px; font-weight: 800; color: #a78bfa; }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 900px) {
      .step-sidebar { display: none; }
      .tour-body { flex-direction: column; }
      .step-content { padding: 20px 16px; }
      .mock-row { flex-direction: column; }
      .fee-stats { grid-template-columns: 1fr 1fr; }
      .dash-stats { grid-template-columns: 1fr 1fr; }
      .dash-charts { grid-template-columns: 1fr; }
      .transport-layout { grid-template-columns: 1fr; }
      .exam-cards-grid { grid-template-columns: 1fr; }
      .report-cards-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 600px) {
      .tour-header { padding: 10px 16px; }
      .step-counter { display: none; }
      .report-cards-grid { grid-template-columns: 1fr; }
      .fee-stats { grid-template-columns: 1fr; }
    }
  `]
})
export class GuidedTourComponent implements OnDestroy {
  current = signal(0);
  animating = signal(true);
  private animTimer: any;
  private autoTimer: any;

  steps: TourStep[] = [
    {
      id: 1, title: 'Create Your Account', subtitle: 'Sign up as a School Administrator to begin setting up your school',
      description: '', icon: '🔐', screenType: 'register',
      tips: [
        'Use your official school email for verification',
        'Choose a strong password with mixed characters, numbers and symbols',
        'Your school name will create a unique workspace for your institution',
        'You\'ll be assigned the School Admin role automatically',
      ]
    },
    {
      id: 2, title: 'Set Up Your School', subtitle: 'Complete your school profile with contact details, address, and branding',
      description: '', icon: '🏫', screenType: 'schools/new',
      tips: [
        'Upload your school logo for branded report cards and communications',
        'School code is auto-generated but can be customized (e.g., GVIS-2026)',
        'Add website and social links for parent visibility',
        'Configure timezone and currency in school settings later',
      ]
    },
    {
      id: 3, title: 'Create Academic Year', subtitle: 'Define the current academic year — all data is scoped to this year',
      description: '', icon: '📅', screenType: 'academic-years',
      tips: [
        'Always create the academic year before adding classes or students',
        'Mark one year as "Current" — this controls what teachers and students see',
        'You can have multiple years for historical data and reporting',
        'Academic year dates control fee cycles and promotion eligibility',
      ]
    },
    {
      id: 4, title: 'Add Classes & Sections', subtitle: 'Create class grades (e.g., Grade 1–12) with sections (A, B, C)',
      description: '', icon: '🏫', screenType: 'classes',
      tips: [
        'Create all classes first, then assign class teachers later',
        'Sections help divide large classes (A, B, C or Morning/Afternoon)',
        'Set classroom capacity to track overcrowding',
        'Classes are linked to the academic year for proper scoping',
      ]
    },
    {
      id: 5, title: 'Add Subjects', subtitle: 'Define the curriculum subjects that will be taught across classes',
      description: '', icon: '📖', screenType: 'subjects',
      tips: [
        'Use subject codes for easy identification on timetables (MAT, SCI, ENG)',
        'Link subjects to specific classes for proper assignment',
        'Set periods per week to help with timetable generation',
        'Mark subjects as Core or Elective for flexible curriculum planning',
      ]
    },
    {
      id: 6, title: 'Add Teachers', subtitle: 'Register your teaching staff with their qualifications and assigned subjects',
      description: '', icon: '👨‍🏫', screenType: 'teachers',
      tips: [
        'Each teacher gets a login account to manage their classes',
        'Assign subjects and classes to teachers for role-specific access',
        'Teachers can mark attendance and enter results from their portal',
        'Add qualification details for internal records and compliance',
      ]
    },
    {
      id: 7, title: 'Enroll Students', subtitle: 'Add students with admission details and assign them to classes',
      description: '', icon: '🎓', screenType: 'students',
      tips: [
        'Admission numbers are auto-generated or can be manually set',
        'Assign each student to a class and section during registration',
        'Upload student photos for easy identification',
        'Use bulk import (CSV) for migrating existing student data quickly',
      ]
    },
    {
      id: 8, title: 'Add Parents', subtitle: 'Link parents/guardians to their children for communication and access',
      description: '', icon: '👨‍👩‍👧', screenType: 'parents',
      tips: [
        'Parents get their own login to view attendance, fees, and results',
        'Link multiple children to one parent account',
        'Parents receive automated notifications for absences and fee dues',
        'Add emergency contact details for safety protocols',
      ]
    },
    {
      id: 9, title: 'Mark Attendance', subtitle: 'Daily attendance tracking per class — Present, Absent, or Late',
      description: '', icon: '📋', screenType: 'attendance',
      tips: [
        'Class teachers mark attendance from their dashboard each morning',
        'Parents get instant alerts when their child is marked absent',
        'Attendance reports are auto-generated at month-end',
        'Late arrivals are tracked separately for pattern analysis',
      ]
    },
    {
      id: 10, title: 'Schedule Examinations', subtitle: 'Create exam schedules with types, date ranges, and assigned classes',
      description: '', icon: '📝', screenType: 'exams',
      tips: [
        'Support multiple exam types: Midterm, Final, Unit Test, Quarterly',
        'Assign exams to specific classes or all classes at once',
        'Set date ranges for multi-day examination periods',
        'Exam schedules can be published to parents via notifications',
      ]
    },
    {
      id: 11, title: 'Enter Results & Report Cards', subtitle: 'Record marks, auto-calculate grades, and generate printable report cards',
      description: '', icon: '📊', screenType: 'results',
      tips: [
        'Teachers enter marks per subject — grades are auto-calculated',
        'Printable report cards with school branding and signatures',
        'View analytics: class averages, top performers, grade distribution',
        'Parents can view results online as soon as they\'re published',
      ]
    },
    {
      id: 12, title: 'Manage Fees', subtitle: 'Track tuition, transport, and other fees with payment recording',
      description: '', icon: '💰', screenType: 'fees',
      tips: [
        'Configure fee structures: tuition, transport, lab, library, etc.',
        'Multiple payment methods: Cash, Bank Transfer, Card, UPI',
        'Automated overdue reminders sent to parents',
        'Fee analytics dashboard shows collection rates and pending amounts',
      ]
    },
    {
      id: 13, title: 'Create Timetable', subtitle: 'Design weekly class schedules with subjects, teachers, and breaks',
      description: '', icon: '🕐', screenType: 'timetable',
      tips: [
        'Drag-and-drop timetable editor for easy scheduling',
        'System warns about teacher conflicts (same teacher, same slot)',
        'Include breaks and free periods in the schedule',
        'Timetables are visible to students and parents on their dashboard',
      ]
    },
    {
      id: 14, title: 'Transport & GPS Tracking', subtitle: 'Manage school vehicles, routes, and real-time bus tracking for parents',
      description: '', icon: '🚌', screenType: 'transport',
      tips: [
        'Register vehicles with driver info and route details',
        'Real-time GPS tracking visible to parents on their app',
        'Set pickup/drop stop locations on the map',
        'Assign students to specific vehicles for route optimization',
      ]
    },
    {
      id: 15, title: 'Generate Reports', subtitle: 'Export comprehensive reports for students, attendance, fees, and staff',
      description: '', icon: '📊', screenType: 'reports',
      tips: [
        'Export in PDF, Excel, or CSV formats for flexibility',
        'Student reports: enrollment, demographics, class-wise',
        'Financial reports: fee collection, pending, overdue analysis',
        'Attendance reports: monthly summaries, trend graphs',
      ]
    },
    {
      id: 16, title: 'Send Notifications', subtitle: 'Communicate with parents, teachers, and students via in-app and email',
      description: '', icon: '🔔', screenType: 'notifications',
      tips: [
        'Target specific audiences: All, Parents, Teachers, or Students',
        'Set priority levels: Normal, High, or Urgent',
        'Schedule notifications for future dates',
        'Track read/unread status for important announcements',
      ]
    },
    {
      id: 17, title: 'Your Dashboard is Ready!', subtitle: 'Everything at a glance — analytics, charts, quick actions, and real-time stats',
      description: '', icon: '🎉', screenType: 'dashboard',
      tips: [
        'Dashboard shows live stats: students, teachers, attendance, revenue',
        'Interactive charts for attendance trends and fee collection',
        'Quick action buttons for common tasks',
        'Role-based views — Principal sees everything, teachers see their classes',
      ]
    },
  ];

  mockClasses = [
    { name: 'Grade 1', sections: ['A', 'B'], teacher: 'Ms. Smith', capacity: 30 },
    { name: 'Grade 5', sections: ['A', 'B', 'C'], teacher: 'Mr. Johnson', capacity: 35 },
    { name: 'Grade 8', sections: ['A', 'B'], teacher: 'Mrs. Davis', capacity: 35 },
    { name: 'Grade 10', sections: ['A', 'B', 'C'], teacher: 'Mr. Wilson', capacity: 40 },
    { name: 'Grade 12', sections: ['A', 'B'], teacher: 'Dr. Brown', capacity: 30 },
  ];

  mockSubjects = [
    { name: 'Mathematics', code: 'MAT', type: 'Core', periods: 6 },
    { name: 'Science', code: 'SCI', type: 'Core', periods: 5 },
    { name: 'English', code: 'ENG', type: 'Core', periods: 5 },
    { name: 'History', code: 'HIS', type: 'Core', periods: 3 },
    { name: 'Computer Science', code: 'CS', type: 'Elective', periods: 3 },
    { name: 'Physical Education', code: 'PE', type: 'Core', periods: 2 },
  ];

  mockTeachers = [
    { name: 'Sarah Johnson', email: 'sarah@greenvalley.edu', subjectCount: 2 },
    { name: 'Michael Chen', email: 'michael@greenvalley.edu', subjectCount: 3 },
    { name: 'Emily Davis', email: 'emily@greenvalley.edu', subjectCount: 1 },
    { name: 'Robert Wilson', email: 'robert@greenvalley.edu', subjectCount: 2 },
  ];

  mockStudents = [
    { name: 'Arjun Patel', admNo: 'GV-2026-001', cls: 'Grade 10-A', color: '#6366f1' },
    { name: 'Emily Chen', admNo: 'GV-2026-002', cls: 'Grade 10-A', color: '#10b981' },
    { name: 'Carlos Rodriguez', admNo: 'GV-2026-003', cls: 'Grade 10-B', color: '#f59e0b' },
    { name: 'Sofia Martinez', admNo: 'GV-2026-004', cls: 'Grade 8-A', color: '#ec4899' },
    { name: 'Liam Johnson', admNo: 'GV-2026-005', cls: 'Grade 12-A', color: '#3b82f6' },
  ];

  mockParents = [
    { name: 'Raj Patel', email: 'raj@gmail.com', phone: '+1 555-0101', children: 2 },
    { name: 'Wei Chen', email: 'wei@gmail.com', phone: '+1 555-0102', children: 1 },
    { name: 'Maria Rodriguez', email: 'maria@gmail.com', phone: '+1 555-0103', children: 1 },
    { name: 'Lisa Johnson', email: 'lisa@gmail.com', phone: '+1 555-0104', children: 2 },
  ];

  mockExams = [
    { name: 'Midterm Examination', type: 'Midterm', dates: 'Feb 15 – Feb 22', classes: 'All Classes' },
    { name: 'Unit Test 3', type: 'Unit Test', dates: 'Mar 5 – Mar 6', classes: 'Grade 9–12' },
    { name: 'Final Examination', type: 'Final', dates: 'Apr 10 – Apr 25', classes: 'All Classes' },
    { name: 'Quarterly Quiz', type: 'Quarterly', dates: 'Jan 20', classes: 'Grade 1–5' },
  ];

  mockTimetable = [
    { time: '8:00', cells: ['Math', 'Eng', 'Sci', 'Math', 'Hist'] },
    { time: '9:00', cells: ['Eng', 'Math', 'Eng', 'CS', 'Math'] },
    { time: '10:00', cells: ['BREAK', 'BREAK', 'BREAK', 'BREAK', 'BREAK'] },
    { time: '10:30', cells: ['Sci', 'Hist', 'Math', 'Eng', 'CS'] },
    { time: '11:30', cells: ['PE', 'CS', 'Hist', 'Sci', 'Eng'] },
    { time: '12:30', cells: ['BREAK', 'BREAK', 'BREAK', 'BREAK', 'BREAK'] },
    { time: '1:00', cells: ['Hist', 'Sci', 'PE', 'Hist', 'Sci'] },
  ];

  mockVehicles = [
    { number: 'GV-BUS-01', route: 'North Route', online: true },
    { number: 'GV-BUS-02', route: 'South Route', online: true },
    { number: 'GV-BUS-03', route: 'East Route', online: false },
    { number: 'GV-VAN-01', route: 'Downtown', online: true },
  ];

  mockReports = [
    { name: 'Student Report', icon: '🎓', desc: 'Enrollment & demographics' },
    { name: 'Attendance Report', icon: '📋', desc: 'Monthly summaries' },
    { name: 'Results Report', icon: '📊', desc: 'Exam-wise analysis' },
    { name: 'Fee Report', icon: '💰', desc: 'Collection status' },
    { name: 'Staff Report', icon: '👨‍🏫', desc: 'Teacher directory' },
    { name: 'Transport Report', icon: '🚌', desc: 'Vehicle & route data' },
  ];

  dashStats = [
    { icon: '🎓', label: 'Students', value: '1,247', bg: 'rgba(99,102,241,0.12)', color: '#6366f1' },
    { icon: '👨‍🏫', label: 'Teachers', value: '83', bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
    { icon: '🏫', label: 'Classes', value: '42', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    { icon: '💰', label: 'Revenue', value: '$285K', bg: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  ];

  progressPercent = computed(() => ((this.current() + 1) / this.steps.length) * 100);

  constructor() {
    this.startAutoAdvance();
  }

  ngOnDestroy(): void {
    clearTimeout(this.animTimer);
    clearInterval(this.autoTimer);
  }

  next(): void {
    if (this.current() < this.steps.length - 1) {
      this.transition(this.current() + 1);
    }
    this.restartAutoAdvance();
  }

  prev(): void {
    if (this.current() > 0) {
      this.transition(this.current() - 1);
    }
    this.restartAutoAdvance();
  }

  goTo(index: number): void {
    if (index !== this.current()) {
      this.transition(index);
    }
    this.restartAutoAdvance();
  }

  private transition(to: number): void {
    this.animating.set(false);
    clearTimeout(this.animTimer);
    this.animTimer = setTimeout(() => {
      this.current.set(to);
      this.animating.set(true);
    }, 50);
  }

  private startAutoAdvance(): void {
    this.autoTimer = setInterval(() => {
      if (this.current() < this.steps.length - 1) {
        this.next();
      } else {
        clearInterval(this.autoTimer);
      }
    }, 12000);
  }

  private restartAutoAdvance(): void {
    clearInterval(this.autoTimer);
    this.startAutoAdvance();
  }
}
