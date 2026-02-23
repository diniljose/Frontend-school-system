import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Student, ClassModel, AcademicYear } from '../../core/models';

interface StudentActionOption {
  action: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  requiresClass: boolean;
  requiresAcademicYear: boolean;
  applicableStatuses: string[];
  confirmationRequired: boolean;
  color: string;
}

interface StudentStatusOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ 'nav.students' | translate }}</h1>
        <p>Manage students, enroll them in classes, and track their progress</p>
      </div>
      <div class="header-actions">
        @if (selectedIds.length > 0) {
          <div class="dropdown">
            <button class="btn btn-success" (click)="showBulkActionMenu = !showBulkActionMenu">
              ⚡ Bulk Actions ({{ selectedIds.length }}) ▾
            </button>
            @if (showBulkActionMenu) {
              <div class="dropdown-menu" (click)="showBulkActionMenu = false">
                <div class="dropdown-item" (click)="openBulkEnroll()">📋 Enroll in Class</div>
                <div class="dropdown-item" (click)="openBulkAction('promote')">⬆️ Promote</div>
                <div class="dropdown-item" (click)="openBulkAction('pass')">✅ Mark as Passed</div>
                <div class="dropdown-item" (click)="openBulkAction('fail')">❌ Mark as Failed</div>
                <div class="dropdown-item" (click)="openBulkAction('retain')">🔄 Retain</div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item text-danger" (click)="openBulkAction('withdraw')">🚪 Withdraw</div>
              </div>
            }
          </div>
        }
        <button class="btn btn-primary" routerLink="/students/new">+ Add Student</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card filter-bar">
      <div class="filter-group">
        <div class="filter-item">
          <label>Academic Year</label>
          <select class="form-select" [(ngModel)]="filterAcademicYear" (change)="onFilterChange()">
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
          <select class="form-select" [(ngModel)]="filterSection" (change)="onFilterChange()" [disabled]="!filterClass || availableSections().length === 0">
            <option value="">{{ filterClass && availableSections().length === 0 ? 'No sections' : 'All Sections' }}</option>
            @for (s of availableSections(); track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>
        </div>
        <div class="filter-item">
          <label>Status</label>
          <select class="form-select" [(ngModel)]="filterStatus" (change)="onFilterChange()">
            <option value="">All Status</option>
            @for (status of statusOptions(); track status.value) {
              <option [value]="status.value">{{ status.label }}</option>
            }
          </select>
        </div>
        <div class="filter-item search-item">
          <label>Search</label>
          <input type="text" class="form-input" placeholder="Name or admission no..." [(ngModel)]="search" (input)="onSearch()" />
        </div>
      </div>
    </div>

    <!-- Bulk Action Bar -->
    @if (selectedIds.length > 0) {
      <div class="bulk-bar">
        <span>{{ selectedIds.length }} student{{ selectedIds.length > 1 ? 's' : '' }} selected</span>
        <button class="btn btn-ghost btn-sm" (click)="clearSelection()">Clear Selection</button>
      </div>
    }

    <!-- Student Table -->
    <div class="card">
      @if (loading()) {
        @for (i of [1,2,3,4,5]; track i) { <div class="skeleton" style="height:52px;margin-bottom:8px"></div> }
      } @else {
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th class="th-check">
                  <input type="checkbox" [checked]="isAllSelected()" (change)="toggleSelectAll()" title="Select all on this page" />
                </th>
                <th>Student</th>
                <th>Admission No.</th>
                <th>Class</th>
                <th>Section</th>
                <th>Roll No</th>
                <th>Gender</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (student of students(); track student._id) {
                <tr [class.selected-row]="isSelected(student._id)">
                  <td class="td-check">
                    <input type="checkbox" [checked]="isSelected(student._id)" (change)="toggleSelect(student._id)" />
                  </td>
                  <td>
                    <a [routerLink]="['/students', student._id]" class="student-link">
                      <div class="avatar-sm">{{ student.firstName?.charAt(0) }}{{ student.lastName?.charAt(0) }}</div>
                      <div>
                        <div class="student-name">{{ student.firstName }} {{ student.lastName }}</div>
                        <div class="student-sub">{{ student.contact?.phone || '' }}</div>
                      </div>
                    </a>
                  </td>
                  <td><span class="adm-badge">{{ student.admissionNumber }}</span></td>
                  <td>{{ getClassName(student.currentClass) }}</td>
                  <td>
                    @if (student.currentSection) {
                      <span class="section-badge">{{ student.currentSection }}</span>
                    } @else { — }
                  </td>
                  <td>{{ student.rollNumber || '—' }}</td>
                  <td>{{ student.gender || '—' }}</td>
                  <td><span class="status-badge" [class]="'status-' + student.status">{{ getStatusLabel(student.status || '') }}</span></td>
                  <td>
                    <div class="action-btns">
                      <a [routerLink]="['/students', student._id]" class="btn btn-ghost btn-sm" title="View Details">👁️</a>
                      <a [routerLink]="['/students', student._id, 'edit']" class="btn btn-ghost btn-sm" title="Edit">✏️</a>
                      <div class="dropdown action-dropdown">
                        <button class="btn btn-ghost btn-sm" (click)="toggleActionMenu(student._id)" title="Actions">⋯</button>
                        @if (openActionMenuId === student._id) {
                          <div class="dropdown-menu dropdown-right">
                            @for (opt of getApplicableActions(student.status || ''); track opt.action) {
                              <div class="dropdown-item" (click)="openActionModal(student, opt)" [style.color]="opt.color">
                                {{ opt.icon }} {{ opt.label }}
                              </div>
                            }
                            @if (getApplicableActions(student.status || '').length === 0) {
                              <div class="dropdown-item disabled">No actions available</div>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="9" class="empty-state">No students found</td></tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Footer: Pagination + bulk hint -->
        <div class="table-footer">
          @if (students().length > 0 && selectedIds.length === 0) {
            <div class="bulk-hint">💡 Select students using checkboxes for bulk actions, or use the ⋯ menu for individual actions</div>
          }
          @if (totalPages() > 1) {
            <div class="pagination">
              <button class="btn btn-ghost btn-sm" [disabled]="page() <= 1" (click)="goToPage(page() - 1)">← Prev</button>
              <span class="page-info">Page {{ page() }} of {{ totalPages() }} ({{ totalCount() }} total)</span>
              <button class="btn btn-ghost btn-sm" [disabled]="page() >= totalPages()" (click)="goToPage(page() + 1)">Next →</button>
            </div>
          }
        </div>
      }
    </div>

    <!-- Student Action Modal -->
    @if (showActionModal) {
      <div class="modal-overlay" (click)="closeActionModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2>{{ currentAction?.icon }} {{ currentAction?.label }}</h2>
              <p class="modal-subtitle">{{ currentAction?.description }}</p>
            </div>
            <button class="modal-close" (click)="closeActionModal()">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Student info -->
            <div class="action-student-info">
              @if (selectedStudent) {
                <div class="student-card">
                  <div class="avatar-md">{{ selectedStudent.firstName?.charAt(0) }}{{ selectedStudent.lastName?.charAt(0) }}</div>
                  <div>
                    <div class="student-name">{{ selectedStudent.firstName }} {{ selectedStudent.lastName }}</div>
                    <div class="student-details">
                      {{ selectedStudent.admissionNumber }} · {{ getClassName(selectedStudent.currentClass) }}
                      @if (selectedStudent.currentSection) { Section {{ selectedStudent.currentSection }} }
                    </div>
                  </div>
                </div>
              }
              @if (isBulkAction) {
                <div class="bulk-info">Applying to {{ selectedIds.length }} students</div>
              }
            </div>

            <!-- Action-specific forms -->
            @if (currentAction?.requiresClass) {
              <div class="form-group">
                <label class="required">Target Class</label>
                <select class="form-select" [(ngModel)]="actionData.toClassId" (change)="onActionClassChange()">
                  <option value="">Select Class</option>
                  @for (c of classes(); track c._id) {
                    <option [value]="c._id">{{ c.name }}</option>
                  }
                </select>
              </div>
              @if (actionSections().length > 0) {
                <div class="form-group">
                  <label>Section</label>
                  <select class="form-select" [(ngModel)]="actionData.toSection">
                    <option value="">Select Section</option>
                    @for (s of actionSections(); track s) {
                      <option [value]="s">{{ s }}</option>
                    }
                  </select>
                </div>
              }
            }

            @if (currentAction?.requiresAcademicYear) {
              <div class="form-group">
                <label class="required">Academic Year</label>
                <select class="form-select" [(ngModel)]="actionData.toAcademicYearId">
                  <option value="">Select Academic Year</option>
                  @for (ay of academicYears(); track ay._id) {
                    <option [value]="ay._id">{{ ay.name }} {{ ay.isCurrent ? '(Current)' : '' }}</option>
                  }
                </select>
              </div>
            }

            <!-- Common fields for academic actions -->
            @if (isActionIn(['promote', 'pass', 'fail', 'retain', 'graduate'])) {
              <div class="grid grid-2">
                <div class="form-group">
                  <label>Percentage</label>
                  <input type="number" class="form-input" [(ngModel)]="actionData.percentage" placeholder="e.g., 75.5" min="0" max="100" />
                </div>
                <div class="form-group">
                  <label>Rank</label>
                  <input type="number" class="form-input" [(ngModel)]="actionData.rank" placeholder="e.g., 5" min="1" />
                </div>
              </div>
            }

            <!-- Transfer fields -->
            @if (currentAction?.action === 'transfer_out') {
              <div class="form-group">
                <label>Destination School</label>
                <input type="text" class="form-input" [(ngModel)]="actionData.toSchoolName" placeholder="Name of the school" />
              </div>
              <div class="form-group">
                <label>TC Number</label>
                <input type="text" class="form-input" [(ngModel)]="actionData.transferCertificateNumber" placeholder="Transfer certificate number" />
              </div>
            }

            <!-- Reason field for certain actions -->
            @if (isActionIn(['transfer_out', 'withdraw', 'suspend', 'reject'])) {
              <div class="form-group">
                <label>Reason</label>
                <input type="text" class="form-input" [(ngModel)]="actionData.reason" placeholder="Reason for this action" />
              </div>
            }

            <!-- Remarks (always shown) -->
            <div class="form-group">
              <label>Remarks</label>
              <textarea class="form-input" [(ngModel)]="actionData.remarks" rows="2" placeholder="Additional notes..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeActionModal()">Cancel</button>
            <button 
              class="btn" 
              [class.btn-danger]="isActionIn(['fail', 'withdraw', 'suspend', 'reject', 'transfer_out'])"
              [class.btn-success]="isActionIn(['promote', 'pass', 'approve', 'graduate', 'enroll'])"
              [class.btn-primary]="!isActionIn(['fail', 'withdraw', 'suspend', 'reject', 'transfer_out', 'promote', 'pass', 'approve', 'graduate', 'enroll'])"
              (click)="executeAction()"
              [disabled]="actionSaving()">
              @if (actionSaving()) { <span class="spinner"></span> }
              {{ currentAction?.label }}
            </button>
          </div>
        </div>
      </div>
    }
    @if (showBulkModal) {
      <div class="modal-overlay" (click)="showBulkModal = false">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Bulk Enroll Students</h2>
            <button class="modal-close" (click)="showBulkModal = false">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Step indicator -->
            <div class="steps">
              <div class="step" [class.active]="bulkStep === 1" [class.done]="bulkStep > 1">
                <span class="step-num">1</span> Select Class
              </div>
              <div class="step-line"></div>
              <div class="step" [class.active]="bulkStep === 2" [class.done]="bulkStep > 2">
                <span class="step-num">2</span> Assign Sections
              </div>
              <div class="step-line"></div>
              <div class="step" [class.active]="bulkStep === 3">
                <span class="step-num">3</span> Confirm
              </div>
            </div>

            <!-- Step 1: Choose class + section -->
            @if (bulkStep === 1) {
              <div class="step-content">
                <div class="info-banner">
                  📅 Enrolling for: <strong>{{ getCurrentAcademicYearName() }}</strong>
                  <span class="info-sub">({{ selectedIds.length }} students selected)</span>
                </div>
                <div class="grid grid-2">
                  <div class="form-group">
                    <label>Class *</label>
                    <select class="form-select" [(ngModel)]="bulkClass" (change)="onBulkClassChange()">
                      <option value="">Select Class</option>
                      @for (c of classes(); track c._id) {
                        <option [value]="c._id">{{ c.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Default Section {{ bulkClassHasSections() ? '*' : '(no sections)' }}</label>
                    <select class="form-select" [(ngModel)]="bulkSection" [disabled]="!bulkClassHasSections()">
                      @if (bulkClassHasSections()) {
                        <option value="">Select Section</option>
                        @for (s of bulkSections(); track s) {
                          <option [value]="s">{{ s }}</option>
                        }
                      } @else {
                        <option value="">Not needed</option>
                      }
                    </select>
                  </div>
                </div>
                @if (bulkClass && bulkClassHasSections() && !bulkSection) {
                  <div class="warn-banner">⚠️ Please select a default section, or proceed to assign individually.</div>
                }
              </div>
            }

            <!-- Step 2: Per-student section assignment -->
            @if (bulkStep === 2) {
              <div class="step-content">
                <div class="info-banner">
                  Class: <strong>{{ getBulkClassName() }}</strong>
                  @if (bulkClassHasSections()) {
                    · Default section: <strong>{{ bulkSection || 'None' }}</strong>
                  }
                </div>
                <p class="step-desc">
                  @if (bulkClassHasSections()) {
                    Optionally change the section for individual students below:
                  } @else {
                    These students will be enrolled in <strong>{{ getBulkClassName() }}</strong> (no sections).
                  }
                </p>
                <div class="student-assign-list">
                  <div class="assign-header">
                    <span>Student</span>
                    @if (bulkClassHasSections()) { <span>Section</span> }
                  </div>
                  @for (sid of selectedIds; track sid) {
                    <div class="assign-row">
                      <span class="assign-name">{{ getStudentDisplayName(sid) }}</span>
                      @if (bulkClassHasSections()) {
                        <select class="form-select form-select-sm" [(ngModel)]="studentSectionMap[sid]">
                          @for (s of bulkSections(); track s) {
                            <option [value]="s">{{ s }}</option>
                          }
                        </select>
                      }
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Step 3: Confirm -->
            @if (bulkStep === 3) {
              <div class="step-content">
                <div class="confirm-summary">
                  <h3>Enrollment Summary</h3>
                  <div class="summary-grid">
                    <div class="summary-item"><span class="label">Academic Year</span><span>{{ getCurrentAcademicYearName() }}</span></div>
                    <div class="summary-item"><span class="label">Class</span><span>{{ getBulkClassName() }}</span></div>
                    <div class="summary-item"><span class="label">Students</span><span>{{ selectedIds.length }}</span></div>
                    @if (bulkClassHasSections()) {
                      <div class="summary-item"><span class="label">Sections</span><span>{{ getUniqueSections().join(', ') }}</span></div>
                    }
                  </div>
                </div>
                <div class="confirm-list">
                  @for (sid of selectedIds; track sid) {
                    <div class="confirm-row">
                      <span>{{ getStudentDisplayName(sid) }}</span>
                      @if (bulkClassHasSections()) {
                        <span class="section-badge">{{ studentSectionMap[sid] || bulkSection }}</span>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
          <div class="modal-footer">
            @if (bulkStep > 1) {
              <button class="btn btn-secondary" (click)="bulkStep = bulkStep - 1" style="margin-right:auto">← Back</button>
            }
            <button class="btn btn-secondary" (click)="showBulkModal = false">Cancel</button>
            @if (bulkStep < 3) {
              <button class="btn btn-primary" (click)="nextBulkStep()" [disabled]="!canProceedBulk()">
                Next →
              </button>
            } @else {
              <button class="btn btn-success" (click)="submitBulkEnroll()" [disabled]="bulkSaving()">
                @if (bulkSaving()) { <span class="spinner"></span> }
                Enroll {{ selectedIds.length }} Students
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-3); }
    .page-header h1 { font-size: var(--text-2xl); font-weight: 700; }
    .page-header p { color: var(--text-secondary); margin-top: var(--space-1); }
    .header-actions { display: flex; gap: var(--space-3); }
    .btn-success { background: #059669; color: white; }
    .btn-success:hover { background: #047857; }

    .filter-bar { margin-bottom: var(--space-4); }
    .filter-group { display: flex; gap: var(--space-4); flex-wrap: wrap; align-items: flex-end; }
    .filter-item { flex: 1; min-width: 130px; }
    .filter-item label { display: block; font-size: var(--text-xs); font-weight: 600; color: var(--text-secondary); margin-bottom: var(--space-1); text-transform: uppercase; letter-spacing: 0.05em; }
    .search-item { min-width: 220px; flex: 2; }

    .bulk-bar { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--radius-md); margin-bottom: var(--space-4); font-size: var(--text-sm); font-weight: 500; color: #065f46; }
    .bulk-hint { font-size: var(--text-xs); color: var(--text-tertiary); padding: var(--space-2) 0; }

    .th-check, .td-check { width: 40px; text-align: center; }
    .selected-row { background: #ecfdf5 !important; }
    .table-responsive { overflow-x: auto; }
    .student-link { display: flex; align-items: center; gap: var(--space-3); text-decoration: none; color: inherit; }
    .student-link:hover .student-name { color: var(--primary); }
    .avatar-sm { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; font-size: var(--text-xs); font-weight: 600; flex-shrink: 0; }
    .student-name { font-weight: 500; transition: color 0.15s; }
    .student-sub { font-size: var(--text-xs); color: var(--text-tertiary); }
    .adm-badge { background: var(--bg-secondary); padding: 2px 8px; border-radius: 6px; font-size: var(--text-xs); font-weight: 500; font-family: monospace; }
    .section-badge { display: inline-flex; min-width: 28px; height: 28px; align-items: center; justify-content: center; border-radius: 50%; background: var(--bg-secondary); font-weight: 600; font-size: var(--text-sm); padding: 0 4px; }
    .status-badge { padding: 2px 10px; border-radius: 12px; font-size: var(--text-xs); font-weight: 500; }
    .status-active { background: #dcfce7; color: #166534; }
    .status-inactive { background: #fee2e2; color: #991b1b; }
    .status-graduated { background: #dbeafe; color: #1e40af; }
    .status-rejected { background: #fecaca; color: #991b1b; }
    .status-suspended { background: #fed7aa; color: #c2410c; }
    .status-dropped { background: #fecaca; color: #991b1b; }
    .status-transferred_out { background: #e9d5ff; color: #7c3aed; }
    .action-btns { display: flex; gap: var(--space-1); align-items: center; }
    
    /* Dropdown */
    .dropdown { position: relative; }
    .dropdown-menu { position: absolute; top: 100%; right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); min-width: 180px; z-index: 100; padding: var(--space-1) 0; animation: fadeIn 0.15s; }
    .dropdown-item { padding: var(--space-2) var(--space-3); cursor: pointer; font-size: var(--text-sm); display: flex; align-items: center; gap: var(--space-2); }
    .dropdown-item:hover { background: var(--bg-secondary); }
    .dropdown-item.disabled { color: var(--text-tertiary); cursor: not-allowed; }
    .dropdown-item.text-danger { color: #dc2626; }
    .dropdown-divider { height: 1px; background: var(--border); margin: var(--space-1) 0; }
    .dropdown-right { right: 0; left: auto; }
    .action-dropdown { display: inline-block; }
    
    .empty-state { text-align: center; padding: var(--space-8) !important; color: var(--text-tertiary); }
    .table-footer { padding: var(--space-3) 0; }
    .pagination { display: flex; justify-content: center; align-items: center; gap: var(--space-4); margin-top: var(--space-2); }
    .page-info { font-size: var(--text-sm); color: var(--text-secondary); }

    /* Modal */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
    .modal { background: var(--surface); border-radius: var(--radius-xl); width: 90%; max-width: 580px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; animation: slideUp 0.3s; }
    .modal-lg { max-width: 720px; }
    .modal-header { display: flex; justify-content: space-between; align-items: flex-start; padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--border); }
    .modal-header h2 { font-size: var(--text-lg); font-weight: 600; }
    .modal-subtitle { font-size: var(--text-sm); color: var(--text-secondary); margin-top: 2px; }
    .modal-close { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-tertiary); }
    .modal-body { padding: var(--space-6); overflow-y: auto; flex: 1; }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--border); align-items: center; }

    /* Action modal specifics */
    .action-student-info { margin-bottom: var(--space-4); }
    .student-card { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3); background: var(--bg-secondary); border-radius: var(--radius-md); }
    .avatar-md { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; font-size: var(--text-base); font-weight: 600; }
    .student-details { font-size: var(--text-sm); color: var(--text-secondary); margin-top: 2px; }
    .bulk-info { padding: var(--space-3); background: #dbeafe; color: #1e40af; border-radius: var(--radius-md); font-weight: 500; }
    .form-group label.required::after { content: ' *'; color: #dc2626; }
    .btn-danger { background: #dc2626; color: white; }
    .btn-danger:hover { background: #b91c1c; }

    /* Steps */
    .steps { display: flex; align-items: center; justify-content: center; gap: var(--space-2); margin-bottom: var(--space-6); }
    .step { display: flex; align-items: center; gap: 6px; font-size: var(--text-sm); color: var(--text-tertiary); font-weight: 500; }
    .step.active { color: var(--primary); font-weight: 600; }
    .step.done { color: #059669; }
    .step-num { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; background: var(--bg-secondary); }
    .step.active .step-num { background: var(--primary); color: white; }
    .step.done .step-num { background: #059669; color: white; }
    .step-line { width: 32px; height: 2px; background: var(--border); }

    .step-content { min-height: 200px; }
    .step-desc { font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-4); }
    .info-banner { background: #dbeafe; color: #1e40af; padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); font-size: var(--text-sm); margin-bottom: var(--space-4); }
    .info-sub { color: #3b82f6; margin-left: var(--space-2); }
    .warn-banner { background: #fef3c7; color: #92400e; padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); font-size: var(--text-sm); margin-top: var(--space-2); }
    .form-group { margin-bottom: var(--space-4); }
    .form-group label { display: block; font-size: var(--text-sm); font-weight: 500; margin-bottom: var(--space-1); color: var(--text-secondary); }
    .grid { display: grid; gap: var(--space-4); }
    .grid-2 { grid-template-columns: 1fr 1fr; }

    .student-assign-list { border: 1px solid var(--border); border-radius: var(--radius-md); max-height: 280px; overflow-y: auto; }
    .assign-header { display: flex; justify-content: space-between; padding: var(--space-2) var(--space-3); background: var(--bg-secondary); font-size: var(--text-xs); font-weight: 600; color: var(--text-tertiary); text-transform: uppercase; position: sticky; top: 0; }
    .assign-row { display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--border); }
    .assign-row:last-child { border-bottom: none; }
    .assign-name { font-size: var(--text-sm); font-weight: 500; }
    .form-select-sm { width: 100px; padding: 4px 8px; font-size: var(--text-sm); }

    .confirm-summary { background: var(--bg-secondary); border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-4); }
    .confirm-summary h3 { font-size: var(--text-base); font-weight: 600; margin-bottom: var(--space-3); }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); }
    .summary-item { display: flex; justify-content: space-between; font-size: var(--text-sm); }
    .summary-item .label { color: var(--text-tertiary); }
    .confirm-list { border: 1px solid var(--border); border-radius: var(--radius-md); max-height: 200px; overflow-y: auto; }
    .confirm-row { display: flex; justify-content: space-between; align-items: center; padding: var(--space-2) var(--space-3); border-bottom: 1px solid var(--border); font-size: var(--text-sm); }
    .confirm-row:last-child { border-bottom: none; }

    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @media (max-width: 768px) { 
      .filter-group { flex-direction: column; } 
      .grid-2 { grid-template-columns: 1fr; } 
      .page-header { flex-direction: column; align-items: stretch; }
      .header-actions { flex-direction: column; gap: var(--space-2); }
      .header-actions .dropdown { width: 100%; }
      .header-actions .dropdown .btn { width: 100%; }
      .header-actions > .btn { width: 100%; }
      .action-btns { flex-wrap: wrap; gap: 4px; }
      .action-btns .btn { padding: 4px 8px; font-size: 12px; }
      .data-table th, .data-table td { padding: 8px 6px; font-size: 12px; }
      .student-link { flex-direction: column; align-items: flex-start; gap: 4px; }
      .avatar-sm { width: 28px; height: 28px; font-size: 10px; }
      .dropdown-menu { min-width: 150px; right: 0; }
    }
    @media (max-width: 480px) {
      .header-actions { gap: var(--space-2); }
      .action-btns { gap: 2px; }
      .action-btns .btn { padding: 2px 6px; }
      .table-responsive { margin: 0 -16px; }
      .data-table th:nth-child(4), .data-table td:nth-child(4),
      .data-table th:nth-child(5), .data-table td:nth-child(5),
      .data-table th:nth-child(6), .data-table td:nth-child(6),
      .data-table th:nth-child(7), .data-table td:nth-child(7) { display: none; }
    }
  `]
})
export class StudentListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  students = signal<Student[]>([]);
  academicYears = signal<AcademicYear[]>([]);
  classes = signal<ClassModel[]>([]);
  availableSections = signal<string[]>([]);
  statusOptions = signal<StudentStatusOption[]>([]);
  actionOptions = signal<StudentActionOption[]>([]);

  search = '';
  filterAcademicYear = '';
  filterClass = '';
  filterSection = '';
  filterStatus = '';
  page = signal(1);
  totalPages = signal(1);
  totalCount = signal(0);
  private searchTimeout: any;

  // Selection
  selectedIds: string[] = [];
  showBulkActionMenu = false;

  // Bulk enroll modal
  showBulkModal = false;
  bulkStep = 1;
  bulkClass = '';
  bulkSection = '';
  bulkSections = signal<string[]>([]);
  studentSectionMap: Record<string, string> = {};
  bulkSaving = signal(false);
  private currentAcademicYearId = '';

  // Action modal
  showActionModal = false;
  selectedStudent: Student | null = null;
  currentAction: StudentActionOption | null = null;
  isBulkAction = false;
  openActionMenuId: string | null = null;
  actionSections = signal<string[]>([]);
  actionSaving = signal(false);
  actionData: any = {};

  ngOnInit(): void {
    this.loadAcademicYears();
    this.loadClasses();
    this.loadActionOptions();
    this.loadStatusOptions();

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
      this.openActionMenuId = null;
      this.showBulkActionMenu = false;
    });

    // Read queryParams for pre-filtering from class list navigation
    const qp = this.route.snapshot.queryParams;
    if (qp['classId']) this.filterClass = qp['classId'];
    if (qp['section']) this.filterSection = qp['section'];

    this.loadStudents();
  }

  loadActionOptions(): void {
    this.api.get<any>('/students/options/actions').subscribe({
      next: (res) => {
        const data = res.data?.items || res.data?.data || res.data || [];
        this.actionOptions.set(Array.isArray(data) ? data : []);
      }
    });
  }

  loadStatusOptions(): void {
    // Derive from action options' applicableStatuses
    const statuses = [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'pending_approval', label: 'Pending Approval' },
      { value: 'graduated', label: 'Graduated' },
      { value: 'transferred_out', label: 'Transferred Out' },
      { value: 'dropped', label: 'Dropped/Withdrawn' },
      { value: 'suspended', label: 'Suspended' },
      { value: 'rejected', label: 'Rejected' },
    ];
    this.statusOptions.set(statuses);
  }

  getStatusLabel(status: string): string {
    const opt = this.statusOptions().find(s => s.value === status);
    return opt?.label || status;
  }

  loadAcademicYears(): void {
    this.api.get<any>('/academic-years').subscribe({
      next: (res) => {
        const data = res.data?.items || res.data?.data || res.data || [];
        const years = Array.isArray(data) ? data : [];
        this.academicYears.set(years);
        const current = years.find((y: any) => y.isCurrent);
        if (current) this.currentAcademicYearId = current._id;
      }
    });
  }

  loadClasses(): void {
    this.api.get<any>('/classes', { limit: 100 }).subscribe({
      next: (res) => {
        const data = res.data?.items || res.data?.data || res.data || [];
        this.classes.set(Array.isArray(data) ? data : []);
        // If pre-filtered class, load sections
        if (this.filterClass) {
          const cls = this.classes().find(c => c._id === this.filterClass);
          this.availableSections.set(cls?.sections?.map(s => s.name) || []);
        }
      }
    });
  }

  onClassChange(): void {
    const cls = this.classes().find(c => c._id === this.filterClass);
    this.availableSections.set(cls?.sections?.map(s => s.name) || []);
    this.filterSection = '';
    this.onFilterChange();
  }

  onFilterChange(): void { this.page.set(1); this.loadStudents(); }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => { this.page.set(1); this.loadStudents(); }, 400);
  }

  loadStudents(): void {
    this.loading.set(true);
    const params: any = { page: this.page(), limit: 20 };
    if (this.search) params.search = this.search;
    if (this.filterClass) params.classId = this.filterClass;
    if (this.filterSection) params.section = this.filterSection;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterAcademicYear) params.academicYearId = this.filterAcademicYear;

    this.api.get<any>('/students', params).subscribe({
      next: (res) => {
        const data = res.data?.items || res.data?.data || res.data || [];
        this.students.set(Array.isArray(data) ? data : []);
        this.totalPages.set(res.data?.totalPages || 1);
        this.totalCount.set(res.data?.total || 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  goToPage(p: number): void { this.page.set(p); this.loadStudents(); }

  getClassName(currentClass: any): string {
    if (!currentClass) return '—';
    if (typeof currentClass === 'string') return currentClass;
    return currentClass.name || '—';
  }

  // ═══ Selection ═══
  isSelected(id: string): boolean { return this.selectedIds.includes(id); }

  toggleSelect(id: string): void {
    const idx = this.selectedIds.indexOf(id);
    if (idx >= 0) this.selectedIds.splice(idx, 1);
    else this.selectedIds.push(id);
  }

  isAllSelected(): boolean {
    if (this.students().length === 0) return false;
    return this.students().every(s => this.selectedIds.includes(s._id));
  }

  toggleSelectAll(): void {
    if (this.isAllSelected()) {
      // Deselect all on this page
      const pageIds = new Set(this.students().map(s => s._id));
      this.selectedIds = this.selectedIds.filter(id => !pageIds.has(id));
    } else {
      // Select all on this page (add to existing selection)
      const currentIds = new Set(this.selectedIds);
      this.students().forEach(s => { if (!currentIds.has(s._id)) this.selectedIds.push(s._id); });
    }
  }

  clearSelection(): void { this.selectedIds = []; }

  // ═══ Action Dropdown ═══
  toggleActionMenu(studentId: string): void {
    event?.stopPropagation();
    this.openActionMenuId = this.openActionMenuId === studentId ? null : studentId;
  }

  getApplicableActions(status: string): StudentActionOption[] {
    return this.actionOptions().filter(opt => opt.applicableStatuses.includes(status));
  }

  isActionIn(actions: string[]): boolean {
    return !!this.currentAction && actions.includes(this.currentAction.action);
  }

  // ═══ Action Modal ═══
  openActionModal(student: Student, action: StudentActionOption): void {
    this.selectedStudent = student;
    this.currentAction = action;
    this.isBulkAction = false;
    this.openActionMenuId = null;
    this.actionData = {
      toAcademicYearId: this.currentAcademicYearId,
    };
    this.showActionModal = true;
  }

  openBulkAction(actionCode: string): void {
    if (this.selectedIds.length === 0) { 
      this.toast.error('Select at least one student'); 
      return; 
    }
    const action = this.actionOptions().find(a => a.action === actionCode);
    if (!action) { 
      this.toast.error('Action not available'); 
      return; 
    }
    this.currentAction = action;
    this.selectedStudent = null;
    this.isBulkAction = true;
    this.actionData = {
      toAcademicYearId: this.currentAcademicYearId,
    };
    this.showActionModal = true;
  }

  closeActionModal(): void {
    this.showActionModal = false;
    this.selectedStudent = null;
    this.currentAction = null;
    this.isBulkAction = false;
    this.actionData = {};
    this.actionSections.set([]);
  }

  onActionClassChange(): void {
    const cls = this.classes().find(c => c._id === this.actionData.toClassId);
    this.actionSections.set(cls?.sections?.map(s => s.name) || []);
    this.actionData.toSection = '';
  }

  executeAction(): void {
    if (!this.currentAction) return;

    // Validate required fields
    if (this.currentAction.requiresClass && !this.actionData.toClassId) {
      this.toast.error('Please select a target class');
      return;
    }
    if (this.currentAction.requiresAcademicYear && !this.actionData.toAcademicYearId) {
      this.toast.error('Please select an academic year');
      return;
    }

    this.actionSaving.set(true);
    const payload = {
      action: this.currentAction.action,
      ...this.actionData
    };

    if (this.isBulkAction) {
      // Bulk action
      this.api.post('/students/bulk/action', {
        studentIds: this.selectedIds,
        ...payload
      }).subscribe({
        next: (res: any) => {
          const data = res.data?.data || res.data || {};
          this.toast.success(`${data.success || 0} students updated, ${data.failed || 0} failed`);
          this.closeActionModal();
          this.selectedIds = [];
          this.loadStudents();
          this.actionSaving.set(false);
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Action failed');
          this.actionSaving.set(false);
        }
      });
    } else if (this.selectedStudent) {
      // Single action
      this.api.post(`/students/${this.selectedStudent._id}/action`, payload).subscribe({
        next: (res: any) => {
          this.toast.success(res.message || 'Action completed successfully');
          this.closeActionModal();
          this.loadStudents();
          this.actionSaving.set(false);
        },
        error: (err) => {
          this.toast.error(err?.error?.message || 'Action failed');
          this.actionSaving.set(false);
        }
      });
    }
  }

  // ═══ Bulk Enroll Modal ═══
  openBulkEnroll(): void {
    if (this.selectedIds.length === 0) { this.toast.error('Select at least one student'); return; }
    if (!this.currentAcademicYearId) { this.toast.error('No active academic year found'); return; }
    this.bulkStep = 1;
    this.bulkClass = '';
    this.bulkSection = '';
    this.studentSectionMap = {};
    this.showBulkModal = true;
  }

  onBulkClassChange(): void {
    const cls = this.classes().find(c => c._id === this.bulkClass);
    const sections = cls?.sections?.map(s => s.name) || [];
    this.bulkSections.set(sections);
    this.bulkSection = sections.length > 0 ? sections[0] : '';
    // Pre-fill per-student map with default section
    this.selectedIds.forEach(id => { this.studentSectionMap[id] = this.bulkSection; });
  }

  bulkClassHasSections(): boolean { return this.bulkSections().length > 0; }

  getBulkClassName(): string {
    const cls = this.classes().find(c => c._id === this.bulkClass);
    return cls?.name || '';
  }

  getCurrentAcademicYearName(): string {
    const ay = this.academicYears().find(y => y._id === this.currentAcademicYearId);
    return ay?.name || 'Current';
  }

  getStudentDisplayName(id: string): string {
    const s = this.students().find(st => st._id === id);
    if (s) return `${s.firstName} ${s.lastName} (${s.admissionNumber})`;
    return id;
  }

  getUniqueSections(): string[] {
    if (!this.bulkClassHasSections()) return [];
    const set = new Set(this.selectedIds.map(id => this.studentSectionMap[id] || this.bulkSection).filter(Boolean));
    return Array.from(set);
  }

  canProceedBulk(): boolean {
    if (this.bulkStep === 1) return !!this.bulkClass;
    if (this.bulkStep === 2) return true;
    return true;
  }

  nextBulkStep(): void {
    if (this.bulkStep === 1 && !this.bulkClass) { this.toast.error('Please select a class'); return; }
    // When moving from step 1 to 2, fill section map
    if (this.bulkStep === 1) {
      this.selectedIds.forEach(id => {
        if (!this.studentSectionMap[id]) this.studentSectionMap[id] = this.bulkSection;
      });
    }
    this.bulkStep++;
  }

  submitBulkEnroll(): void {
    this.bulkSaving.set(true);
    const students = this.selectedIds.map(id => ({
      studentId: id,
      section: this.bulkClassHasSections() ? (this.studentSectionMap[id] || this.bulkSection) : undefined,
    }));

    const payload: any = {
      academicYearId: this.currentAcademicYearId,
      classId: this.bulkClass,
      students,
    };
    if (this.bulkClassHasSections() && this.bulkSection) {
      payload.section = this.bulkSection;
    }

    this.api.post('/enrollments/bulk', payload).subscribe({
      next: (res: any) => {
        const d = res.data?.data || res.data || {};
        const successCount = d.success || 0;
        const failCount = d.failed || 0;
        if (failCount > 0) {
          this.toast.success(`Enrolled ${successCount} students. ${failCount} failed.`);
          if (d.errors?.length) {
            d.errors.forEach((e: any) => this.toast.error(`${e.studentId}: ${e.error}`));
          }
        } else {
          this.toast.success(`Successfully enrolled ${successCount} students!`);
        }
        this.showBulkModal = false;
        this.bulkSaving.set(false);
        this.selectedIds = [];
        this.loadStudents();
      },
      error: (err) => {
        this.bulkSaving.set(false);
        this.toast.error(err?.error?.message || 'Bulk enrollment failed');
      }
    });
  }
}
