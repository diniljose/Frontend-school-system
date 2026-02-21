import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Enrollment, Student, ClassModel, AcademicYear } from '../../core/models';

@Component({
  selector: 'app-enrollment-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Enrollment Management</h1>
        <p>Manage student enrollments by academic year, class and section</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" (click)="showBulkModal = true">📋 Bulk Enroll</button>
        <button class="btn btn-primary" (click)="showEnrollModal = true">+ New Enrollment</button>
      </div>
    </div>

    <!-- Stats Row -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon" style="background:#dbeafe;color:#3b82f6">📊</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().totalEnrollments }}</div>
          <div class="stat-label">Total</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#dcfce7;color:#22c55e">✓</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().activeEnrollments }}</div>
          <div class="stat-label">Active</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#fef3c7;color:#f59e0b">⟳</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().completedEnrollments }}</div>
          <div class="stat-label">Completed</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon" style="background:#fee2e2;color:#ef4444">✗</div>
        <div class="stat-info">
          <div class="stat-value">{{ stats().withdrawnEnrollments }}</div>
          <div class="stat-label">Withdrawn</div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card filter-bar">
      <div class="filter-group">
        <div class="filter-item">
          <label>Academic Year</label>
          <select class="form-select" [(ngModel)]="filterAcademicYear" (change)="onAcademicYearChange()">
            <option value="">All Years</option>
            @for (ay of academicYears(); track ay._id) {
              <option [value]="ay._id">{{ ay.name }} {{ ay.isCurrent ? '(Current)' : '' }}</option>
            }
          </select>
        </div>
        <div class="filter-item">
          <label>Class</label>
          <select class="form-select" [(ngModel)]="filterClass" (change)="onClassChange()">
            <option value="">All Classes</option>
            @for (c of classes(); track c._id) {
              <option [value]="c._id">{{ c.name }}</option>
            }
          </select>
        </div>
        <div class="filter-item">
          <label>Section</label>
          <select class="form-select" [(ngModel)]="filterSection" (change)="loadEnrollments()">
            <option value="">All Sections</option>
            @for (s of availableSections(); track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>
        </div>
        <div class="filter-item">
          <label>Status</label>
          <select class="form-select" [(ngModel)]="filterStatus" (change)="loadEnrollments()">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="promoted">Promoted</option>
            <option value="retained">Retained</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
        <div class="filter-item search-item">
          <label>Search</label>
          <input type="text" class="form-input" placeholder="Search student..." [(ngModel)]="searchText" (input)="onSearch()" />
        </div>
      </div>
    </div>

    <!-- Enrollment Table -->
    <div class="card">
      @if (loading()) {
        <div class="skeleton-table">
          @for (i of [1,2,3,4,5]; track i) { <div class="skeleton" style="height:52px;margin-bottom:8px"></div> }
        </div>
      } @else {
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Academic Year</th>
                <th>Class</th>
                <th>Section</th>
                <th>Roll No</th>
                <th>Result</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (e of enrollments(); track e._id) {
                <tr class="table-row" [class.row-failed]="e.result === 'fail'" [class.row-passed]="e.result === 'pass'">
                  <td>
                    <div class="student-cell">
                      <div class="avatar-sm">{{ getStudentInitials(e.student) }}</div>
                      <div>
                        <div class="student-name">{{ getStudentName(e.student) }}</div>
                        <div class="student-adm">{{ getStudentAdm(e.student) }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="year-badge" [class.current]="isCurrentYear(e.academicYear)">
                      {{ getAcademicYearName(e.academicYear) }}
                    </span>
                  </td>
                  <td>{{ getClassName(e.class) }}</td>
                  <td><span class="section-badge">{{ e.section }}</span></td>
                  <td>{{ e.rollNumber || '-' }}</td>
                  <td>
                    @if (e.result) {
                      <span class="result-badge" [class]="'result-' + e.result">{{ e.result | titlecase }}</span>
                    } @else {
                      <span class="result-badge result-pending">Pending</span>
                    }
                  </td>
                  <td>
                    <span class="status-badge" [class]="'status-' + e.status">{{ e.status | titlecase }}</span>
                  </td>
                  <td>
                    <div class="action-btns">
                      <button class="btn btn-ghost btn-sm" (click)="viewEnrollment(e)" title="View Details">👁</button>
                      <button class="btn btn-ghost btn-sm" (click)="editEnrollment(e)" title="Update Result">✏️</button>
                      @if (e.status === 'active') {
                        <button class="btn btn-ghost btn-sm" style="color:var(--danger)" (click)="withdrawEnrollment(e)" title="Withdraw">✗</button>
                      }
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="8" class="empty-state">
                  <div class="empty-icon">📋</div>
                  <h3>No enrollments found</h3>
                  <p>Select an academic year and class to view enrollments, or enroll new students.</p>
                </td></tr>
              }
            </tbody>
          </table>
        </div>
        @if (totalPages() > 1) {
          <div class="pagination">
            <button class="btn btn-ghost btn-sm" [disabled]="page() <= 1" (click)="goToPage(page() - 1)">← Prev</button>
            <span class="page-info">Page {{ page() }} of {{ totalPages() }}</span>
            <button class="btn btn-ghost btn-sm" [disabled]="page() >= totalPages()" (click)="goToPage(page() + 1)">Next →</button>
          </div>
        }
      }
    </div>

    <!-- Enroll Modal -->
    @if (showEnrollModal) {
      <div class="modal-overlay" (click)="showEnrollModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Enroll Student</h2>
            <button class="modal-close" (click)="showEnrollModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Academic Year *</label>
              <select class="form-select" [(ngModel)]="enrollForm.academicYearId" (change)="onEnrollAcademicYearChange()">
                <option value="">Select Academic Year</option>
                @for (ay of academicYears(); track ay._id) {
                  <option [value]="ay._id">{{ ay.name }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Class *</label>
              <select class="form-select" [(ngModel)]="enrollForm.classId" (change)="onEnrollClassChange()">
                <option value="">Select Class</option>
                @for (c of classes(); track c._id) {
                  <option [value]="c._id">{{ c.name }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Section {{ enrollClassHasSections() ? '*' : '(no sections)' }}</label>
              <select class="form-select" [(ngModel)]="enrollForm.section" [disabled]="!enrollClassHasSections()">
                @if (enrollClassHasSections()) {
                  <option value="">Select Section</option>
                  @for (s of enrollSections(); track s) {
                    <option [value]="s">{{ s }}</option>
                  }
                } @else {
                  <option value="">Not needed</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Student *</label>
              <select class="form-select" [(ngModel)]="enrollForm.studentId">
                <option value="">Select Student</option>
                @for (s of unenrolledStudents(); track s._id) {
                  <option [value]="s._id">{{ s.firstName }} {{ s.lastName }} ({{ s.admissionNumber }})</option>
                }
              </select>
              @if (enrollForm.academicYearId && unenrolledStudents().length === 0 && !loadingUnenrolled()) {
                <small class="form-hint">All students are already enrolled for this academic year.</small>
              }
            </div>
            <div class="form-group">
              <label>Roll Number (auto-generated if empty)</label>
              <input type="text" class="form-input" [(ngModel)]="enrollForm.rollNumber" placeholder="Auto-generated" />
            </div>
            <div class="form-group">
              <label>Remarks</label>
              <textarea class="form-input" [(ngModel)]="enrollForm.remarks" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showEnrollModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="submitEnrollment()" [disabled]="enrollSaving()">
              @if (enrollSaving()) { <span class="spinner"></span> }
              Enroll Student
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Bulk Enroll Modal -->
    @if (showBulkModal) {
      <div class="modal-overlay" (click)="showBulkModal = false">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Bulk Enrollment</h2>
            <button class="modal-close" (click)="showBulkModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="grid grid-3">
              <div class="form-group">
                <label>Academic Year *</label>
                <select class="form-select" [(ngModel)]="bulkForm.academicYearId" (change)="onBulkAcademicYearChange()">
                  <option value="">Select</option>
                  @for (ay of academicYears(); track ay._id) {
                    <option [value]="ay._id">{{ ay.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Class *</label>
                <select class="form-select" [(ngModel)]="bulkForm.classId" (change)="onBulkClassChange()">
                  <option value="">Select</option>
                  @for (c of classes(); track c._id) {
                    <option [value]="c._id">{{ c.name }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Default Section {{ bulkClassHasSections() ? '*' : '(no sections)' }}</label>
                <select class="form-select" [(ngModel)]="bulkForm.section" [disabled]="!bulkClassHasSections()">
                  @if (bulkClassHasSections()) {
                    <option value="">Select</option>
                    @for (s of bulkSections(); track s) {
                      <option [value]="s">{{ s }}</option>
                    }
                  } @else {
                    <option value="">Not needed</option>
                  }
                </select>
              </div>
            </div>
            <h4 style="margin:var(--space-4) 0 var(--space-2);display:flex;justify-content:space-between;align-items:center">
              Select Students
              @if (unenrolledStudents().length > 0) {
                <button class="btn btn-ghost btn-sm" (click)="toggleBulkSelectAll()">
                  {{ bulkSelectedIds.length === unenrolledStudents().length ? 'Deselect All' : 'Select All' }}
                </button>
              }
            </h4>
            <div class="bulk-student-list">
              @for (s of unenrolledStudents(); track s._id) {
                <label class="bulk-student-item" [class.selected]="isBulkSelected(s._id)">
                  <input type="checkbox" [checked]="isBulkSelected(s._id)" (change)="toggleBulkStudent(s._id)" />
                  <div class="avatar-sm">{{ s.firstName?.charAt(0) }}{{ s.lastName?.charAt(0) }}</div>
                  <div>
                    <div class="student-name">{{ s.firstName }} {{ s.lastName }}</div>
                    <div class="student-adm">{{ s.admissionNumber }}</div>
                  </div>
                  @if (bulkClassHasSections() && isBulkSelected(s._id)) {
                    <select class="form-select form-select-sm bulk-sec-select" [(ngModel)]="bulkStudentSections[s._id]" (click)="$event.stopPropagation()">
                      @for (sec of bulkSections(); track sec) {
                        <option [value]="sec">{{ sec }}</option>
                      }
                    </select>
                  }
                </label>
              } @empty {
                <p class="empty-hint">{{ bulkForm.academicYearId ? 'All students are already enrolled' : 'Select academic year first' }}</p>
              }
            </div>
          </div>
          <div class="modal-footer">
            <span class="selected-count">{{ bulkSelectedIds.length }} students selected</span>
            <button class="btn btn-secondary" (click)="showBulkModal = false">Cancel</button>
            <button class="btn btn-primary" (click)="submitBulkEnrollment()" [disabled]="bulkSaving() || bulkSelectedIds.length === 0">
              @if (bulkSaving()) { <span class="spinner"></span> }
              Enroll {{ bulkSelectedIds.length }} Students
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Detail/Edit Modal -->
    @if (showDetailModal && selectedEnrollment) {
      <div class="modal-overlay" (click)="showDetailModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editMode ? 'Update Enrollment' : 'Enrollment Details' }}</h2>
            <button class="modal-close" (click)="showDetailModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-item"><span class="label">Student</span><span>{{ getStudentName(selectedEnrollment.student) }}</span></div>
              <div class="detail-item"><span class="label">Academic Year</span><span>{{ getAcademicYearName(selectedEnrollment.academicYear) }}</span></div>
              <div class="detail-item"><span class="label">Class</span><span>{{ getClassName(selectedEnrollment.class) }}</span></div>
              <div class="detail-item"><span class="label">Section</span><span>{{ selectedEnrollment.section }}</span></div>
              <div class="detail-item"><span class="label">Roll Number</span><span>{{ selectedEnrollment.rollNumber || '-' }}</span></div>
              <div class="detail-item"><span class="label">Enrollment Date</span><span>{{ selectedEnrollment.enrollmentDate | date:'mediumDate' }}</span></div>
            </div>
            @if (editMode) {
              <hr style="margin:var(--space-4) 0"/>
              <div class="grid grid-2">
                <div class="form-group">
                  <label>Result</label>
                  <select class="form-select" [(ngModel)]="editForm.result">
                    <option value="">Pending</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                    <option value="promoted">Promoted</option>
                    <option value="retained">Retained</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Status</label>
                  <select class="form-select" [(ngModel)]="editForm.status">
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="promoted">Promoted</option>
                    <option value="retained">Retained</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>
              </div>
              <div class="grid grid-2">
                <div class="form-group">
                  <label>Percentage</label>
                  <input type="number" class="form-input" [(ngModel)]="editForm.percentage" min="0" max="100" placeholder="0-100" />
                </div>
                <div class="form-group">
                  <label>Rank</label>
                  <input type="number" class="form-input" [(ngModel)]="editForm.rank" min="1" placeholder="Class rank" />
                </div>
              </div>
              <div class="form-group">
                <label>Remarks</label>
                <textarea class="form-input" [(ngModel)]="editForm.remarks" rows="2"></textarea>
              </div>
            }
          </div>
          <div class="modal-footer">
            @if (!editMode) {
              <button class="btn btn-secondary" (click)="showDetailModal = false">Close</button>
              <button class="btn btn-primary" (click)="editMode = true">Edit</button>
            } @else {
              <button class="btn btn-secondary" (click)="editMode = false">Cancel Edit</button>
              <button class="btn btn-primary" (click)="submitEditEnrollment()" [disabled]="editSaving()">
                @if (editSaving()) { <span class="spinner"></span> }
                Save Changes
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
    .page-header h1 { font-size: var(--text-2xl); font-weight: 700; }
    .page-header p { color: var(--text-secondary); margin-top: var(--space-1); }
    .header-actions { display: flex; gap: var(--space-3); }

    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-4); display: flex; align-items: center; gap: var(--space-4); }
    .stat-icon { width: 48px; height: 48px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
    .stat-value { font-size: var(--text-2xl); font-weight: 700; }
    .stat-label { font-size: var(--text-xs); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }

    .filter-bar { margin-bottom: var(--space-4); }
    .filter-group { display: flex; gap: var(--space-4); flex-wrap: wrap; align-items: flex-end; }
    .filter-item { flex: 1; min-width: 140px; }
    .filter-item label { display: block; font-size: var(--text-xs); font-weight: 600; color: var(--text-secondary); margin-bottom: var(--space-1); text-transform: uppercase; letter-spacing: 0.05em; }
    .search-item { min-width: 200px; }

    .table-responsive { overflow-x: auto; }
    .student-cell { display: flex; align-items: center; gap: var(--space-3); }
    .avatar-sm { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; font-size: var(--text-xs); font-weight: 600; flex-shrink: 0; }
    .student-name { font-weight: 500; }
    .student-adm { font-size: var(--text-xs); color: var(--text-tertiary); }
    .year-badge { padding: 2px 10px; border-radius: 12px; font-size: var(--text-xs); background: var(--bg-secondary); font-weight: 500; }
    .year-badge.current { background: #dbeafe; color: #2563eb; }
    .section-badge { display: inline-flex; width: 28px; height: 28px; align-items: center; justify-content: center; border-radius: 50%; background: var(--bg-secondary); font-weight: 600; font-size: var(--text-sm); }
    .result-badge { padding: 2px 10px; border-radius: 12px; font-size: var(--text-xs); font-weight: 600; }
    .result-pass { background: #dcfce7; color: #166534; }
    .result-fail { background: #fee2e2; color: #991b1b; }
    .result-promoted { background: #dbeafe; color: #1e40af; }
    .result-retained { background: #fef3c7; color: #92400e; }
    .result-pending { background: var(--bg-secondary); color: var(--text-tertiary); }
    .status-badge { padding: 2px 10px; border-radius: 12px; font-size: var(--text-xs); font-weight: 500; }
    .status-active { background: #dcfce7; color: #166534; }
    .status-completed { background: #dbeafe; color: #1e40af; }
    .status-passed { background: #dcfce7; color: #166534; }
    .status-failed { background: #fee2e2; color: #991b1b; }
    .status-promoted { background: #dbeafe; color: #1e40af; }
    .status-retained { background: #fef3c7; color: #92400e; }
    .status-withdrawn { background: #fee2e2; color: #991b1b; }
    .status-transferred { background: #f3e8ff; color: #7c3aed; }
    .row-failed { background: #fef2f2; }
    .row-passed { background: #f0fdf4; }
    .action-btns { display: flex; gap: var(--space-1); }
    .empty-state { text-align: center; padding: var(--space-8) !important; }
    .empty-icon { font-size: 48px; margin-bottom: var(--space-2); }
    .empty-state h3 { color: var(--text-secondary); margin-bottom: var(--space-1); }
    .empty-state p { color: var(--text-tertiary); font-size: var(--text-sm); }
    .pagination { display: flex; justify-content: center; align-items: center; gap: var(--space-4); margin-top: var(--space-4); }
    .page-info { font-size: var(--text-sm); color: var(--text-secondary); }

    /* Modal styles */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
    .modal { background: var(--surface); border-radius: var(--radius-xl); width: 90%; max-width: 560px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; animation: slideUp 0.3s; }
    .modal-lg { max-width: 720px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--border); }
    .modal-header h2 { font-size: var(--text-lg); font-weight: 600; }
    .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-tertiary); }
    .modal-body { padding: var(--space-6); overflow-y: auto; flex: 1; }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--border); align-items: center; }
    .form-group { margin-bottom: var(--space-4); }
    .form-group label { display: block; font-size: var(--text-sm); font-weight: 500; margin-bottom: var(--space-1); color: var(--text-secondary); }
    .form-hint { font-size: var(--text-xs); color: var(--text-tertiary); margin-top: 4px; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
    .detail-item { display: flex; flex-direction: column; gap: 2px; }
    .detail-item .label { font-size: var(--text-xs); color: var(--text-tertiary); text-transform: uppercase; letter-spacing: 0.05em; }
    .selected-count { margin-right: auto; font-size: var(--text-sm); color: var(--text-secondary); font-weight: 500; }

    .bulk-student-list { max-height: 320px; overflow-y: auto; border: 1px solid var(--border); border-radius: var(--radius-md); }
    .bulk-student-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); cursor: pointer; border-bottom: 1px solid var(--border); transition: background 0.15s; }
    .bulk-student-item:hover, .bulk-student-item.selected { background: var(--bg-secondary); }
    .bulk-student-item input { margin-right: var(--space-1); }
    .empty-hint { padding: var(--space-6); text-align: center; color: var(--text-tertiary); }
    .form-select-sm { padding: 4px 8px; font-size: var(--text-xs); border-radius: var(--radius-sm); }
    .bulk-sec-select { margin-left: auto; min-width: 80px; }

    .grid { display: grid; gap: var(--space-4); }
    .grid-2 { grid-template-columns: 1fr 1fr; }
    .grid-3 { grid-template-columns: 1fr 1fr 1fr; }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 768px) { .stats-row { grid-template-columns: repeat(2, 1fr); } .filter-group { flex-direction: column; } .grid-3 { grid-template-columns: 1fr; } }
  `]
})
export class EnrollmentListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  enrollments = signal<Enrollment[]>([]);
  academicYears = signal<AcademicYear[]>([]);
  classes = signal<ClassModel[]>([]);
  availableSections = signal<string[]>([]);
  unenrolledStudents = signal<any[]>([]);
  loadingUnenrolled = signal(false);
  stats = signal<any>({ totalEnrollments: 0, activeEnrollments: 0, completedEnrollments: 0, withdrawnEnrollments: 0 });

  filterAcademicYear = '';
  filterClass = '';
  filterSection = '';
  filterStatus = '';
  searchText = '';
  page = signal(1);
  totalPages = signal(1);
  private searchTimeout: any;

  // Enroll modal
  showEnrollModal = false;
  enrollForm: any = {};
  enrollSections = signal<string[]>([]);
  enrollSaving = signal(false);

  // Bulk modal
  showBulkModal = false;
  bulkForm: any = {};
  bulkSections = signal<string[]>([]);
  bulkSelectedIds: string[] = [];
  bulkStudentSections: Record<string, string> = {};
  bulkSaving = signal(false);

  // Detail/Edit modal
  showDetailModal = false;
  selectedEnrollment: Enrollment | null = null;
  editMode = false;
  editForm: any = {};
  editSaving = signal(false);

  ngOnInit(): void {
    this.loadAcademicYears();
    this.loadClasses();
    this.loadStats();
    this.loadEnrollments();
  }

  loadAcademicYears(): void {
    this.api.get<any>('/academic-years').subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        const years = Array.isArray(data) ? data : [];
        this.academicYears.set(years);
        const current = years.find((y: any) => y.isCurrent);
        if (current && !this.filterAcademicYear) {
          this.filterAcademicYear = current._id;
          this.loadEnrollments();
          this.loadStats();
        }
      }
    });
  }

  loadClasses(): void {
    this.api.get<any>('/classes', { limit: 100 }).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.classes.set(Array.isArray(data) ? data : []);
      }
    });
  }

  loadStats(): void {
    const params: any = {};
    if (this.filterAcademicYear) params.academicYearId = this.filterAcademicYear;
    this.api.get<any>('/enrollments/stats', params).subscribe({
      next: (res) => {
        const d = res.data?.data || res.data || {};
        this.stats.set({
          totalEnrollments: d.totalEnrollments || 0,
          activeEnrollments: d.activeEnrollments || 0,
          completedEnrollments: d.completedEnrollments || 0,
          withdrawnEnrollments: d.withdrawnEnrollments || 0,
        });
      }
    });
  }

  loadEnrollments(): void {
    this.loading.set(true);
    const params: any = { page: this.page(), limit: 20 };
    if (this.filterAcademicYear) params.academicYearId = this.filterAcademicYear;
    if (this.filterClass) params.classId = this.filterClass;
    if (this.filterSection) params.section = this.filterSection;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.searchText) params.search = this.searchText;

    this.api.get<any>('/enrollments', params).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.enrollments.set(Array.isArray(data) ? data : []);
        this.totalPages.set(res.data?.pagination?.pages || res.data?.totalPages || 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadUnenrolled(): void {
    if (!this.filterAcademicYear && !this.enrollForm.academicYearId && !this.bulkForm.academicYearId) return;
    const ayId = this.enrollForm.academicYearId || this.bulkForm.academicYearId || this.filterAcademicYear;
    if (!ayId) return;
    this.loadingUnenrolled.set(true);
    this.api.get<any>('/enrollments/unenrolled', { academicYearId: ayId }).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        this.unenrolledStudents.set(Array.isArray(data) ? data : []);
        this.loadingUnenrolled.set(false);
      },
      error: () => this.loadingUnenrolled.set(false)
    });
  }

  onAcademicYearChange(): void {
    this.page.set(1);
    this.loadEnrollments();
    this.loadStats();
  }

  onClassChange(): void {
    const cls = this.classes().find(c => c._id === this.filterClass);
    this.availableSections.set(cls?.sections?.map(s => s.name) || []);
    this.filterSection = '';
    this.page.set(1);
    this.loadEnrollments();
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => { this.page.set(1); this.loadEnrollments(); }, 400);
  }

  goToPage(p: number): void { this.page.set(p); this.loadEnrollments(); }

  // Enroll modal
  onEnrollAcademicYearChange(): void { this.loadUnenrolled(); }
  onEnrollClassChange(): void {
    const cls = this.classes().find(c => c._id === this.enrollForm.classId);
    this.enrollSections.set(cls?.sections?.map(s => s.name) || []);
  }

  enrollClassHasSections(): boolean { return this.enrollSections().length > 0; }
  bulkClassHasSections(): boolean { return this.bulkSections().length > 0; }

  toggleBulkSelectAll(): void {
    const all = this.unenrolledStudents();
    if (this.bulkSelectedIds.length === all.length) {
      this.bulkSelectedIds = [];
      this.bulkStudentSections = {};
    } else {
      this.bulkSelectedIds = all.map(s => s._id);
      const defaultSec = this.bulkForm.section || this.bulkSections()[0] || '';
      all.forEach(s => { if (!this.bulkStudentSections[s._id]) this.bulkStudentSections[s._id] = defaultSec; });
    }
  }

  submitEnrollment(): void {
    const hasSections = this.enrollClassHasSections();
    if (!this.enrollForm.studentId || !this.enrollForm.academicYearId || !this.enrollForm.classId || (hasSections && !this.enrollForm.section)) {
      this.toast.error('Please fill all required fields');
      return;
    }
    if (!hasSections) this.enrollForm.section = '';
    this.enrollSaving.set(true);
    this.api.post('/enrollments', this.enrollForm).subscribe({
      next: () => {
        this.toast.success('Student enrolled successfully');
        this.showEnrollModal = false;
        this.enrollForm = {};
        this.enrollSaving.set(false);
        this.loadEnrollments();
        this.loadStats();
      },
      error: (err) => { this.enrollSaving.set(false); this.toast.error(err?.error?.message || 'Enrollment failed'); }
    });
  }

  // Bulk modal
  onBulkAcademicYearChange(): void { this.bulkSelectedIds = []; this.loadUnenrolled(); }
  onBulkClassChange(): void {
    const cls = this.classes().find(c => c._id === this.bulkForm.classId);
    const secs = cls?.sections?.map((s: any) => s.name) || [];
    this.bulkSections.set(secs);
    this.bulkForm.section = secs[0] || '';
    this.bulkStudentSections = {};
    if (secs.length > 0) {
      this.bulkSelectedIds.forEach(id => { this.bulkStudentSections[id] = secs[0]; });
    }
  }

  isBulkSelected(id: string): boolean { return this.bulkSelectedIds.includes(id); }
  toggleBulkStudent(id: string): void {
    const idx = this.bulkSelectedIds.indexOf(id);
    if (idx >= 0) {
      this.bulkSelectedIds.splice(idx, 1);
      delete this.bulkStudentSections[id];
    } else {
      this.bulkSelectedIds.push(id);
      const defaultSec = this.bulkForm.section || this.bulkSections()[0] || '';
      if (defaultSec) this.bulkStudentSections[id] = defaultSec;
    }
  }

  submitBulkEnrollment(): void {
    const hasSections = this.bulkClassHasSections();
    if (!this.bulkForm.academicYearId || !this.bulkForm.classId || (hasSections && !this.bulkForm.section) || this.bulkSelectedIds.length === 0) {
      this.toast.error('Please fill all fields and select students');
      return;
    }
    this.bulkSaving.set(true);
    const defaultSection = hasSections ? this.bulkForm.section : '';
    const payload = {
      academicYearId: this.bulkForm.academicYearId,
      classId: this.bulkForm.classId,
      section: defaultSection,
      students: this.bulkSelectedIds.map(id => ({
        studentId: id,
        ...(hasSections && this.bulkStudentSections[id] ? { section: this.bulkStudentSections[id] } : {})
      })),
    };
    this.api.post('/enrollments/bulk', payload).subscribe({
      next: (res: any) => {
        const d = res.data?.data || res.data || {};
        this.toast.success(`Enrolled ${d.success || 0} students. ${d.failed || 0} failed.`);
        this.showBulkModal = false;
        this.bulkForm = {};
        this.bulkSelectedIds = [];
        this.bulkSaving.set(false);
        this.loadEnrollments();
        this.loadStats();
      },
      error: (err) => { this.bulkSaving.set(false); this.toast.error(err?.error?.message || 'Bulk enrollment failed'); }
    });
  }

  // Detail/Edit
  viewEnrollment(e: Enrollment): void {
    this.selectedEnrollment = e;
    this.editMode = false;
    this.showDetailModal = true;
  }

  editEnrollment(e: Enrollment): void {
    this.selectedEnrollment = e;
    this.editForm = {
      result: e.result || '',
      status: e.status || 'active',
      percentage: e.percentage || null,
      rank: e.rank || null,
      remarks: e.remarks || '',
    };
    this.editMode = true;
    this.showDetailModal = true;
  }

  submitEditEnrollment(): void {
    if (!this.selectedEnrollment) return;
    this.editSaving.set(true);
    const payload: any = {};
    if (this.editForm.result) payload.result = this.editForm.result;
    if (this.editForm.status) payload.status = this.editForm.status;
    if (this.editForm.percentage !== null && this.editForm.percentage !== undefined) payload.percentage = +this.editForm.percentage;
    if (this.editForm.rank !== null && this.editForm.rank !== undefined) payload.rank = +this.editForm.rank;
    if (this.editForm.remarks) payload.remarks = this.editForm.remarks;

    this.api.patch(`/enrollments/${this.selectedEnrollment._id}`, payload).subscribe({
      next: () => {
        this.toast.success('Enrollment updated');
        this.showDetailModal = false;
        this.editSaving.set(false);
        this.loadEnrollments();
      },
      error: (err) => { this.editSaving.set(false); this.toast.error(err?.error?.message || 'Update failed'); }
    });
  }

  withdrawEnrollment(e: Enrollment): void {
    const reason = prompt('Reason for withdrawal:');
    if (reason === null) return;
    this.api.patch(`/enrollments/${e._id}/withdraw`, { reason }).subscribe({
      next: () => { this.toast.success('Student withdrawn'); this.loadEnrollments(); this.loadStats(); },
      error: (err) => this.toast.error(err?.error?.message || 'Withdrawal failed'),
    });
  }

  // Helpers
  getStudentName(s: any): string {
    if (!s) return '-';
    if (typeof s === 'string') return s;
    return `${s.firstName || ''} ${s.lastName || ''}`.trim() || '-';
  }
  getStudentInitials(s: any): string {
    if (!s || typeof s === 'string') return '?';
    return `${s.firstName?.charAt(0) || ''}${s.lastName?.charAt(0) || ''}`;
  }
  getStudentAdm(s: any): string {
    if (!s || typeof s === 'string') return '';
    return s.admissionNumber || '';
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
  isCurrentYear(ay: any): boolean {
    if (!ay || typeof ay === 'string') return false;
    return ay.isCurrent === true;
  }
}
