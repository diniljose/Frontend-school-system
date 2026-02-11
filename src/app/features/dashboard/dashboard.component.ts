import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats, UserRole } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule, BaseChartDirective],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ getGreeting() }}, {{ auth.userName() }} 👋</h1>
        <p>{{ getRoleSubtitle() }}</p>
      </div>
      <div class="header-actions">
        @switch (userRole()) {
          @case ('student') {
            <button class="btn btn-secondary" routerLink="/timetable">📅 My Timetable</button>
            <button class="btn btn-primary" routerLink="/results">📊 My Results</button>
          }
          @case ('parent') {
            <button class="btn btn-secondary" routerLink="/fees">💳 Pay Fees</button>
            <button class="btn btn-primary" routerLink="/results">📊 View Results</button>
          }
          @case ('teacher') {
            <button class="btn btn-secondary" routerLink="/attendance">📋 Mark Attendance</button>
            <button class="btn btn-primary" routerLink="/results">📝 Enter Marks</button>
          }
          @case ('class_teacher') {
            <button class="btn btn-secondary" routerLink="/pending-students">👥 Pending Approvals</button>
            <button class="btn btn-primary" routerLink="/attendance">📋 Mark Attendance</button>
          }
          @default {
            <button class="btn btn-ghost" routerLink="/pending-teachers">👨‍🏫 Pending Teachers</button>
            <button class="btn btn-secondary" routerLink="/reports">📊 Reports</button>
            <button class="btn btn-primary" routerLink="/students/new">+ Add Student</button>
          }
        }
      </div>
    </div>

    @if (loading()) {
      <div class="grid grid-4">
        @for (i of [1,2,3,4]; track i) {
          <div class="stat-card skeleton" style="height:120px"></div>
        }
      </div>
    } @else {
      <!-- Student Dashboard -->
      @if (userRole() === 'student') {
        <div class="grid grid-4">
          <div class="stat-card animate-in" routerLink="/attendance" style="cursor:pointer">
            <div class="stat-icon" style="background: rgba(16,185,129,0.12); color: #10b981;">📋</div>
            <div class="stat-label">Attendance Rate</div>
            <div class="stat-value">{{ studentData()?.attendanceRate || 92 }}%</div>
            <div class="stat-change positive">Good standing</div>
          </div>
          <div class="stat-card animate-in" routerLink="/results" style="cursor:pointer;animation-delay:.05s">
            <div class="stat-icon" style="background: rgba(99,102,241,0.12); color: #6366f1;">📊</div>
            <div class="stat-label">Current Grade</div>
            <div class="stat-value">{{ studentData()?.currentGrade || 'A' }}</div>
            <div class="stat-change positive">Top 10%</div>
          </div>
          <div class="stat-card animate-in" routerLink="/exams" style="cursor:pointer;animation-delay:.1s">
            <div class="stat-icon" style="background: rgba(245,158,11,0.12); color: #f59e0b;">📝</div>
            <div class="stat-label">Upcoming Exams</div>
            <div class="stat-value">{{ studentData()?.upcomingExams || 3 }}</div>
            <div class="stat-change neutral">Next week</div>
          </div>
          <div class="stat-card animate-in" routerLink="/fees" style="cursor:pointer;animation-delay:.15s">
            <div class="stat-icon" style="background: rgba(239,68,68,0.12); color: #ef4444;">💰</div>
            <div class="stat-label">Fee Status</div>
            <div class="stat-value">{{ studentData()?.feeStatus || 'Paid' }}</div>
            <div class="stat-change" [class.positive]="studentData()?.feeStatus === 'Paid'" [class.negative]="studentData()?.feeStatus !== 'Paid'">
              {{ studentData()?.feeStatus === 'Paid' ? 'All clear' : 'Due' }}
            </div>
          </div>
        </div>

        <div class="grid grid-2" style="margin-top: var(--space-6)">
          <div class="card animate-in" style="animation-delay:.2s">
            <div class="card-header"><h3>📅 Today's Schedule</h3></div>
            <div class="schedule-list">
              @for (period of todaySchedule(); track period.time) {
                <div class="schedule-item" [class.current]="period.current">
                  <span class="schedule-time">{{ period.time }}</span>
                  <span class="schedule-subject">{{ period.subject }}</span>
                  <span class="schedule-teacher">{{ period.teacher }}</span>
                </div>
              }
            </div>
          </div>
          <div class="card animate-in" style="animation-delay:.25s">
            <div class="card-header"><h3>📚 Recent Assignments</h3></div>
            <div class="assignment-list">
              @for (a of assignments(); track a.id) {
                <div class="assignment-item">
                  <div class="assignment-subject">{{ a.subject }}</div>
                  <div class="assignment-title">{{ a.title }}</div>
                  <div class="assignment-due" [class.urgent]="a.urgent">Due: {{ a.dueDate }}</div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Parent Dashboard -->
      @else if (userRole() === 'parent') {
        <div class="children-section">
          <h3>👨‍👩‍👧‍👦 Your Children</h3>
          <div class="children-cards">
            @for (child of children(); track child.id) {
              <div class="child-card animate-in">
                <div class="child-avatar">{{ child.name.charAt(0) }}</div>
                <div class="child-info">
                  <strong>{{ child.name }}</strong>
                  <span>{{ child.class }} - {{ child.section }}</span>
                </div>
                <div class="child-stats">
                  <div class="child-stat">
                    <span class="label">Attendance</span>
                    <span class="value">{{ child.attendance }}%</span>
                  </div>
                  <div class="child-stat">
                    <span class="label">Grade</span>
                    <span class="value">{{ child.grade }}</span>
                  </div>
                  <div class="child-stat">
                    <span class="label">Rank</span>
                    <span class="value">#{{ child.rank }}</span>
                  </div>
                </div>
                <a [routerLink]="['/students', child.id]" class="btn btn-sm btn-secondary">View Details</a>
              </div>
            }
          </div>
        </div>

        <div class="grid grid-2" style="margin-top: var(--space-6)">
          <div class="card animate-in">
            <div class="card-header"><h3>💰 Fee Summary</h3></div>
            <div class="fee-summary">
              <div class="fee-row"><span>Total Due</span><strong>{{ parentData()?.totalDue | currency }}</strong></div>
              <div class="fee-row"><span>Paid</span><strong class="text-success">{{ parentData()?.totalPaid | currency }}</strong></div>
              <div class="fee-row"><span>Pending</span><strong class="text-danger">{{ parentData()?.pending | currency }}</strong></div>
              <button class="btn btn-primary" routerLink="/fees" style="width:100%;margin-top:var(--space-4)">Pay Now</button>
            </div>
          </div>
          <div class="card animate-in">
            <div class="card-header"><h3>📅 Upcoming Events</h3></div>
            <div class="event-list">
              @for (event of upcomingEvents(); track event.id) {
                <div class="event-item">
                  <div class="event-date">
                    <span class="event-day">{{ event.day }}</span>
                    <span class="event-month">{{ event.month }}</span>
                  </div>
                  <div class="event-content">
                    <p>{{ event.title }}</p>
                    <span class="event-type badge" [class]="'badge-' + event.badgeType">{{ event.type }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- Teacher / Class Teacher Dashboard -->
      @else if (userRole() === 'teacher' || userRole() === 'class_teacher') {
        <div class="grid grid-4">
          <div class="stat-card animate-in" routerLink="/classes" style="cursor:pointer">
            <div class="stat-icon" style="background: rgba(99,102,241,0.12); color: #6366f1;">🏫</div>
            <div class="stat-label">My Classes</div>
            <div class="stat-value">{{ teacherData()?.classCount || 4 }}</div>
            <div class="stat-change neutral">{{ teacherData()?.totalStudents || 120 }} students</div>
          </div>
          <div class="stat-card animate-in" routerLink="/attendance" style="cursor:pointer;animation-delay:.05s">
            <div class="stat-icon" style="background: rgba(16,185,129,0.12); color: #10b981;">📋</div>
            <div class="stat-label">Today's Attendance</div>
            <div class="stat-value">{{ teacherData()?.todayAttendance || 94 }}%</div>
            <div class="stat-change positive">{{ teacherData()?.presentToday || 113 }} present</div>
          </div>
          @if (userRole() === 'class_teacher') {
            <div class="stat-card animate-in" routerLink="/pending-students" style="cursor:pointer;animation-delay:.1s">
              <div class="stat-icon" style="background: rgba(245,158,11,0.12); color: #f59e0b;">⏳</div>
              <div class="stat-label">Pending Approvals</div>
              <div class="stat-value">{{ teacherData()?.pendingApprovals || 0 }}</div>
              <div class="stat-change" [class.negative]="(teacherData()?.pendingApprovals || 0) > 0">Needs review</div>
            </div>
          } @else {
            <div class="stat-card animate-in" routerLink="/subjects" style="cursor:pointer;animation-delay:.1s">
              <div class="stat-icon" style="background: rgba(245,158,11,0.12); color: #f59e0b;">📖</div>
              <div class="stat-label">My Subjects</div>
              <div class="stat-value">{{ teacherData()?.subjectCount || 3 }}</div>
              <div class="stat-change neutral">Across classes</div>
            </div>
          }
          <div class="stat-card animate-in" routerLink="/exams" style="cursor:pointer;animation-delay:.15s">
            <div class="stat-icon" style="background: rgba(239,68,68,0.12); color: #ef4444;">📝</div>
            <div class="stat-label">Pending Evaluations</div>
            <div class="stat-value">{{ teacherData()?.pendingEvaluations || 12 }}</div>
            <div class="stat-change negative">Due this week</div>
          </div>
        </div>

        <div class="grid grid-2" style="margin-top: var(--space-6)">
          <div class="card animate-in" style="animation-delay:.2s">
            <div class="card-header"><h3>📅 Today's Schedule</h3></div>
            <div class="schedule-list">
              @for (period of teacherSchedule(); track period.time) {
                <div class="schedule-item" [class.current]="period.current">
                  <span class="schedule-time">{{ period.time }}</span>
                  <span class="schedule-subject">{{ period.subject }}</span>
                  <span class="schedule-class">{{ period.class }}</span>
                </div>
              }
            </div>
          </div>
          <div class="card animate-in" style="animation-delay:.25s">
            <div class="card-header"><h3>⚡ Quick Actions</h3></div>
            <div class="quick-actions">
              <a routerLink="/attendance" class="quick-action-btn">📋 Mark Attendance</a>
              <a routerLink="/results" class="quick-action-btn">📝 Enter Marks</a>
              @if (userRole() === 'class_teacher') {
                <a routerLink="/pending-students" class="quick-action-btn">👥 Approve Students</a>
              }
              <a routerLink="/exams" class="quick-action-btn">📅 Schedule Exam</a>
              <a routerLink="/notifications" class="quick-action-btn">📣 Send Notice</a>
              <a routerLink="/students" class="quick-action-btn">🎓 View Students</a>
            </div>
          </div>
        </div>
      }

      <!-- Principal / Admin Dashboard (Default) -->
      @else {
        <div class="grid grid-4">
          <div class="stat-card animate-in" routerLink="/students" style="cursor:pointer">
            <div class="stat-icon" style="background: rgba(99,102,241,0.12); color: #6366f1;">🎓</div>
            <div class="stat-label">{{ 'dashboard.total_students' | translate }}</div>
            <div class="stat-value">{{ stats()?.totalStudents | number }}</div>
            <div class="stat-change positive">+12% this month</div>
          </div>
          <div class="stat-card animate-in" routerLink="/teachers" style="cursor:pointer;animation-delay:.05s">
            <div class="stat-icon" style="background: rgba(16,185,129,0.12); color: #10b981;">👨‍🏫</div>
            <div class="stat-label">{{ 'dashboard.total_teachers' | translate }}</div>
            <div class="stat-value">{{ stats()?.totalTeachers | number }}</div>
            <div class="stat-change positive">+3 new</div>
          </div>
          <div class="stat-card animate-in" routerLink="/classes" style="cursor:pointer;animation-delay:.1s">
            <div class="stat-icon" style="background: rgba(245,158,11,0.12); color: #f59e0b;">🏫</div>
            <div class="stat-label">{{ 'dashboard.total_classes' | translate }}</div>
            <div class="stat-value">{{ stats()?.totalClasses | number }}</div>
            <div class="stat-change neutral">No change</div>
          </div>
          <div class="stat-card animate-in" routerLink="/fees" style="cursor:pointer;animation-delay:.15s">
            <div class="stat-icon" style="background: rgba(239,68,68,0.12); color: #ef4444;">💰</div>
            <div class="stat-label">{{ 'dashboard.revenue' | translate }}</div>
            <div class="stat-value">{{ stats()?.totalFeeCollected | currency:'USD':'symbol':'1.0-0' }}</div>
            <div class="stat-change positive">+8.2%</div>
          </div>
        </div>

        <div class="grid grid-2" style="margin-top: var(--space-6)">
          <div class="card animate-in" style="animation-delay:.2s">
            <div class="card-header">
              <h3>📈 Attendance Overview</h3>
              <select class="form-select" style="width: auto;" [(ngModel)]="attendancePeriod" (change)="loadAttendanceChart()">
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div class="chart-container">
              <canvas baseChart [datasets]="attendanceChartData.datasets" [labels]="attendanceChartData.labels"
                [options]="attendanceChartOptions" type="line"></canvas>
            </div>
          </div>

          <div class="card animate-in" style="animation-delay:.25s">
            <div class="card-header">
              <h3>💰 Fee Collection</h3>
              <span class="badge badge-success">{{ stats()?.feeCollectionRate || 0 }}% collected</span>
            </div>
            <div class="chart-container">
              <canvas baseChart [datasets]="feeChartData.datasets" [labels]="feeChartData.labels"
                [options]="feeChartOptions" type="bar"></canvas>
            </div>
          </div>
        </div>

        <div class="grid grid-3" style="margin-top: var(--space-6)">
          <div class="card animate-in" style="animation-delay:.3s">
            <div class="card-header"><h3>🕒 Recent Activities</h3></div>
            <div class="activity-list">
              @for (activity of recentActivities(); track activity.id) {
                <div class="activity-item">
                  <div class="activity-icon">{{ activity.icon }}</div>
                  <div class="activity-content">
                    <p>{{ activity.message }}</p>
                    <span class="activity-time">{{ activity.time }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="card animate-in" style="animation-delay:.35s">
            <div class="card-header"><h3>📅 Upcoming Events</h3></div>
            <div class="event-list">
              @for (event of upcomingEvents(); track event.id) {
                <div class="event-item">
                  <div class="event-date">
                    <span class="event-day">{{ event.day }}</span>
                    <span class="event-month">{{ event.month }}</span>
                  </div>
                  <div class="event-content">
                    <p>{{ event.title }}</p>
                    <span class="event-type badge" [class]="'badge-' + event.badgeType">{{ event.type }}</span>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="card animate-in" style="animation-delay:.4s">
            <div class="card-header"><h3>⚡ Quick Actions</h3></div>
            <div class="quick-actions">
              <a routerLink="/students/new" class="quick-action-btn">🎓 Add Student</a>
              <a routerLink="/pending-students" class="quick-action-btn">👥 Pending Students</a>
              <a routerLink="/pending-teachers" class="quick-action-btn">👨‍🏫 Pending Teachers</a>
              <a routerLink="/attendance" class="quick-action-btn">📋 Mark Attendance</a>
              <a routerLink="/exams/new" class="quick-action-btn">📝 Create Exam</a>
              <a routerLink="/notifications" class="quick-action-btn">📣 Send Notification</a>
            </div>
          </div>
        </div>
      }
    }
  `,
  styles: [`
    .header-actions { display: flex; gap: var(--space-3); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
    .card-header h3 { font-size: var(--text-lg); font-weight: 600; }
    .chart-container { position: relative; height: 260px; }
    .activity-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .activity-item { display: flex; gap: var(--space-3); align-items: flex-start; }
    .activity-icon { font-size: 20px; flex-shrink: 0; margin-top: 2px; }
    .activity-content p { font-size: var(--text-sm); margin: 0; }
    .activity-time { font-size: var(--text-xs); color: var(--text-tertiary); }
    .event-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .event-item { display: flex; gap: var(--space-3); align-items: center; }
    .event-date {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      width: 48px; height: 48px; border-radius: var(--radius-lg); background: var(--surface-hover); flex-shrink: 0;
    }
    .event-day { font-size: var(--text-lg); font-weight: 700; line-height: 1; }
    .event-month { font-size: var(--text-xs); color: var(--text-tertiary); text-transform: uppercase; }
    .event-content p { font-size: var(--text-sm); margin: 0; }
    .event-type { margin-top: var(--space-1); }
    .quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); }
    .quick-action-btn {
      padding: var(--space-3); border-radius: var(--radius-md); background: var(--surface-hover);
      text-align: center; font-size: var(--text-sm); font-weight: 500;
      transition: var(--transition-fast); cursor: pointer; text-decoration: none; color: var(--text-primary);
    }
    .quick-action-btn:hover { background: var(--primary); color: white; }
    
    /* Schedule styles */
    .schedule-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .schedule-item {
      display: grid; grid-template-columns: 80px 1fr auto;
      gap: var(--space-3); padding: var(--space-3);
      background: var(--surface-hover); border-radius: var(--radius-md);
      align-items: center;
    }
    .schedule-item.current { background: rgba(99,102,241,0.1); border-left: 3px solid var(--primary); }
    .schedule-time { font-weight: 600; font-size: var(--text-sm); color: var(--text-secondary); }
    .schedule-subject { font-weight: 500; }
    .schedule-teacher, .schedule-class { font-size: var(--text-sm); color: var(--text-tertiary); }
    
    /* Assignment styles */
    .assignment-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .assignment-item {
      padding: var(--space-3); background: var(--surface-hover);
      border-radius: var(--radius-md);
    }
    .assignment-subject { font-size: var(--text-xs); color: var(--primary); font-weight: 600; text-transform: uppercase; }
    .assignment-title { font-weight: 500; margin: var(--space-1) 0; }
    .assignment-due { font-size: var(--text-sm); color: var(--text-tertiary); }
    .assignment-due.urgent { color: var(--danger); font-weight: 600; }
    
    /* Children cards (parent dashboard) */
    .children-section h3 { margin-bottom: var(--space-4); }
    .children-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-4); }
    .child-card {
      background: var(--bg-surface); border: 1px solid var(--border-color);
      border-radius: var(--radius-lg); padding: var(--space-4);
      display: flex; flex-direction: column; gap: var(--space-3);
    }
    .child-card .child-avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: var(--text-xl); font-weight: 600;
    }
    .child-info { display: flex; flex-direction: column; }
    .child-info strong { font-size: var(--text-lg); }
    .child-info span { color: var(--text-secondary); font-size: var(--text-sm); }
    .child-stats { display: flex; gap: var(--space-4); }
    .child-stat { display: flex; flex-direction: column; }
    .child-stat .label { font-size: var(--text-xs); color: var(--text-tertiary); }
    .child-stat .value { font-size: var(--text-lg); font-weight: 600; }
    
    /* Fee summary */
    .fee-summary { display: flex; flex-direction: column; gap: var(--space-3); }
    .fee-row { display: flex; justify-content: space-between; padding: var(--space-2) 0; border-bottom: 1px solid var(--border-color); }
    .text-success { color: var(--success); }
    .text-danger { color: var(--danger); }
    
    @media (max-width: 768px) {
      .header-actions { flex-direction: column; }
      .grid-4, .grid-3, .grid-2 { grid-template-columns: 1fr !important; }
      .schedule-item { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);

  loading = signal(true);
  stats = signal<DashboardStats | null>(null);
  attendancePeriod = 'week';
  
  // Role-based computed
  userRole = computed(() => this.auth.userRole() || 'principal');
  
  // Student-specific data
  studentData = signal<any>({ attendanceRate: 92, currentGrade: 'A', upcomingExams: 3, feeStatus: 'Paid' });
  todaySchedule = signal([
    { time: '08:00 - 08:45', subject: 'Mathematics', teacher: 'Mr. Johnson', current: false },
    { time: '08:45 - 09:30', subject: 'Physics', teacher: 'Mrs. Smith', current: true },
    { time: '09:45 - 10:30', subject: 'English', teacher: 'Ms. Wilson', current: false },
    { time: '10:30 - 11:15', subject: 'Chemistry', teacher: 'Dr. Brown', current: false },
    { time: '11:30 - 12:15', subject: 'History', teacher: 'Mr. Davis', current: false },
  ]);
  assignments = signal([
    { id: 1, subject: 'Mathematics', title: 'Chapter 5 Problems', dueDate: 'Tomorrow', urgent: true },
    { id: 2, subject: 'Physics', title: 'Lab Report', dueDate: 'Feb 15', urgent: false },
    { id: 3, subject: 'English', title: 'Essay on Climate', dueDate: 'Feb 18', urgent: false },
  ]);
  
  // Parent-specific data
  parentData = signal<any>({ totalDue: 5000, totalPaid: 4200, pending: 800 });
  children = signal([
    { id: '1', name: 'Emily Johnson', class: 'Grade 10', section: 'A', attendance: 94, grade: 'A', rank: 3 },
    { id: '2', name: 'Michael Johnson', class: 'Grade 7', section: 'B', attendance: 88, grade: 'B+', rank: 8 },
  ]);
  
  // Teacher-specific data
  teacherData = signal<any>({ classCount: 4, totalStudents: 120, todayAttendance: 94, presentToday: 113, subjectCount: 3, pendingApprovals: 2, pendingEvaluations: 12 });
  teacherSchedule = signal([
    { time: '08:00 - 08:45', subject: 'Mathematics', class: 'Grade 10A', current: false },
    { time: '09:45 - 10:30', subject: 'Mathematics', class: 'Grade 9B', current: true },
    { time: '11:30 - 12:15', subject: 'Physics', class: 'Grade 11A', current: false },
    { time: '14:00 - 14:45', subject: 'Mathematics', class: 'Grade 8C', current: false },
  ]);

  recentActivities = signal([
    { id: 1, icon: '🎓', message: 'New student John Doe enrolled in Class 10A', time: '2 min ago' },
    { id: 2, icon: '💰', message: 'Fee payment received from Sarah Smith - $500', time: '15 min ago' },
    { id: 3, icon: '📝', message: 'Midterm exam results published for Class 9B', time: '1 hour ago' },
    { id: 4, icon: '📋', message: 'Attendance marked for all classes today', time: '2 hours ago' },
    { id: 5, icon: '🔔', message: 'Parent meeting scheduled for next Monday', time: '3 hours ago' },
  ]);

  upcomingEvents = signal([
    { id: 1, day: '15', month: 'Feb', title: 'Annual Day Celebration', type: 'Event', badgeType: 'primary' },
    { id: 2, day: '18', month: 'Feb', title: 'Mid-Term Examinations', type: 'Exam', badgeType: 'warning' },
    { id: 3, day: '20', month: 'Feb', title: 'Parent-Teacher Meeting', type: 'Meeting', badgeType: 'info' },
    { id: 4, day: '25', month: 'Feb', title: 'Sports Day', type: 'Event', badgeType: 'success' },
  ]);

  attendanceChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      { data: [92, 94, 88, 96, 93, 90], label: 'Present %', borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4 },
    ]
  };

  attendanceChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: false, min: 70, max: 100, ticks: { callback: v => v + '%' } } }
  };

  feeChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      { data: [45000, 52000, 48000, 61000, 55000, 67000], label: 'Collected', backgroundColor: '#6366f1' },
      { data: [5000, 8000, 12000, 4000, 10000, 3000], label: 'Pending', backgroundColor: 'rgba(99,102,241,0.2)' },
    ]
  };

  feeChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
    scales: { y: { beginAtZero: true, ticks: { callback: v => '$' + (Number(v) / 1000) + 'k' } } }
  };

  ngOnInit(): void {
    this.loadStats();
    this.loadRoleSpecificData();
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  getRoleSubtitle(): string {
    switch (this.userRole()) {
      case 'student': return 'Here\'s your academic overview';
      case 'parent': return 'Stay updated with your children\'s progress';
      case 'teacher': return 'Manage your classes and students';
      case 'class_teacher': return 'Your class at a glance';
      default: return 'Here\'s what\'s happening at your school';
    }
  }

  loadStats(): void {
    this.api.get<DashboardStats>('/dashboard/stats').subscribe({
      next: (res) => { this.stats.set(res.data); this.loading.set(false); },
      error: () => {
        this.stats.set({ totalStudents: 1247, totalTeachers: 83, totalClasses: 42, totalParents: 920, attendanceRate: 92, feeCollectionRate: 87, totalFeeCollected: 285000, totalFeePending: 38500, activeTransport: 15, upcomingExams: 3 });
        this.loading.set(false);
      }
    });
  }

  loadRoleSpecificData(): void {
    // In a real app, load role-specific data from API
    // For now using mock data set in signals above
  }

  loadAttendanceChart(): void {
    // Reload chart data based on period
  }
}
