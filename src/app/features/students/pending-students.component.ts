import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

interface PendingStudent {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  currentClass?: { _id: string; name: string; grade: number };
  currentSection?: string;
  dateOfBirth?: string;
  gender?: string;
  registrationDate?: string;
  parentInfo?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    relation?: string;
  };
}

@Component({
  selector: 'app-pending-students',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>📋 Pending Student Registrations</h1>
        <p>Review and approve student registration requests</p>
      </div>
      <div class="header-stats">
        <span class="stat-badge">{{ students().length }} pending</span>
      </div>
    </div>

    <div class="card">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading pending registrations...</p>
        </div>
      } @else if (students().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>No Pending Registrations</h3>
          <p>All student registrations have been processed.</p>
        </div>
      } @else {
        <div class="student-cards">
          @for (student of students(); track student._id) {
            <div class="student-card" [class.expanded]="expandedId === student._id">
              <div class="card-header" (click)="toggleExpand(student._id)">
                <div class="student-info">
                  <div class="avatar">{{ student.firstName?.charAt(0) }}{{ student.lastName?.charAt(0) }}</div>
                  <div class="details">
                    <div class="name">{{ student.firstName }} {{ student.lastName }}</div>
                    <div class="meta">
                      <span class="class-badge">{{ student.currentClass?.name || 'N/A' }}</span>
                      <span class="section-badge">Section {{ student.currentSection || 'N/A' }}</span>
                    </div>
                  </div>
                </div>
                <div class="card-actions">
                  <button class="btn btn-success btn-sm" (click)="approve(student, $event)" [disabled]="processing() === student._id">
                    @if (processing() === student._id) {
                      <span class="spinner-sm"></span>
                    } @else {
                      ✓ Approve
                    }
                  </button>
                  <button class="btn btn-danger btn-sm" (click)="showRejectModal(student, $event)" [disabled]="processing() === student._id">
                    ✕ Reject
                  </button>
                  <button class="expand-btn" (click)="toggleExpand(student._id); $event.stopPropagation()">
                    {{ expandedId === student._id ? '▲' : '▼' }}
                  </button>
                </div>
              </div>

              @if (expandedId === student._id) {
                <div class="card-body">
                  <div class="info-grid">
                    <div class="info-item">
                      <label>Email</label>
                      <span>{{ student.email || '-' }}</span>
                    </div>
                    <div class="info-item">
                      <label>Phone</label>
                      <span>{{ student.phone || '-' }}</span>
                    </div>
                    <div class="info-item">
                      <label>Date of Birth</label>
                      <span>{{ student.dateOfBirth ? (student.dateOfBirth | date:'mediumDate') : '-' }}</span>
                    </div>
                    <div class="info-item">
                      <label>Gender</label>
                      <span>{{ student.gender || '-' }}</span>
                    </div>
                    <div class="info-item">
                      <label>Registration Date</label>
                      <span>{{ student.registrationDate ? (student.registrationDate | date:'medium') : '-' }}</span>
                    </div>
                  </div>

                  @if (student.parentInfo) {
                    <div class="parent-section">
                      <h4>👨‍👩‍👦 Parent/Guardian Information</h4>
                      <div class="info-grid">
                        <div class="info-item">
                          <label>Name</label>
                          <span>{{ student.parentInfo.firstName }} {{ student.parentInfo.lastName }}</span>
                        </div>
                        <div class="info-item">
                          <label>Relationship</label>
                          <span>{{ student.parentInfo.relation || '-' }}</span>
                        </div>
                        <div class="info-item">
                          <label>Email</label>
                          <span>{{ student.parentInfo.email || '-' }}</span>
                        </div>
                        <div class="info-item">
                          <label>Phone</label>
                          <span>{{ student.parentInfo.phone || '-' }}</span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- Reject Modal -->
    @if (rejectModalStudent()) {
      <div class="modal-overlay" (click)="closeRejectModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Reject Registration</h3>
            <button class="close-btn" (click)="closeRejectModal()">×</button>
          </div>
          <div class="modal-body">
            <p>You are about to reject the registration for <strong>{{ rejectModalStudent()?.firstName }} {{ rejectModalStudent()?.lastName }}</strong>.</p>
            <div class="form-group">
              <label class="form-label">Reason for rejection *</label>
              <textarea class="form-input" [(ngModel)]="rejectReason" rows="3" placeholder="Please provide a reason for rejecting this registration..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="closeRejectModal()">Cancel</button>
            <button class="btn btn-danger" (click)="confirmReject()" [disabled]="!rejectReason.trim() || processing()">
              @if (processing()) {
                <span class="spinner-sm"></span>
              }
              Reject Registration
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Approve Modal -->
    @if (approveModalStudent()) {
      <div class="modal-overlay" (click)="closeApproveModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Approve Student Registration</h3>
            <button class="close-btn" (click)="closeApproveModal()">×</button>
          </div>
          <div class="modal-body">
            <p>Approving registration for <strong>{{ approveModalStudent()?.firstName }} {{ approveModalStudent()?.lastName }}</strong></p>
            <p class="hint">You can modify the class/section before approving:</p>
            
            <div class="form-group">
              <label class="form-label">Class</label>
              <select class="form-select" [(ngModel)]="approveForm.classId" (change)="onApproveClassChange()">
                <option value="">Keep original</option>
                @for (c of classes(); track c._id) {
                  <option [value]="c._id">{{ c.name }} (Grade {{ c.grade }})</option>
                }
              </select>
            </div>
            
            @if (availableSections.length > 0) {
              <div class="form-group">
                <label class="form-label">Section</label>
                <select class="form-select" [(ngModel)]="approveForm.section">
                  <option value="">Select section</option>
                  @for (s of availableSections; track s) {
                    <option [value]="s">Section {{ s }}</option>
                  }
                </select>
              </div>
            } @else {
              <div class="form-group">
                <label class="form-label">Section</label>
                <input type="text" class="form-input" [(ngModel)]="approveForm.section" placeholder="e.g., A" />
              </div>
            }
            
            <div class="form-group">
              <label class="form-label">Roll Number (optional)</label>
              <input type="text" class="form-input" [(ngModel)]="approveForm.rollNumber" placeholder="e.g., 101" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="closeApproveModal()">Cancel</button>
            <button class="btn btn-success" (click)="confirmApprove()" [disabled]="processing()">
              @if (processing()) {
                <span class="spinner-sm"></span>
              }
              Approve Student
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); }
    .header-stats { display: flex; gap: var(--space-3); }
    .stat-badge { 
      background: var(--warning-light, rgba(245,158,11,0.1)); 
      color: var(--warning, #d97706); 
      padding: var(--space-2) var(--space-4); 
      border-radius: var(--radius-full); 
      font-weight: 600; 
      font-size: var(--text-sm); 
    }

    .loading-state, .empty-state { 
      text-align: center; 
      padding: var(--space-12); 
    }
    .spinner {
      width: 40px; height: 40px; 
      border: 3px solid var(--border); border-top-color: var(--primary);
      border-radius: 50%; animation: spin 0.8s linear infinite;
      margin: 0 auto var(--space-4);
    }
    .spinner-sm {
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3); border-top-color: white;
      border-radius: 50%; animation: spin 0.6s linear infinite;
      display: inline-block; margin-right: var(--space-1);
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-icon { font-size: 48px; margin-bottom: var(--space-4); }
    .empty-state h3 { margin-bottom: var(--space-2); }
    .empty-state p { color: var(--text-secondary); }

    .student-cards { display: flex; flex-direction: column; gap: var(--space-4); }
    .student-card {
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      transition: var(--transition-fast);
    }
    .student-card:hover { border-color: var(--primary-light); box-shadow: var(--shadow-sm); }
    .student-card.expanded { border-color: var(--primary); }

    .card-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-4); cursor: pointer;
      background: var(--surface);
    }
    .student-info { display: flex; align-items: center; gap: var(--space-3); }
    .avatar {
      width: 48px; height: 48px; border-radius: 50%;
      background: var(--primary); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: var(--text-lg); font-weight: 600;
    }
    .details .name { font-weight: 600; font-size: var(--text-base); color: var(--text-primary); }
    .details .meta { display: flex; gap: var(--space-2); margin-top: var(--space-1); }
    .class-badge, .section-badge {
      font-size: var(--text-xs); padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm); background: var(--surface-secondary);
      color: var(--text-secondary);
    }
    .class-badge { background: var(--primary-light); color: var(--primary); }

    .card-actions { display: flex; align-items: center; gap: var(--space-2); }
    .btn-success { background: var(--success, #22c55e); color: white; border: none; }
    .btn-danger { background: var(--danger, #ef4444); color: white; border: none; }
    .expand-btn {
      background: none; border: none; color: var(--text-tertiary);
      padding: var(--space-2); cursor: pointer; font-size: var(--text-sm);
    }

    .card-body {
      padding: var(--space-4); border-top: 1px solid var(--border);
      background: var(--surface-secondary);
      animation: slideDown 0.2s ease-out;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: var(--space-4); }
    .info-item label { display: block; font-size: var(--text-xs); color: var(--text-tertiary); margin-bottom: var(--space-1); }
    .info-item span { font-weight: 500; color: var(--text-primary); }

    .parent-section { margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border); }
    .parent-section h4 { margin-bottom: var(--space-3); font-size: var(--text-sm); }

    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
      z-index: 1000; animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .modal {
      background: var(--surface); border-radius: var(--radius-lg);
      width: 100%; max-width: 450px; animation: slideUp 0.2s ease-out;
    }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4); border-bottom: 1px solid var(--border); }
    .modal-header h3 { margin: 0; }
    .close-btn { background: none; border: none; font-size: 24px; color: var(--text-tertiary); cursor: pointer; }
    .modal-body { padding: var(--space-4); }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4); border-top: 1px solid var(--border); }
  `]
})
export class PendingStudentsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  processing = signal<string | null>(null);
  students = signal<PendingStudent[]>([]);
  classes = signal<any[]>([]);
  rejectModalStudent = signal<PendingStudent | null>(null);
  approveModalStudent = signal<PendingStudent | null>(null);
  rejectReason = '';
  expandedId: string | null = null;
  
  // Approval form fields
  approveForm = {
    classId: '',
    section: '',
    rollNumber: ''
  };
  availableSections: string[] = [];

  ngOnInit(): void {
    this.loadPendingStudents();
    this.loadClasses();
  }

  loadClasses(): void {
    this.api.get<any>('/classes').subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        this.classes.set(Array.isArray(data) ? data : []);
      },
      error: () => this.classes.set([])
    });
  }

  loadPendingStudents(): void {
    this.loading.set(true);
    this.api.get<any>('/auth/students/pending').subscribe({
      next: (res) => {
        // Handle both normalized (items array) and raw response formats  
        const data = res.data?.items || res.data || [];
        this.students.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load pending students');
        this.loading.set(false);
      }
    });
  }

  toggleExpand(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  approve(student: PendingStudent, event: Event): void {
    event.stopPropagation();
    this.approveModalStudent.set(student);
    this.approveForm = {
      classId: student.currentClass?._id || '',
      section: student.currentSection || '',
      rollNumber: ''
    };
    this.updateAvailableSections();
  }

  showApproveModal(student: PendingStudent, event: Event): void {
    event.stopPropagation();
    this.approveModalStudent.set(student);
    this.approveForm = {
      classId: student.currentClass?._id || '',
      section: student.currentSection || '',
      rollNumber: ''
    };
    this.updateAvailableSections();
  }

  closeApproveModal(): void {
    this.approveModalStudent.set(null);
    this.approveForm = { classId: '', section: '', rollNumber: '' };
    this.availableSections = [];
  }

  onApproveClassChange(): void {
    this.updateAvailableSections();
    this.approveForm.section = '';
  }

  updateAvailableSections(): void {
    const cls = this.classes().find(c => c._id === this.approveForm.classId);
    // Handle sections as array or string
    let sections = cls?.sections || [];
    if (typeof sections === 'string') {
      sections = sections.split(',').map((s: string) => s.trim()).filter((s: string) => s);
    }
    this.availableSections = Array.isArray(sections) ? sections : [];
    if (this.availableSections.length === 1) {
      this.approveForm.section = this.availableSections[0];
    }
  }

  confirmApprove(): void {
    const student = this.approveModalStudent();
    if (!student) return;

    this.processing.set(student._id);
    
    const payload: any = {};
    if (this.approveForm.classId) payload.classId = this.approveForm.classId;
    if (this.approveForm.section) payload.section = this.approveForm.section;
    if (this.approveForm.rollNumber) payload.rollNumber = this.approveForm.rollNumber;
    
    this.api.post<any>(`/auth/students/${student._id}/approve`, payload).subscribe({
      next: (res) => {
        this.toast.success(`${student.firstName} ${student.lastName} has been approved!`);
        this.students.update(list => list.filter(s => s._id !== student._id));
        this.closeApproveModal();
        this.processing.set(null);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to approve student');
        this.processing.set(null);
      }
    });
  }

  showRejectModal(student: PendingStudent, event: Event): void {
    event.stopPropagation();
    this.rejectModalStudent.set(student);
    this.rejectReason = '';
  }

  closeRejectModal(): void {
    this.rejectModalStudent.set(null);
    this.rejectReason = '';
  }

  confirmReject(): void {
    const student = this.rejectModalStudent();
    if (!student || !this.rejectReason.trim()) return;

    this.processing.set(student._id);
    
    this.api.post<any>(`/auth/students/${student._id}/reject`, { reason: this.rejectReason }).subscribe({
      next: () => {
        this.toast.success(`Registration rejected for ${student.firstName} ${student.lastName}`);
        this.students.update(list => list.filter(s => s._id !== student._id));
        this.closeRejectModal();
        this.processing.set(null);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Failed to reject registration');
        this.processing.set(null);
      }
    });
  }
}
