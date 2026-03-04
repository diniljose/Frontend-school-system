import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardStats, UserRole } from '../../core/models';

// Register Chart.js components
Chart.register(...registerables);

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
            <div class="stat-value">{{ studentData()?.attendanceRate ?? '-' }}{{ studentData()?.attendanceRate ? '%' : '' }}</div>
            <div class="stat-change" [class.positive]="(studentData()?.attendanceRate || 0) >= 75">{{ getAttendanceStatus() }}</div>
          </div>
          <div class="stat-card animate-in" routerLink="/results" style="cursor:pointer;animation-delay:.05s">
            <div class="stat-icon" style="background: rgba(99,102,241,0.12); color: #6366f1;">📊</div>
            <div class="stat-label">Current Grade</div>
            <div class="stat-value">{{ studentData()?.currentGrade || '-' }}</div>
            <div class="stat-change" [class.positive]="studentData()?.currentGrade">{{ studentData()?.currentGrade ? 'Latest result' : 'No results yet' }}</div>
          </div>
          <div class="stat-card animate-in" routerLink="/exams" style="cursor:pointer;animation-delay:.1s">
            <div class="stat-icon" style="background: rgba(245,158,11,0.12); color: #f59e0b;">📝</div>
            <div class="stat-label">Upcoming Exams</div>
            <div class="stat-value">{{ studentData()?.upcomingExams ?? 0 }}</div>
            <div class="stat-change neutral">{{ studentData()?.upcomingExams ? 'Scheduled' : 'None scheduled' }}</div>
          </div>
          <div class="stat-card animate-in" routerLink="/fees" style="cursor:pointer;animation-delay:.15s">
            <div class="stat-icon" style="background: rgba(239,68,68,0.12); color: #ef4444;">💰</div>
            <div class="stat-label">Fee Status</div>
            <div class="stat-value">{{ studentData()?.feeStatus || '-' }}</div>
            <div class="stat-change" [class.positive]="studentData()?.feeStatus === 'Paid'" [class.negative]="studentData()?.feeStatus === 'Pending'">
              {{ getFeeStatusText() }}
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
              } @empty {
                <div class="empty-list">No classes scheduled for today</div>
              }
            </div>
          </div>
          <div class="card animate-in" style="animation-delay:.25s">
            <div class="card-header"><h3>📝 Upcoming Exams</h3><a routerLink="/exams" class="btn btn-ghost btn-sm">View All</a></div>
            <div class="exam-list">
              @for (exam of upcomingExamsList(); track exam._id) {
                <div class="exam-item">
                  <div class="exam-date">
                    <span class="exam-day">{{ exam.startDay }}</span>
                    <span class="exam-month">{{ exam.startMonth }}</span>
                  </div>
                  <div class="exam-info">
                    <strong>{{ exam.name }}</strong>
                    <span>{{ exam.examType | titlecase }} • {{ exam.subjectCount }} subjects</span>
                  </div>
                </div>
              } @empty {
                <div class="empty-list">No upcoming exams scheduled</div>
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
            <div class="stat-value">{{ teacherData()?.classCount ?? 0 }}</div>
            <div class="stat-change neutral">{{ teacherData()?.totalStudents ?? 0 }} students</div>
          </div>
          <div class="stat-card animate-in" routerLink="/attendance" style="cursor:pointer;animation-delay:.05s">
            <div class="stat-icon" style="background: rgba(16,185,129,0.12); color: #10b981;">📋</div>
            <div class="stat-label">Today's Attendance</div>
            <div class="stat-value">{{ teacherData()?.todayAttendance ?? '-' }}{{ teacherData()?.todayAttendance ? '%' : '' }}</div>
            <div class="stat-change" [class.positive]="teacherData()?.presentToday">{{ teacherData()?.presentToday ?? 0 }} present</div>
          </div>
          @if (userRole() === 'class_teacher') {
            <div class="stat-card animate-in" routerLink="/pending-students" style="cursor:pointer;animation-delay:.1s">
              <div class="stat-icon" style="background: rgba(245,158,11,0.12); color: #f59e0b;">⏳</div>
              <div class="stat-label">Pending Approvals</div>
              <div class="stat-value">{{ teacherData()?.pendingApprovals ?? 0 }}</div>
              <div class="stat-change" [class.negative]="(teacherData()?.pendingApprovals ?? 0) > 0">{{ (teacherData()?.pendingApprovals ?? 0) > 0 ? 'Needs review' : 'All clear' }}</div>
            </div>
          } @else {
            <div class="stat-card animate-in" routerLink="/subjects" style="cursor:pointer;animation-delay:.1s">
              <div class="stat-icon" style="background: rgba(245,158,11,0.12); color: #f59e0b;">📖</div>
              <div class="stat-label">My Subjects</div>
              <div class="stat-value">{{ teacherData()?.subjectCount ?? 0 }}</div>
              <div class="stat-change neutral">Across classes</div>
            </div>
          }
          <div class="stat-card animate-in" routerLink="/results/entry" style="cursor:pointer;animation-delay:.15s">
            <div class="stat-icon" style="background: rgba(239,68,68,0.12); color: #ef4444;">📝</div>
            <div class="stat-label">Pending Evaluations</div>
            <div class="stat-value">{{ teacherData()?.pendingEvaluations ?? 0 }}</div>
            <div class="stat-change" [class.negative]="(teacherData()?.pendingEvaluations ?? 0) > 0">{{ (teacherData()?.pendingEvaluations ?? 0) > 0 ? 'Due this week' : 'All done' }}</div>
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
              } @empty {
                <div class="empty-list">No classes scheduled for today</div>
              }
            </div>
          </div>
          <div class="card animate-in" style="animation-delay:.25s">
            <div class="card-header"><h3>📝 Upcoming Exams</h3><a routerLink="/exams" class="btn btn-ghost btn-sm">Manage</a></div>
            <div class="exam-list">
              @for (exam of upcomingExamsList(); track exam._id) {
                <div class="exam-item">
                  <div class="exam-date">
                    <span class="exam-day">{{ exam.startDay }}</span>
                    <span class="exam-month">{{ exam.startMonth }}</span>
                  </div>
                  <div class="exam-info">
                    <strong>{{ exam.name }}</strong>
                    <span>{{ exam.examType | titlecase }} • {{ exam.subjectCount }} subjects</span>
                  </div>
                </div>
              } @empty {
                <div class="empty-list">No upcoming exams</div>
              }
            </div>
          </div>
        </div>

        <div class="card animate-in" style="margin-top: var(--space-6); animation-delay:.3s">
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
    :host { display: block; width: 100%; overflow-x: hidden; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-4); margin-bottom: var(--space-6); }
    .header-actions { display: flex; gap: var(--space-3); flex-wrap: wrap; }
    .card { width: 100%; box-sizing: border-box; overflow: hidden; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
    .card-header h3 { font-size: var(--text-lg); font-weight: 600; }
    .chart-container { position: relative; height: 260px; width: 100%; max-width: 100%; }
    
    /* Grid system with proper constraints */
    .grid { display: grid; gap: var(--space-4); width: 100%; }
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-4 { grid-template-columns: repeat(4, 1fr); }
    
    /* Stat card enhancements */
    .stat-change.positive { color: #10b981; }
    .stat-change.negative { color: #ef4444; }
    .stat-change.neutral { color: var(--text-tertiary); }
    
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
    
    /* Exam list styles */
    .exam-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .exam-item { display: flex; gap: var(--space-3); align-items: center; padding: var(--space-2); background: var(--surface-hover); border-radius: var(--radius-md); }
    .exam-date { display: flex; flex-direction: column; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: var(--radius-md); background: rgba(245,158,11,0.15); flex-shrink: 0; }
    .exam-day { font-size: var(--text-lg); font-weight: 700; color: #f59e0b; line-height: 1; }
    .exam-month { font-size: var(--text-xs); color: #f59e0b; text-transform: uppercase; }
    .exam-info { display: flex; flex-direction: column; gap: 2px; }
    .exam-info strong { font-size: var(--text-sm); }
    .exam-info span { font-size: var(--text-xs); color: var(--text-tertiary); }
    
    .empty-list { text-align: center; padding: var(--space-6); color: var(--text-tertiary); font-size: var(--text-sm); }
    
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
    
    @media (max-width: 1024px) {
      .grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
      .grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
      .chart-container { height: 200px; }
    }
    @media (max-width: 768px) {
      .header-actions { flex-direction: column; width: 100%; }
      .header-actions .btn { width: 100%; justify-content: center; }
      .grid-4, .grid-3, .grid-2 { grid-template-columns: 1fr !important; }
      .schedule-item { grid-template-columns: 1fr; gap: var(--space-2); }
      .schedule-item .schedule-time { font-size: var(--text-xs); }
      .quick-actions { grid-template-columns: 1fr; }
      .child-stats { flex-wrap: wrap; gap: var(--space-2); }
      .child-stat { min-width: 60px; }
      .children-cards { grid-template-columns: 1fr; }
      .event-item { flex-direction: column; align-items: flex-start; }
      .event-date { flex-direction: row; width: auto; height: auto; padding: var(--space-2); gap: var(--space-1); }
      .stat-card { flex-direction: column; text-align: center; align-items: center; }
      .stat-icon { margin-bottom: var(--space-2); }
    }
    @media (max-width: 480px) {
      .page-header { flex-direction: column; align-items: stretch; }
      .page-header > div:first-child { text-align: center; margin-bottom: var(--space-3); }
      .stat-value { font-size: var(--text-xl); }
      .activity-item { flex-direction: column; gap: var(--space-2); }
      .feedback-item { flex-direction: column; }
      .feedback-avatar { align-self: center; }
      .feedback-content { text-align: center; }
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
  
  // Student-specific data - loaded from API
  studentData = signal<any>(null);
  todaySchedule = signal<any[]>([]);
  assignments = signal<any[]>([]);
  
  // Parent-specific data - loaded from API
  parentData = signal<any>(null);
  children = signal<any[]>([]);
  
  // Teacher-specific data - loaded from API
  teacherData = signal<any>(null);
  teacherSchedule = signal<any[]>([]);

  // Exam data - for all roles
  upcomingExamsList = signal<any[]>([]);

  recentActivities = signal<any[]>([]);
  upcomingEvents = signal<any[]>([]);

  attendanceChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      { data: [], label: 'Present %', borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', fill: true, tension: 0.4 },
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
      { data: [], label: 'Collected', backgroundColor: '#6366f1' },
      { data: [], label: 'Pending', backgroundColor: 'rgba(99,102,241,0.2)' },
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
    this.loadEvents();
    this.loadActivities();
    this.loadUpcomingExams();
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

  getAttendanceStatus(): string {
    const rate = this.studentData()?.attendanceRate;
    if (rate === undefined || rate === null) return 'No data';
    if (rate >= 90) return 'Excellent';
    if (rate >= 75) return 'Good standing';
    if (rate >= 50) return 'Needs improvement';
    return 'Critical';
  }

  getFeeStatusText(): string {
    const status = this.studentData()?.feeStatus;
    if (!status) return 'Check status';
    if (status === 'Paid') return 'All clear';
    if (status === 'Pending') return 'Payment due';
    return status;
  }

  loadStats(): void {
    this.api.get<DashboardStats>('/dashboard/stats').subscribe({
      next: (res) => {
        this.stats.set(res.data);
        this.loading.set(false);
        // Update chart data from stats
        if (res.data) {
          this.updateChartData(res.data);
        }
      },
      error: () => {
        // Show empty state instead of hardcoded data
        this.stats.set(null);
        this.loading.set(false);
      }
    });
  }

  loadRoleSpecificData(): void {
    const role = this.userRole();
    
    if (role === 'student') {
      this.loadStudentData();
    } else if (role === 'parent') {
      this.loadParentData();
    } else if (role === 'teacher' || role === 'class_teacher') {
      this.loadTeacherData();
    }
  }

  private loadStudentData(): void {
    // Load student schedule
    this.api.get('/timetable/my-schedule').subscribe({
      next: (res: any) => this.todaySchedule.set(res.data || []),
      error: () => this.todaySchedule.set([])
    });
    
    // Load student dashboard data
    this.api.get('/dashboard/student').subscribe({
      next: (res: any) => {
        this.studentData.set(res.data);
        this.assignments.set(res.data?.assignments || []);
      },
      error: () => this.studentData.set(null)
    });
  }

  private loadParentData(): void {
    // Load children data
    this.api.get('/dashboard/parent').subscribe({
      next: (res: any) => {
        this.parentData.set(res.data);
        this.children.set(res.data?.children || []);
      },
      error: () => {
        this.parentData.set(null);
        this.children.set([]);
      }
    });
  }

  private loadTeacherData(): void {
    // Load teacher schedule and data
    this.api.get('/dashboard/teacher').subscribe({
      next: (res: any) => {
        this.teacherData.set(res.data);
        this.teacherSchedule.set(res.data?.schedule || []);
      },
      error: () => {
        this.teacherData.set(null);
        this.teacherSchedule.set([]);
      }
    });
  }

  private loadEvents(): void {
    this.api.get('/events?limit=5&upcoming=true').subscribe({
      next: (res: any) => {
        let rawEvents = res?.data?.items || res?.data?.data || res?.data || [];
        if (!Array.isArray(rawEvents)) {
          rawEvents = [];
        }
        const events = rawEvents.map((e: any) => {
          const date = new Date(e.startDate || e.date);
          return {
            id: e._id,
            day: date.getDate().toString(),
            month: date.toLocaleString('default', { month: 'short' }),
            title: e.title,
            type: e.type || 'Event',
            badgeType: e.type === 'Exam' ? 'warning' : e.type === 'Meeting' ? 'info' : 'primary'
          };
        });
        this.upcomingEvents.set(events);
      },
      error: () => this.upcomingEvents.set([])
    });
  }

  private loadActivities(): void {
    this.api.get('/dashboard/recent-activities').subscribe({
      next: (res: any) => {
        let activities = res?.data?.data || res?.data?.items || res?.data || [];
        if (!Array.isArray(activities)) {
          activities = [];
        }
        this.recentActivities.set(activities);
      },
      error: () => this.recentActivities.set([])
    });
  }

  private loadUpcomingExams(): void {
    this.api.get('/exams/upcoming').subscribe({
      next: (res: any) => {
        // Handle both paginated response and direct array
        let rawExams = res?.data?.data || res?.data?.items || res?.data || res || [];
        if (!Array.isArray(rawExams)) {
          rawExams = [];
        }
        const exams = rawExams.slice(0, 5).map((e: any) => {
          const startDate = new Date(e.startDate);
          return {
            _id: e._id,
            name: e.name,
            examType: e.examType?.replace(/_/g, ' ') || 'Exam',
            startDay: startDate.getDate().toString(),
            startMonth: startDate.toLocaleString('default', { month: 'short' }),
            subjectCount: e.schedule?.length || 0,
            startDate: e.startDate,
            endDate: e.endDate,
          };
        });
        this.upcomingExamsList.set(exams);
        
        // Update studentData with exam count
        if (this.studentData()) {
          this.studentData.set({ ...this.studentData(), upcomingExams: exams.length });
        }
      },
      error: () => this.upcomingExamsList.set([])
    });
  }

  private updateChartData(stats: DashboardStats): void {
    // Update attendance chart with real data if available
    if (stats.attendanceRate) {
      this.attendanceChartData = {
        ...this.attendanceChartData,
        datasets: [{ ...this.attendanceChartData.datasets[0], data: [stats.attendanceRate, stats.attendanceRate, stats.attendanceRate, stats.attendanceRate, stats.attendanceRate, stats.attendanceRate] }]
      };
    }
    
    // Update fee chart with real data if available
    if (stats.totalFeeCollected || stats.totalFeePending) {
      this.feeChartData = {
        ...this.feeChartData,
        datasets: [
          { ...this.feeChartData.datasets[0], data: [stats.totalFeeCollected || 0] },
          { ...this.feeChartData.datasets[1], data: [stats.totalFeePending || 0] }
        ]
      };
    }
  }

  loadAttendanceChart(): void {
    // Load attendance chart data based on period
    this.api.get(`/attendance/chart?period=${this.attendancePeriod}`).subscribe({
      next: (res: any) => {
        if (res.data?.labels && res.data?.data) {
          this.attendanceChartData = {
            labels: res.data.labels,
            datasets: [{ ...this.attendanceChartData.datasets[0], data: res.data.data }]
          };
        }
      },
      error: () => {} // Keep existing data on error
    });
  }
}
