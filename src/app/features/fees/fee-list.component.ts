import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Fee, FeeStatus, PaginatedResult } from '../../core/models';

@Component({
  selector: 'app-fee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.fees' | translate }}</h1><p>Manage student fees and payments</p></div>
      <div class="header-actions">
        <a routerLink="/fees/analytics" class="btn btn-secondary">📊 Analytics</a>
      </div>
    </div>

    <div class="card">
      <div class="table-toolbar">
        <select class="form-select" style="width:160px" [(ngModel)]="filterStatus" (change)="load()">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="waived">Waived</option>
        </select>
      </div>

      @if (loading()) {
        @for (i of [1,2,3,4]; track i) { <div class="skeleton" style="height:60px;margin-bottom:8px"></div> }
      } @else {
        <table class="data-table">
          <thead>
            <tr><th>Student</th><th>Month/Year</th><th>Total</th><th>Paid</th><th>Due</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            @for (fee of fees(); track fee._id) {
              <tr>
                <td>{{ getStudentName(fee) }}</td>
                <td>{{ fee.month }}/{{ fee.year }}</td>
                <td class="text-right">{{ fee.totalAmount | currency:'INR' }}</td>
                <td class="text-right">{{ fee.paidAmount | currency:'INR' }}</td>
                <td class="text-right">{{ fee.dueAmount | currency:'INR' }}</td>
                <td>
                  <span class="badge" [class]="getStatusClass(fee.status)">{{ fee.status }}</span>
                </td>
                <td class="action-btns">
                  @if (fee.status !== 'paid' && fee.status !== 'waived') {
                    <button class="btn btn-primary btn-sm" (click)="openPaymentModal(fee)">Pay</button>
                  }
                </td>
              </tr>
            } @empty { <tr><td colspan="7" class="empty-state">No fee records found</td></tr> }
          </tbody>
        </table>
      }
    </div>

    <!-- Payment Modal -->
    @if (showPaymentModal()) {
      <div class="modal-backdrop" (click)="closePaymentModal()">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <h2>Record Payment</h2>
          <p class="text-secondary">Due: {{ selectedFee()?.dueAmount | currency:'INR' }}</p>
          <form (ngSubmit)="submitPayment()">
            <div class="form-group">
              <label>Amount *</label>
              <input type="number" class="form-input" [(ngModel)]="payment.amount" name="amount" required min="1" />
            </div>
            <div class="form-group">
              <label>Payment Method *</label>
              <select class="form-select" [(ngModel)]="payment.method" name="method" required>
                <option value="">Select</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="online">Online</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div class="form-group">
              <label>Transaction ID</label>
              <input type="text" class="form-input" [(ngModel)]="payment.transactionId" name="transactionId" />
            </div>
            <div class="form-group">
              <label>Remarks</label>
              <input type="text" class="form-input" [(ngModel)]="payment.remarks" name="remarks" />
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closePaymentModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="paymentSaving()">
                @if (paymentSaving()) { <span class="spinner"></span> }
                Record Payment
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .header-actions { display: flex; gap: var(--space-3); }
    .table-toolbar { display: flex; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap; }
    .text-right { text-align: right; }
    .action-btns { display: flex; gap: var(--space-1); }
    .empty-state { text-align: center; padding: var(--space-8) !important; color: var(--text-tertiary); }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { width: 90%; max-width: 480px; padding: var(--space-6); }
    .text-secondary { color: var(--text-secondary); margin-bottom: var(--space-4); }
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4); }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class FeeListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  fees = signal<Fee[]>([]);
  filterStatus = '';

  showPaymentModal = signal(false);
  selectedFee = signal<Fee | null>(null);
  paymentSaving = signal(false);
  payment: any = {};

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    const params: any = {};
    if (this.filterStatus) params.status = this.filterStatus;
    this.api.get<any>('/fees', params).subscribe({
      next: (res) => {
        this.fees.set(res.data?.items || res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getStudentName(fee: Fee): string {
    if (typeof fee.student === 'object' && fee.student) {
      return `${(fee.student as any).firstName || ''} ${(fee.student as any).lastName || ''}`.trim();
    }
    return fee.student as string || 'N/A';
  }

  getStatusClass(status?: string): string {
    switch (status) {
      case 'paid': return 'badge-success';
      case 'partial': return 'badge-warning';
      case 'overdue': return 'badge-danger';
      case 'waived': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  openPaymentModal(fee: Fee): void {
    this.selectedFee.set(fee);
    this.payment = { amount: fee.dueAmount || 0, method: '', transactionId: '', remarks: '' };
    this.showPaymentModal.set(true);
  }

  closePaymentModal(): void {
    this.showPaymentModal.set(false);
    this.selectedFee.set(null);
  }

  submitPayment(): void {
    const fee = this.selectedFee();
    if (!fee) return;
    this.paymentSaving.set(true);
    this.api.post(`/fees/${fee._id}/payment`, this.payment).subscribe({
      next: () => {
        this.toast.success('Payment recorded successfully');
        this.closePaymentModal();
        this.paymentSaving.set(false);
        this.load();
      },
      error: (err) => {
        this.paymentSaving.set(false);
        this.toast.error(err?.error?.message?.join?.(', ') || 'Failed to record payment');
      }
    });
  }
}
