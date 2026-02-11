import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Transfer, Student } from '../../core/models';

@Component({
  selector: 'app-transfer-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.transfers' | translate }}</h1><p>Manage student transfers</p></div>
      <button class="btn btn-primary" (click)="openTransferModal()">+ New Transfer</button>
    </div>

    <div class="card">
      @if (loading()) {
        @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:60px;margin-bottom:8px"></div> }
      } @else {
        <table class="data-table">
          <thead>
            <tr><th>Student</th><th>Type</th><th>School</th><th>Date</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            @for (t of transfers(); track t._id) {
              <tr>
                <td>{{ getStudentName(t) }}</td>
                <td><span class="badge badge-info">{{ t.type || 'out' }}</span></td>
                <td>{{ t.externalSchoolName || 'N/A' }}</td>
                <td>{{ t.transferDate | date:'mediumDate' }}</td>
                <td>
                  <span class="badge" [class]="getStatusClass(t.status)">{{ t.status }}</span>
                </td>
                <td class="action-btns">
                  @if (t.status === 'initiated' || t.status === 'pending') {
                    <button class="btn btn-ghost btn-sm" style="color:var(--danger)" (click)="cancelTransfer(t._id)">Cancel</button>
                  }
                </td>
              </tr>
            } @empty { <tr><td colspan="6" class="empty-state">No transfer records</td></tr> }
          </tbody>
        </table>
      }
    </div>

    <!-- Transfer Modal -->
    @if (showTransferModal()) {
      <div class="modal-backdrop" (click)="closeTransferModal()">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <h2>Initiate Transfer</h2>
          <form (ngSubmit)="submitTransfer()">
            <div class="form-group">
              <label>Student *</label>
              <select class="form-select" [(ngModel)]="transferData.studentId" name="studentId" required>
                <option value="">Select Student</option>
                @for (s of students(); track s._id) {
                  <option [value]="s._id">{{ s.firstName }} {{ s.lastName }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Transfer To (School Name) *</label>
              <input type="text" class="form-input" [(ngModel)]="transferData.toSchool" name="toSchool" required placeholder="Enter destination school name" />
            </div>
            <div class="form-group">
              <label>Reason</label>
              <textarea class="form-input" [(ngModel)]="transferData.reason" name="reason" rows="2" placeholder="Reason for transfer"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeTransferModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                @if (saving()) { <span class="spinner"></span> }
                Initiate Transfer
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .action-btns { display: flex; gap: var(--space-1); }
    .empty-state { text-align: center; padding: var(--space-8) !important; color: var(--text-tertiary); }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { width: 90%; max-width: 480px; padding: var(--space-6); }
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4); }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class TransferListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  transfers = signal<Transfer[]>([]);
  students = signal<Student[]>([]);
  showTransferModal = signal(false);
  saving = signal(false);
  transferData: any = {};

  ngOnInit(): void { this.load(); this.loadStudents(); }

  load(): void {
    this.loading.set(true);
    this.api.get<any>('/transfers').subscribe({
      next: (res) => {
        this.transfers.set(res.data?.items || res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadStudents(): void {
    this.api.get<any>('/students').subscribe({ next: (res) => this.students.set(res.data?.items || res.data || []) });
  }

  getStudentName(t: Transfer): string {
    if (typeof t.student === 'object' && t.student) {
      return `${(t.student as any).firstName || ''} ${(t.student as any).lastName || ''}`.trim();
    }
    return t.student as string || 'N/A';
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'completed': return 'badge-success';
      case 'initiated': case 'pending': return 'badge-warning';
      case 'cancelled': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  openTransferModal(): void {
    this.transferData = { studentId: '', toSchool: '', reason: '' };
    this.showTransferModal.set(true);
  }

  closeTransferModal(): void { this.showTransferModal.set(false); }

  submitTransfer(): void {
    this.saving.set(true);
    this.api.post('/transfers', this.transferData).subscribe({
      next: () => {
        this.toast.success('Transfer initiated');
        this.closeTransferModal();
        this.saving.set(false);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message?.join?.(', ') || 'Failed to initiate transfer');
      }
    });
  }

  cancelTransfer(id: string): void {
    if (!confirm('Cancel this transfer?')) return;
    this.api.post(`/transfers/${id}/cancel`, { reason: 'Cancelled by admin' }).subscribe({
      next: () => { this.toast.success('Transfer cancelled'); this.load(); },
      error: (err) => this.toast.error(err?.error?.message || 'Failed to cancel'),
    });
  }
}
