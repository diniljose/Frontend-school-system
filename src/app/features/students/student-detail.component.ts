import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Student, Enrollment } from '../../core/models';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Student Profile</h1>
        <p>Complete academic journey and history</p>
      </div>
      <div class="header-actions">
        <a routerLink="/students" class="btn btn-secondary">← Back</a>
        @if (student()) {
          <a [routerLink]="['/students', student()!._id, 'analytics']" class="btn btn-info">📊 Analytics</a>
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
          @case ('analytics') {
            <div class="tab-content animate-in">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4)">
                <h3>📊 Performance Analytics</h3>
                <button class="btn btn-primary btn-sm" (click)="loadStudentAnalytics()">🔄 Refresh</button>
              </div>
              
              @if (loadingAnalytics()) {
                <div class="skeleton" style="height:300px;border-radius:8px"></div>
              } @else if (!studentAnalytics()) {
                <div class="analytics-empty">
                  <div class="empty-icon">📊</div>
                  <p>Click refresh to load performance analytics</p>
                  <button class="btn btn-primary" (click)="loadStudentAnalytics()">Load Analytics</button>
                </div>
              } @else {
                <!-- Summary Stats -->
                <div class="analytics-summary">
                  <div class="analytics-stat">
                    <span class="analytics-stat-value">{{ studentAnalytics()?.summary?.totalExams || 0 }}</span>
                    <span class="analytics-stat-label">Exams Taken</span>
                  </div>
                  <div class="analytics-stat">
                    <span class="analytics-stat-value">{{ studentAnalytics()?.summary?.averagePercentage?.toFixed(1) || 0 }}%</span>
                    <span class="analytics-stat-label">Average Score</span>
                  </div>
                  <div class="analytics-stat success">
                    <span class="analytics-stat-value">{{ studentAnalytics()?.summary?.passedExams || 0 }}</span>
                    <span class="analytics-stat-label">Exams Passed</span>
                  </div>
                  <div class="analytics-stat danger">
                    <span class="analytics-stat-value">{{ studentAnalytics()?.summary?.failedExams || 0 }}</span>
                    <span class="analytics-stat-label">Exams Failed</span>
                  </div>
                </div>

                <!-- Subject-wise Performance -->
                @if (studentAnalytics()?.subjectAnalysis?.length) {
                  <h4 style="margin:var(--space-6) 0 var(--space-3)">📚 Subject-wise Performance</h4>
                  <div class="subject-analytics-grid">
                    @for (sub of studentAnalytics()?.subjectAnalysis || []; track sub.subjectId) {
                      <div class="subject-analytics-card">
                        <div class="subject-header">
                          <span class="subject-name">{{ sub.subjectName }}</span>
                          <span class="trend-icon" [class]="getAnalyticsTrendClass(sub.trend)">
                            {{ getAnalyticsTrendIcon(sub.trend) }} {{ sub.trendPercentage > 0 ? '+' : '' }}{{ sub.trendPercentage?.toFixed(1) || 0 }}%
                          </span>
                        </div>
                        <div class="subject-avg">{{ sub.averagePercentage?.toFixed(1) }}% avg</div>
                        <div class="subject-range">
                          <span class="high">↑ {{ sub.highestPercentage?.toFixed(0) }}%</span>
                          <span class="low">↓ {{ sub.lowestPercentage?.toFixed(0) }}%</span>
                        </div>
                        <div class="subject-pass-rate">
                          <div class="progress-mini">
                            <div class="progress-fill" [style.width.%]="sub.passRate"></div>
                          </div>
                          <span>{{ sub.passRate?.toFixed(0) }}% pass rate</span>
                        </div>
                      </div>
                    }
                  </div>
                }

                <!-- Performance Trend / Exam History -->
                @if (studentAnalytics()?.examResults?.length) {
                  <h4 style="margin:var(--space-6) 0 var(--space-3)">📈 Exam History</h4>
                  <table class="data-table">
                    <thead><tr><th>Exam</th><th>Type</th><th>Marks</th><th>%</th><th>Grade</th><th>Rank</th></tr></thead>
                    <tbody>
                      @for (exam of studentAnalytics()?.examResults || []; track exam.examId) {
                        <tr>
                          <td><strong>{{ exam.examName }}</strong></td>
                          <td><span class="badge badge-info">{{ exam.examType }}</span></td>
                          <td>{{ exam.obtainedMarks }}/{{ exam.totalMarks }}</td>
                          <td>{{ exam.percentage?.toFixed(1) }}%</td>
                          <td><span class="badge" [class]="getAnalyticsGradeBadge(exam.grade)">{{ exam.grade }}</span></td>
                          <td>{{ exam.rank || '-' }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }

                <!-- Exam Comparisons -->
                @if (studentAnalytics()?.examComparisons?.length) {
                  <h4 style="margin:var(--space-6) 0 var(--space-3)">📊 Exam Comparisons</h4>
                  @for (comparison of studentAnalytics()?.examComparisons || []; track comparison.currentExam?.examId) {
                    <div class="comparison-card">
                      <div class="comparison-header">
                        <span>{{ comparison.previousExam?.examName }} → {{ comparison.currentExam?.examName }}</span>
                        <span class="comparison-diff" [class]="comparison.overallDifference > 0 ? 'positive' : comparison.overallDifference < 0 ? 'negative' : ''">
                          {{ comparison.overallDifference > 0 ? '+' : '' }}{{ comparison.overallDifference?.toFixed(1) }}%
                        </span>
                      </div>
                      <div class="comparison-subjects">
                        @for (sub of comparison.subjectComparisons || []; track sub.subjectId) {
                          <div class="comparison-subject">
                            <span class="cs-name">{{ sub.subjectName }}</span>
                            <span class="cs-current">{{ sub.currentPercentage?.toFixed(0) }}%</span>
                            @if (sub.status === 'improved') {
                              <span class="cs-diff positive">+{{ sub.difference?.toFixed(0) }}%</span>
                            } @else if (sub.status === 'declined') {
                              <span class="cs-diff negative">{{ sub.difference?.toFixed(0) }}%</span>
                            } @else if (sub.status === 'same') {
                              <span class="cs-diff">→ same</span>
                            } @else {
                              <span class="cs-diff new">new</span>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  }
                }
              }
            </div>
          }
          @case ('fees') {
            <div class="tab-content animate-in">
              <h3>Fee Records</h3>
              @if (loadingFees()) {
                <div class="skeleton" style="height:150px;border-radius:8px"></div>
              } @else if (feeData().length > 0) {
                <!-- Fee Summary -->
                <div class="fee-summary">
                  <div class="fee-summary-item">
                    <span class="fee-label">Total Due</span>
                    <span class="fee-value text-danger">{{ getTotalFeeDue() | currency:'INR' }}</span>
                  </div>
                  <div class="fee-summary-item">
                    <span class="fee-label">Total Paid</span>
                    <span class="fee-value text-success">{{ getTotalFeePaid() | currency:'INR' }}</span>
                  </div>
                </div>
                <table class="data-table">
                  <thead><tr><th>Period</th><th class="text-right">Total</th><th class="text-right">Paid</th><th class="text-right">Due</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    @for (f of feeData(); track f._id || $index) {
                      <tr>
                        <td>{{ f.type }}</td>
                        <td class="text-right">{{ f.amount | currency:'INR' }}</td>
                        <td class="text-right text-success">{{ f.paidAmount | currency:'INR' }}</td>
                        <td class="text-right text-danger">{{ f.dueAmount | currency:'INR' }}</td>
                        <td>{{ f.dueDate | date:'mediumDate' }}</td>
                        <td><span class="badge" [class]="getFeeBadgeClass(f.status)">{{ f.status }}</span></td>
                        <td>
                          @if (f.status !== 'paid') {
                            <button class="btn btn-primary btn-sm" (click)="openPaymentModal(f)">💰 Pay</button>
                          } @else {
                            <span class="text-success">✓ Paid</span>
                          }
                        </td>
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
          @case ('exams') {
            <div class="tab-content animate-in">
              <h3>Exam Schedule</h3>
              @if (loadingExams()) {
                <div class="skeleton" style="height:150px;border-radius:8px"></div>
              } @else if (studentExams().upcoming.length || studentExams().ongoing.length || studentExams().completed.length) {
                <!-- Ongoing Exams -->
                @if (studentExams().ongoing.length) {
                  <div class="exam-section">
                    <h4 class="exam-section-title ongoing-title">🔴 Ongoing Exams</h4>
                    <div class="exam-list">
                      @for (e of studentExams().ongoing; track e._id) {
                        <div class="exam-card-container">
                          <div class="exam-item ongoing" (click)="toggleExamSchedule(e._id)">
                            <div class="exam-date-badge">
                              <span class="exam-day">{{ e.startDate | date:'d' }}</span>
                              <span class="exam-month">{{ e.startDate | date:'MMM' }}</span>
                            </div>
                            <div class="exam-details">
                              <div class="exam-name">{{ e.name }}</div>
                              <div class="exam-meta">
                                <span class="exam-type-badge">{{ formatExamType(e.examType) }}</span>
                                <span>{{ e.startDate | date:'mediumDate' }} - {{ e.endDate | date:'mediumDate' }}</span>
                              </div>
                              @if (e.schedule?.length) {
                                <div class="exam-subjects-toggle">
                                  {{ expandedExam() === e._id ? '▼' : '▶' }} {{ e.schedule.length }} subjects scheduled - Click to view details
                                </div>
                              }
                            </div>
                          </div>
                          @if (expandedExam() === e._id) {
                            <div class="exam-schedule-detail">
                              <!-- Exam Overview -->
                              <div class="exam-overview">
                                <div class="overview-stats">
                                  <div class="overview-stat"><span class="stat-icon">📚</span><span class="stat-value">{{ e.schedule?.length || 0 }}</span><span class="stat-label">Subjects</span></div>
                                  <div class="overview-stat"><span class="stat-icon">📊</span><span class="stat-value">{{ getTotalMarks(e) }}</span><span class="stat-label">Total Marks</span></div>
                                  <div class="overview-stat"><span class="stat-icon">📅</span><span class="stat-value">{{ getExamDays(e) }}</span><span class="stat-label">Days</span></div>
                                  <div class="overview-stat"><span class="stat-icon">⏱️</span><span class="stat-value">{{ e.status || 'scheduled' }}</span><span class="stat-label">Status</span></div>
                                </div>
                                @if (e.description) {
                                  <div class="exam-description">ℹ️ {{ e.description }}</div>
                                }
                              </div>
                              <!-- Schedule by Day -->
                              @if (e.schedule?.length) {
                                <div class="schedule-section-title">📋 Exam Schedule</div>
                                @for (day of getGroupedSchedule(e); track day.date) {
                                  <div class="schedule-day">
                                    <div class="schedule-day-header">📅 {{ day.date | date:'EEEE, MMMM d, yyyy' }}</div>
                                    <div class="schedule-slots">
                                      @for (slot of day.slots; track slot._id) {
                                        <div class="schedule-slot">
                                          <span class="slot-time">🕐 {{ slot.startTime }} - {{ slot.endTime }}</span>
                                          <span class="slot-subject">📚 {{ getScheduleSubjectName(slot) }}</span>
                                          @if (slot.room) { <span class="slot-room">🚪 {{ slot.room }}</span> }
                                          <span class="slot-marks">{{ slot.maxMarks }} marks (pass: {{ slot.passingMarks }})</span>
                                          @if (slot.instructions) { <div class="slot-instructions">💡 {{ slot.instructions }}</div> }
                                        </div>
                                      }
                                    </div>
                                  </div>
                                }
                              } @else {
                                <div class="no-schedule">Schedule not yet published for this exam.</div>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
                <!-- Upcoming Exams -->
                @if (studentExams().upcoming.length) {
                  <div class="exam-section">
                    <h4 class="exam-section-title upcoming-title">📅 Upcoming Exams</h4>
                    <div class="exam-list">
                      @for (e of studentExams().upcoming; track e._id) {
                        <div class="exam-card-container">
                          <div class="exam-item upcoming" (click)="toggleExamSchedule(e._id)">
                            <div class="exam-date-badge">
                              <span class="exam-day">{{ e.startDate | date:'d' }}</span>
                              <span class="exam-month">{{ e.startDate | date:'MMM' }}</span>
                            </div>
                            <div class="exam-details">
                              <div class="exam-name">{{ e.name }}</div>
                              <div class="exam-meta">
                                <span class="exam-type-badge">{{ formatExamType(e.examType) }}</span>
                                <span>{{ e.startDate | date:'mediumDate' }} - {{ e.endDate | date:'mediumDate' }}</span>
                                <span class="days-left">{{ getDaysUntil(e.startDate) }} days left</span>
                              </div>
                              @if (e.schedule?.length) {
                                <div class="exam-subjects-toggle">
                                  {{ expandedExam() === e._id ? '▼' : '▶' }} {{ e.schedule.length }} subjects scheduled - Click to view details
                                </div>
                              } @else {
                                <div class="exam-subjects-toggle">Click to view exam details</div>
                              }
                            </div>
                          </div>
                          @if (expandedExam() === e._id) {
                            <div class="exam-schedule-detail">
                              <div class="exam-overview">
                                <div class="overview-stats">
                                  <div class="overview-stat"><span class="stat-icon">📚</span><span class="stat-value">{{ e.schedule?.length || 0 }}</span><span class="stat-label">Subjects</span></div>
                                  <div class="overview-stat"><span class="stat-icon">📊</span><span class="stat-value">{{ getTotalMarks(e) }}</span><span class="stat-label">Total Marks</span></div>
                                  <div class="overview-stat"><span class="stat-icon">📅</span><span class="stat-value">{{ getExamDays(e) }}</span><span class="stat-label">Days</span></div>
                                  <div class="overview-stat"><span class="stat-icon">⏰</span><span class="stat-value">{{ getDaysUntil(e.startDate) }}</span><span class="stat-label">Days Left</span></div>
                                </div>
                                @if (e.description) {
                                  <div class="exam-description">ℹ️ {{ e.description }}</div>
                                }
                              </div>
                              @if (e.schedule?.length) {
                                <div class="schedule-section-title">📋 Exam Schedule</div>
                                @for (day of getGroupedSchedule(e); track day.date) {
                                  <div class="schedule-day">
                                    <div class="schedule-day-header">📅 {{ day.date | date:'EEEE, MMMM d, yyyy' }}</div>
                                    <div class="schedule-slots">
                                      @for (slot of day.slots; track slot._id) {
                                        <div class="schedule-slot">
                                          <span class="slot-time">🕐 {{ slot.startTime }} - {{ slot.endTime }}</span>
                                          <span class="slot-subject">📚 {{ getScheduleSubjectName(slot) }}</span>
                                          @if (slot.room) { <span class="slot-room">🚪 {{ slot.room }}</span> }
                                          <span class="slot-marks">{{ slot.maxMarks }} marks (pass: {{ slot.passingMarks }})</span>
                                          @if (slot.instructions) { <div class="slot-instructions">💡 {{ slot.instructions }}</div> }
                                        </div>
                                      }
                                    </div>
                                  </div>
                                }
                              } @else {
                                <div class="no-schedule">Schedule not yet published for this exam.</div>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
                <!-- Completed Exams -->
                @if (studentExams().completed.length) {
                  <div class="exam-section">
                    <h4 class="exam-section-title completed-title">✅ Completed Exams</h4>
                    <div class="exam-list">
                      @for (e of studentExams().completed; track e._id) {
                        <div class="exam-card-container">
                          <div class="exam-item completed" (click)="toggleExamSchedule(e._id)">
                            <div class="exam-date-badge completed-badge">
                              <span class="exam-day">{{ e.endDate | date:'d' }}</span>
                              <span class="exam-month">{{ e.endDate | date:'MMM' }}</span>
                            </div>
                            <div class="exam-details">
                              <div class="exam-name">{{ e.name }}</div>
                              <div class="exam-meta">
                                <span class="exam-type-badge">{{ formatExamType(e.examType) }}</span>
                                <span>{{ e.startDate | date:'mediumDate' }} - {{ e.endDate | date:'mediumDate' }}</span>
                              </div>
                              @if (e.schedule?.length) {
                                <div class="exam-subjects-toggle">
                                  {{ expandedExam() === e._id ? '▼' : '▶' }} {{ e.schedule.length }} subjects
                                </div>
                              } @else {
                                <div class="exam-subjects-toggle">Click to view exam details</div>
                              }
                              <a [routerLink]="['/results']" [queryParams]="{examId: e._id, studentId: student()!._id}" class="view-results-link" (click)="$event.stopPropagation()">View Results →</a>
                            </div>
                          </div>
                          @if (expandedExam() === e._id) {
                            <div class="exam-schedule-detail">
                              <div class="exam-overview">
                                <div class="overview-stats">
                                  <div class="overview-stat"><span class="stat-icon">📚</span><span class="stat-value">{{ e.schedule?.length || 0 }}</span><span class="stat-label">Subjects</span></div>
                                  <div class="overview-stat"><span class="stat-icon">📊</span><span class="stat-value">{{ getTotalMarks(e) }}</span><span class="stat-label">Total Marks</span></div>
                                  <div class="overview-stat"><span class="stat-icon">📅</span><span class="stat-value">{{ getExamDays(e) }}</span><span class="stat-label">Days</span></div>
                                  <div class="overview-stat"><span class="stat-icon">✅</span><span class="stat-value">Completed</span><span class="stat-label">Status</span></div>
                                </div>
                                @if (e.description) {
                                  <div class="exam-description">ℹ️ {{ e.description }}</div>
                                }
                              </div>
                              @if (e.schedule?.length) {
                                <div class="schedule-section-title">📋 Exam Schedule</div>
                                @for (day of getGroupedSchedule(e); track day.date) {
                                  <div class="schedule-day">
                                    <div class="schedule-day-header">📅 {{ day.date | date:'EEEE, MMMM d, yyyy' }}</div>
                                    <div class="schedule-slots">
                                      @for (slot of day.slots; track slot._id) {
                                        <div class="schedule-slot">
                                          <span class="slot-time">🕐 {{ slot.startTime }} - {{ slot.endTime }}</span>
                                          <span class="slot-subject">📚 {{ getScheduleSubjectName(slot) }}</span>
                                          @if (slot.room) { <span class="slot-room">🚪 {{ slot.room }}</span> }
                                          <span class="slot-marks">{{ slot.maxMarks }} marks</span>
                                        </div>
                                      }
                                    </div>
                                  </div>
                                }
                              } @else {
                                <div class="no-schedule">No schedule details available for this exam.</div>
                              }
                            </div>
                          }
                        </div>
                      }
                    </div>
                  </div>
                }
              } @else {
                <p class="tab-empty">No exams scheduled for this student's class.</p>
              }
            </div>
          }
        }
      </div>

      <!-- Payment Modal -->
      @if (showPaymentModal()) {
        <div class="modal-backdrop" (click)="closePaymentModal()">
          <div class="modal-content card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Record Payment</h2>
              <button class="close-btn" (click)="closePaymentModal()">×</button>
            </div>
            
            <div class="payment-info">
              <p><strong>Period:</strong> {{ selectedFee()?.type }}</p>
              <p><strong>Total Amount:</strong> {{ selectedFee()?.amount | currency:'INR' }}</p>
              <p><strong>Already Paid:</strong> {{ selectedFee()?.paidAmount | currency:'INR' }}</p>
              <p><strong>Balance Due:</strong> {{ selectedFee()?.dueAmount | currency:'INR' }}</p>
            </div>
            
            <form (ngSubmit)="recordPayment()">
              <div class="form-group">
                <label>Payment Amount *</label>
                <input type="number" class="form-input" [(ngModel)]="paymentForm.amount" name="amount" 
                       [max]="selectedFee()?.dueAmount" min="1" required />
                <div class="quick-btns">
                  <button type="button" class="btn btn-sm btn-secondary" (click)="setPaymentAmount('full')">Full Amount</button>
                  <button type="button" class="btn btn-sm btn-secondary" (click)="setPaymentAmount('half')">Half</button>
                </div>
              </div>
              
              <div class="form-group">
                <label>Payment Method *</label>
                <select class="form-select" [(ngModel)]="paymentForm.method" name="method" required>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online</option>
                </select>
              </div>
              
              <div class="form-group">
                <label>Transaction ID</label>
                <input type="text" class="form-input" [(ngModel)]="paymentForm.transactionId" name="transactionId" 
                       placeholder="Reference/Transaction ID (optional)" />
              </div>
              
              <div class="form-group">
                <label>Remarks</label>
                <input type="text" class="form-input" [(ngModel)]="paymentForm.remarks" name="remarks" 
                       placeholder="Payment remarks (optional)" />
              </div>
              
              <div class="form-actions">
                <button type="button" class="btn btn-secondary" (click)="closePaymentModal()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="processingPayment() || !paymentForm.amount">
                  @if (processingPayment()) { <span class="spinner"></span> }
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      }
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

    /* Exam Tab Styles */
    .exam-section { margin-bottom: var(--space-5); }
    .exam-section-title { font-size: var(--text-sm); font-weight: 600; margin-bottom: var(--space-3); display: flex; align-items: center; gap: var(--space-2); }
    .ongoing-title { color: #ef4444; }
    .upcoming-title { color: #3b82f6; }
    .completed-title { color: #22c55e; }
    .exam-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .exam-card-container { border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; transition: all 0.2s; }
    .exam-card-container:hover { border-color: var(--primary); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .exam-item { display: flex; gap: var(--space-4); padding: var(--space-3); cursor: pointer; transition: all 0.2s; }
    .exam-item.ongoing { border-left: 3px solid #ef4444; background: #fef2f2; }
    .exam-item.upcoming { border-left: 3px solid #3b82f6; }
    .exam-item.completed { border-left: 3px solid #22c55e; opacity: 0.85; }
    .exam-date-badge { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 50px; padding: var(--space-2); background: var(--primary); color: white; border-radius: var(--radius-md); }
    .exam-date-badge.completed-badge { background: #22c55e; }
    .exam-day { font-size: var(--text-xl); font-weight: 700; line-height: 1; }
    .exam-month { font-size: var(--text-xs); text-transform: uppercase; }
    .exam-details { flex: 1; }
    .exam-name { font-weight: 600; margin-bottom: 4px; }
    .exam-meta { display: flex; flex-wrap: wrap; gap: var(--space-2); font-size: var(--text-xs); color: var(--text-tertiary); }
    .exam-type-badge { background: var(--bg-secondary); padding: 2px 8px; border-radius: 8px; font-weight: 500; }
    .days-left { color: #3b82f6; font-weight: 500; }
    .exam-subjects-toggle { font-size: var(--text-xs); color: var(--primary); margin-top: 4px; font-weight: 500; cursor: pointer; }
    .view-results-link { font-size: var(--text-xs); color: var(--primary); font-weight: 500; margin-top: 4px; display: inline-block; }
    
    /* Expandable Schedule Detail */
    .exam-schedule-detail { background: var(--bg-secondary); padding: var(--space-4); border-top: 1px solid var(--border); animation: slideDown 0.2s ease; }
    @keyframes slideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 500px; } }
    .schedule-day { margin-bottom: var(--space-4); }
    .schedule-day:last-child { margin-bottom: 0; }
    .schedule-day-header { font-weight: 600; font-size: var(--text-sm); color: var(--primary); margin-bottom: var(--space-2); padding-bottom: var(--space-2); border-bottom: 1px dashed var(--border); }
    .schedule-slots { display: flex; flex-direction: column; gap: var(--space-2); }
    .schedule-slot { display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center; padding: var(--space-2) var(--space-3); background: var(--surface); border-radius: var(--radius-md); font-size: var(--text-sm); border: 1px solid var(--border); }
    .slot-time { font-weight: 500; color: var(--text-secondary); min-width: 120px; }
    .slot-subject { font-weight: 600; color: var(--text-primary); flex: 1; min-width: 150px; }
    .slot-room { color: var(--text-tertiary); font-size: var(--text-xs); }
    .slot-marks { color: var(--text-secondary); font-size: var(--text-xs); background: var(--bg-secondary); padding: 2px 8px; border-radius: 8px; }
    .slot-instructions { width: 100%; font-size: var(--text-xs); color: var(--text-tertiary); background: #fefce8; padding: 4px 8px; border-radius: 4px; margin-top: 4px; }
    
    /* Exam Overview Stats */
    .exam-overview { margin-bottom: var(--space-4); }
    .overview-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-3); margin-bottom: var(--space-3); }
    .overview-stat { display: flex; flex-direction: column; align-items: center; padding: var(--space-3); background: var(--surface); border-radius: var(--radius-md); border: 1px solid var(--border); text-align: center; }
    .stat-icon { font-size: var(--text-lg); margin-bottom: 4px; }
    .stat-value { font-size: var(--text-lg); font-weight: 700; color: var(--text-primary); }
    .stat-label { font-size: var(--text-xs); color: var(--text-tertiary); }
    .exam-description { font-size: var(--text-sm); color: var(--text-secondary); padding: var(--space-2) var(--space-3); background: #f0f9ff; border-radius: var(--radius-md); border-left: 3px solid #3b82f6; }
    .schedule-section-title { font-weight: 600; font-size: var(--text-sm); color: var(--text-primary); margin-bottom: var(--space-3); padding-bottom: var(--space-2); border-bottom: 1px solid var(--border); }
    .no-schedule { padding: var(--space-4); text-align: center; color: var(--text-tertiary); font-style: italic; }
    @media (max-width: 600px) { .overview-stats { grid-template-columns: repeat(2, 1fr); } }

    .grid { display: grid; gap: var(--space-4); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    @media (max-width: 900px) {
      .dashboard-grid { grid-template-columns: 1fr; }
      .quick-stats { grid-template-columns: repeat(2, 1fr); }
      .hero-content { flex-direction: column; align-items: center; text-align: center; }
    }
    
    /* Fee Styles */
    .fee-summary { display: flex; gap: var(--space-4); margin-bottom: var(--space-4); padding: var(--space-4); background: var(--surface); border-radius: var(--radius-md); border: 1px solid var(--border); }
    .fee-summary-item { display: flex; flex-direction: column; }
    .fee-label { font-size: var(--text-sm); color: var(--text-tertiary); }
    .fee-value { font-size: var(--text-xl); font-weight: 700; }
    .text-right { text-align: right; }
    .text-success { color: #22c55e; }
    .text-danger { color: #ef4444; }
    
    /* Payment Modal Styles */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: var(--surface); border-radius: var(--radius-lg); padding: var(--space-6); width: 100%; max-width: 450px; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--border); }
    .modal-header h2 { margin: 0; font-size: var(--text-xl); }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); }
    .payment-info { background: var(--bg-surface); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-4); }
    .payment-info p { margin: var(--space-1) 0; font-size: var(--text-sm); }
    .form-group { margin-bottom: var(--space-4); }
    .form-group label { display: block; font-weight: 500; margin-bottom: var(--space-1); font-size: var(--text-sm); }
    .form-input, .form-select { width: 100%; padding: var(--space-2) var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md); font-size: var(--text-base); }
    .quick-btns { display: flex; gap: var(--space-2); margin-top: var(--space-2); }
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border); }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; margin-right: 8px; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    /* Analytics Styles */
    .analytics-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-8); text-align: center; color: var(--text-tertiary); }
    .analytics-empty .empty-icon { font-size: 48px; margin-bottom: var(--space-3); opacity: 0.5; }
    .analytics-empty p { margin-bottom: var(--space-4); }
    
    .analytics-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-4); }
    .analytics-stat { display: flex; flex-direction: column; align-items: center; padding: var(--space-4); background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); text-align: center; }
    .analytics-stat.success { border-color: #22c55e; background: #f0fdf4; }
    .analytics-stat.danger { border-color: #ef4444; background: #fef2f2; }
    .analytics-stat-value { font-size: var(--text-2xl); font-weight: 700; color: var(--text-primary); }
    .analytics-stat.success .analytics-stat-value { color: #15803d; }
    .analytics-stat.danger .analytics-stat-value { color: #dc2626; }
    .analytics-stat-label { font-size: var(--text-sm); color: var(--text-tertiary); margin-top: 4px; }
    
    .subject-analytics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: var(--space-3); }
    .subject-analytics-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-3); }
    .subject-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); }
    .subject-name { font-weight: 600; color: var(--text-primary); }
    .trend-icon { font-size: var(--text-sm); padding: 2px 6px; border-radius: 4px; }
    .trend-icon.trend-up { color: #15803d; background: #dcfce7; }
    .trend-icon.trend-down { color: #dc2626; background: #fee2e2; }
    .trend-icon.trend-same { color: #6b7280; background: #f3f4f6; }
    .subject-avg { font-size: var(--text-lg); font-weight: 700; color: var(--primary); margin-bottom: var(--space-2); }
    .subject-range { display: flex; gap: var(--space-3); font-size: var(--text-sm); margin-bottom: var(--space-2); }
    .subject-range .high { color: #15803d; }
    .subject-range .low { color: #dc2626; }
    .subject-pass-rate { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-xs); color: var(--text-tertiary); }
    .progress-mini { flex: 1; height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden; min-width: 60px; }
    .progress-mini .progress-fill { height: 100%; background: #22c55e; border-radius: 3px; transition: width 0.3s; }
    
    .comparison-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-3); }
    .comparison-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); padding-bottom: var(--space-2); border-bottom: 1px solid var(--border); font-weight: 600; }
    .comparison-diff { padding: 2px 8px; border-radius: 4px; font-size: var(--text-sm); }
    .comparison-diff.positive { color: #15803d; background: #dcfce7; }
    .comparison-diff.negative { color: #dc2626; background: #fee2e2; }
    .comparison-subjects { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .comparison-subject { display: flex; align-items: center; gap: var(--space-2); padding: 4px 8px; background: var(--bg-secondary); border-radius: 4px; font-size: var(--text-sm); }
    .cs-name { color: var(--text-secondary); }
    .cs-current { font-weight: 600; color: var(--text-primary); }
    .cs-diff { font-weight: 500; }
    .cs-diff.positive { color: #15803d; }
    .cs-diff.negative { color: #dc2626; }
    .cs-diff.new { color: #3b82f6; }
    
    @media (max-width: 768px) {
      .analytics-summary { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class StudentDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

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
    { key: 'exams', icon: '📅', label: 'Exams' },
    { key: 'results', icon: '📝', label: 'Results' },
    { key: 'analytics', icon: '📊', label: 'Analytics' },
    { key: 'fees', icon: '💰', label: 'Fees' },
    { key: 'parents', icon: '👨‍👩‍👧', label: 'Parents' },
  ];
  loadingExams = signal(false);
  loadingAnalytics = signal(false);
  studentExams = signal<{ upcoming: any[]; ongoing: any[]; completed: any[] }>({ upcoming: [], ongoing: [], completed: [] });
  studentAnalytics = signal<any>(null);
  expandedExam = signal<string>('');
  subjects = signal<any[]>([]);
  subjectMap = signal<Map<string, string>>(new Map());
  loadingFees = signal(false);

  // Payment modal
  showPaymentModal = signal(false);
  selectedFee = signal<any>(null);
  processingPayment = signal(false);
  paymentForm = {
    amount: 0,
    method: 'cash',
    transactionId: '',
    remarks: '',
  };

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadStudent(id);
    this.loadEnrollmentHistory(id);
    this.loadStudentExams(id);
    this.loadSubjects();
    this.loadStudentFees(id);
  }

  loadStudentFees(studentId: string): void {
    this.loadingFees.set(true);
    // Get fees for the student - trying without academicYearId first to get all fees
    this.api.get<any>(`/fees`, { studentId, limit: 50 }).subscribe({
      next: (res) => {
        const data = res.data?.items || res.data?.data || res.data || [];
        const fees = Array.isArray(data) ? data : [];
        // Transform fee data for display
        const transformedFees = fees.map((fee: any) => ({
          _id: fee._id,
          type: fee.periodLabel || `${this.getMonthName(fee.month)} ${fee.year}` || 'Monthly Fee',
          amount: fee.totalAmount || 0,
          paidAmount: fee.paidAmount || 0,
          dueAmount: fee.dueAmount || fee.balanceAmount || 0,
          dueDate: fee.dueDate,
          status: fee.status || 'pending',
          components: fee.feeComponents || [],
        }));
        this.feeData.set(transformedFees);
        this.loadingFees.set(false);
      },
      error: () => {
        this.loadingFees.set(false);
      }
    });
  }

  private getMonthName(month: number): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  }

  loadSubjects(): void {
    this.api.get<any>('/subjects').subscribe({
      next: (res) => {
        const list = res.data?.data || res.data || [];
        this.subjects.set(list);
        const map = new Map<string, string>();
        list.forEach((s: any) => map.set(s._id, s.name || s.code || 'Subject'));
        this.subjectMap.set(map);
      },
      error: () => {}
    });
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

  loadStudentExams(studentId: string): void {
    this.loadingExams.set(true);
    this.api.get<any>(`/exams/student/${studentId}`).subscribe({
      next: (res) => {
        const data = res.data || res || {};
        this.studentExams.set({
          upcoming: data.upcoming || [],
          ongoing: data.ongoing || [],
          completed: data.completed || []
        });
        this.loadingExams.set(false);
      },
      error: () => {
        // Fallback: load exams by class if student endpoint fails
        const student = this.student();
        if (student?.currentClass) {
          const classId = typeof student.currentClass === 'object' 
            ? (student.currentClass as any)._id 
            : student.currentClass;
          const section = student.currentSection || '';
          this.loadExamsByClass(classId, section);
        } else {
          this.loadingExams.set(false);
        }
      }
    });
  }

  private loadExamsByClass(classId: string, section: string): void {
    const params: any = { limit: 50 };
    if (section) params.section = section;
    
    this.api.get<any>(`/exams/class/${classId}/section/${section || 'A'}`).subscribe({
      next: (res) => {
        const exams = res.data || [];
        const now = new Date();
        const upcoming: any[] = [];
        const ongoing: any[] = [];
        const completed: any[] = [];

        exams.forEach((exam: any) => {
          const start = new Date(exam.startDate);
          const end = new Date(exam.endDate);
          if (end < now) {
            completed.push(exam);
          } else if (start <= now && end >= now) {
            ongoing.push(exam);
          } else {
            upcoming.push(exam);
          }
        });

        upcoming.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        completed.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

        this.studentExams.set({ upcoming, ongoing, completed });
        this.loadingExams.set(false);
      },
      error: () => this.loadingExams.set(false)
    });
  }

  formatExamType(type: string): string {
    if (!type) return 'Exam';
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  getDaysUntil(date: string): number {
    if (!date) return 0;
    const target = new Date(date);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  toggleExamSchedule(examId: string): void {
    this.expandedExam.set(this.expandedExam() === examId ? '' : examId);
  }

  getGroupedSchedule(exam: any): { date: Date; slots: any[] }[] {
    if (!exam?.schedule?.length) return [];
    
    const grouped: { [date: string]: any[] } = {};
    exam.schedule.forEach((item: any) => {
      const dateKey = new Date(item.date).toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(item);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, slots]) => ({
        date: new Date(date),
        slots: slots.sort((a: any, b: any) => (a.startTime || '').localeCompare(b.startTime || ''))
      }));
  }

  getSubjectName(subject: any): string {
    if (!subject) return 'Unknown Subject';
    if (typeof subject === 'string') return subject;
    return subject.name || subject.code || 'Subject';
  }

  getScheduleSubjectName(slot: any): string {
    // 1. Try the denormalized subjectName field (best - no lookup needed)
    if (slot.subjectName) return slot.subjectName;
    
    // 2. Try populated subject object
    if (slot.subject && typeof slot.subject === 'object' && slot.subject.name) {
      return slot.subject.name;
    }
    
    // 3. Try lookup from subjects map by ID
    const subjectId = typeof slot.subject === 'string' ? slot.subject : slot.subject?._id;
    if (subjectId && this.subjectMap().has(subjectId)) {
      return this.subjectMap().get(subjectId) || 'Subject';
    }
    
    // 4. Fallback
    return 'Subject TBD';
  }

  getTotalMarks(exam: any): number {
    if (!exam?.schedule?.length) return 0;
    return exam.schedule.reduce((sum: number, slot: any) => sum + (slot.maxMarks || 0), 0);
  }

  getExamDays(exam: any): number {
    if (!exam?.startDate || !exam?.endDate) return 0;
    const start = new Date(exam.startDate);
    const end = new Date(exam.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  loadStudentAnalytics(): void {
    const studentId = this.student()?._id;
    if (!studentId) return;
    
    this.loadingAnalytics.set(true);
    this.api.get<any>(`/results/analytics/student/${studentId}`).subscribe({
      next: (res) => {
        const data = res.data || res;
        this.studentAnalytics.set(data);
        this.loadingAnalytics.set(false);
      },
      error: () => {
        this.studentAnalytics.set(null);
        this.loadingAnalytics.set(false);
      }
    });
  }

  getAnalyticsTrendIcon(trend: string): string {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  }

  getAnalyticsTrendClass(trend: string): string {
    switch (trend) {
      case 'improving': return 'trend-up';
      case 'declining': return 'trend-down';
      default: return 'trend-stable';
    }
  }

  getAnalyticsGradeBadge(grade: string): string {
    if (grade?.startsWith('A')) return 'badge-success';
    if (grade?.startsWith('B')) return 'badge-info';
    if (grade?.startsWith('C')) return 'badge-warning';
    return 'badge-danger';
  }

  // Fee helper methods
  getTotalFeeDue(): number {
    return this.feeData().reduce((sum, f) => sum + (f.dueAmount || 0), 0);
  }

  getTotalFeePaid(): number {
    return this.feeData().reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  }

  getFeeBadgeClass(status: string): string {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'partial': return 'badge-warning';
      case 'overdue': return 'badge-danger';
      case 'waived': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  // Payment modal methods
  openPaymentModal(fee: any): void {
    this.selectedFee.set(fee);
    this.paymentForm = {
      amount: fee.dueAmount || 0,
      method: 'cash',
      transactionId: '',
      remarks: '',
    };
    this.showPaymentModal.set(true);
  }

  closePaymentModal(): void {
    this.showPaymentModal.set(false);
    this.selectedFee.set(null);
  }

  setPaymentAmount(type: 'full' | 'half'): void {
    const fee = this.selectedFee();
    if (!fee) return;
    this.paymentForm.amount = type === 'full' ? fee.dueAmount : Math.floor(fee.dueAmount / 2);
  }

  recordPayment(): void {
    const fee = this.selectedFee();
    if (!fee || !this.paymentForm.amount) return;

    this.processingPayment.set(true);
    this.api.post(`/fees/${fee._id}/payment`, {
      amount: this.paymentForm.amount,
      method: this.paymentForm.method,
      transactionId: this.paymentForm.transactionId || undefined,
      remarks: this.paymentForm.remarks || undefined,
    }).subscribe({
      next: (res: any) => {
        this.processingPayment.set(false);
        this.toast.success(`Payment of ₹${this.paymentForm.amount} recorded successfully`);
        this.closePaymentModal();
        // Refresh fee data
        const studentId = this.student()?._id;
        if (studentId) {
          this.loadStudentFees(studentId);
        }
      },
      error: (err) => {
        this.processingPayment.set(false);
        this.toast.error(err?.error?.message || 'Failed to record payment');
      },
    });
  }
}

