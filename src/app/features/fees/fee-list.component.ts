import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { Fee, FeeStatus, ClassModel, UserRole } from '../../core/models';

@Component({
  selector: 'app-fee-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ isStudentView() ? 'My Fees' : ('nav.fees' | translate) }}</h1>
        <p>{{ isStudentView() ? 'View and track your fee payments' : 'Manage student fees and payments' }}</p>
      </div>
      @if (!isStudentView()) {
        <div class="header-actions">
          <a routerLink="/fees/structures" class="btn btn-secondary">📋 Fee Structures</a>
          <a routerLink="/fees/analytics" class="btn btn-secondary">📊 Analytics</a>
        </div>
      }
    </div>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-icon pending">⏳</div>
        <div class="summary-info">
          <span class="summary-value">{{ summary().pending | currency:'INR' }}</span>
          <span class="summary-label">Pending</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon collected">✓</div>
        <div class="summary-info">
          <span class="summary-value">{{ summary().collected | currency:'INR' }}</span>
          <span class="summary-label">{{ isStudentView() ? 'Paid' : 'Collected' }}</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon overdue">!</div>
        <div class="summary-info">
          <span class="summary-value">{{ summary().overdue | currency:'INR' }}</span>
          <span class="summary-label">Overdue</span>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon total">₹</div>
        <div class="summary-info">
          <span class="summary-value">{{ summary().total | currency:'INR' }}</span>
          <span class="summary-label">{{ isStudentView() ? 'Total Fees' : 'Total Expected' }}</span>
        </div>
      </div>
    </div>

    <div class="card">
      @if (!isStudentView()) {
        <div class="table-toolbar">
          <select class="form-select filter-select" [(ngModel)]="filterClass" (change)="onClassChange(); load()">
            <option value="">All Classes</option>
            @for (cls of classes(); track cls._id) {
            <option [value]="cls._id">{{ cls.name }}</option>
          }
        </select>
        <select class="form-select filter-select" [(ngModel)]="filterSection" (change)="load()">
          <option value="">All Sections</option>
          @for (sec of sections(); track sec) {
            <option [value]="sec">{{ sec }}</option>
          }
        </select>
        <select class="form-select filter-select" [(ngModel)]="filterStatus" (change)="load()">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="waived">Waived</option>
        </select>
        <select class="form-select filter-select" [(ngModel)]="filterPeriodType" (change)="load()">
          <option value="">All Periods</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="half_yearly">Half Yearly</option>
          <option value="yearly">Yearly</option>
        </select>
        
        <div class="toolbar-spacer"></div>
        
        @if (selectedFees().length > 0) {
          <button class="btn btn-primary" (click)="bulkMarkPaid()">
            ✓ Mark {{ selectedFees().length }} as Paid
          </button>
        }
        </div>
      } @else {
        <!-- Student filter toolbar -->
        <div class="table-toolbar">
          <select class="form-select filter-select" [(ngModel)]="filterStatus" (change)="load()">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="partial">Partial</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      }

      @if (loading()) {
        @for (i of [1,2,3,4]; track i) { <div class="skeleton" style="height:60px;margin-bottom:8px"></div> }
      } @else {
        <table class="data-table">
          <thead>
            <tr>
              @if (!isStudentView()) {
                <th class="check-col">
                  <input type="checkbox" [checked]="allSelected()" (change)="toggleSelectAll($event)" />
                </th>
                <th>Student</th>
                <th>Class</th>
              }
              <th>Period</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (fee of fees(); track fee._id) {
              <tr [class.selected]="isSelected(fee._id)">
                @if (!isStudentView()) {
                  <td class="check-col">
                    @if (fee.status !== 'paid' && fee.status !== 'waived') {
                      <input type="checkbox" [checked]="isSelected(fee._id)" (change)="toggleSelect(fee._id)" />
                    }
                  </td>
                  <td>
                    <div class="student-info">
                      <span class="student-name">{{ getStudentName(fee) }}</span>
                      <span class="student-id">{{ getStudentAdmissionNo(fee) }}</span>
                    </div>
                  </td>
                  <td>{{ getClassName(fee) }}{{ getSectionName(fee) ? ' - ' + getSectionName(fee) : '' }}</td>
                }
                <td>{{ fee.periodLabel || (fee.month + '/' + fee.year) }}</td>
                <td class="text-right">{{ fee.totalAmount | currency:'INR' }}</td>
                <td class="text-right text-success">{{ fee.paidAmount | currency:'INR' }}</td>
                <td class="text-right text-danger">{{ fee.dueAmount | currency:'INR' }}</td>
                <td>
                  <span class="badge" [class]="getStatusClass(fee.status)">{{ fee.status }}</span>
                </td>
                <td class="action-btns">
                  @if (!isStudentView() && fee.status !== 'paid' && fee.status !== 'waived') {
                    <button class="btn btn-primary btn-sm" (click)="openPaymentModal(fee)">Pay</button>
                    <button class="btn btn-secondary btn-sm" (click)="markAsPaid(fee)" title="Mark as Paid">✓</button>
                  }
                  <button class="btn btn-ghost btn-sm" (click)="viewDetails(fee)" title="Details">👁</button>
                </td>
              </tr>
            } @empty { <tr><td [attr.colspan]="isStudentView() ? 6 : 9" class="empty-state">No fee records found</td></tr> }
          </tbody>
        </table>
        
        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="pagination">
            <button class="btn btn-secondary btn-sm" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">← Prev</button>
            <span class="page-info">Page {{ currentPage() }} of {{ totalPages() }}</span>
            <button class="btn btn-secondary btn-sm" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">Next →</button>
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
          <div class="payment-summary">
            <div class="payment-row"><span>Student:</span><strong>{{ getStudentName(selectedFee()!) }}</strong></div>
            <div class="payment-row"><span>Period:</span><strong>{{ selectedFee()?.periodLabel }}</strong></div>
            <div class="payment-row"><span>Total Amount:</span><strong>{{ selectedFee()?.totalAmount | currency:'INR' }}</strong></div>
            <div class="payment-row"><span>Already Paid:</span><strong class="text-success">{{ selectedFee()?.paidAmount | currency:'INR' }}</strong></div>
            <div class="payment-row highlight"><span>Due Amount:</span><strong class="text-danger">{{ selectedFee()?.dueAmount | currency:'INR' }}</strong></div>
          </div>
          <form (ngSubmit)="submitPayment()">
            <div class="form-group">
              <label>Amount *</label>
              <input type="number" class="form-input" [(ngModel)]="payment.amount" name="amount" required min="1" [max]="selectedFee()?.dueAmount || 999999" />
            </div>
            <div class="form-group">
              <label>Payment Method *</label>
              <select class="form-select" [(ngModel)]="payment.method" name="method" required>
                <option value="">Select</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="online">Online Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="upi">UPI</option>
              </select>
            </div>
            <div class="form-group">
              <label>Transaction ID / Reference</label>
              <input type="text" class="form-input" [(ngModel)]="payment.transactionId" name="transactionId" placeholder="Optional" />
            </div>
            <div class="form-group">
              <label>Remarks</label>
              <input type="text" class="form-input" [(ngModel)]="payment.remarks" name="remarks" placeholder="Optional" />
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

    <!-- Details Modal -->
    @if (showDetailsModal()) {
      <div class="modal-backdrop" (click)="closeDetailsModal()">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Fee Details</h2>
            <button class="close-btn" (click)="closeDetailsModal()">×</button>
          </div>
          @if (detailsFee()) {
            <div class="details-grid">
              <div class="detail-item"><span class="label">Student</span><span class="value">{{ getStudentName(detailsFee()!) }}</span></div>
              <div class="detail-item"><span class="label">Admission No</span><span class="value">{{ getStudentAdmissionNo(detailsFee()!) }}</span></div>
              <div class="detail-item"><span class="label">Class</span><span class="value">{{ getClassName(detailsFee()!) }}</span></div>
              <div class="detail-item"><span class="label">Period</span><span class="value">{{ detailsFee()!.periodLabel }}</span></div>
              <div class="detail-item"><span class="label">Due Date</span><span class="value">{{ detailsFee()!.dueDate | date:'mediumDate' }}</span></div>
              <div class="detail-item"><span class="label">Status</span><span class="badge" [class]="getStatusClass(detailsFee()!.status)">{{ detailsFee()!.status }}</span></div>
            </div>
            
            <h4>Fee Components</h4>
            <table class="data-table compact">
              <thead><tr><th>Component</th><th class="text-right">Amount</th></tr></thead>
              <tbody>
                @for (comp of detailsFee()!.feeComponents || []; track comp.name) {
                  <tr><td>{{ comp.name }}</td><td class="text-right">{{ comp.amount | currency:'INR' }}</td></tr>
                }
              </tbody>
              <tfoot>
                <tr><td><strong>Total</strong></td><td class="text-right"><strong>{{ detailsFee()!.totalAmount | currency:'INR' }}</strong></td></tr>
              </tfoot>
            </table>
            
            @if (detailsFee()!.payments?.length) {
              <h4>Payment History</h4>
              <table class="data-table compact">
                <thead><tr><th>Date</th><th>Method</th><th class="text-right">Amount</th><th>Reference</th></tr></thead>
                <tbody>
                  @for (pay of detailsFee()!.payments; track $index) {
                    <tr>
                      <td>{{ pay.paidAt | date:'mediumDate' }}</td>
                      <td>{{ pay.paymentMethod }}</td>
                      <td class="text-right">{{ pay.amount | currency:'INR' }}</td>
                      <td>{{ pay.transactionId || '-' }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .header-actions { display: flex; gap: var(--space-3); }
    
    .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-4); }
    .summary-card { display: flex; align-items: center; gap: var(--space-4); background: var(--bg-card); border-radius: var(--radius-lg); padding: var(--space-4); border: 1px solid var(--border-color); }
    .summary-icon { width: 48px; height: 48px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 1.25rem; font-weight: bold; }
    .summary-icon.pending { background: rgba(234,179,8,0.1); color: #eab308; }
    .summary-icon.collected { background: rgba(34,197,94,0.1); color: #22c55e; }
    .summary-icon.overdue { background: rgba(239,68,68,0.1); color: #ef4444; }
    .summary-icon.total { background: rgba(59,130,246,0.1); color: #3b82f6; }
    .summary-info { display: flex; flex-direction: column; }
    .summary-value { font-size: var(--text-lg); font-weight: 600; }
    .summary-label { font-size: var(--text-sm); color: var(--text-secondary); }
    
    .table-toolbar { display: flex; gap: var(--space-3); margin-bottom: var(--space-4); flex-wrap: wrap; align-items: center; }
    .filter-select { width: 150px; }
    .toolbar-spacer { flex: 1; }
    
    .check-col { width: 40px; text-align: center; }
    .student-info { display: flex; flex-direction: column; }
    .student-name { font-weight: 500; }
    .student-id { font-size: var(--text-xs); color: var(--text-secondary); }
    .text-right { text-align: right; }
    .text-success { color: #22c55e; }
    .text-danger { color: #ef4444; }
    .action-btns { display: flex; gap: var(--space-1); }
    tr.selected { background: rgba(59,130,246,0.08); }
    .empty-state { text-align: center; padding: var(--space-8) !important; color: var(--text-tertiary); }
    
    .pagination { display: flex; justify-content: center; align-items: center; gap: var(--space-4); margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border-color); }
    .page-info { color: var(--text-secondary); }
    
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; overflow-y: auto; padding: var(--space-4); }
    .modal-content { width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
    .modal-header h2 { margin: 0; }
    .close-btn { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); }
    
    .payment-summary { background: var(--bg-surface); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-4); }
    .payment-row { display: flex; justify-content: space-between; padding: var(--space-1) 0; }
    .payment-row.highlight { border-top: 1px solid var(--border-color); padding-top: var(--space-2); margin-top: var(--space-2); }
    
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4); }
    
    .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); margin-bottom: var(--space-4); }
    .detail-item { display: flex; flex-direction: column; }
    .detail-item .label { font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: 2px; }
    .detail-item .value { font-weight: 500; }
    
    h4 { margin: var(--space-4) 0 var(--space-2); }
    .data-table.compact { font-size: var(--text-sm); }
    .data-table.compact td, .data-table.compact th { padding: var(--space-2); }
    
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class FeeListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  loading = signal(true);
  fees = signal<Fee[]>([]);
  classes = signal<ClassModel[]>([]);
  sections = signal<string[]>([]);
  
  filterStatus = '';
  filterClass = '';
  filterSection = '';
  filterPeriodType = '';
  
  currentPage = signal(1);
  totalPages = signal(1);
  pageSize = 20;
  
  summary = signal({ pending: 0, collected: 0, overdue: 0, total: 0 });
  
  selectedFeeIds = signal<Set<string>>(new Set());
  
  showPaymentModal = signal(false);
  selectedFee = signal<Fee | null>(null);
  paymentSaving = signal(false);
  payment: any = {};
  
  showDetailsModal = signal(false);
  detailsFee = signal<Fee | null>(null);

  // Check if user is a student to show simplified view
  isStudentView = computed(() => {
    const role = this.auth.userRole();
    return role === UserRole.STUDENT;
  });

  ngOnInit(): void {
    // Only load classes for admin view
    if (!this.isStudentView()) {
      this.loadClasses();
    }
    this.load();
  }

  loadClasses(): void {
    this.api.get<any>('/classes', { limit: 100 }).subscribe({
      next: (res) => {
        const data = res.data?.items || res.data?.data || res.data || [];
        this.classes.set(Array.isArray(data) ? data : []);
      },
    });
  }

  onClassChange(): void {
    const cls = this.classes().find(c => c._id === this.filterClass);
    if (cls && (cls as any).sections) {
      this.sections.set((cls as any).sections.map((s: any) => s.name || s));
    } else {
      this.sections.set([]);
    }
    this.filterSection = '';
  }

  load(): void {
    this.loading.set(true);
    const params: any = { page: this.currentPage(), limit: this.pageSize };
    if (this.filterStatus) params.status = this.filterStatus;
    
    // Use different endpoint for students
    if (this.isStudentView()) {
      this.api.get<any>('/fees/my-fees', params).subscribe({
        next: (res) => {
          const data = res.data?.data || res.data || [];
          this.fees.set(Array.isArray(data) ? data : []);
          this.totalPages.set(res.data?.totalPages || 1);
          this.loading.set(false);
          // Use summary from response if available
          if (res.data?.summary) {
            this.summary.set(res.data.summary);
          } else {
            this.calculateSummary(Array.isArray(data) ? data : []);
          }
          this.selectedFeeIds.set(new Set());
        },
        error: () => this.loading.set(false),
      });
    } else {
      // Admin view - use regular fees endpoint with filters
      if (this.filterClass) params.classId = this.filterClass;
      if (this.filterSection) params.section = this.filterSection;
      if (this.filterPeriodType) params.periodType = this.filterPeriodType;
      
      this.api.get<any>('/fees', params).subscribe({
        next: (res) => {
          const data = res.data?.items || res.data || [];
          this.fees.set(data);
          this.totalPages.set(res.data?.totalPages || 1);
          this.loading.set(false);
          this.calculateSummary(data);
          this.selectedFeeIds.set(new Set());
        },
        error: () => this.loading.set(false),
      });
    }
  }

  calculateSummary(fees: Fee[]): void {
    let pending = 0, collected = 0, overdue = 0, total = 0;
    fees.forEach(f => {
      total += f.totalAmount || 0;
      collected += f.paidAmount || 0;
      if (f.status === 'overdue') overdue += f.dueAmount || 0;
      else if (f.status === 'pending' || f.status === 'partial') pending += f.dueAmount || 0;
    });
    this.summary.set({ pending, collected, overdue, total });
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.load();
  }

  // Selection methods
  selectedFees(): string[] {
    return Array.from(this.selectedFeeIds());
  }

  isSelected(id: string): boolean {
    return this.selectedFeeIds().has(id);
  }

  toggleSelect(id: string): void {
    const current = new Set(this.selectedFeeIds());
    if (current.has(id)) current.delete(id);
    else current.add(id);
    this.selectedFeeIds.set(current);
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      const ids = this.fees()
        .filter(f => f.status !== 'paid' && f.status !== 'waived')
        .map(f => f._id);
      this.selectedFeeIds.set(new Set(ids));
    } else {
      this.selectedFeeIds.set(new Set());
    }
  }

  allSelected(): boolean {
    const unpaid = this.fees().filter(f => f.status !== 'paid' && f.status !== 'waived');
    return unpaid.length > 0 && unpaid.every(f => this.selectedFeeIds().has(f._id));
  }

  // Bulk Operations
  bulkMarkPaid(): void {
    const ids = this.selectedFees();
    if (ids.length === 0) return;
    
    this.api.post('/fees/bulk-mark-paid', { feeIds: ids }).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.toast.success(`Marked ${data.success} fees as paid`);
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Failed to mark fees as paid'),
    });
  }

  markAsPaid(fee: Fee): void {
    this.api.post(`/fees/${fee._id}/mark-paid`, {}).subscribe({
      next: () => {
        this.toast.success('Fee marked as paid');
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Failed to mark fee as paid'),
    });
  }

  // Helper methods
  getStudentName(fee: Fee): string {
    if (typeof fee.student === 'object' && fee.student) {
      return `${(fee.student as any).firstName || ''} ${(fee.student as any).lastName || ''}`.trim();
    }
    // If string ID, return generic label instead of raw ID
    return 'Student';
  }

  getStudentAdmissionNo(fee: Fee): string {
    if (typeof fee.student === 'object' && fee.student) {
      return (fee.student as any).admissionNumber || '';
    }
    return '';
  }

  getClassName(fee: Fee): string {
    if ((fee as any).class) {
      const cls = (fee as any).class;
      if (typeof cls === 'object') return cls.name || '';
      // If string ID, look up from loaded classes
      const found = this.classes().find(c => c._id === cls);
      return found?.name || 'Class';
    }
    return '';
  }

  getSectionName(fee: Fee): string {
    return (fee as any).section || '';
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

  // Payment Modal
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

  // Details Modal
  viewDetails(fee: Fee): void {
    this.detailsFee.set(fee);
    this.showDetailsModal.set(true);
  }

  closeDetailsModal(): void {
    this.showDetailsModal.set(false);
    this.detailsFee.set(null);
  }
}
