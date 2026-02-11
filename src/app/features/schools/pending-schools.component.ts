import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

interface PendingSchool {
  _id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  pendingAdmin?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
}

@Component({
  selector: 'app-pending-schools',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>⏳ Pending School Approvals</h1>
        <p>Review and approve new school registrations</p>
      </div>
      <button class="btn btn-outline" (click)="loadPendingSchools()">
        🔄 Refresh
      </button>
    </div>

    <div class="card">
      @if (loading()) {
        @for (i of [1,2,3]; track i) {
          <div class="skeleton" style="height:120px;margin-bottom:12px"></div>
        }
      } @else {
        @if (pendingSchools().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">✓</div>
            <h3>All caught up!</h3>
            <p>No pending school registrations to review</p>
          </div>
        } @else {
          <div class="pending-list">
            @for (school of pendingSchools(); track school._id) {
              <div class="pending-card" [class.processing]="processingId() === school._id">
                <div class="school-info">
                  <div class="school-header">
                    <h3>{{ school.name }}</h3>
                    <span class="badge badge-warning">Pending</span>
                  </div>
                  <div class="school-details">
                    <div class="detail-row">
                      <span class="label">Code:</span>
                      <span class="value">{{ school.code }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Address:</span>
                      <span class="value">{{ school.address || '—' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Applied On:</span>
                      <span class="value">{{ school.createdAt | date:'medium' }}</span>
                    </div>
                  </div>
                  @if (school.pendingAdmin) {
                    <div class="admin-info">
                      <h4>Proposed Administrator</h4>
                      <div class="detail-row">
                        <span class="label">Name:</span>
                        <span class="value">{{ school.pendingAdmin.firstName }} {{ school.pendingAdmin.lastName }}</span>
                      </div>
                      <div class="detail-row">
                        <span class="label">Email:</span>
                        <span class="value">{{ school.pendingAdmin.email }}</span>
                      </div>
                      @if (school.pendingAdmin.phone) {
                        <div class="detail-row">
                          <span class="label">Phone:</span>
                          <span class="value">{{ school.pendingAdmin.phone }}</span>
                        </div>
                      }
                    </div>
                  }
                </div>

                <div class="actions">
                  @if (rejectingId() === school._id) {
                    <div class="reject-form">
                      <textarea
                        [(ngModel)]="rejectReason"
                        placeholder="Reason for rejection (required)"
                        rows="2"
                      ></textarea>
                      <div class="reject-actions">
                        <button class="btn btn-sm" (click)="cancelReject()">Cancel</button>
                        <button
                          class="btn btn-sm btn-danger"
                          [disabled]="!rejectReason.trim()"
                          (click)="confirmReject(school._id)"
                        >
                          Confirm Reject
                        </button>
                      </div>
                    </div>
                  } @else {
                    <button
                      class="btn btn-success"
                      [disabled]="processingId() !== null"
                      (click)="approveSchool(school._id)"
                    >
                      ✓ Approve
                    </button>
                    <button
                      class="btn btn-outline-danger"
                      [disabled]="processingId() !== null"
                      (click)="startReject(school._id)"
                    >
                      ✕ Reject
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .empty-state {
      text-align: center;
      padding: var(--space-12);
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: var(--space-4);
      color: #22c55e;
    }

    .empty-state h3 {
      font-size: var(--text-xl);
      margin-bottom: var(--space-2);
    }

    .empty-state p {
      color: var(--text-secondary);
    }

    .pending-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .pending-card {
      display: flex;
      justify-content: space-between;
      gap: var(--space-4);
      padding: var(--space-5);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      transition: all 0.2s;
    }

    .pending-card:hover {
      border-color: var(--primary);
    }

    .pending-card.processing {
      opacity: 0.6;
      pointer-events: none;
    }

    .school-info {
      flex: 1;
    }

    .school-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-3);
    }

    .school-header h3 {
      font-size: var(--text-lg);
      font-weight: 600;
    }

    .school-details,
    .admin-info {
      display: grid;
      gap: var(--space-1);
    }

    .admin-info {
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--border);
    }

    .admin-info h4 {
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-secondary);
      margin-bottom: var(--space-2);
    }

    .detail-row {
      display: flex;
      gap: var(--space-2);
      font-size: var(--text-sm);
    }

    .label {
      color: var(--text-secondary);
      min-width: 80px;
    }

    .value {
      font-weight: 500;
    }

    .actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      align-self: center;
    }

    .btn-success {
      background: #22c55e;
      color: white;
    }

    .btn-success:hover {
      background: #16a34a;
    }

    .btn-outline-danger {
      border: 1px solid #ef4444;
      color: #ef4444;
      background: transparent;
    }

    .btn-outline-danger:hover {
      background: #fef2f2;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .reject-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      min-width: 250px;
    }

    .reject-form textarea {
      padding: var(--space-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      resize: vertical;
      font-size: var(--text-sm);
    }

    .reject-actions {
      display: flex;
      gap: var(--space-2);
    }

    .badge-warning {
      background: #fef3c7;
      color: #92400e;
    }

    @media (max-width: 768px) {
      .pending-card {
        flex-direction: column;
      }

      .actions {
        flex-direction: row;
        align-self: stretch;
      }

      .actions button {
        flex: 1;
      }
    }
  `]
})
export class PendingSchoolsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  pendingSchools = signal<PendingSchool[]>([]);
  processingId = signal<string | null>(null);
  rejectingId = signal<string | null>(null);
  rejectReason = '';

  ngOnInit(): void {
    this.loadPendingSchools();
  }

  loadPendingSchools(): void {
    this.loading.set(true);
    this.api.get<any>('/auth/schools/pending').subscribe({
      next: (res) => {
        // Handle nested response structure
        const data = res?.data?.items || res?.data || res || [];
        this.pendingSchools.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load pending schools:', err);
        this.toast.error('Failed to load pending schools');
        this.loading.set(false);
      }
    });
  }

  approveSchool(schoolId: string): void {
    this.processingId.set(schoolId);
    this.api.post(`/auth/schools/${schoolId}/approve`, {}).subscribe({
      next: (res: any) => {
        this.toast.success(`School approved! Admin account created for ${res.admin?.email || 'the administrator'}`);
        this.loadPendingSchools();
        this.processingId.set(null);
      },
      error: (err) => {
        this.toast.error('Failed to approve school', err.error?.message || 'Unknown error');
        this.processingId.set(null);
      }
    });
  }

  startReject(schoolId: string): void {
    this.rejectingId.set(schoolId);
    this.rejectReason = '';
  }

  cancelReject(): void {
    this.rejectingId.set(null);
    this.rejectReason = '';
  }

  confirmReject(schoolId: string): void {
    if (!this.rejectReason.trim()) return;

    this.processingId.set(schoolId);
    this.api.post(`/auth/schools/${schoolId}/reject`, { reason: this.rejectReason }).subscribe({
      next: () => {
        this.toast.success('School registration rejected');
        this.loadPendingSchools();
        this.processingId.set(null);
        this.rejectingId.set(null);
        this.rejectReason = '';
      },
      error: (err) => {
        this.toast.error('Failed to reject school', err.error?.message || 'Unknown error');
        this.processingId.set(null);
      }
    });
  }
}
