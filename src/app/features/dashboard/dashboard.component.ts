import { Component, inject, OnInit, signal, computed, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyService } from '../../core/services/currency.service';
import { SchoolCurrencyPipe } from '../../shared/pipes/school-currency.pipe';
import { DashboardStats, DashboardStatsApiResponse, UserRole } from '../../core/models';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule, BaseChartDirective, SchoolCurrencyPipe],
  template: `
    <!-- Modern Dashboard Header -->
    <div class="dashboard-header">
      <div class="header-content">
        <div class="greeting-section">
          <span class="greeting-badge">{{ getTodayDate() }}</span>
          <h1 class="greeting-title">{{ getGreeting() }}, <span class="highlight">{{ auth.userName() }}</span> 👋</h1>
          <p class="greeting-subtitle">{{ getRoleSubtitle() }}</p>
        </div>
        <div class="header-actions">
          @switch (userRole()) {
            @case ('student') {
              <button class="action-btn secondary" routerLink="/timetable">
                <span class="icon">📅</span>
                <span>My Timetable</span>
              </button>
              <button class="action-btn primary" routerLink="/results">
                <span class="icon">📊</span>
                <span>My Results</span>
              </button>
            }
            @case ('parent') {
              <button class="action-btn secondary" routerLink="/fees">
                <span class="icon">💳</span>
                <span>Pay Fees</span>
              </button>
              <button class="action-btn primary" routerLink="/results">
                <span class="icon">📊</span>
                <span>View Results</span>
              </button>
            }
            @case ('teacher') {
              <button class="action-btn secondary" routerLink="/attendance">
                <span class="icon">📋</span>
                <span>Mark Attendance</span>
              </button>
              <button class="action-btn primary" routerLink="/results/entry">
                <span class="icon">📝</span>
                <span>Enter Results</span>
              </button>
            }
            @case ('class_teacher') {
              <button class="action-btn secondary" routerLink="/pending-students">
                <span class="icon">👥</span>
                <span>Pending Students</span>
              </button>
              <button class="action-btn primary" routerLink="/attendance">
                <span class="icon">📋</span>
                <span>Mark Attendance</span>
              </button>
            }
            @default {
              <button class="action-btn secondary" routerLink="/reports">
                <span class="icon">📊</span>
                <span>Reports</span>
              </button>
              <button class="action-btn primary" routerLink="/settings">
                <span class="icon">⚙️</span>
                <span>Settings</span>
              </button>
            }
          }
        </div>
      </div>
    </div>

    @if (loading()) {
      <div class="loading-container">
        <div class="loader-card">
          <div class="loader-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    } @else {
      @switch (userRole()) {
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- STUDENT DASHBOARD -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        @case ('student') {
          <!-- Stats Overview -->
          <div class="stats-grid stats-4">
            <div class="stat-card gradient-purple animate-slide-up" routerLink="/attendance" style="cursor:pointer;--delay:0">
              <div class="stat-glow"></div>
              <div class="stat-content">
                <div class="stat-header">
                  <div class="stat-icon-wrapper purple">
                    <span class="stat-icon">📊</span>
                  </div>
                  <div class="stat-trend" [class.positive]="(studentData()?.attendanceRate || 0) >= 75">
                    {{ getAttendanceStatus() }}
                  </div>
                </div>
                <div class="stat-body">
                  <span class="stat-value">{{ studentData()?.attendanceRate ?? 0 }}<small>%</small></span>
                  <span class="stat-label">Attendance Rate</span>
                </div>
                <div class="stat-progress">
                  <div class="progress-bar purple" [style.width.%]="studentData()?.attendanceRate ?? 0"></div>
                </div>
              </div>
            </div>
            
            <div class="stat-card gradient-green animate-slide-up" routerLink="/results" style="cursor:pointer;--delay:1">
              <div class="stat-glow"></div>
              <div class="stat-content">
                <div class="stat-header">
                  <div class="stat-icon-wrapper green">
                    <span class="stat-icon">🏆</span>
                  </div>
                  <div class="stat-trend positive">
                    {{ studentData()?.gradeStatus || 'View Results' }}
                  </div>
                </div>
                <div class="stat-body">
                  <span class="stat-value">{{ studentData()?.currentGrade ?? '—' }}</span>
                  <span class="stat-label">Current Grade</span>
                </div>
                <div class="stat-footer">
                  <span class="stat-detail">{{ studentData()?.rank ? 'Rank: #' + studentData()?.rank : 'Keep improving!' }}</span>
                </div>
              </div>
            </div>
            
            <div class="stat-card gradient-amber animate-slide-up" routerLink="/exams" style="cursor:pointer;--delay:2">
              <div class="stat-glow"></div>
              <div class="stat-content">
                <div class="stat-header">
                  <div class="stat-icon-wrapper amber">
                    <span class="stat-icon">📝</span>
                  </div>
                  <div class="stat-trend" [class.warning]="(studentData()?.upcomingExams || 0) > 0">
                    {{ (studentData()?.upcomingExams || 0) > 0 ? 'Coming soon' : 'All clear' }}
                  </div>
                </div>
                <div class="stat-body">
                  <span class="stat-value">{{ studentData()?.upcomingExams ?? 0 }}</span>
                  <span class="stat-label">Upcoming Exams</span>
                </div>
                <div class="stat-footer">
                  <span class="stat-detail">{{ getNextExamInfo() }}</span>
                </div>
              </div>
            </div>
            
            <div class="stat-card gradient-rose animate-slide-up" routerLink="/fees" style="cursor:pointer;--delay:3">
              <div class="stat-glow"></div>
              <div class="stat-content">
                <div class="stat-header">
                  <div class="stat-icon-wrapper rose">
                    <span class="stat-icon">💳</span>
                  </div>
                  <div class="stat-trend" [class.positive]="studentData()?.feeStatus === 'Paid'" 
                       [class.negative]="studentData()?.feeStatus === 'Pending'">
                    {{ studentData()?.feeStatus || 'Check Status' }}
                  </div>
                </div>
                <div class="stat-body">
                  <span class="stat-value fee-status" [class.paid]="studentData()?.feeStatus === 'Paid'"
                        [class.pending]="studentData()?.feeStatus === 'Pending'">
                    {{ studentData()?.feeStatus || '—' }}
                  </span>
                  <span class="stat-label">Fee Status</span>
                </div>
                <div class="stat-footer">
                  <span class="stat-detail">{{ getFeeStatusText() }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Main Content Grid -->
          <div class="content-grid">
            <!-- Today's Schedule -->
            <div class="dashboard-card schedule-card animate-slide-up" style="--delay:4">
              <div class="card-header">
                <div class="card-title">
                  <span class="title-icon">📅</span>
                  <h3>Today's Schedule</h3>
                </div>
                <a routerLink="/timetable" class="card-link">View Full →</a>
              </div>
              <div class="schedule-timeline">
                @for (period of todaySchedule(); track period.time; let i = $index) {
                  <div class="timeline-item" [class.current]="period.current" [class.completed]="period.completed">
                    <div class="timeline-marker">
                      <div class="marker-dot"></div>
                      <div class="marker-line"></div>
                    </div>
                    <div class="timeline-content">
                      <div class="schedule-time">{{ period.time }}</div>
                      <div class="schedule-details">
                        <span class="schedule-subject">{{ getDisplayName(period.subject, 'subject') }}</span>
                        <span class="schedule-teacher">{{ getDisplayName(period.teacher, 'teacher') }}</span>
                      </div>
                    </div>
                    @if (period.current) {
                      <div class="live-badge">
                        <span class="pulse"></span>
                        Now
                      </div>
                    }
                  </div>
                } @empty {
                  <div class="empty-state">
                    <span class="empty-icon">🎉</span>
                    <p>No classes scheduled for today!</p>
                    <span class="empty-hint">Enjoy your day off</span>
                  </div>
                }
              </div>
            </div>

            <!-- Upcoming Exams -->
            <div class="dashboard-card exams-card animate-slide-up" style="--delay:5">
              <div class="card-header">
                <div class="card-title">
                  <span class="title-icon">📝</span>
                  <h3>Upcoming Exams</h3>
                </div>
                <a routerLink="/exams" class="card-link">See All →</a>
              </div>
              <div class="exams-list">
                @for (exam of upcomingExamsList(); track exam._id) {
                  <div class="exam-card">
                    <div class="exam-date-badge">
                      <span class="exam-day">{{ exam.startDay }}</span>
                      <span class="exam-month">{{ exam.startMonth }}</span>
                    </div>
                    <div class="exam-details">
                      <h4>{{ exam.name }}</h4>
                      <div class="exam-meta">
                        <span class="exam-type">{{ exam.examType | titlecase }}</span>
                        <span class="exam-subjects">{{ exam.subjectCount }} subjects</span>
                      </div>
                    </div>
                    <div class="exam-countdown" [class.urgent]="exam.daysLeft <= 3">
                      {{ exam.daysLeft > 0 ? exam.daysLeft + ' days' : 'Today' }}
                    </div>
                  </div>
                } @empty {
                  <div class="empty-state">
                    <span class="empty-icon">📚</span>
                    <p>No upcoming exams</p>
                    <span class="empty-hint">Focus on your studies</span>
                  </div>
                }
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="dashboard-card actions-card animate-slide-up" style="--delay:6">
              <div class="card-header">
                <div class="card-title">
                  <span class="title-icon">⚡</span>
                  <h3>Quick Actions</h3>
                </div>
              </div>
              <div class="quick-actions-grid">
                <a routerLink="/timetable" class="quick-action purple">
                  <span class="action-icon">📅</span>
                  <span class="action-label">Timetable</span>
                </a>
                <a routerLink="/results" class="quick-action green">
                  <span class="action-icon">📊</span>
                  <span class="action-label">Results</span>
                </a>
                <a routerLink="/attendance" class="quick-action blue">
                  <span class="action-icon">📋</span>
                  <span class="action-label">Attendance</span>
                </a>
                <a routerLink="/fees" class="quick-action rose">
                  <span class="action-icon">💳</span>
                  <span class="action-label">Fees</span>
                </a>
                <a routerLink="/notifications" class="quick-action amber">
                  <span class="action-icon">🔔</span>
                  <span class="action-label">Notices</span>
                </a>
                <a routerLink="/events" class="quick-action cyan">
                  <span class="action-icon">🎉</span>
                  <span class="action-label">Events</span>
                </a>
              </div>
            </div>
          </div>
        }

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- PARENT DASHBOARD -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        @case ('parent') {
          <!-- Children Overview -->
          <div class="children-overview animate-slide-up">
            <div class="section-header">
              <h2><span class="section-icon">👨‍👩‍👧‍👦</span> Your Children</h2>
              <span class="children-count">{{ children()?.length || 0 }} enrolled</span>
            </div>
            
            <div class="children-grid">
              @for (child of children(); track child._id; let i = $index) {
                <div class="child-card animate-slide-up" [style.--delay]="i">
                  <div class="child-header">
                    <div class="child-avatar" [style.background]="getAvatarGradient(i)">
                      {{ child.firstName?.charAt(0) }}{{ child.lastName?.charAt(0) }}
                    </div>
                    <div class="child-info">
                      <h3>{{ child.firstName }} {{ child.lastName }}</h3>
                      <span class="child-class">{{ getDisplayName(child.class, 'class') }} - {{ getDisplayName(child.section, 'section') }}</span>
                    </div>
                    <a [routerLink]="['/students', child._id]" class="view-profile-btn">View Profile →</a>
                  </div>
                  
                  <div class="child-stats">
                    <div class="child-stat">
                      <div class="stat-circle green">
                        <svg viewBox="0 0 36 36" class="circular-chart">
                          <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                          <path class="circle" [style.stroke-dasharray]="(child.attendance || 0) + ', 100'" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                        </svg>
                        <span class="stat-value-inner">{{ child.attendance || 0 }}%</span>
                      </div>
                      <span class="stat-label">Attendance</span>
                    </div>
                    
                    <div class="child-stat">
                      <div class="stat-circle purple">
                        <span class="stat-value-inner grade">{{ child.grade || '—' }}</span>
                      </div>
                      <span class="stat-label">Grade</span>
                    </div>
                    
                    <div class="child-stat">
                      <div class="stat-circle" [class.amber]="child.feeStatus === 'Pending'" [class.green]="child.feeStatus === 'Paid'">
                        <span class="stat-value-inner fee" [class.pending]="child.feeStatus === 'Pending'">
                          {{ child.feeStatus === 'Paid' ? '✓' : '!' }}
                        </span>
                      </div>
                      <span class="stat-label">{{ child.feeStatus || 'Fees' }}</span>
                    </div>
                  </div>
                  
                  <div class="child-actions">
                    <a [routerLink]="['/results']" [queryParams]="{student: child._id}" class="child-action-btn">
                      <span>📊</span> Results
                    </a>
                    <a [routerLink]="['/fees']" [queryParams]="{student: child._id}" class="child-action-btn">
                      <span>💳</span> Fees
                    </a>
                    <a [routerLink]="['/attendance']" [queryParams]="{student: child._id}" class="child-action-btn">
                      <span>📋</span> Attendance
                    </a>
                  </div>
                </div>
              } @empty {
                <div class="empty-state large">
                  <span class="empty-icon">👨‍👩‍👧‍👦</span>
                  <h3>No Children Enrolled</h3>
                  <p>Children linked to your account will appear here</p>
                </div>
              }
            </div>
          </div>

          <!-- Fee Summary & Events -->
          <div class="content-grid mt-6">
            <div class="dashboard-card animate-slide-up" style="--delay:4">
              <div class="card-header">
                <div class="card-title">
                  <span class="title-icon">💰</span>
                  <h3>Fee Summary</h3>
                </div>
                <a routerLink="/fees" class="card-link">Pay Now →</a>
              </div>
              <div class="fee-summary">
                @for (child of children(); track child._id) {
                  <div class="fee-row">
                    <div class="fee-child">
                      <span class="mini-avatar">{{ child.firstName?.charAt(0) }}</span>
                      <span>{{ child.firstName }}</span>
                    </div>
                    <div class="fee-amount" [class.pending]="child.pendingFees > 0" [class.paid]="!child.pendingFees">
                      {{ child.pendingFees ? ('$' + child.pendingFees + ' Due') : '✓ Paid' }}
                    </div>
                  </div>
                } @empty {
                  <div class="empty-state small">No fee data available</div>
                }
              </div>
            </div>

            <div class="dashboard-card animate-slide-up" style="--delay:5">
              <div class="card-header">
                <div class="card-title">
                  <span class="title-icon">📅</span>
                  <h3>Upcoming Events</h3>
                </div>
                <a routerLink="/events" class="card-link">See All →</a>
              </div>
              <div class="events-list">
                @for (event of upcomingEvents(); track event.id) {
                  <div class="event-item">
                    <div class="event-date-badge">
                      <span class="event-day">{{ event.day }}</span>
                      <span class="event-month">{{ event.month }}</span>
                    </div>
                    <div class="event-details">
                      <h4>{{ event.title }}</h4>
                      <span class="event-type-badge" [class]="'type-' + event.badgeType">{{ event.type }}</span>
                    </div>
                  </div>
                } @empty {
                  <div class="empty-state small">No upcoming events</div>
                }
              </div>
            </div>
          </div>
        }

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- TEACHER DASHBOARD -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        @case ('teacher') {
          @defer {
            <ng-container *ngTemplateOutlet="teacherDashboard"></ng-container>
          }
        }
        @case ('class_teacher') {
          @defer {
            <ng-container *ngTemplateOutlet="teacherDashboard"></ng-container>
          }
        }

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- ADMIN/PRINCIPAL DASHBOARD -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        @default {
          <!-- Stats Overview -->
          <div class="stats-grid stats-4">
            <div class="stat-card gradient-purple animate-slide-up" routerLink="/students" style="cursor:pointer;--delay:0">
              <div class="stat-glow"></div>
              <div class="stat-content">
                <div class="stat-header">
                  <div class="stat-icon-wrapper purple">
                    <span class="stat-icon">🎓</span>
                  </div>
                  <div class="stat-trend positive">+12% this month</div>
                </div>
                <div class="stat-body">
                  <span class="stat-value">{{ stats()?.totalStudents | number }}</span>
                  <span class="stat-label">{{ 'dashboard.total_students' | translate }}</span>
                </div>
              </div>
            </div>
            
            <div class="stat-card gradient-green animate-slide-up" routerLink="/teachers" style="cursor:pointer;--delay:1">
              <div class="stat-glow"></div>
              <div class="stat-content">
                <div class="stat-header">
                  <div class="stat-icon-wrapper green">
                    <span class="stat-icon">👨‍🏫</span>
                  </div>
                  <div class="stat-trend positive">+3 new</div>
                </div>
                <div class="stat-body">
                  <span class="stat-value">{{ stats()?.totalTeachers | number }}</span>
                  <span class="stat-label">{{ 'dashboard.total_teachers' | translate }}</span>
                </div>
              </div>
            </div>
            
            <div class="stat-card gradient-amber animate-slide-up" routerLink="/classes" style="cursor:pointer;--delay:2">
              <div class="stat-glow"></div>
              <div class="stat-content">
                <div class="stat-header">
                  <div class="stat-icon-wrapper amber">
                    <span class="stat-icon">🏫</span>
                  </div>
                  <div class="stat-trend neutral">Active</div>
                </div>
                <div class="stat-body">
                  <span class="stat-value">{{ stats()?.totalClasses | number }}</span>
                  <span class="stat-label">{{ 'dashboard.total_classes' | translate }}</span>
                </div>
              </div>
            </div>
            
            <div class="stat-card gradient-rose animate-slide-up" routerLink="/fees" style="cursor:pointer;--delay:3">
              <div class="stat-glow"></div>
              <div class="stat-content">
                <div class="stat-header">
                  <div class="stat-icon-wrapper rose">
                    <span class="stat-icon">💰</span>
                  </div>
                  <div class="stat-trend positive">+8.2%</div>
                </div>
                <div class="stat-body">
                  <span class="stat-value">{{ stats()?.totalFeeCollected | schoolCurrency:'symbol':'1.0-0' }}</span>
                  <span class="stat-label">{{ 'dashboard.revenue' | translate }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Charts Row -->
          <div class="content-grid mt-6">
            <div class="dashboard-card chart-card animate-slide-up" style="--delay:4">
              <div class="card-header">
                <div class="card-title">
                  <span class="title-icon">📈</span>
                  <h3>Attendance Overview</h3>
                </div>
                <div class="chart-filters">
                  <select class="chart-select" [(ngModel)]="attendanceClassFilter" (change)="onAttendanceClassChange()">
                    @for (cls of classes(); track cls._id) {
                      <option [value]="cls._id">{{ cls.name }}</option>
                    }
                  </select>
                  @if (attendanceSections().length > 0) {
                    <select class="chart-select" [(ngModel)]="attendanceSectionFilter" (change)="loadAttendanceChart()">
                      <option value="">All Sections</option>
                      @for (sec of attendanceSections(); track sec) {
                        <option [value]="sec">{{ sec }}</option>
                      }
                    </select>
                  }
                  <select class="chart-select" [(ngModel)]="attendancePeriod" (change)="loadAttendanceChart()">
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </div>
              <div class="chart-container">
                <canvas baseChart [datasets]="attendanceChartData.datasets" [labels]="attendanceChartData.labels"
                  [options]="attendanceChartOptions" type="line"></canvas>
              </div>
            </div>

            <div class="dashboard-card chart-card animate-slide-up" style="--delay:5">
              <div class="card-header">
                <div class="card-title">
                  <span class="title-icon">💰</span>
                  <h3>Fee Collection</h3>
                </div>
                <div class="chart-filters">
                  <select class="chart-select" [(ngModel)]="feeChartView" (change)="loadFeeChartData()">
                    <option value="total">Total Summary</option>
                    <option value="classwise">Class-wise</option>
                    <option value="monthly">Monthly Trend</option>
                  </select>
                  @if (feeChartView === 'classwise') {
                    <select class="chart-select" [(ngModel)]="feeClassFilter" (change)="loadFeeChartData()">
                      <option value="">All Classes</option>
                      @for (cls of classes(); track cls._id) {
                        <option [value]="cls._id">{{ cls.name }}</option>
                      }
                    </select>
                  }
                  <span class="collection-badge">{{ stats()?.feeCollectionRate || 0 }}%</span>
                </div>
              </div>
              <div class="chart-container">
                <canvas baseChart [datasets]="feeChartData.datasets" [labels]="feeChartData.labels"
                  [options]="feeChartOptions" type="bar"></canvas>
              </div>
              <div class="chart-summary">
                <div class="summary-item">
                  <span class="summary-label">Total Collected</span>
                  <span class="summary-value collected">{{ feeSummary().collected | schoolCurrency:'symbol':'1.0-0' }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Total Pending</span>
                  <span class="summary-value pending">{{ feeSummary().pending | schoolCurrency:'symbol':'1.0-0' }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Total Expected</span>
                  <span class="summary-value">{{ feeSummary().total | schoolCurrency:'symbol':'1.0-0' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Activities, Events, Quick Actions -->
          <div class="content-grid three-col mt-6">
            <div class="dashboard-card animate-slide-up" style="--delay:6">
              <div class="card-header">
                <div class="card-title">
                  <span class="title-icon">🕒</span>
                  <h3>Recent Activities</h3>
                </div>
                <a routerLink="/activity-logs" class="view-all-link">View All →</a>
              </div>
              <div class="activities-list">
                @for (activity of recentActivities(); track activity.id) {
                  <a routerLink="/activity-logs" class="activity-item clickable" [class]="'activity-type-' + activity.type">
                    <div class="activity-icon-wrapper">
                      <span>{{ activity.icon }}</span>
                    </div>
                    <div class="activity-content">
                      <span class="activity-title">{{ activity.title }}</span>
                      <p class="activity-message">{{ activity.message }}</p>
                      <span class="activity-time">{{ activity.time }}</span>
                    </div>
                    <span class="activity-arrow">→</span>
                  </a>
                } @empty {
                  <div class="empty-state small">No recent activities</div>
                }
              </div>
            </div>

            <div class="dashboard-card animate-slide-up" style="--delay:7">
              <div class="card-header">
                <div class="card-title">
                  <span class="title-icon">📅</span>
                  <h3>Upcoming Events</h3>
                </div>
                <a routerLink="/events" class="view-all-link">View All →</a>
              </div>
              <div class="events-list">
                @for (event of upcomingEvents(); track event.id) {
                  <a [routerLink]="['/events']" [queryParams]="{eventId: event.id}" class="event-item clickable">
                    <div class="event-date-badge">
                      <span class="event-day">{{ event.day }}</span>
                      <span class="event-month">{{ event.month }}</span>
                    </div>
                    <div class="event-details">
                      <h4>{{ event.title }}</h4>
                      <span class="event-type-badge" [class]="'type-' + event.badgeType">{{ event.type }}</span>
                    </div>
                    <span class="event-arrow">→</span>
                  </a>
                } @empty {
                  <div class="empty-state small">No upcoming events</div>
                }
              </div>
            </div>

            <div class="dashboard-card animate-slide-up" style="--delay:8">
              <div class="card-header">
                <div class="card-title">
                  <span class="title-icon">⚡</span>
                  <h3>Quick Actions</h3>
                </div>
              </div>
              <div class="quick-actions-grid small">
                <a routerLink="/students/new" class="quick-action purple">
                  <span class="action-icon">🎓</span>
                  <span class="action-label">Add Student</span>
                </a>
                <a routerLink="/pending-students" class="quick-action amber">
                  <span class="action-icon">👥</span>
                  <span class="action-label">Approvals</span>
                </a>
                <a routerLink="/pending-teachers" class="quick-action green">
                  <span class="action-icon">👨‍🏫</span>
                  <span class="action-label">Teachers</span>
                </a>
                <a routerLink="/attendance" class="quick-action blue">
                  <span class="action-icon">📋</span>
                  <span class="action-label">Attendance</span>
                </a>
                <a routerLink="/exams/new" class="quick-action rose">
                  <span class="action-icon">📝</span>
                  <span class="action-label">Create Exam</span>
                </a>
                <a routerLink="/notifications" class="quick-action cyan">
                  <span class="action-icon">📣</span>
                  <span class="action-label">Notify</span>
                </a>
              </div>
            </div>
          </div>
        }
      }
    }

    <!-- Teacher Dashboard Template -->
    <ng-template #teacherDashboard>
      <!-- Stats Overview -->
      <div class="stats-grid stats-4">
        <div class="stat-card gradient-purple animate-slide-up" routerLink="/students" style="cursor:pointer;--delay:0">
          <div class="stat-glow"></div>
          <div class="stat-content">
            <div class="stat-header">
              <div class="stat-icon-wrapper purple">
                <span class="stat-icon">👨‍🎓</span>
              </div>
              <div class="stat-trend neutral">Your Classes</div>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ teacherData()?.studentCount ?? 0 }}</span>
              <span class="stat-label">Total Students</span>
            </div>
          </div>
        </div>
        
        <div class="stat-card gradient-green animate-slide-up" routerLink="/attendance" style="cursor:pointer;--delay:1">
          <div class="stat-glow"></div>
          <div class="stat-content">
            <div class="stat-header">
              <div class="stat-icon-wrapper green">
                <span class="stat-icon">📊</span>
              </div>
              <div class="stat-trend" [class.positive]="teacherData()?.presentToday">
                {{ teacherData()?.presentToday ?? 0 }} present
              </div>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ teacherData()?.todayAttendance ?? '-' }}<small>%</small></span>
              <span class="stat-label">Today's Attendance</span>
            </div>
            <div class="stat-progress">
              <div class="progress-bar green" [style.width.%]="teacherData()?.todayAttendance ?? 0"></div>
            </div>
          </div>
        </div>
        
        @if (userRole() === 'class_teacher') {
          <div class="stat-card gradient-amber animate-slide-up" routerLink="/pending-students" style="cursor:pointer;--delay:2">
            <div class="stat-glow"></div>
            <div class="stat-content">
              <div class="stat-header">
                <div class="stat-icon-wrapper amber">
                  <span class="stat-icon">⏳</span>
                </div>
                <div class="stat-trend" [class.warning]="(teacherData()?.pendingApprovals ?? 0) > 0">
                  {{ (teacherData()?.pendingApprovals ?? 0) > 0 ? 'Needs review' : 'All clear' }}
                </div>
              </div>
              <div class="stat-body">
                <span class="stat-value">{{ teacherData()?.pendingApprovals ?? 0 }}</span>
                <span class="stat-label">Pending Approvals</span>
              </div>
            </div>
          </div>
        } @else {
          <div class="stat-card gradient-amber animate-slide-up" routerLink="/subjects" style="cursor:pointer;--delay:2">
            <div class="stat-glow"></div>
            <div class="stat-content">
              <div class="stat-header">
                <div class="stat-icon-wrapper amber">
                  <span class="stat-icon">📖</span>
                </div>
                <div class="stat-trend neutral">Across classes</div>
              </div>
              <div class="stat-body">
                <span class="stat-value">{{ teacherData()?.subjectCount ?? 0 }}</span>
                <span class="stat-label">My Subjects</span>
              </div>
            </div>
          </div>
        }
        
        <div class="stat-card gradient-rose animate-slide-up" routerLink="/results/entry" style="cursor:pointer;--delay:3">
          <div class="stat-glow"></div>
          <div class="stat-content">
            <div class="stat-header">
              <div class="stat-icon-wrapper rose">
                <span class="stat-icon">📝</span>
              </div>
              <div class="stat-trend" [class.warning]="(teacherData()?.pendingEvaluations ?? 0) > 0">
                {{ (teacherData()?.pendingEvaluations ?? 0) > 0 ? 'Due this week' : 'All done' }}
              </div>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ teacherData()?.pendingEvaluations ?? 0 }}</span>
              <span class="stat-label">Pending Evaluations</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Schedule & Exams -->
      <div class="content-grid mt-6">
        <div class="dashboard-card schedule-card animate-slide-up" style="--delay:4">
          <div class="card-header">
            <div class="card-title">
              <span class="title-icon">📅</span>
              <h3>Today's Schedule</h3>
            </div>
            <a routerLink="/timetable" class="card-link">View Full →</a>
          </div>
          <div class="schedule-timeline">
            @for (period of teacherSchedule(); track period.time) {
              <div class="timeline-item" [class.current]="period.current">
                <div class="timeline-marker">
                  <div class="marker-dot"></div>
                  <div class="marker-line"></div>
                </div>
                <div class="timeline-content">
                  <div class="schedule-time">{{ period.time }}</div>
                  <div class="schedule-details">
                    <span class="schedule-subject">{{ getDisplayName(period.subject, 'subject') }}</span>
                    <span class="schedule-class">{{ getDisplayName(period.class, 'class') }}</span>
                  </div>
                </div>
                @if (period.current) {
                  <div class="live-badge">
                    <span class="pulse"></span>
                    Now
                  </div>
                }
              </div>
            } @empty {
              <div class="empty-state">
                <span class="empty-icon">🎉</span>
                <p>No classes scheduled for today</p>
              </div>
            }
          </div>
        </div>
        
        <div class="dashboard-card exams-card animate-slide-up" style="--delay:5">
          <div class="card-header">
            <div class="card-title">
              <span class="title-icon">📝</span>
              <h3>Upcoming Exams</h3>
            </div>
            <a routerLink="/exams" class="card-link">Manage →</a>
          </div>
          <div class="exams-list">
            @for (exam of upcomingExamsList(); track exam._id) {
              <div class="exam-card">
                <div class="exam-date-badge">
                  <span class="exam-day">{{ exam.startDay }}</span>
                  <span class="exam-month">{{ exam.startMonth }}</span>
                </div>
                <div class="exam-details">
                  <h4>{{ exam.name }}</h4>
                  <div class="exam-meta">
                    <span class="exam-type">{{ exam.examType | titlecase }}</span>
                    <span class="exam-subjects">{{ exam.subjectCount }} subjects</span>
                  </div>
                </div>
              </div>
            } @empty {
              <div class="empty-state">
                <span class="empty-icon">📚</span>
                <p>No upcoming exams</p>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="dashboard-card actions-card full-width animate-slide-up mt-6" style="--delay:6">
        <div class="card-header">
          <div class="card-title">
            <span class="title-icon">⚡</span>
            <h3>Quick Actions</h3>
          </div>
        </div>
        <div class="quick-actions-grid wide">
          <a routerLink="/attendance" class="quick-action blue">
            <span class="action-icon">📋</span>
            <span class="action-label">Mark Attendance</span>
          </a>
          <a routerLink="/results/entry" class="quick-action purple">
            <span class="action-icon">📝</span>
            <span class="action-label">Enter Marks</span>
          </a>
          @if (userRole() === 'class_teacher') {
            <a routerLink="/pending-students" class="quick-action amber">
              <span class="action-icon">👥</span>
              <span class="action-label">Approve Students</span>
            </a>
          }
          <a routerLink="/exams" class="quick-action rose">
            <span class="action-icon">📅</span>
            <span class="action-label">Schedule Exam</span>
          </a>
          <a routerLink="/notifications" class="quick-action cyan">
            <span class="action-icon">📣</span>
            <span class="action-label">Send Notice</span>
          </a>
          <a routerLink="/students" class="quick-action green">
            <span class="action-icon">🎓</span>
            <span class="action-label">View Students</span>
          </a>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    /* ═══════════════════════════════════════════════════════════════ */
    /* MODERN DASHBOARD STYLES */
    /* ═══════════════════════════════════════════════════════════════ */
    :host {
      display: block;
      width: 100%;
      min-height: 100vh;
      padding-bottom: var(--space-8);
    }

    /* Header Styles */
    .dashboard-header {
      margin-bottom: var(--space-8);
      padding: var(--space-6) var(--space-8);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
      border-radius: var(--radius-2xl);
      border: 1px solid rgba(99, 102, 241, 0.1);
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-4);
    }
    .greeting-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .greeting-badge {
      display: inline-flex;
      align-items: center;
      padding: var(--space-1) var(--space-3);
      background: rgba(99, 102, 241, 0.1);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 500;
      color: var(--color-primary);
      width: fit-content;
    }
    .greeting-title {
      font-size: var(--text-3xl);
      font-weight: 700;
      color: var(--text-primary);
      margin: 0;
    }
    .greeting-title .highlight {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .greeting-subtitle {
      font-size: var(--text-base);
      color: var(--text-secondary);
      margin: 0;
    }
    .header-actions {
      display: flex;
      gap: var(--space-3);
    }
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-lg);
      font-weight: 500;
      font-size: var(--text-sm);
      text-decoration: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      cursor: pointer;
    }
    .action-btn.primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
    }
    .action-btn.primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
    }
    .action-btn.secondary {
      background: var(--bg-surface);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }
    .action-btn.secondary:hover {
      background: var(--bg-surface-hover);
      border-color: var(--color-primary);
    }
    .action-btn .icon {
      font-size: 1.1em;
    }

    /* Loading State */
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }
    .loader-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-8);
      background: var(--bg-surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
    }
    .loader-spinner {
      width: 48px;
      height: 48px;
      border: 3px solid var(--border-color);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      gap: var(--space-5);
      margin-bottom: var(--space-6);
    }
    .stats-4 {
      grid-template-columns: repeat(4, 1fr);
    }
    .stats-3 {
      grid-template-columns: repeat(3, 1fr);
    }

    /* Modern Stat Cards */
    .stat-card {
      position: relative;
      background: var(--bg-surface);
      border-radius: var(--radius-xl);
      padding: var(--space-5);
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid var(--border-color);
    }
    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-xl);
    }
    .stat-glow {
      position: absolute;
      top: 0;
      right: 0;
      width: 150px;
      height: 150px;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.15;
      transition: opacity 0.3s;
      pointer-events: none;
    }
    .stat-card:hover .stat-glow {
      opacity: 0.25;
    }
    .gradient-purple .stat-glow { background: #6366f1; }
    .gradient-green .stat-glow { background: #10b981; }
    .gradient-amber .stat-glow { background: #f59e0b; }
    .gradient-rose .stat-glow { background: #f43f5e; }
    .gradient-blue .stat-glow { background: #3b82f6; }
    .gradient-cyan .stat-glow { background: #06b6d4; }

    .stat-content {
      position: relative;
      z-index: 1;
    }
    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-3);
    }
    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-lg);
      font-size: 1.5rem;
    }
    .stat-icon-wrapper.purple { background: rgba(99, 102, 241, 0.15); }
    .stat-icon-wrapper.green { background: rgba(16, 185, 129, 0.15); }
    .stat-icon-wrapper.amber { background: rgba(245, 158, 11, 0.15); }
    .stat-icon-wrapper.rose { background: rgba(244, 63, 94, 0.15); }
    .stat-icon-wrapper.blue { background: rgba(59, 130, 246, 0.15); }

    .stat-trend {
      font-size: var(--text-xs);
      font-weight: 500;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      background: var(--bg-muted);
      color: var(--text-secondary);
    }
    .stat-trend.positive { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .stat-trend.negative { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
    .stat-trend.warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .stat-trend.neutral { background: var(--bg-muted); color: var(--text-muted); }

    .stat-body {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .stat-value {
      font-size: var(--text-3xl);
      font-weight: 700;
      font-family: var(--font-mono);
      color: var(--text-primary);
      line-height: 1.2;
    }
    .stat-value small {
      font-size: 0.5em;
      font-weight: 500;
      opacity: 0.7;
    }
    .stat-value.fee-status {
      font-size: var(--text-xl);
      font-family: var(--font-sans);
    }
    .stat-value.fee-status.paid { color: #10b981; }
    .stat-value.fee-status.pending { color: #f59e0b; }

    .stat-label {
      font-size: var(--text-sm);
      color: var(--text-muted);
    }
    .stat-progress {
      margin-top: var(--space-3);
      height: 4px;
      background: var(--bg-muted);
      border-radius: var(--radius-full);
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      border-radius: var(--radius-full);
      transition: width 1s ease-out;
    }
    .progress-bar.purple { background: linear-gradient(90deg, #6366f1, #8b5cf6); }
    .progress-bar.green { background: linear-gradient(90deg, #10b981, #34d399); }
    .progress-bar.amber { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .progress-bar.rose { background: linear-gradient(90deg, #f43f5e, #fb7185); }

    .stat-footer {
      margin-top: var(--space-2);
    }
    .stat-detail {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-5);
    }
    .content-grid.three-col {
      grid-template-columns: repeat(3, 1fr);
    }
    .mt-6 { margin-top: var(--space-6); }

    /* Dashboard Cards */
    .dashboard-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: var(--space-5);
      transition: all 0.3s ease;
    }
    .dashboard-card:hover {
      box-shadow: var(--shadow-md);
    }
    .dashboard-card.full-width {
      grid-column: 1 / -1;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
    }
    .card-title {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .title-icon {
      font-size: 1.25rem;
    }
    .card-title h3 {
      font-size: var(--text-lg);
      font-weight: 600;
      margin: 0;
    }
    .card-link {
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--color-primary);
      text-decoration: none;
      transition: color 0.2s;
    }
    .card-link:hover {
      color: var(--color-accent);
    }

    /* Schedule Timeline */
    .schedule-timeline {
      display: flex;
      flex-direction: column;
    }
    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-3) 0;
      position: relative;
    }
    .timeline-marker {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding-top: 2px;
    }
    .marker-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--bg-muted);
      border: 2px solid var(--border-color);
      position: relative;
      z-index: 1;
    }
    .timeline-item.current .marker-dot {
      background: var(--color-primary);
      border-color: var(--color-primary);
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.2);
    }
    .timeline-item.completed .marker-dot {
      background: var(--color-success);
      border-color: var(--color-success);
    }
    .marker-line {
      width: 2px;
      flex-grow: 1;
      background: var(--border-color);
      min-height: 20px;
    }
    .timeline-item:last-child .marker-line {
      display: none;
    }
    .timeline-content {
      flex: 1;
      display: flex;
      gap: var(--space-4);
      align-items: center;
      padding: var(--space-2) var(--space-3);
      background: var(--bg-muted);
      border-radius: var(--radius-lg);
    }
    .timeline-item.current .timeline-content {
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.2);
    }
    .schedule-time {
      font-weight: 600;
      font-size: var(--text-sm);
      color: var(--text-secondary);
      min-width: 70px;
    }
    .schedule-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .schedule-subject {
      font-weight: 500;
      color: var(--text-primary);
    }
    .schedule-teacher, .schedule-class {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }
    .live-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      background: var(--color-primary);
      color: white;
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
    }
    .pulse {
      width: 6px;
      height: 6px;
      background: white;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.5); }
    }

    /* Exams List */
    .exams-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .exam-card {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-3);
      background: var(--bg-muted);
      border-radius: var(--radius-lg);
      transition: all 0.2s;
    }
    .exam-card:hover {
      background: var(--bg-surface-hover);
    }
    .exam-date-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.1));
      border-radius: var(--radius-lg);
      flex-shrink: 0;
    }
    .exam-day {
      font-size: var(--text-xl);
      font-weight: 700;
      color: #f59e0b;
      line-height: 1;
    }
    .exam-month {
      font-size: var(--text-xs);
      font-weight: 500;
      color: #f59e0b;
      text-transform: uppercase;
    }
    .exam-details {
      flex: 1;
    }
    .exam-details h4 {
      font-size: var(--text-sm);
      font-weight: 600;
      margin: 0 0 4px;
    }
    .exam-meta {
      display: flex;
      gap: var(--space-2);
      font-size: var(--text-xs);
      color: var(--text-muted);
    }
    .exam-type {
      padding: 2px 6px;
      background: var(--bg-surface);
      border-radius: var(--radius-sm);
    }
    .exam-countdown {
      font-size: var(--text-xs);
      font-weight: 600;
      padding: 4px 10px;
      background: rgba(99, 102, 241, 0.1);
      color: var(--color-primary);
      border-radius: var(--radius-full);
    }
    .exam-countdown.urgent {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    /* Quick Actions */
    .quick-actions-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-3);
    }
    .quick-actions-grid.small {
      grid-template-columns: repeat(2, 1fr);
    }
    .quick-actions-grid.wide {
      grid-template-columns: repeat(6, 1fr);
    }
    .quick-action {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: var(--space-4);
      background: var(--bg-muted);
      border-radius: var(--radius-lg);
      text-decoration: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid transparent;
    }
    .quick-action:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-md);
    }
    .quick-action .action-icon {
      font-size: 1.5rem;
    }
    .quick-action .action-label {
      font-size: var(--text-xs);
      font-weight: 500;
      color: var(--text-primary);
    }
    .quick-action.purple:hover { background: rgba(99, 102, 241, 0.15); border-color: rgba(99, 102, 241, 0.3); }
    .quick-action.green:hover { background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); }
    .quick-action.blue:hover { background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); }
    .quick-action.amber:hover { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.3); }
    .quick-action.rose:hover { background: rgba(244, 63, 94, 0.15); border-color: rgba(244, 63, 94, 0.3); }
    .quick-action.cyan:hover { background: rgba(6, 182, 212, 0.15); border-color: rgba(6, 182, 212, 0.3); }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-8);
      text-align: center;
    }
    .empty-state.small {
      padding: var(--space-4);
    }
    .empty-state.large {
      grid-column: 1 / -1;
      padding: var(--space-12);
    }
    .empty-icon {
      font-size: 3rem;
      margin-bottom: var(--space-3);
      opacity: 0.8;
    }
    .empty-state p {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0;
    }
    .empty-state h3 {
      font-size: var(--text-lg);
      margin: 0 0 var(--space-2);
    }
    .empty-hint {
      font-size: var(--text-xs);
      color: var(--text-muted);
      margin-top: var(--space-1);
    }

    /* Children Overview (Parent Dashboard) */
    .children-overview {
      margin-bottom: var(--space-6);
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
    }
    .section-header h2 {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-xl);
      font-weight: 600;
      margin: 0;
    }
    .section-icon {
      font-size: 1.5rem;
    }
    .children-count {
      font-size: var(--text-sm);
      color: var(--text-muted);
      padding: 4px 12px;
      background: var(--bg-muted);
      border-radius: var(--radius-full);
    }
    .children-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: var(--space-5);
    }
    .child-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: var(--space-5);
      transition: all 0.3s;
    }
    .child-card:hover {
      box-shadow: var(--shadow-lg);
      transform: translateY(-2px);
    }
    .child-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-4);
    }
    .child-avatar {
      width: 56px;
      height: 56px;
      border-radius: var(--radius-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-lg);
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }
    .child-info {
      flex: 1;
    }
    .child-info h3 {
      font-size: var(--text-lg);
      font-weight: 600;
      margin: 0 0 2px;
    }
    .child-class {
      font-size: var(--text-sm);
      color: var(--text-muted);
    }
    .view-profile-btn {
      font-size: var(--text-xs);
      font-weight: 500;
      color: var(--color-primary);
      text-decoration: none;
    }
    .child-stats {
      display: flex;
      justify-content: space-around;
      padding: var(--space-4);
      background: var(--bg-muted);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-4);
    }
    .child-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2);
    }
    .stat-circle {
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .circular-chart {
      position: absolute;
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }
    .circle-bg {
      fill: none;
      stroke: var(--bg-surface);
      stroke-width: 3;
    }
    .circle {
      fill: none;
      stroke: var(--color-success);
      stroke-width: 3;
      stroke-linecap: round;
      transition: stroke-dasharray 1s ease-out;
    }
    .stat-value-inner {
      font-size: var(--text-sm);
      font-weight: 700;
    }
    .stat-value-inner.grade {
      font-size: var(--text-xl);
      color: var(--color-primary);
    }
    .stat-value-inner.fee {
      font-size: var(--text-lg);
    }
    .stat-value-inner.fee.pending {
      color: #f59e0b;
    }
    .stat-circle.green .stat-value-inner { color: #10b981; }
    .stat-circle.purple .stat-value-inner { color: #6366f1; }
    .stat-circle.amber .stat-value-inner { color: #f59e0b; }

    .child-actions {
      display: flex;
      gap: var(--space-2);
    }
    .child-action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      padding: var(--space-2);
      background: var(--bg-muted);
      border-radius: var(--radius-md);
      font-size: var(--text-xs);
      font-weight: 500;
      color: var(--text-primary);
      text-decoration: none;
      transition: all 0.2s;
    }
    .child-action-btn:hover {
      background: var(--color-primary);
      color: white;
    }

    /* Fee Summary */
    .fee-summary {
      display: flex;
      flex-direction: column;
    }
    .fee-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3);
      border-bottom: 1px solid var(--border-color);
    }
    .fee-row:last-child {
      border-bottom: none;
    }
    .fee-child {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .mini-avatar {
      width: 28px;
      height: 28px;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-xs);
      font-weight: 600;
    }
    .fee-amount {
      font-weight: 600;
      font-size: var(--text-sm);
    }
    .fee-amount.pending { color: #f59e0b; }
    .fee-amount.paid { color: #10b981; }

    /* Events List */
    .events-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      max-height: 320px;
      overflow-y: auto;
    }
    .event-item {
      display: flex;
      gap: var(--space-3);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      transition: all 0.2s ease;
      text-decoration: none;
      color: inherit;
    }
    .event-item.clickable {
      cursor: pointer;
    }
    .event-item.clickable:hover {
      background: var(--bg-muted);
      transform: translateX(4px);
    }
    .event-item.clickable:hover .event-arrow {
      opacity: 1;
      transform: translateX(0);
    }
    .event-arrow {
      display: flex;
      align-items: center;
      font-size: var(--text-lg);
      color: var(--color-primary);
      opacity: 0;
      transform: translateX(-8px);
      transition: all 0.2s ease;
    }
    .event-date-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: var(--bg-muted);
      border-radius: var(--radius-lg);
      flex-shrink: 0;
    }
    .event-day {
      font-size: var(--text-lg);
      font-weight: 700;
      line-height: 1;
    }
    .event-month {
      font-size: var(--text-xs);
      color: var(--text-muted);
      text-transform: uppercase;
    }
    .event-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }
    .event-details h4 {
      font-size: var(--text-sm);
      font-weight: 500;
      margin: 0;
    }
    .event-type-badge {
      display: inline-flex;
      width: fit-content;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 500;
    }
    .event-type-badge.type-primary { background: rgba(99, 102, 241, 0.1); color: #6366f1; }
    .event-type-badge.type-warning { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
    .event-type-badge.type-info { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
    .event-type-badge.type-success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    .view-all-link {
      font-size: var(--text-sm);
      color: var(--color-primary);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
    }
    .view-all-link:hover {
      color: var(--color-primary-dark);
      text-decoration: underline;
    }

    /* Activities List */
    .activities-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      max-height: 320px;
      overflow-y: auto;
    }
    .activity-item {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      border-radius: var(--radius-md);
      transition: all 0.2s ease;
      text-decoration: none;
      color: inherit;
      border: 1px solid transparent;
    }
    .activity-item.clickable {
      cursor: pointer;
    }
    .activity-item.clickable:hover {
      background: var(--bg-muted);
      transform: translateX(4px);
      border-color: var(--border-color);
    }
    .activity-item.clickable:hover .activity-arrow {
      opacity: 1;
      transform: translateX(0);
    }
    .activity-arrow {
      display: flex;
      align-items: center;
      font-size: var(--text-lg);
      color: var(--color-primary);
      opacity: 0;
      transform: translateX(-8px);
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
    .activity-icon-wrapper {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-muted);
      border-radius: var(--radius-md);
      flex-shrink: 0;
      font-size: 1.25rem;
      line-height: 1;
      font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
    }
    .activity-icon-wrapper span {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      font-size: 1.25rem;
      font-family: 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', sans-serif;
    }
    /* Activity type colors */
    .activity-type-student_registered .activity-icon-wrapper,
    .activity-type-STUDENT .activity-icon-wrapper { background: rgba(99, 102, 241, 0.15); }
    .activity-type-enrollment .activity-icon-wrapper,
    .activity-type-ENROLLMENT .activity-icon-wrapper { background: rgba(16, 185, 129, 0.15); }
    .activity-type-event_created .activity-icon-wrapper,
    .activity-type-EVENT .activity-icon-wrapper { background: rgba(245, 158, 11, 0.15); }
    .activity-type-SUBJECT .activity-icon-wrapper { background: rgba(139, 92, 246, 0.15); }
    .activity-type-CLASS .activity-icon-wrapper { background: rgba(59, 130, 246, 0.15); }
    .activity-type-TEACHER .activity-icon-wrapper { background: rgba(236, 72, 153, 0.15); }
    .activity-type-EXAM .activity-icon-wrapper { background: rgba(239, 68, 68, 0.15); }
    .activity-type-FEE .activity-icon-wrapper { background: rgba(34, 197, 94, 0.15); }
    .activity-type-RESULT .activity-icon-wrapper { background: rgba(14, 165, 233, 0.15); }
    .activity-type-ATTENDANCE .activity-icon-wrapper { background: rgba(168, 85, 247, 0.15); }
    .activity-type-USER .activity-icon-wrapper { background: rgba(251, 146, 60, 0.15); }
    .activity-type-SYSTEM .activity-icon-wrapper { background: rgba(107, 114, 128, 0.15); }
    .activity-content {
      flex: 1;
      min-width: 0;
    }
    .activity-title {
      display: block;
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--color-primary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .activity-message {
      font-size: var(--text-sm);
      color: var(--text-primary);
      margin: 0 0 4px;
      line-height: 1.4;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .activity-time {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }

    /* Chart Styles */
    .chart-card {
      min-height: 350px;
    }
    .chart-container {
      height: 260px;
      position: relative;
    }
    .chart-filters {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
    }
    .chart-select {
      padding: var(--space-1) var(--space-2);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      font-size: var(--text-sm);
      color: var(--text-primary);
    }
    .collection-badge {
      padding: 4px 12px;
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
    }
    
    /* Chart Summary */
    .chart-summary {
      display: flex;
      justify-content: space-around;
      padding: var(--space-4) 0 0;
      border-top: 1px solid var(--border-color);
      margin-top: var(--space-4);
    }
    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
    }
    .summary-label {
      font-size: var(--text-xs);
      color: var(--text-muted);
    }
    .summary-value {
      font-size: var(--text-lg);
      font-weight: 600;
      font-family: var(--font-mono);
    }
    .summary-value.collected {
      color: #10b981;
    }
    .summary-value.pending {
      color: #f59e0b;
    }

    /* Animations */
    .animate-slide-up {
      animation: slideUp 0.5s ease-out both;
      animation-delay: calc(var(--delay, 0) * 0.08s);
    }
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Responsive Design */
    @media (max-width: 1280px) {
      .stats-4 { grid-template-columns: repeat(2, 1fr); }
      .content-grid.three-col { grid-template-columns: repeat(2, 1fr); }
      .content-grid.three-col > *:last-child { grid-column: 1 / -1; }
      .quick-actions-grid.wide { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 1024px) {
      .dashboard-header {
        padding: var(--space-4) var(--space-5);
      }
      .greeting-title {
        font-size: var(--text-2xl);
      }
      .content-grid {
        grid-template-columns: 1fr;
      }
      .children-grid {
        grid-template-columns: 1fr;
      }
      .chart-card canvas {
        max-height: 250px;
      }
    }

    @media (max-width: 768px) {
      :host {
        padding: var(--space-3);
        gap: var(--space-3);
      }
      .dashboard-header {
        padding: var(--space-4);
        margin-bottom: var(--space-3);
        border-radius: var(--radius-lg);
      }
      .header-content {
        flex-direction: column;
        align-items: stretch;
        gap: var(--space-3);
      }
      .header-actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--space-2);
      }
      .action-btn {
        flex: 1 1 calc(50% - var(--space-2));
        justify-content: center;
        min-height: 44px;
      }
      .stats-4, .stats-3     {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-3);
      }
      .stat-card {
        padding: var(--space-4);
      }
      .stat-value {
        font-size: var(--text-xl);
      }
      .stat-label {
        font-size: var(--text-xs);
      }
      .stat-icon-wrapper {
        width: 40px;
        height: 40px;
        font-size: 1rem;
      }
      .stat-progress {
        height: 3px;
      }
      .quick-actions-grid, .quick-actions-grid.wide, .quick-actions-grid.small {
        grid-template-columns: repeat(3, 1fr);
        gap: var(--space-2);
      }
      .quick-action {
        padding: var(--space-3);
        min-height: 44px;
      }
      .quick-action .action-icon {
        font-size: 1.2rem;
      }
      .quick-action .action-label {
        font-size: 0.65rem;
      }
      .dashboard-card {
        padding: var(--space-4);
        border-radius: var(--radius-lg);
      }
      .card-header {
        margin-bottom: var(--space-3);
      }
      .card-header h3 {
        font-size: var(--text-base);
      }
      .child-header {
        flex-direction: column;
        text-align: center;
        gap: var(--space-3);
      }
      .child-stats {
        flex-wrap: wrap;
        justify-content: center;
        gap: var(--space-3);
      }
      .child-actions {
        flex-wrap: wrap;
      }
      .child-actions .child-action-btn {
        flex: 1 1 calc(50% - var(--space-2));
        min-height: 44px;
        justify-content: center;
      }
      .chart-card {
        min-height: auto;
      }
      .chart-card canvas {
        max-height: 200px;
      }
      .exam-card {
        padding: var(--space-3);
      }
      .exam-date-badge {
        width: 44px;
        height: 44px;
        flex-shrink: 0;
      }
      .timeline-item {
        padding: var(--space-2) 0;
      }
      .schedule-time {
        font-size: var(--text-xs);
      }
      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-2);
      }
    }

    @media (max-width: 480px) {
      :host {
        padding: var(--space-2);
      }
      .dashboard-header {
        padding: var(--space-3);
        border-radius: var(--radius-lg);
      }
      .greeting-title {
        font-size: var(--text-lg);
      }
      .greeting-subtitle {
        font-size: var(--text-xs);
      }
      .action-btn {
        padding: var(--space-2) var(--space-3);
        font-size: var(--text-xs);
        flex: 1 1 100%;
      }
      .stats-4, .stats-3 {
        grid-template-columns: 1fr;
        gap: var(--space-2);
      }
      .stat-card {
        padding: var(--space-3);
      }
      .stat-header {
        margin-bottom: var(--space-1);
      }
      .stat-value {
        font-size: var(--text-lg);
      }
      .dashboard-card {
        padding: var(--space-3);
      }
      .quick-actions-grid, .quick-actions-grid.wide, .quick-actions-grid.small {
        grid-template-columns: repeat(2, 1fr);
      }
      .timeline-content {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-1);
      }
      .exam-card {
        flex-wrap: wrap;
        gap: var(--space-2);
      }
      .exam-countdown {
        width: 100%;
        text-align: center;
        margin-top: var(--space-2);
      }
      .children-grid {
        gap: var(--space-2);
      }
      .child-card {
        padding: var(--space-3);
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  private currencyService = inject(CurrencyService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  stats = signal<DashboardStats | null>(null);
  attendancePeriod = 'week';
  attendanceClassFilter = '';
  attendanceSectionFilter = '';
  attendanceSections = signal<string[]>([]);
  
  // Fee chart options
  feeChartView = 'classwise';  // 'total', 'classwise', 'monthly'
  feeClassFilter = '';
  feeSummary = signal({ collected: 0, pending: 0, total: 0 });
  
  // Reference data for lookups
  classes = signal<any[]>([]);
  subjects = signal<any[]>([]);
  teachers = signal<any[]>([]);
  
  // Role-based computed
  userRole = computed(() => this.auth.userRole() || 'principal');
  
  // Student-specific data
  studentData = signal<any>(null);
  todaySchedule = signal<any[]>([]);
  assignments = signal<any[]>([]);
  
  // Parent-specific data
  parentData = signal<any>(null);
  children = signal<any[]>([]);
  
  // Teacher-specific data
  teacherData = signal<any>(null);
  teacherSchedule = signal<any[]>([]);

  // Exam data - for all roles
  upcomingExamsList = signal<any[]>([]);

  recentActivities = signal<any[]>([]);
  upcomingEvents = signal<any[]>([]);

  attendanceChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [
      { 
        data: [], 
        label: 'Present %', 
        borderColor: '#6366f1', 
        backgroundColor: 'rgba(99,102,241,0.1)', 
        fill: true, 
        tension: 0.4,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4
      },
    ]
  };

  attendanceChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true, 
    maintainAspectRatio: false,
    plugins: { 
      legend: { display: false }
    },
    scales: { 
      y: { 
        beginAtZero: false, 
        min: 0, 
        max: 100, 
        ticks: { callback: v => v + '%' },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  feeChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      { 
        data: [], 
        label: 'Collected', 
        backgroundColor: '#6366f1',
        borderRadius: 6
      },
      { 
        data: [], 
        label: 'Pending', 
        backgroundColor: 'rgba(99,102,241,0.2)',
        borderRadius: 6
      },
    ]
  };

  feeChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true, 
    maintainAspectRatio: false,
    plugins: { 
      legend: { position: 'bottom' }
    },
    scales: { 
      y: { 
        beginAtZero: true,
        // suggestedMax will be dynamically set
        ticks: { 
          callback: (v) => this.currencyService.formatShort(Number(v))
        },
        grid: { color: 'rgba(0,0,0,0.05)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  // Helper to dynamically adjust fee chart Y-axis based on data
  private updateFeeChartScale(): void {
    const allValues = [
      ...(this.feeChartData.datasets[0]?.data || []),
      ...(this.feeChartData.datasets[1]?.data || [])
    ].map(v => Number(v) || 0);
    
    const maxValue = Math.max(...allValues, 0);
    
    if (maxValue > 0) {
      // Add 20% headroom for visual appeal
      const suggestedMax = Math.ceil(maxValue * 1.2);
      
      this.feeChartOptions = {
        ...this.feeChartOptions,
        scales: {
          ...this.feeChartOptions?.scales,
          y: {
            ...((this.feeChartOptions?.scales as any)?.y || {}),
            beginAtZero: true,
            suggestedMax,
            ticks: {
              callback: (v: any) => this.currencyService.formatShort(Number(v))
            },
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        }
      };
    }
  }

  ngOnInit(): void {
    this.loadReferenceData();
    this.loadStats();
    this.loadRoleSpecificData();
    this.loadEvents();
    this.loadActivities();
    this.loadUpcomingExams();
  }

  getTodayDate(): string {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }

  getRoleSubtitle(): string {
    switch (this.userRole()) {
      case 'student': return 'Here\'s your academic overview for today';
      case 'parent': return 'Stay updated with your children\'s progress';
      case 'teacher': return 'Manage your classes and track student performance';
      case 'class_teacher': return 'Your class at a glance';
      default: return 'Here\'s what\'s happening at your school';
    }
  }

  getAttendanceStatus(): string {
    const rate = this.studentData()?.attendanceRate;
    if (rate === undefined || rate === null) return 'No data';
    if (rate >= 90) return 'Excellent';
    if (rate >= 75) return 'Good';
    if (rate >= 50) return 'Improve';
    return 'Critical';
  }

  getFeeStatusText(): string {
    const status = this.studentData()?.feeStatus;
    if (!status) return 'Check status';
    if (status === 'Paid') return 'All clear';
    if (status === 'Pending') return 'Payment due';
    return status;
  }

  getNextExamInfo(): string {
    const exams = this.upcomingExamsList();
    if (!exams.length) return 'No exams scheduled';
    return `Next: ${exams[0].name}`;
  }

  getAvatarGradient(index: number): string {
    const gradients = [
      'linear-gradient(135deg, #6366f1, #8b5cf6)',
      'linear-gradient(135deg, #10b981, #34d399)',
      'linear-gradient(135deg, #f59e0b, #fbbf24)',
      'linear-gradient(135deg, #f43f5e, #fb7185)',
      'linear-gradient(135deg, #3b82f6, #60a5fa)',
    ];
    return gradients[index % gradients.length];
  }

  /**
   * Helper to display names instead of MongoIDs
   */
  getDisplayName(ref: any, type: 'class' | 'subject' | 'teacher' | 'section'): string {
    if (!ref) return '-';
    
    // Already an object with name
    if (typeof ref === 'object') {
      return ref.name || ref.firstName ? `${ref.firstName || ''} ${ref.lastName || ''}`.trim() : '-';
    }
    
    // String ID - lookup from reference data
    if (typeof ref === 'string') {
      switch (type) {
        case 'class':
          const cls = this.classes().find(c => c._id === ref);
          return cls?.name || 'Class';
        case 'subject':
          const sub = this.subjects().find(s => s._id === ref);
          return sub?.name || sub?.code || 'Subject';
        case 'teacher':
          const teacher = this.teachers().find(t => t._id === ref);
          return teacher ? `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() : 'Teacher';
        case 'section':
          // Sections are usually embedded or simple strings
          return ref;
        default:
          return ref;
      }
    }
    
    return '-';
  }

  private loadReferenceData(): void {
    // Load classes for lookup
    this.api.get('/classes').subscribe({
      next: (res: any) => {
        const data = res?.data?.data || res?.data || [];
        const classes = Array.isArray(data) ? data : [];
        this.classes.set(classes);
        
        // Auto-select first class for attendance chart (attendance requires a specific class)
        if (classes.length > 0 && !this.attendanceClassFilter) {
          this.attendanceClassFilter = classes[0]._id;
          // Set sections for the first class
          const firstClass = classes[0];
          this.attendanceSections.set(firstClass?.sections?.map((s: any) => s.name || s) || []);
        }
      },
      error: () => this.classes.set([])
    });

    // Load subjects for lookup
    this.api.get('/subjects').subscribe({
      next: (res: any) => {
        const data = res?.data?.data || res?.data || [];
        this.subjects.set(Array.isArray(data) ? data : []);
      },
      error: () => this.subjects.set([])
    });

    // Load teachers for lookup
    this.api.get('/teachers').subscribe({
      next: (res: any) => {
        const data = res?.data?.data || res?.data || [];
        this.teachers.set(Array.isArray(data) ? data : []);
      },
      error: () => this.teachers.set([])
    });
  }

  loadStats(): void {
    this.api.get<any>('/dashboard/stats').subscribe({
      next: (res) => {
        // Map the nested backend response to flat DashboardStats interface
        const apiData = res.data;
        const mappedStats: DashboardStats = {
          totalStudents: apiData?.overview?.totalStudents || apiData?.totalStudents || 0,
          totalTeachers: apiData?.overview?.totalTeachers || apiData?.totalTeachers || 0,
          totalClasses: apiData?.overview?.totalClasses || apiData?.totalClasses || 0,
          totalParents: apiData?.totalParents || 0,
          attendanceRate: parseFloat(apiData?.attendance?.today?.percentage || apiData?.attendanceRate || '0'),
          feeCollectionRate: parseFloat(apiData?.fees?.thisMonth?.collectionPercentage || apiData?.feeCollectionRate || '0'),
          totalFeeCollected: apiData?.fees?.thisMonth?.collected || apiData?.totalFeeCollected || 0,
          totalFeePending: apiData?.fees?.thisMonth?.pending || apiData?.totalFeePending || 0,
          activeTransport: apiData?.activeTransport || 0,
          upcomingExams: apiData?.events?.upcomingCount || apiData?.upcomingExams || 0,
          activeStudents: apiData?.overview?.activeStudents || 0,
          activeTeachers: apiData?.overview?.activeTeachers || 0,
          activeClasses: apiData?.overview?.activeClasses || 0,
          totalSubjects: apiData?.overview?.totalSubjects || 0,
          totalEnrollments: apiData?.overview?.totalEnrollments || 0,
          todayPresent: apiData?.attendance?.today?.present || 0,
          todayAbsent: apiData?.attendance?.today?.absent || 0,
          todayLate: apiData?.attendance?.today?.late || 0,
        };
        this.stats.set(mappedStats);
        this.loading.set(false);
        if (mappedStats) {
          this.updateChartData(mappedStats);
        }
      },
      error: () => {
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
    this.api.get('/timetable/my-schedule').subscribe({
      next: (res: any) => this.todaySchedule.set(res.data || []),
      error: () => this.todaySchedule.set([])
    });
    
    this.api.get('/dashboard/student').subscribe({
      next: (res: any) => {
        this.studentData.set(res.data);
        this.assignments.set(res.data?.assignments || []);
      },
      error: () => this.studentData.set(null)
    });
  }

  private loadParentData(): void {
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
        if (!Array.isArray(rawEvents)) rawEvents = [];
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
    this.api.get('/dashboard/recent-activities', { limit: 15 }).subscribe({
      next: (res: any) => {
        let rawActivities = res?.data?.data || res?.data?.items || res?.data || [];
        if (!Array.isArray(rawActivities)) rawActivities = [];
        
        // Transform backend format to frontend format
        const activities = rawActivities.map((a: any, index: number) => {
          const timestamp = new Date(a.timestamp || a.createdAt || new Date());
          const timeAgo = this.getTimeAgo(timestamp);
          
          // Map backend icon names to emoji icons
          const iconMap: Record<string, string> = {
            // Action names
            'create': '➕',
            'add_circle': '➕',
            'update': '✏️',
            'edit': '✏️',
            'delete': '🗑️',
            'login': '🔐',
            'logout': '🚪',
            'password_change': '🔑',
            'password_reset': '🔑',
            'role_change': '👥',
            'permission_change': '🔒',
            'fee_payment': '💰',
            'payment': '💰',
            'attendance_mark': '✔️',
            'result_publish': '📊',
            'grade': '📊',
            'promotion': '⬆️',
            'transfer': '↔️',
            'notification_send': '🔔',
            'notification': '🔔',
            'settings_change': '⚙️',
            'settings': '⚙️',
            'export': '📥',
            'bulk_operation': '📦',
            'person_add': '👤',
            'school': '🏫',
            'event': '📅',
            'assignment': '📝',
            'add': '➕',
            'check': '✅',
            'book': '📚',
            'class': '🏛️',
            'user': '👤',
          };

          // Map entity types to icons
          const entityIconMap: Record<string, string> = {
            'STUDENT': '🎓',
            'TEACHER': '👨‍🏫',
            'SUBJECT': '📚',
            'CLASS': '🏛️',
            'EXAM': '📝',
            'FEE': '💰',
            'RESULT': '📊',
            'ATTENDANCE': '📋',
            'EVENT': '📅',
            'ENROLLMENT': '✅',
            'USER': '👤',
            'SYSTEM': '⚙️',
          };
          
          const entityType = a.entityType || a.type || '';
          const actionOrIcon = a.action || a.icon || '';
          const icon = entityIconMap[entityType.toUpperCase()] || iconMap[actionOrIcon.toLowerCase()] || iconMap[a.icon] || '📌';
          
          return {
            id: a._id || `activity-${index}`,
            icon: icon,
            title: a.title || a.action || 'Activity',
            message: a.description || a.message || a.title || 'Recent activity',
            time: timeAgo,
            type: entityType.toUpperCase() || 'general',
            timestamp: timestamp
          };
        });
        
        this.recentActivities.set(activities);
      },
      error: () => this.recentActivities.set([])
    });
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  private loadUpcomingExams(): void {
    this.api.get('/exams/upcoming').subscribe({
      next: (res: any) => {
        let rawExams = res?.data?.data || res?.data?.items || res?.data || res || [];
        if (!Array.isArray(rawExams)) rawExams = [];
        const today = new Date();
        const exams = rawExams.slice(0, 5).map((e: any) => {
          const startDate = new Date(e.startDate);
          const daysLeft = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return {
            _id: e._id,
            name: e.name,
            examType: e.examType?.replace(/_/g, ' ') || 'Exam',
            startDay: startDate.getDate().toString(),
            startMonth: startDate.toLocaleString('default', { month: 'short' }),
            subjectCount: e.schedule?.length || 0,
            daysLeft: Math.max(0, daysLeft),
          };
        });
        this.upcomingExamsList.set(exams);
        
        if (this.studentData()) {
          this.studentData.set({ ...this.studentData(), upcomingExams: exams.length });
        }
      },
      error: () => this.upcomingExamsList.set([])
    });
  }

  private updateChartData(stats: DashboardStats): void {
    // Update attendance chart with real stats data
    // Use today's attendance breakdown (present/absent/late) and attendance rate from stats
    const present = stats.todayPresent || 0;
    const absent = stats.todayAbsent || 0;
    const late = stats.todayLate || 0;
    const total = present + absent + late;
    
    // Calculate current attendance rate
    const rate = total > 0 ? Math.round((present / total) * 100) : stats.attendanceRate || 0;
    
    // Show single day data with attendance rate, or load weekly data from API
    this.loadAttendanceChart(rate);
    
    // Load fee chart data based on selected view
    this.loadFeeChartData();
  }
  
  /**
   * Load fee chart data based on selected view mode
   */
  loadFeeChartData(): void {
    switch (this.feeChartView) {
      case 'total':
        this.loadTotalFeeChart();
        break;
      case 'monthly':
        this.loadMonthlyFeeChart();
        break;
      case 'classwise':
      default:
        this.loadClassWiseFeeChart();
        break;
    }
  }
  
  private loadTotalFeeChart(): void {
    // Show total summary
    const stats = this.stats();
    const collected = stats?.totalFeeCollected || 0;
    const pending = stats?.totalFeePending || 0;
    
    this.feeSummary.set({ collected, pending, total: collected + pending });
    
    this.feeChartData = {
      labels: ['Total Fees'],
      datasets: [
        { ...this.feeChartData.datasets[0], data: [collected], label: 'Collected' },
        { ...this.feeChartData.datasets[1], data: [pending], label: 'Pending' }
      ]
    };
    this.updateFeeChartScale();
  }
  
  private loadMonthlyFeeChart(): void {
    // Try to load monthly fee breakdown from API
    this.api.get('/fees/analytics/monthly').subscribe({
      next: (res: any) => {
        const monthlyData = res?.data || [];
        if (Array.isArray(monthlyData) && monthlyData.length > 0) {
          const labels = monthlyData.map((m: any) => m.month || m.label || '');
          const collected = monthlyData.map((m: any) => m.collected || m.paid || 0);
          const pending = monthlyData.map((m: any) => m.pending || m.due || 0);
          
          const totalCollected = collected.reduce((a: number, b: number) => a + b, 0);
          const totalPending = pending.reduce((a: number, b: number) => a + b, 0);
          this.feeSummary.set({ collected: totalCollected, pending: totalPending, total: totalCollected + totalPending });
          
          this.feeChartData = {
            labels,
            datasets: [
              { ...this.feeChartData.datasets[0], data: collected, label: 'Collected' },
              { ...this.feeChartData.datasets[1], data: pending, label: 'Pending' }
            ]
          };
          this.updateFeeChartScale();
        } else {
          // Fall back to simulated monthly
          this.loadSimulatedMonthlyChart();
        }
      },
      error: () => this.loadSimulatedMonthlyChart()
    });
  }
  
  private loadSimulatedMonthlyChart(): void {
    const stats = this.stats();
    const collected = stats?.totalFeeCollected || 0;
    const pending = stats?.totalFeePending || 0;
    
    this.feeSummary.set({ collected, pending, total: collected + pending });
    
    // Generate month labels
    const today = new Date();
    const monthLabels = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthLabels.push(d.toLocaleString('default', { month: 'short' }));
    }
    
    if (collected > 0 || pending > 0) {
      const avgCollected = Math.round(collected / 6);
      const avgPending = Math.round(pending / 6);
      
      this.feeChartData = {
        labels: monthLabels,
        datasets: [
          { 
            ...this.feeChartData.datasets[0], 
            data: monthLabels.map(() => Math.round(avgCollected * (0.8 + Math.random() * 0.4))),
            label: 'Collected' 
          },
          { 
            ...this.feeChartData.datasets[1], 
            data: monthLabels.map(() => Math.round(avgPending * (0.6 + Math.random() * 0.8))),
            label: 'Pending' 
          }
        ]
      };
    } else {
      this.feeChartData = {
        labels: monthLabels,
        datasets: [
          { ...this.feeChartData.datasets[0], data: [0, 0, 0, 0, 0, 0], label: 'Collected' },
          { ...this.feeChartData.datasets[1], data: [0, 0, 0, 0, 0, 0], label: 'Pending' }
        ]
      };
    }
    this.updateFeeChartScale();
  }
  
  private loadClassWiseFeeChart(): void {
    // Build query params
    const params: any = { limit: 1000 };
    if (this.feeClassFilter) {
      params.classId = this.feeClassFilter;
    }
    
    // Load fee data
    this.api.get('/fees', params).subscribe({
      next: (res: any) => {
        const fees = res?.data?.data || res?.data?.items || res?.data || [];
        if (Array.isArray(fees) && fees.length > 0) {
          // Group by class (with section if filtering by class)
          const groupMap = new Map<string, { collected: number, pending: number }>();
          
          fees.forEach((fee: any) => {
            let groupKey: string;
            
            if (this.feeClassFilter) {
              // Group by section when filtering by class
              groupKey = fee.section || 'No Section';
            } else {
              // Group by class name
              const classObj = fee.class;
              groupKey = typeof classObj === 'object' ? classObj?.name : 
                         this.classes().find(c => c._id === classObj)?.name || 'Other';
            }
            
            if (!groupMap.has(groupKey)) {
              groupMap.set(groupKey, { collected: 0, pending: 0 });
            }
            
            const data = groupMap.get(groupKey)!;
            data.collected += fee.paidAmount || 0;
            data.pending += fee.dueAmount || fee.balanceAmount || 0;
          });
          
          // Sort and limit
          const sorted = Array.from(groupMap.entries())
            .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
            .slice(0, 10);
          
          if (sorted.length > 0) {
            const totalCollected = sorted.reduce((sum, [, d]) => sum + d.collected, 0);
            const totalPending = sorted.reduce((sum, [, d]) => sum + d.pending, 0);
            this.feeSummary.set({ collected: totalCollected, pending: totalPending, total: totalCollected + totalPending });
            
            this.feeChartData = {
              labels: sorted.map(([name]) => name),
              datasets: [
                { ...this.feeChartData.datasets[0], data: sorted.map(([, d]) => d.collected), label: 'Collected' },
                { ...this.feeChartData.datasets[1], data: sorted.map(([, d]) => d.pending), label: 'Pending' }
              ]
            };
            this.updateFeeChartScale();
          } else {
            this.loadTotalFeeChart();
          }
        } else {
          this.loadTotalFeeChart();
        }
      },
      error: () => this.loadTotalFeeChart()
    });
  }

  loadAttendanceChart(fallbackRate?: number): void {
    // Calculate date range based on period
    const today = new Date();
    let fromDate: string;
    let toDate = today.toISOString().split('T')[0];
    
    switch (this.attendancePeriod) {
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 6);
        fromDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setDate(today.getDate() - 29);
        fromDate = monthAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        fromDate = yearStart.toISOString().split('T')[0];
        break;
      default:
        fromDate = toDate;
    }
    
    // Build query params for attendance endpoint
    let params: any = { fromDate, toDate, limit: 5000 };
    if (this.attendanceClassFilter) {
      params.classId = this.attendanceClassFilter;
    }
    if (this.attendanceSectionFilter) {
      params.section = this.attendanceSectionFilter;
    }
    
    // Try daily summary endpoint first
    this.api.get('/attendance/daily-summary', params).subscribe({
      next: (res: any) => {
        const summaryData = res?.data || [];
        if (Array.isArray(summaryData) && summaryData.length > 0) {
          const labels = summaryData.map((d: any) => {
            const date = new Date(d.date);
            return this.attendancePeriod === 'year' 
              ? date.toLocaleString('default', { month: 'short' })
              : date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
          });
          const rates = summaryData.map((d: any) => 
            d.presentPercentage || d.percentage || d.attendanceRate || 
            (d.total > 0 ? Math.round((d.present / d.total) * 100) : 0)
          );
          
          this.attendanceChartData = {
            labels,
            datasets: [{ ...this.attendanceChartData.datasets[0], data: rates }]
          };
          this.cdr.detectChanges();
        } else {
          // Try raw attendance data
          this.loadAttendanceRawData(params, fallbackRate, fromDate, toDate);
        }
      },
      error: () => {
        // Fallback to raw data
        this.loadAttendanceRawData(params, fallbackRate, fromDate, toDate);
      }
    });
  }
  
  private loadAttendanceRawData(params: any, fallbackRate?: number, fromDate?: string, toDate?: string): void {
    this.api.get('/attendance', params).subscribe({
      next: (res: any) => {
        const data = res?.data?.data || res?.data?.items || res?.data || [];
        const records = Array.isArray(data) ? data : [];
        
        if (records.length > 0) {
          // Group by date and calculate daily attendance rates
          const dailyData = this.calculateDailyAttendanceRates(records, fromDate || '', toDate || '');
          this.attendanceChartData = {
            labels: dailyData.labels,
            datasets: [{ ...this.attendanceChartData.datasets[0], data: dailyData.rates }]
          };
          this.cdr.detectChanges();
        } else {
          // No data - show fallback
          this.setFallbackAttendanceChart(fallbackRate);
        }
      },
      error: () => {
        this.setFallbackAttendanceChart(fallbackRate);
      }
    });
  }

  private calculateDailyAttendanceRates(records: any[], fromDate: string, toDate: string): { labels: string[], rates: number[] } {
    // Group attendance records by date
    // Each record is an attendance document with a 'records' array of student attendance
    const byDate = new Map<string, { present: number, total: number }>();
    
    for (const record of records) {
      const dateStr = new Date(record.date).toISOString().split('T')[0];
      if (!byDate.has(dateStr)) {
        byDate.set(dateStr, { present: 0, total: 0 });
      }
      const day = byDate.get(dateStr)!;
      
      // Handle nested records array (each has student attendance)
      const studentRecords = record.records || [];
      for (const studentRec of studentRecords) {
        day.total++;
        if (studentRec.status === 'present' || studentRec.status === 'late') {
          day.present++;
        }
      }
    }
    
    // Generate labels and rates for the period
    const labels: string[] = [];
    const rates: number[] = [];
    const start = new Date(fromDate);
    const end = new Date(toDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      labels.push(dayName);
      
      const dayData = byDate.get(dateStr);
      if (dayData && dayData.total > 0) {
        rates.push(Math.round((dayData.present / dayData.total) * 100));
      } else {
        rates.push(0);
      }
    }
    
    // Limit to reasonable number of labels for display
    if (labels.length > 31) {
      // For longer periods, sample monthly
      return this.sampleMonthly(byDate, fromDate, toDate);
    } else if (labels.length > 7) {
      // Sample weekly summary
      return { labels: labels.slice(-7), rates: rates.slice(-7) };
    }
    
    return { labels, rates };
  }

  private sampleMonthly(byDate: Map<string, { present: number, total: number }>, fromDate: string, toDate: string): { labels: string[], rates: number[] } {
    const monthlyData = new Map<string, { present: number, total: number }>();
    
    byDate.forEach((data, dateStr) => {
      const monthKey = dateStr.substring(0, 7); // YYYY-MM
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { present: 0, total: 0 });
      }
      const month = monthlyData.get(monthKey)!;
      month.present += data.present;
      month.total += data.total;
    });
    
    const labels: string[] = [];
    const rates: number[] = [];
    
    const sortedMonths = Array.from(monthlyData.keys()).sort();
    for (const monthKey of sortedMonths) {
      const monthData = monthlyData.get(monthKey)!;
      const date = new Date(monthKey + '-01');
      labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
      rates.push(monthData.total > 0 ? Math.round((monthData.present / monthData.total) * 100) : 0);
    }
    
    return { labels, rates };
  }

  private setFallbackAttendanceChart(fallbackRate?: number): void {
    const rate = fallbackRate || this.stats()?.attendanceRate || 0;
    
    // If we have a rate, generate a week's worth of simulated data around that rate
    if (rate > 0) {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const today = new Date().getDay();
      const usedDays = days.slice(0, Math.min(today === 0 ? 7 : today, 6));
      
      // Generate data with some variance around the rate
      const data = usedDays.map(() => {
        const variance = Math.random() * 10 - 5; // ±5%
        return Math.min(100, Math.max(0, Math.round(rate + variance)));
      });
      
      this.attendanceChartData = {
        labels: usedDays,
        datasets: [{ 
          ...this.attendanceChartData.datasets[0], 
          data 
        }]
      };
    } else {
      // No data at all - show empty chart with today's label
      this.attendanceChartData = {
        labels: ['Today'],
        datasets: [{ 
          ...this.attendanceChartData.datasets[0], 
          data: [0] 
        }]
      };
    }
    this.cdr.detectChanges();
  }

  onAttendanceClassChange(): void {
    this.attendanceSectionFilter = '';
    if (this.attendanceClassFilter) {
      const cls = this.classes().find(c => c._id === this.attendanceClassFilter);
      this.attendanceSections.set(cls?.sections?.map((s: any) => s.name || s) || []);
    } else {
      this.attendanceSections.set([]);
    }
    this.loadAttendanceChart();
  }
}
