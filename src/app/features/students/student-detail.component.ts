import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Student, Enrollment } from '../../core/models';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <!-- Elegant Header -->
    <header class="profile-header">
      <div class="header-left">
        <a routerLink="/students" class="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          <span>Students</span>
        </a>
      </div>
      @if (student()) {
        <div class="header-right">
          <a [routerLink]="['/students', student()!._id, 'analytics']" class="btn-outline">Analytics</a>
          <a [routerLink]="['/students', student()!._id, 'edit']" class="btn-primary">Edit Student</a>
        </div>
      }
    </header>

    @if (loading()) {
      <div class="loading-state">
        <div class="loader"></div>
        <p>Loading profile...</p>
      </div>
    } @else if (student()) {
      <!-- Profile Card -->
      <section class="profile-card fade-in">
        <div class="profile-main">
          <div class="avatar">
            <span class="avatar-initials">{{ student()!.firstName?.charAt(0) }}{{ student()!.lastName?.charAt(0) }}</span>
            <span class="status-indicator" [class]="'status-' + student()!.status"></span>
          </div>
          <div class="profile-info">
            <h1 class="name">{{ student()!.firstName }} {{ student()!.middleName || '' }} {{ student()!.lastName }}</h1>
            <p class="role">{{ getClassName(student()!.currentClass) }} @if (student()!.currentSection) { - Section {{ student()!.currentSection }} }</p>
            <div class="meta-row">
              @if (student()!.admissionNumber) {
                <span class="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {{ student()!.admissionNumber }}
                </span>
              }
              @if (student()!.rollNumber) {
                <span class="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  Roll #{{ student()!.rollNumber }}
                </span>
              }
              <span class="status-chip" [class]="'chip-' + student()!.status">{{ student()!.status | titlecase }}</span>
            </div>
          </div>
        </div>
        <div class="profile-stats">
          <div class="stat-item slide-up" style="--delay: 0.1s">
            <span class="stat-number">{{ yearsInSchool() }}</span>
            <span class="stat-label">Years</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item slide-up" style="--delay: 0.15s">
            <span class="stat-number">{{ enrollmentHistory().length }}</span>
            <span class="stat-label">Enrollments</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item slide-up" style="--delay: 0.2s">
            <span class="stat-number">{{ getPassCount() }}</span>
            <span class="stat-label">Passed</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item slide-up" style="--delay: 0.25s">
            <span class="stat-number">{{ getCurrentAcademicYear() }}</span>
            <span class="stat-label">Current Year</span>
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
            <div class="detail-row"><span class="detail-label">Full Name</span><span class="detail-value">{{ student()!.firstName }} {{ student()!.middleName || '' }} {{ student()!.lastName }}</span></div>
            <div class="detail-row"><span class="detail-label">Gender</span><span class="detail-value">{{ student()!.gender || '—' }}</span></div>
            <div class="detail-row"><span class="detail-label">Date of Birth</span><span class="detail-value">{{ student()!.dateOfBirth ? (student()!.dateOfBirth | date:'mediumDate') : '—' }}</span></div>
            <div class="detail-row"><span class="detail-label">Blood Group</span><span class="detail-value">{{ $any(student()).bloodGroup || '—' }}</span></div>
            <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">{{ student()!.email || $any(student()!.contact)?.email || '—' }}</span></div>
            <div class="detail-row"><span class="detail-label">Phone</span><span class="detail-value">{{ student()!.contact?.phone || '—' }}</span></div>
            <div class="detail-row"><span class="detail-label">Admission Date</span><span class="detail-value">{{ student()!.admissionDate ? (student()!.admissionDate | date:'mediumDate') : '—' }}</span></div>
            <div class="detail-row"><span class="detail-label">Admission No.</span><span class="detail-value highlight">{{ student()!.admissionNumber || '—' }}</span></div>
          </div>
        </section>

        <!-- Academic Journey -->
        <section class="content-card slide-up" style="--delay: 0.35s">
          <h2 class="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            Academic Journey
            <span class="badge">{{ enrollmentHistory().length }}</span>
          </h2>
          @if (enrollmentHistory().length > 0) {
            <div class="timeline">
              @for (e of enrollmentHistory(); track e._id; let i = $index; let last = $last) {
                <div class="timeline-item" [style.--delay]="(0.4 + i * 0.05) + 's'" [class.current]="e.status === 'active'">
                  <div class="timeline-marker" [class.last]="last">
                    <span class="marker-dot" [class]="'dot-' + (e.result || e.status)"></span>
                    @if (!last) { <span class="marker-line"></span> }
                  </div>
                  <div class="timeline-content">
                    <div class="timeline-header">
                      <h4>{{ getClassName(e.class) }}</h4>
                      @if (e.status === 'active') { <span class="current-badge">CURRENT</span> }
                    </div>
                    <p class="timeline-year">{{ getAcademicYearName(e.academicYear) }} @if (e.section) { - Section {{ e.section }} }</p>
                    <div class="timeline-meta">
                      @if (e.rollNumber) { <span class="meta-chip">Roll #{{ e.rollNumber }}</span> }
                      @if (e.result) { <span class="result-chip" [class]="'result-' + e.result">{{ e.result | titlecase }}</span> }
                      @if (e.percentage) { <span class="meta-chip">{{ e.percentage }}%</span> }
                    </div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <p>No enrollment history found</p>
              <a routerLink="/enrollments" class="link-btn">Enroll Student</a>
            </div>
          }
        </section>
      </div>

      <!-- Tab Section -->
      <section class="tab-section slide-up" style="--delay: 0.4s">
        <div class="tab-bar">
          @for (tab of tabs; track tab.key) {
            <button class="tab-btn" [class.active]="activeTab() === tab.key" (click)="activeTab.set(tab.key)">
              <span class="tab-icon">{{ tab.icon }}</span>
              <span class="tab-label">{{ tab.label }}</span>
            </button>
          }
        </div>

        <div class="tab-content">
          @switch (activeTab()) {
            @case ('attendance') {
              <div class="tab-panel">
                <h3 class="panel-title">Attendance Summary</h3>
                @if (attendanceData().length > 0) {
                  <div class="mini-stats">
                    @for (a of attendanceData(); track a.label) {
                      <div class="mini-stat">
                        <span class="mini-value" [style.color]="a.color">{{ a.value }}</span>
                        <span class="mini-label">{{ a.label }}</span>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="tab-empty">No attendance data available yet.</p>
                }
              </div>
            }
            @case ('exams') {
              <div class="tab-panel">
                <h3 class="panel-title">Upcoming Exams</h3>
                @if (loadingExams()) {
                  <div class="loading-inline"><div class="loader-sm"></div></div>
                } @else if (studentExams().upcoming.length > 0) {
                  <div class="exams-list">
                    @for (exam of studentExams().upcoming; track exam._id) {
                      <div class="exam-card">
                        <div class="exam-header">
                          <span class="exam-name">{{ exam.name }}</span>
                          <span class="exam-type">{{ formatExamType(exam.examType || exam.type) }}</span>
                        </div>
                        <div class="exam-info">
                          <span class="exam-date">{{ exam.startDate | date:'mediumDate' }}</span>
                          <span class="exam-countdown" [class.urgent]="getDaysUntil(exam.startDate) <= 3">
                            {{ getDaysUntil(exam.startDate) }} days left
                          </span>
                        </div>
                        @if (exam.schedule?.length) {
                          <button class="toggle-btn" (click)="toggleExamSchedule(exam._id)">
                            {{ expandedExam() === exam._id ? 'Hide' : 'View' }} Schedule
                          </button>
                          @if (expandedExam() === exam._id) {
                            <div class="schedule-details">
                              @for (group of getGroupedSchedule(exam); track group.date) {
                                <div class="schedule-day">
                                  <span class="day-label">{{ group.date | date:'EEE, MMM d' }}</span>
                                  @for (slot of group.slots; track slot) {
                                    <div class="slot-item">
                                      <span class="slot-time">{{ slot.startTime }} - {{ slot.endTime }}</span>
                                      <span class="slot-subject">{{ getScheduleSubjectName(slot) }}</span>
                                      <span class="slot-marks">{{ slot.maxMarks }} marks</span>
                                    </div>
                                  }
                                </div>
                              }
                            </div>
                          }
                        }
                      </div>
                    }
                  </div>
                } @else {
                  <p class="tab-empty">No upcoming exams.</p>
                }
              </div>
            }
            @case ('results') {
              <div class="tab-panel">
                <div class="panel-header">
                  <h3 class="panel-title">Exam Results</h3>
                  <div class="header-actions">
                    @if (examsForResults().length > 0) {
                      <select class="form-select-sm" [ngModel]="selectedExamForResults()" (ngModelChange)="onExamSelectForResults($event)">
                        <option value="">Select Exam</option>
                        @for (exam of examsForResults(); track exam._id) {
                          <option [value]="exam._id">{{ exam.name }}</option>
                        }
                      </select>
                      @if (selectedExamForResults()) {
                        <a [routerLink]="['/results/report-card', student()!._id]" [queryParams]="{examId: selectedExamForResults()}" class="btn-sm">📄 Report Card</a>
                      }
                    }
                  </div>
                </div>
                @if (loadingExams()) {
                  <div class="loading-inline"><div class="loader-sm"></div></div>
                } @else if (examsForResults().length === 0) {
                  <div class="empty-state-sm">
                    <p>📚 No exams found. Create exams first to view results.</p>
                  </div>
                } @else if (loadingResults()) {
                  <div class="loading-inline"><div class="loader-sm"></div></div>
                } @else if (!selectedExamForResults()) {
                  <div class="empty-state-sm">
                    <p>📝 Select an exam above to view results</p>
                  </div>
                } @else if (resultsData().length > 0) {
                  <div class="results-summary">
                    <div class="summary-stat"><span class="stat-val">{{ getResultsSummary().percentage.toFixed(1) }}%</span><span class="stat-lbl">Overall</span></div>
                    <div class="summary-stat"><span class="stat-val">{{ getResultsSummary().obtained }}/{{ getResultsSummary().max }}</span><span class="stat-lbl">Total Marks</span></div>
                    <div class="summary-stat" [class.success]="getResultsSummary().passed" [class.danger]="!getResultsSummary().passed">
                      <span class="stat-val">{{ getResultsSummary().passed ? 'Pass' : 'Fail' }}</span>
                      <span class="stat-lbl">Status</span>
                    </div>
                  </div>
                  <table class="data-table">
                    <thead><tr><th>Subject</th><th>Marks</th><th>Percentage</th><th>Grade</th><th>Status</th></tr></thead>
                    <tbody>
                      @for (r of resultsData(); track r) {
                        <tr>
                          <td>{{ r.subjectName }}</td>
                          <td>{{ r.obtained }}/{{ r.max }}</td>
                          <td>{{ r.percentage?.toFixed(1) || ((r.obtained / r.max) * 100).toFixed(1) }}%</td>
                          <td><span class="grade-badge">{{ r.grade }}</span></td>
                          <td><span class="status-chip" [class.pass]="r.isPassed" [class.fail]="!r.isPassed">{{ r.isPassed ? 'Pass' : 'Fail' }}</span></td>
                        </tr>
                      }
                    </tbody>
                  </table>
                } @else {
                  <p class="tab-empty">No results found for this exam.</p>
                }
              </div>
            }
            @case ('analytics') {
              <div class="tab-panel">
                <div class="panel-header">
                  <h3 class="panel-title">Performance Analytics</h3>
                  <button class="btn-sm" (click)="loadStudentAnalytics()">Refresh</button>
                </div>
                @if (loadingAnalytics()) {
                  <div class="loading-inline"><div class="loader-sm"></div></div>
                } @else if (!studentAnalytics()) {
                  <div class="empty-state-sm">
                    <p>Click refresh to load analytics</p>
                    <button class="btn-primary-sm" (click)="loadStudentAnalytics()">Load Analytics</button>
                  </div>
                } @else {
                  <div class="analytics-summary">
                    <div class="analytics-stat"><span class="stat-val">{{ studentAnalytics()?.summary?.totalExams || 0 }}</span><span class="stat-lbl">Exams</span></div>
                    <div class="analytics-stat"><span class="stat-val">{{ studentAnalytics()?.summary?.averagePercentage?.toFixed(1) || 0 }}%</span><span class="stat-lbl">Average</span></div>
                    <div class="analytics-stat success"><span class="stat-val">{{ studentAnalytics()?.summary?.passedExams || 0 }}</span><span class="stat-lbl">Passed</span></div>
                    <div class="analytics-stat danger"><span class="stat-val">{{ studentAnalytics()?.summary?.failedExams || 0 }}</span><span class="stat-lbl">Failed</span></div>
                  </div>
                  @if (studentAnalytics()?.subjectAnalysis?.length) {
                    <h4 class="subsection-title">Subject Performance</h4>
                    <div class="subject-cards">
                      @for (sub of studentAnalytics()?.subjectAnalysis || []; track sub.subjectId) {
                        <div class="subject-card">
                          <div class="subj-header"><span class="subj-name">{{ sub.subjectName }}</span><span class="subj-trend" [class]="getAnalyticsTrendClass(sub.trend)">{{ getAnalyticsTrendIcon(sub.trend) }}</span></div>
                          <div class="subj-avg">{{ sub.averagePercentage?.toFixed(1) }}%</div>
                          <div class="subj-range"><span>High: {{ sub.highestPercentage?.toFixed(0) }}%</span><span>Low: {{ sub.lowestPercentage?.toFixed(0) }}%</span></div>
                        </div>
                      }
                    </div>
                  }
                }
              </div>
            }
            @case ('fees') {
              <div class="tab-panel">
                <h3 class="panel-title">Fee Details</h3>
                @if (loadingFees()) {
                  <div class="loading-inline"><div class="loader-sm"></div></div>
                } @else if (feeData().length > 0) {
                  <div class="fee-summary">
                    <div class="fee-stat"><span class="fee-val">₹{{ getTotalFeePaid() | number }}</span><span class="fee-lbl">Paid</span></div>
                    <div class="fee-stat danger"><span class="fee-val">₹{{ getTotalFeeDue() | number }}</span><span class="fee-lbl">Due</span></div>
                  </div>
                  <div class="fee-list">
                    @for (fee of feeData(); track fee._id) {
                      <div class="fee-item">
                        <div class="fee-info">
                          <span class="fee-type">{{ fee.type }}</span>
                          <span class="fee-status" [class]="'status-' + fee.status">{{ fee.status | titlecase }}</span>
                        </div>
                        <div class="fee-amounts">
                          <span class="fee-amount">₹{{ fee.amount | number }}</span>
                          @if (fee.dueAmount > 0) {
                            <button class="pay-btn" (click)="openPaymentModal(fee)">Pay ₹{{ fee.dueAmount | number }}</button>
                          }
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="tab-empty">No fee records found.</p>
                }
              </div>
            }
            @case ('parents') {
              <div class="tab-panel">
                <h3 class="panel-title">Parent/Guardian Information</h3>
                @if (parents().length > 0) {
                  <div class="parents-list">
                    @for (p of parents(); track p._id) {
                      <div class="parent-card">
                        <div class="parent-avatar">{{ getInitials(p) }}</div>
                        <div class="parent-info">
                          <span class="parent-name">{{ p.firstName }} {{ p.lastName }}</span>
                          <span class="parent-relation">{{ p.relation || 'Guardian' }}</span>
                          @if (p.phone) { <span class="parent-contact">{{ p.phone }}</span> }
                          @if (p.email) { <span class="parent-contact">{{ p.email }}</span> }
                        </div>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="tab-empty">No parent information available.</p>
                }
              </div>
            }
          }
        </div>
      </section>
    }

    <!-- Payment Modal -->
    @if (showPaymentModal()) {
      <div class="modal-backdrop" (click)="closePaymentModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Record Payment</h3>
            <button class="modal-close" (click)="closePaymentModal()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Amount</label>
              <input type="number" [(ngModel)]="paymentForm.amount" class="form-input">
              <div class="quick-amounts">
                <button (click)="setPaymentAmount('full')">Full (₹{{ selectedFee()?.dueAmount }})</button>
                <button (click)="setPaymentAmount('half')">Half</button>
              </div>
            </div>
            <div class="form-group">
              <label>Payment Method</label>
              <select [(ngModel)]="paymentForm.method" class="form-input">
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <div class="form-group">
              <label>Transaction ID (optional)</label>
              <input type="text" [(ngModel)]="paymentForm.transactionId" class="form-input">
            </div>
            <div class="form-group">
              <label>Remarks (optional)</label>
              <textarea [(ngModel)]="paymentForm.remarks" class="form-input" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closePaymentModal()">Cancel</button>
            <button class="btn-confirm" (click)="recordPayment()" [disabled]="processingPayment()">
              {{ processingPayment() ? 'Processing...' : 'Confirm Payment' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* ===== CSS Variables (from global theme) ===== */
    :host {
      --accent: var(--primary, #2563eb);
      --accent-light: var(--primary-hover, #eff6ff);
      --success: #22c55e;
      --success-light: #dcfce7;
      --danger: #ef4444;
      --danger-light: #fee2e2;
      --warning: #f59e0b;
      --warning-light: #fef3c7;
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

    :host-context(.dark) {
      --success-light: rgba(34, 197, 94, 0.15);
      --danger-light: rgba(239, 68, 68, 0.15);
      --warning-light: rgba(245, 158, 11, 0.15);
    }

    /* ===== Animations ===== */
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    .fade-in { animation: fadeIn 0.4s ease forwards; }
    .slide-up { animation: slideUp 0.5s ease forwards; animation-delay: var(--delay, 0s); opacity: 0; }

    /* ===== Header ===== */
    .profile-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 0; margin-bottom: 24px; }
    .back-link { display: inline-flex; align-items: center; gap: 8px; color: var(--text-secondary); text-decoration: none; font-size: 14px; font-weight: 500; transition: color var(--transition); }
    .back-link:hover { color: var(--text-primary); }
    .back-link:hover svg { transform: translateX(-4px); }
    .back-link svg { transition: transform var(--transition); }
    .header-right { display: flex; gap: 12px; }
    .btn-outline { padding: 10px 20px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-primary); color: var(--text-primary); font-size: 14px; font-weight: 500; text-decoration: none; transition: all var(--transition); }
    .btn-outline:hover { border-color: var(--accent); color: var(--accent); }
    .btn-primary { padding: 10px 20px; border-radius: 8px; border: none; background: var(--accent); color: white; font-size: 14px; font-weight: 500; text-decoration: none; transition: all var(--transition); }
    .btn-primary:hover { background: #1d4ed8; }

    /* ===== Loading ===== */
    .loading-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 0; color: var(--text-muted); }
    .loader { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; margin-bottom: 16px; }
    .loader-sm { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
    .loading-inline { display: flex; justify-content: center; padding: 40px; }

    /* ===== Profile Card ===== */
    .profile-card { background: var(--bg-primary); border-radius: var(--radius); border: 1px solid var(--border); padding: 32px; margin-bottom: 24px; box-shadow: var(--shadow-sm); }
    .profile-main { display: flex; align-items: center; gap: 24px; margin-bottom: 32px; }
    .avatar { position: relative; width: 88px; height: 88px; border-radius: 50%; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .avatar-initials { color: white; font-size: 28px; font-weight: 600; letter-spacing: 1px; }
    .status-indicator { position: absolute; bottom: 4px; right: 4px; width: 16px; height: 16px; border-radius: 50%; background: #9ca3af; border: 3px solid var(--bg-primary); }
    .status-indicator.status-active { background: #22c55e; }
    .status-indicator.status-graduated { background: #3b82f6; }
    .status-indicator.status-transferred { background: #f59e0b; }
    .status-indicator.status-inactive { background: #ef4444; }

    .profile-info { flex: 1; }
    .name { font-size: 28px; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; letter-spacing: -0.5px; }
    .role { font-size: 16px; color: var(--text-secondary); margin: 0 0 12px; }
    .meta-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
    .meta-item { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); }
    .meta-item svg { stroke: var(--text-muted); }
    .status-chip { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: var(--success-light); color: #166534; }
    .status-chip.chip-active { background: var(--success-light); color: #166534; }
    .status-chip.chip-inactive { background: var(--danger-light); color: #991b1b; }
    .status-chip.chip-graduated { background: var(--accent-light); color: var(--accent); }

    .profile-stats { display: flex; align-items: center; justify-content: center; padding-top: 24px; border-top: 1px solid var(--border); }
    .stat-item { text-align: center; padding: 0 32px; }
    .stat-number { display: block; font-size: 28px; font-weight: 700; color: var(--text-primary); line-height: 1; }
    .stat-label { display: block; font-size: 13px; color: var(--text-muted); margin-top: 4px; }
    .stat-divider { width: 1px; height: 40px; background: var(--border); }

    /* ===== Content Grid ===== */
    .content-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-bottom: 24px; }
    .content-card { background: var(--bg-primary); border-radius: var(--radius); border: 1px solid var(--border); padding: 24px; box-shadow: var(--shadow-sm); transition: box-shadow var(--transition); }
    .content-card:hover { box-shadow: var(--shadow-md); }
    .section-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0 0 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
    .section-title svg { stroke: var(--accent); }
    .section-title .badge { margin-left: auto; background: var(--accent-light); color: var(--accent); font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 12px; }

    /* ===== Details List ===== */
    .details-list { display: flex; flex-direction: column; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border); }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { font-size: 14px; color: var(--text-muted); }
    .detail-value { font-size: 14px; color: var(--text-primary); font-weight: 500; }
    .detail-value.highlight { background: var(--bg-secondary); padding: 4px 12px; border-radius: 6px; font-family: 'SF Mono', monospace; font-size: 13px; }

    /* ===== Timeline ===== */
    .timeline { display: flex; flex-direction: column; max-height: 400px; overflow-y: auto; }
    .timeline-item { display: flex; gap: 16px; animation: slideUp 0.4s ease forwards; animation-delay: var(--delay, 0s); opacity: 0; }
    .timeline-item.current .timeline-content { border-color: var(--accent); background: var(--accent-light); }
    .timeline-marker { display: flex; flex-direction: column; align-items: center; width: 20px; }
    .marker-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
    .marker-dot.dot-pass, .marker-dot.dot-promoted { background: var(--success); }
    .marker-dot.dot-fail, .marker-dot.dot-retained { background: var(--danger); }
    .marker-dot.dot-active { background: var(--accent); box-shadow: 0 0 0 4px var(--accent-light); }
    .marker-line { flex: 1; width: 2px; background: var(--border); margin-top: 8px; }
    .timeline-content { flex: 1; padding: 16px; background: var(--bg-secondary); border-radius: 10px; border: 1px solid transparent; margin-bottom: 12px; }
    .timeline-header { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
    .timeline-header h4 { margin: 0; font-size: 15px; font-weight: 600; color: var(--text-primary); }
    .current-badge { background: var(--accent); color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; }
    .timeline-year { font-size: 13px; color: var(--text-secondary); margin: 0 0 8px; }
    .timeline-meta { display: flex; gap: 8px; flex-wrap: wrap; }
    .meta-chip { background: var(--bg-primary); border: 1px solid var(--border); padding: 2px 10px; border-radius: 6px; font-size: 12px; color: var(--text-secondary); }
    .result-chip { padding: 2px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .result-chip.result-pass, .result-chip.result-promoted { background: var(--success-light); color: #166534; }
    .result-chip.result-fail, .result-chip.result-retained { background: var(--danger-light); color: #991b1b; }

    /* ===== Empty State ===== */
    .empty-state { display: flex; flex-direction: column; align-items: center; padding: 40px; text-align: center; color: var(--text-muted); }
    .empty-state svg { margin-bottom: 12px; stroke: var(--border); }
    .empty-state p { margin: 0 0 16px; font-size: 14px; }
    .link-btn { color: var(--accent); text-decoration: none; font-weight: 500; }
    .link-btn:hover { text-decoration: underline; }
    .empty-state-sm { text-align: center; padding: 24px; }
    .empty-state-sm p { color: var(--text-muted); margin-bottom: 12px; }

    /* ===== Tab Section ===== */
    .tab-section { background: var(--bg-primary); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; }
    .tab-bar { display: flex; border-bottom: 1px solid var(--border); overflow-x: auto; }
    .tab-btn { display: flex; align-items: center; gap: 8px; padding: 16px 24px; background: none; border: none; cursor: pointer; font-size: 14px; font-weight: 500; color: var(--text-secondary); border-bottom: 2px solid transparent; transition: all var(--transition); white-space: nowrap; }
    .tab-btn:hover { color: var(--text-primary); background: var(--bg-secondary); }
    .tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }
    .tab-icon { font-size: 16px; }
    .tab-content { padding: 24px; }
    .tab-panel { animation: fadeIn 0.3s ease; }
    .panel-title { font-size: 16px; font-weight: 600; margin: 0 0 16px; color: var(--text-primary); }
    .panel-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .btn-sm { padding: 8px 16px; border-radius: 6px; background: var(--accent); color: white; border: none; font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none; }
    .btn-sm:hover { background: #1d4ed8; }
    .btn-primary-sm { padding: 8px 16px; border-radius: 6px; background: var(--accent); color: white; border: none; font-size: 13px; cursor: pointer; }
    .tab-empty { color: var(--text-muted); text-align: center; padding: 24px; }
    .subsection-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 24px 0 12px; }

    /* ===== Mini Stats ===== */
    .mini-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; }
    .mini-stat { text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: 10px; }
    .mini-value { display: block; font-size: 24px; font-weight: 700; }
    .mini-label { display: block; font-size: 12px; color: var(--text-muted); margin-top: 4px; }

    /* ===== Exams List ===== */
    .exams-list { display: flex; flex-direction: column; gap: 12px; }
    .exam-card { padding: 16px; background: var(--bg-secondary); border-radius: 10px; border: 1px solid var(--border); }
    .exam-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .exam-name { font-weight: 600; color: var(--text-primary); }
    .exam-type { background: var(--accent-light); color: var(--accent); padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .exam-info { display: flex; gap: 16px; font-size: 13px; color: var(--text-secondary); }
    .exam-countdown { font-weight: 600; }
    .exam-countdown.urgent { color: var(--danger); }
    .toggle-btn { margin-top: 12px; padding: 8px 12px; border: 1px solid var(--border); background: var(--bg-primary); border-radius: 6px; font-size: 12px; cursor: pointer; }
    .toggle-btn:hover { border-color: var(--accent); color: var(--accent); }
    .schedule-details { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border); }
    .schedule-day { margin-bottom: 12px; }
    .day-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); display: block; margin-bottom: 8px; }
    .slot-item { display: flex; gap: 16px; padding: 8px 12px; background: var(--bg-primary); border-radius: 6px; margin-bottom: 4px; font-size: 13px; }
    .slot-time { color: var(--text-muted); min-width: 100px; }
    .slot-subject { flex: 1; font-weight: 500; color: var(--text-primary); }
    .slot-marks { color: var(--text-secondary); }

    /* ===== Data Table ===== */
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: 12px; text-align: left; border-bottom: 1px solid var(--border); }
    .data-table th { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; background: var(--bg-secondary); }
    .data-table td { font-size: 14px; color: var(--text-primary); }
    .grade-badge { background: var(--success-light); color: #166534; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    
    /* ===== Results Tab ===== */
    .header-actions { display: flex; gap: 12px; align-items: center; }
    .form-select-sm { padding: 6px 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 13px; background: var(--bg-primary); min-width: 180px; }
    .results-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
    .summary-stat { text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: 10px; }
    .summary-stat.success { background: var(--success-light); }
    .summary-stat.danger { background: var(--danger-light); }
    .summary-stat .stat-val { display: block; font-size: 20px; font-weight: 700; color: var(--text-primary); }
    .summary-stat.success .stat-val { color: #166534; }
    .summary-stat.danger .stat-val { color: #991b1b; }
    .summary-stat .stat-lbl { display: block; font-size: 12px; color: var(--text-muted); margin-top: 4px; }
    .status-chip { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .status-chip.pass { background: var(--success-light); color: #166534; }
    .status-chip.fail { background: var(--danger-light); color: #991b1b; }
    .empty-state-sm { text-align: center; padding: 32px; color: var(--text-muted); }

    /* ===== Analytics ===== */
    .analytics-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .analytics-stat { text-align: center; padding: 16px; background: var(--bg-secondary); border-radius: 10px; }
    .analytics-stat.success { background: var(--success-light); }
    .analytics-stat.danger { background: var(--danger-light); }
    .stat-val { display: block; font-size: 24px; font-weight: 700; color: var(--text-primary); }
    .analytics-stat.success .stat-val { color: #166534; }
    .analytics-stat.danger .stat-val { color: #991b1b; }
    .stat-lbl { display: block; font-size: 12px; color: var(--text-muted); margin-top: 4px; }
    .subject-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
    .subject-card { padding: 16px; background: var(--bg-secondary); border-radius: 10px; border: 1px solid var(--border); }
    .subj-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .subj-name { font-weight: 600; color: var(--text-primary); }
    .subj-trend { font-size: 14px; }
    .subj-trend.trend-up { color: var(--success); }
    .subj-trend.trend-down { color: var(--danger); }
    .subj-avg { font-size: 24px; font-weight: 700; color: var(--accent); margin-bottom: 8px; }
    .subj-range { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); }

    /* ===== Fees ===== */
    .fee-summary { display: flex; gap: 24px; margin-bottom: 24px; }
    .fee-stat { flex: 1; text-align: center; padding: 20px; background: var(--success-light); border-radius: 10px; }
    .fee-stat.danger { background: var(--danger-light); }
    .fee-val { display: block; font-size: 24px; font-weight: 700; color: #166534; }
    .fee-stat.danger .fee-val { color: #991b1b; }
    .fee-lbl { display: block; font-size: 12px; color: var(--text-muted); margin-top: 4px; }
    .fee-list { display: flex; flex-direction: column; gap: 12px; }
    .fee-item { display: flex; justify-content: space-between; align-items: center; padding: 16px; background: var(--bg-secondary); border-radius: 10px; }
    .fee-info { display: flex; align-items: center; gap: 12px; }
    .fee-type { font-weight: 600; color: var(--text-primary); }
    .fee-status { padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .fee-status.status-paid { background: var(--success-light); color: #166534; }
    .fee-status.status-pending { background: var(--warning-light); color: #92400e; }
    .fee-status.status-overdue { background: var(--danger-light); color: #991b1b; }
    .fee-status.status-partial { background: var(--warning-light); color: #92400e; }
    .fee-amounts { display: flex; align-items: center; gap: 16px; }
    .fee-amount { font-weight: 600; color: var(--text-primary); }
    .pay-btn { padding: 8px 16px; border-radius: 6px; background: var(--accent); color: white; border: none; font-size: 13px; font-weight: 500; cursor: pointer; }
    .pay-btn:hover { background: #1d4ed8; }

    /* ===== Parents ===== */
    .parents-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .parent-card { display: flex; gap: 16px; padding: 16px; background: var(--bg-secondary); border-radius: 10px; }
    .parent-avatar { width: 48px; height: 48px; border-radius: 50%; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; flex-shrink: 0; }
    .parent-info { display: flex; flex-direction: column; gap: 4px; }
    .parent-name { font-weight: 600; color: var(--text-primary); }
    .parent-relation { font-size: 12px; color: var(--accent); font-weight: 500; }
    .parent-contact { font-size: 13px; color: var(--text-secondary); }

    /* ===== Modal ===== */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s ease; }
    .modal-content { background: var(--bg-primary); border-radius: var(--radius); width: 100%; max-width: 400px; box-shadow: var(--shadow-lg); animation: slideUp 0.3s ease; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border); }
    .modal-header h3 { margin: 0; font-size: 18px; }
    .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-muted); }
    .modal-body { padding: 24px; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; font-size: 14px; font-weight: 500; color: var(--text-primary); margin-bottom: 8px; }
    .form-input { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; font-size: 14px; }
    .form-input:focus { outline: none; border-color: var(--accent); }
    .quick-amounts { display: flex; gap: 8px; margin-top: 8px; }
    .quick-amounts button { flex: 1; padding: 8px; border: 1px solid var(--border); background: var(--bg-secondary); border-radius: 6px; font-size: 12px; cursor: pointer; }
    .quick-amounts button:hover { border-color: var(--accent); }
    .modal-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid var(--border); }
    .btn-cancel { padding: 10px 20px; border: 1px solid var(--border); background: var(--bg-primary); border-radius: 8px; cursor: pointer; }
    .btn-confirm { padding: 10px 20px; border: none; background: var(--accent); color: white; border-radius: 8px; cursor: pointer; }
    .btn-confirm:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ===== Responsive ===== */
    @media (max-width: 900px) {
      .content-grid { grid-template-columns: 1fr; }
      .analytics-summary { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .profile-main { flex-direction: column; text-align: center; }
      .meta-row { justify-content: center; }
      .profile-stats { flex-wrap: wrap; gap: 16px; }
      .stat-divider { display: none; }
      .stat-item { padding: 16px; flex: 1; min-width: 80px; }
      .profile-header { flex-direction: column; gap: 16px; align-items: flex-start; }
      .header-right { width: 100%; }
      .tab-btn { padding: 12px 16px; }
      .fee-summary { flex-direction: column; }
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
  
  // Results tab state
  selectedExamForResults = signal<string>('');
  loadingResults = signal(false);
  examsForResults = signal<any[]>([]);

  tabs = [
    { key: 'attendance', icon: '📋', label: 'Attendance' },
    { key: 'exams', icon: '📅', label: 'Exams' },
    { key: 'results', icon: '📝', label: 'Results' },
    { key: 'analytics', icon: '📊', label: 'Analytics' },
    { key: 'fees', icon: '💰', label: 'Fees' },
    { key: 'parents', icon: '👨‍👩‍👧', label: 'Parents' },
  ];
  loadingExams = signal(true);
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
    this.loadSubjects();
    this.loadStudentFees(id);
  }

  loadStudentFees(studentId: string): void {
    this.loadingFees.set(true);
    this.api.get<any>(`/fees`, { studentId, limit: 50 }).subscribe({
      next: (res) => {
        const data = res.data?.items || res.data?.data || res.data || [];
        const fees = Array.isArray(data) ? data : [];
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
      error: () => this.loadingFees.set(false)
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
        if (data.parents && Array.isArray(data.parents)) {
          this.parents.set(data.parents.filter((p: any) => typeof p === 'object'));
        }
        this.loading.set(false);
        // Load exams after student data is available (need currentClass info)
        this.loadStudentExams(id);
      },
      error: () => {
        this.loading.set(false);
        // Still try to load exams even on error
        this.loadStudentExams(id);
      },
    });
  }

  loadEnrollmentHistory(studentId: string): void {
    this.api.get<any>(`/enrollments/student/${studentId}/history`).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || {};
        const enrollments = data.enrollments || data || [];
        this.enrollmentHistory.set(Array.isArray(enrollments) ? enrollments : []);
      },
      error: () => {}
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
    return this.enrollmentHistory().filter(e => e.result === 'pass' || e.result === 'promoted').length;
  }

  getCurrentAcademicYear(): string {
    const s = this.student();
    if (!s?.currentAcademicYear) return '-';
    if (typeof s.currentAcademicYear === 'object') return (s.currentAcademicYear as any).name || '-';
    const active = this.enrollmentHistory().find(e => e.status === 'active');
    if (active) return this.getAcademicYearName(active.academicYear);
    return '-';
  }

  getClassName(c: any): string {
    if (!c) return '-';
    if (typeof c === 'object') return c.name || '-';
    return 'Class';
  }

  getAcademicYearName(ay: any): string {
    if (!ay) return '-';
    if (typeof ay === 'object') return ay.name || '-';
    return 'Academic Year';
  }

  getInitials(p: any): string {
    if (!p) return '?';
    return `${p.firstName?.charAt(0) || ''}${p.lastName?.charAt(0) || ''}`;
  }

  loadStudentExams(studentId: string): void {
    this.loadingExams.set(true);
    console.log('[StudentDetail] Loading exams for student:', studentId);
    
    // Simply load all exams - more reliable
    this.api.get<any>('/exams', { limit: 100 }).pipe(
      finalize(() => {
        console.log('[StudentDetail] finalize: setting loadingExams to false');
        this.loadingExams.set(false);
      })
    ).subscribe({
      next: (res) => {
        console.log('[StudentDetail] Exams API response:', res);
        // Handle various response structures
        let exams: any[] = [];
        if (Array.isArray(res)) {
          exams = res;
        } else if (Array.isArray(res.data)) {
          exams = res.data;
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          exams = res.data.data;
        } else if (res.data?.items && Array.isArray(res.data.items)) {
          exams = res.data.items;
        }
        console.log('[StudentDetail] Parsed exams:', exams.length, 'exams');
        
        // Filter by student's class if available
        const student = this.student();
        let filteredExams = exams;
        if (student?.currentClass && exams.length > 0) {
          const classId = typeof student.currentClass === 'object' ? (student.currentClass as any)._id : student.currentClass;
          const classFiltered = exams.filter((e: any) => {
            const examClasses = (e.classes || []).map((c: any) => c._id || c);
            return examClasses.includes(classId) || examClasses.length === 0;
          });
          // Only use filtered list if it has results
          if (classFiltered.length > 0) {
            filteredExams = classFiltered;
          }
        }
        
        this.categorizeExams(filteredExams);
      },
      error: (err) => {
        console.error('[StudentDetail] Error loading exams:', err);
        this.studentExams.set({ upcoming: [], ongoing: [], completed: [] });
        this.examsForResults.set([]);
      }
    });
  }
  
  private categorizeExams(exams: any[]): void {
    console.log('[StudentDetail] categorizeExams called with', exams.length, 'exams');
    const now = new Date();
    const upcoming: any[] = [], ongoing: any[] = [], completed: any[] = [];
    exams.forEach((exam: any) => {
      const start = new Date(exam.startDate), end = new Date(exam.endDate);
      if (end < now) completed.push(exam);
      else if (start <= now && end >= now) ongoing.push(exam);
      else upcoming.push(exam);
    });
    upcoming.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    completed.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    this.studentExams.set({ upcoming, ongoing, completed });
    // Set ALL exams for results tab (completed, ongoing, and upcoming)
    const allExams = [...completed, ...ongoing, ...upcoming];
    console.log('[StudentDetail] Setting examsForResults:', allExams.length);
    this.examsForResults.set(allExams);
  }

  // Results tab functions
  onExamSelectForResults(examId: string): void {
    this.selectedExamForResults.set(examId);
    if (examId) {
      this.loadResultsForExam(examId);
    } else {
      this.resultsData.set([]);
    }
  }

  loadResultsForExam(examId: string): void {
    const studentId = this.student()?._id;
    if (!studentId) return;
    
    this.loadingResults.set(true);
    this.api.get<any>(`/results`, { studentId, examId }).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        const results = Array.isArray(data) ? data : [];
        
        // Transform results to display format
        const transformed = results.flatMap((result: any) => {
          // If result has subjectWiseResults array, flatten them
          if (result.subjectWiseResults?.length) {
            return result.subjectWiseResults.map((sr: any) => ({
              subjectName: sr.subject?.name || this.subjectMap().get(sr.subject) || 'Subject',
              obtained: sr.marksObtained || sr.obtainedMarks || 0,
              max: sr.maxMarks || sr.totalMarks || 100,
              percentage: sr.percentage || ((sr.marksObtained || 0) / (sr.maxMarks || 100)) * 100,
              grade: sr.grade || '-',
              isPassed: sr.isPassed ?? (sr.marksObtained >= (sr.passingMarks || 40)),
            }));
          }
          // Single result format
          return [{
            subjectName: result.subject?.name || this.subjectMap().get(result.subject) || 'Subject',
            obtained: result.obtainedMarks || result.marksObtained || 0,
            max: result.totalMarks || result.maxMarks || 100,
            percentage: result.percentage || 0,
            grade: result.grade || '-',
            isPassed: result.isPassed ?? (result.obtainedMarks >= (result.passingMarks || 40)),
          }];
        });
        
        this.resultsData.set(transformed);
        this.loadingResults.set(false);
      },
      error: () => {
        this.resultsData.set([]);
        this.loadingResults.set(false);
      }
    });
  }

  getResultsSummary(): { obtained: number; max: number; percentage: number; passed: boolean } {
    const results = this.resultsData();
    if (!results.length) return { obtained: 0, max: 0, percentage: 0, passed: false };
    
    const obtained = results.reduce((sum, r) => sum + (r.obtained || 0), 0);
    const max = results.reduce((sum, r) => sum + (r.max || 100), 0);
    const percentage = max > 0 ? (obtained / max) * 100 : 0;
    const passed = results.every(r => r.isPassed);
    
    return { obtained, max, percentage, passed };
  }

  formatExamType(type: string): string {
    if (!type) return 'Exam';
    return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  getDaysUntil(date: string): number {
    if (!date) return 0;
    const target = new Date(date), now = new Date();
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
      .map(([date, slots]) => ({ date: new Date(date), slots: slots.sort((a: any, b: any) => (a.startTime || '').localeCompare(b.startTime || '')) }));
  }

  getSubjectName(subject: any): string {
    if (!subject) return 'Unknown Subject';
    if (typeof subject === 'object') return subject.name || subject.code || 'Subject';
    if (this.subjectMap().has(subject)) return this.subjectMap().get(subject) || 'Subject';
    return 'Subject';
  }

  getScheduleSubjectName(slot: any): string {
    if (slot.subjectName) return slot.subjectName;
    if (slot.subject && typeof slot.subject === 'object' && slot.subject.name) return slot.subject.name;
    const subjectId = typeof slot.subject === 'string' ? slot.subject : slot.subject?._id;
    if (subjectId && this.subjectMap().has(subjectId)) return this.subjectMap().get(subjectId) || 'Subject';
    return 'Subject TBD';
  }

  getTotalMarks(exam: any): number {
    if (!exam?.schedule?.length) return 0;
    return exam.schedule.reduce((sum: number, slot: any) => sum + (slot.maxMarks || 0), 0);
  }

  getExamDays(exam: any): number {
    if (!exam?.startDate || !exam?.endDate) return 0;
    const start = new Date(exam.startDate), end = new Date(exam.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  loadStudentAnalytics(): void {
    const studentId = this.student()?._id;
    if (!studentId) return;
    this.loadingAnalytics.set(true);
    this.api.get<any>(`/results/analytics/student/${studentId}`).subscribe({
      next: (res) => { this.studentAnalytics.set(res.data || res); this.loadingAnalytics.set(false); },
      error: () => { this.studentAnalytics.set(null); this.loadingAnalytics.set(false); }
    });
  }

  getAnalyticsTrendIcon(trend: string): string {
    switch (trend) { case 'improving': return '📈'; case 'declining': return '📉'; default: return '➡️'; }
  }

  getAnalyticsTrendClass(trend: string): string {
    switch (trend) { case 'improving': return 'trend-up'; case 'declining': return 'trend-down'; default: return 'trend-stable'; }
  }

  getAnalyticsGradeBadge(grade: string): string {
    if (grade?.startsWith('A')) return 'badge-success';
    if (grade?.startsWith('B')) return 'badge-info';
    if (grade?.startsWith('C')) return 'badge-warning';
    return 'badge-danger';
  }

  getTotalFeeDue(): number { return this.feeData().reduce((sum, f) => sum + (f.dueAmount || 0), 0); }
  getTotalFeePaid(): number { return this.feeData().reduce((sum, f) => sum + (f.paidAmount || 0), 0); }

  getFeeBadgeClass(status: string): string {
    switch (status) { case 'paid': return 'badge-success'; case 'partial': return 'badge-warning'; case 'overdue': return 'badge-danger'; case 'waived': return 'badge-info'; default: return 'badge-secondary'; }
  }

  openPaymentModal(fee: any): void {
    this.selectedFee.set(fee);
    this.paymentForm = { amount: fee.dueAmount || 0, method: 'cash', transactionId: '', remarks: '' };
    this.showPaymentModal.set(true);
  }

  closePaymentModal(): void { this.showPaymentModal.set(false); this.selectedFee.set(null); }

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
      next: () => {
        this.processingPayment.set(false);
        this.toast.success(`Payment of ₹${this.paymentForm.amount} recorded successfully`);
        this.closePaymentModal();
        const studentId = this.student()?._id;
        if (studentId) this.loadStudentFees(studentId);
      },
      error: (err) => { this.processingPayment.set(false); this.toast.error(err?.error?.message || 'Failed to record payment'); },
    });
  }
}
