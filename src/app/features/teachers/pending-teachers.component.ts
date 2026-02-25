import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

interface PendingTeacher {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: string;
  designation?: string;
  department?: string;
  qualifications?: string[];
  registrationDate: string;
  message?: string;
}

@Component({
  selector: 'app-pending-teachers',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-content">
          <h1>Pending Teacher Registrations</h1>
          <p class="subtitle">Review and approve or reject teacher registration requests</p>
        </div>
        <button class="btn btn-ghost" (click)="loadPendingTeachers()">
          🔄 Refresh
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading pending registrations...</p>
        </div>
      } @else if (teachers().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>No Pending Registrations</h3>
          <p>All teacher registrations have been processed.</p>
        </div>
      } @else {
        <div class="teachers-grid">
          @for (teacher of teachers(); track teacher._id) {
            <div class="teacher-card">
              <div class="teacher-header">
                <div class="avatar">{{ teacher.firstName.charAt(0) }}{{ teacher.lastName.charAt(0) }}</div>
                <div class="teacher-info">
                  <h3>{{ teacher.firstName }} {{ teacher.lastName }}</h3>
                  <p class="email">{{ teacher.email }}</p>
                </div>
              </div>

              <div class="teacher-details">
                @if (teacher.phone) {
                  <div class="detail-row">
                    <span class="label">📞 Phone:</span>
                    <span class="value">{{ teacher.phone }}</span>
                  </div>
                }
                @if (teacher.designation) {
                  <div class="detail-row">
                    <span class="label">💼 Designation:</span>
                    <span class="value">{{ teacher.designation }}</span>
                  </div>
                }
                @if (teacher.department) {
                  <div class="detail-row">
                    <span class="label">🏛️ Department:</span>
                    <span class="value">{{ teacher.department }}</span>
                  </div>
                }
                @if (teacher.qualifications && teacher.qualifications.length > 0) {
                  <div class="detail-row">
                    <span class="label">🎓 Qualifications:</span>
                    <span class="value">{{ teacher.qualifications.join(', ') }}</span>
                  </div>
                }
                @if (teacher.gender) {
                  <div class="detail-row">
                    <span class="label">👤 Gender:</span>
                    <span class="value">{{ teacher.gender | titlecase }}</span>
                  </div>
                }
                <div class="detail-row">
                  <span class="label">📅 Applied:</span>
                  <span class="value">{{ formatDate(teacher.registrationDate) }}</span>
                </div>
                @if (teacher.message) {
                  <div class="message-box">
                    <span class="label">💬 Message:</span>
                    <p class="message-text">{{ teacher.message }}</p>
                  </div>
                }
              </div>

              <div class="teacher-actions">
                <button class="btn btn-success" (click)="approveTeacher(teacher)" [disabled]="processingId() === teacher._id">
                  @if (processingId() === teacher._id && processingAction() === 'approve') {
                    <span class="spinner-sm"></span>
                  } @else {
                    ✓ Approve
                  }
                </button>
                <button class="btn btn-danger btn-outline" (click)="openRejectModal(teacher)" [disabled]="processingId() === teacher._id">
                  ✗ Reject
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Reject Modal -->
      @if (showRejectModal()) {
        <div class="modal-overlay" (click)="closeRejectModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Reject Teacher Registration</h3>
              <button class="modal-close" (click)="closeRejectModal()">×</button>
            </div>
            <div class="modal-body">
              <p>You are about to reject the registration for <strong>{{ selectedTeacher()?.firstName }} {{ selectedTeacher()?.lastName }}</strong>.</p>
              <div class="form-group">
                <label class="form-label">Reason for rejection *</label>
                <textarea class="form-textarea" [(ngModel)]="rejectReason" rows="3" 
                          placeholder="Please provide a reason for rejection..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" (click)="closeRejectModal()">Cancel</button>
              <button class="btn btn-danger" (click)="confirmReject()" [disabled]="!rejectReason.trim() || processingId()">
                @if (processingId() && processingAction() === 'reject') {
                  <span class="spinner-sm"></span> Rejecting...
                } @else {
                  Reject Registration
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Approve Modal -->
      @if (showApproveModal()) {
        <div class="modal-overlay" (click)="closeApproveModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>Approve Teacher Registration</h3>
              <button class="modal-close" (click)="closeApproveModal()">×</button>
            </div>
            <div class="modal-body">
              <p>Approving registration for <strong>{{ selectedTeacher()?.firstName }} {{ selectedTeacher()?.lastName }}</strong></p>
              <p class="hint-text">You can modify details before approving:</p>
              
              <div class="form-group">
                <label class="form-label">Designation</label>
                <input type="text" class="form-input" [(ngModel)]="approveForm.designation" placeholder="e.g., Senior Teacher" />
              </div>
              
              <div class="form-group">
                <label class="form-label">Department</label>
                <input type="text" class="form-input" [(ngModel)]="approveForm.department" placeholder="e.g., Mathematics" />
              </div>
              
              <div class="form-group">
                <label class="form-label">Employee ID (optional)</label>
                <input type="text" class="form-input" [(ngModel)]="approveForm.employeeId" placeholder="e.g., EMP001" />
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-ghost" (click)="closeApproveModal()">Cancel</button>
              <button class="btn btn-success" (click)="confirmApprove()" [disabled]="processingId()">
                @if (processingId() && processingAction() === 'approve') {
                  <span class="spinner-sm"></span> Approving...
                } @else {
                  Approve Teacher
                }
              </button>
            </div>
          </div>
        </div>
      }

      @if (successMessage()) {
        <div class="toast success">{{ successMessage() }}</div>
      }
      @if (errorMessage()) {
        <div class="toast error">{{ errorMessage() }}</div>
      }
    </div>
  `,
  styles: [`
    .page-container { padding: var(--space-6); }
    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: var(--space-6);
    }
    .page-header h1 { font-size: var(--text-2xl); font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-1); }
    .subtitle { color: var(--text-secondary); }

    .loading-state, .empty-state {
      text-align: center; padding: var(--space-12);
    }
    .spinner {
      width: 40px; height: 40px; border: 3px solid var(--border);
      border-top-color: var(--primary); border-radius: 50%;
      animation: spin 0.8s linear infinite; margin: 0 auto var(--space-4);
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-icon { font-size: 64px; margin-bottom: var(--space-4); }
    .empty-state h3 { font-size: var(--text-xl); color: var(--text-primary); margin-bottom: var(--space-2); }
    .empty-state p { color: var(--text-secondary); }

    .teachers-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: var(--space-4);
    }

    .teacher-card {
      background: var(--surface); border-radius: var(--radius-lg);
      border: 1px solid var(--border); padding: var(--space-5);
      transition: var(--transition-fast);
    }
    .teacher-card:hover {
      box-shadow: var(--shadow-md); border-color: var(--primary-light);
    }

    .teacher-header {
      display: flex; align-items: center; gap: var(--space-3);
      margin-bottom: var(--space-4); padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--border);
    }
    .avatar {
      width: 56px; height: 56px; border-radius: 50%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: var(--text-lg); font-weight: 700;
    }
    .teacher-info h3 { font-size: var(--text-lg); font-weight: 600; color: var(--text-primary); }
    .email { color: var(--text-secondary); font-size: var(--text-sm); }

    .teacher-details { margin-bottom: var(--space-4); }
    .detail-row {
      display: flex; gap: var(--space-2); margin-bottom: var(--space-2);
      font-size: var(--text-sm);
    }
    .detail-row .label { color: var(--text-tertiary); min-width: 130px; }
    .detail-row .value { color: var(--text-primary); font-weight: 500; }

    .message-box {
      background: var(--surface-secondary); border-radius: var(--radius-md);
      padding: var(--space-3); margin-top: var(--space-3);
    }
    .message-box .label { font-size: var(--text-sm); color: var(--text-tertiary); display: block; margin-bottom: var(--space-1); }
    .message-text { font-size: var(--text-sm); color: var(--text-primary); margin: 0; font-style: italic; }

    .teacher-actions {
      display: flex; gap: var(--space-3); padding-top: var(--space-4);
      border-top: 1px solid var(--border);
    }
    .teacher-actions .btn { flex: 1; }

    .btn-success { background: var(--success); color: white; border: none; }
    .btn-success:hover { background: #059669; }
    .btn-danger { background: var(--danger); color: white; border: none; }
    .btn-danger.btn-outline { background: transparent; color: var(--danger); border: 1px solid var(--danger); }
    .btn-danger.btn-outline:hover { background: rgba(239,68,68,0.1); }

    .spinner-sm {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.6s linear infinite; display: inline-block; margin-right: var(--space-1);
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: var(--surface); border-radius: var(--radius-lg);
      width: 100%; max-width: 500px; animation: slideUp 0.3s ease-out;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border);
    }
    .modal-header h3 { font-size: var(--text-lg); font-weight: 600; margin: 0; }
    .modal-close {
      background: none; border: none; font-size: 24px; color: var(--text-tertiary);
      cursor: pointer; line-height: 1;
    }
    .modal-body { padding: var(--space-5); }
    .modal-body p { margin-bottom: var(--space-4); }
    .form-textarea {
      width: 100%; padding: var(--space-3); border: 1px solid var(--border);
      border-radius: var(--radius-md); font-size: var(--text-base);
      resize: vertical; font-family: inherit;
    }
    .form-textarea:focus { outline: none; border-color: var(--primary); }
    .modal-footer {
      display: flex; gap: var(--space-3); justify-content: flex-end;
      padding: var(--space-4) var(--space-5); border-top: 1px solid var(--border);
    }

    /* Toast */
    .toast {
      position: fixed; bottom: var(--space-6); right: var(--space-6);
      padding: var(--space-3) var(--space-5); border-radius: var(--radius-md);
      font-weight: 500; animation: slideIn 0.3s ease-out;
      z-index: 1001;
    }
    .toast.success { background: var(--success); color: white; }
    .toast.error { background: var(--danger); color: white; }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }

    @media (max-width: 600px) {
      .teachers-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class PendingTeachersComponent implements OnInit {
  private http = inject(HttpClient);

  loading = signal(true);
  teachers = signal<PendingTeacher[]>([]);
  processingId = signal<string | null>(null);
  processingAction = signal<'approve' | 'reject' | null>(null);
  showRejectModal = signal(false);
  showApproveModal = signal(false);
  selectedTeacher = signal<PendingTeacher | null>(null);
  rejectReason = '';
  successMessage = signal('');
  errorMessage = signal('');
  
  // Approval form fields
  approveForm = {
    designation: '',
    department: '',
    employeeId: ''
  };

  ngOnInit(): void {
    this.loadPendingTeachers();
  }

  loadPendingTeachers(): void {
    this.loading.set(true);
    this.http.get<any>('/api/v1/auth/teachers/pending').subscribe({
      next: (res) => {
        // Handle both normalized (items array) and raw response formats
        const data = res.data?.items || res.data || [];
        this.teachers.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: (err) => {
        this.showError('Failed to load pending teachers');
        this.loading.set(false);
      }
    });
  }

  approveTeacher(teacher: PendingTeacher): void {
    this.selectedTeacher.set(teacher);
    this.approveForm = {
      designation: teacher.designation || '',
      department: teacher.department || '',
      employeeId: ''
    };
    this.showApproveModal.set(true);
  }

  closeApproveModal(): void {
    this.showApproveModal.set(false);
    this.approveForm = { designation: '', department: '', employeeId: '' };
  }

  confirmApprove(): void {
    const teacher = this.selectedTeacher();
    if (!teacher) return;

    this.processingId.set(teacher._id);
    this.processingAction.set('approve');
    
    const payload: any = {};
    if (this.approveForm.designation) payload.designation = this.approveForm.designation;
    if (this.approveForm.department) payload.department = this.approveForm.department;
    if (this.approveForm.employeeId) payload.employeeId = this.approveForm.employeeId;

    this.http.post<any>(`/api/v1/auth/teachers/${teacher._id}/approve`, payload).subscribe({
      next: (res) => {
        this.teachers.update(list => list.filter(t => t._id !== teacher._id));
        this.showSuccess(`${teacher.firstName} ${teacher.lastName} has been approved!`);
        this.closeApproveModal();
        this.processingId.set(null);
        this.processingAction.set(null);
      },
      error: (err) => {
        this.showError(err.error?.message || 'Failed to approve teacher');
        this.processingId.set(null);
        this.processingAction.set(null);
      }
    });
  }

  openRejectModal(teacher: PendingTeacher): void {
    this.selectedTeacher.set(teacher);
    this.rejectReason = '';
    this.showRejectModal.set(true);
  }

  closeRejectModal(): void {
    this.showRejectModal.set(false);
    this.selectedTeacher.set(null);
    this.rejectReason = '';
  }

  confirmReject(): void {
    const teacher = this.selectedTeacher();
    if (!teacher || !this.rejectReason.trim()) return;

    this.processingId.set(teacher._id);
    this.processingAction.set('reject');

    this.http.post<any>(`/api/v1/auth/teachers/${teacher._id}/reject`, {
      reason: this.rejectReason.trim()
    }).subscribe({
      next: (res) => {
        this.teachers.update(list => list.filter(t => t._id !== teacher._id));
        this.showSuccess(`${teacher.firstName} ${teacher.lastName}'s registration has been rejected`);
        this.closeRejectModal();
        this.processingId.set(null);
        this.processingAction.set(null);
      },
      error: (err) => {
        this.showError(err.error?.message || 'Failed to reject teacher');
        this.processingId.set(null);
        this.processingAction.set(null);
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  private showSuccess(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => this.successMessage.set(''), 4000);
  }

  private showError(message: string): void {
    this.errorMessage.set(message);
    setTimeout(() => this.errorMessage.set(''), 4000);
  }
}
