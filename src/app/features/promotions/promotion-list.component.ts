import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ClassModel, Promotion } from '../../core/models';

@Component({
  selector: 'app-promotion-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.promotions' | translate }}</h1><p>Promote students to next class</p></div>
      <button class="btn btn-primary" (click)="openPromoteModal()">+ Bulk Promote</button>
    </div>

    <div class="card">
      @if (loading()) {
        @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:60px;margin-bottom:8px"></div> }
      } @else {
        <table class="data-table">
          <thead>
            <tr><th>Student</th><th>From Class</th><th>To Class</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            @for (p of promotions(); track p._id) {
              <tr>
                <td>{{ getStudentName(p) }}</td>
                <td>{{ getClassName(p.fromClass) }}</td>
                <td>{{ getClassName(p.toClass) }}</td>
                <td><span class="badge" [class]="p.status === 'promoted' ? 'badge-success' : 'badge-warning'">{{ p.status }}</span></td>
                <td>{{ p.createdAt | date:'mediumDate' }}</td>
              </tr>
            } @empty { <tr><td colspan="5" class="empty-state">No promotion records. Use Bulk Promote to start.</td></tr> }
          </tbody>
        </table>
      }
    </div>

    <!-- Bulk Promote Modal -->
    @if (showPromoteModal()) {
      <div class="modal-backdrop" (click)="closePromoteModal()">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <h2>Bulk Promote</h2>
          <p class="text-secondary">Promote all students from one class to another</p>
          <form (ngSubmit)="submitPromotion()">
            <div class="form-group">
              <label>From Class *</label>
              <select class="form-select" [(ngModel)]="promoteData.fromClass" name="fromClass" required>
                <option value="">Select Source Class</option>
                @for (c of classes(); track c._id) { <option [value]="c._id">{{ c.name }}</option> }
              </select>
            </div>
            <div class="form-group">
              <label>To Class *</label>
              <select class="form-select" [(ngModel)]="promoteData.toClass" name="toClass" required>
                <option value="">Select Target Class</option>
                @for (c of classes(); track c._id) { <option [value]="c._id">{{ c.name }}</option> }
              </select>
            </div>
            <div class="form-group">
              <label>Remarks</label>
              <input type="text" class="form-input" [(ngModel)]="promoteData.remarks" name="remarks" placeholder="Optional remarks" />
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closePromoteModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                @if (saving()) { <span class="spinner"></span> }
                Promote Students
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .empty-state { text-align: center; padding: var(--space-8) !important; color: var(--text-tertiary); }
    .text-secondary { color: var(--text-secondary); margin-bottom: var(--space-4); }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { width: 90%; max-width: 480px; padding: var(--space-6); }
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4); }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PromotionListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  promotions = signal<Promotion[]>([]);
  classes = signal<ClassModel[]>([]);
  showPromoteModal = signal(false);
  saving = signal(false);
  promoteData: any = {};

  ngOnInit(): void { this.load(); this.loadClasses(); }

  load(): void {
    this.loading.set(true);
    this.api.get<any>('/promotions').subscribe({
      next: (res) => {
        this.promotions.set(res.data?.items || res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadClasses(): void {
    this.api.get<any>('/classes').subscribe({ next: (res) => this.classes.set(res.data?.items || res.data || []) });
  }

  getStudentName(p: Promotion): string {
    if (typeof p.student === 'object' && p.student) {
      return `${(p.student as any).firstName || ''} ${(p.student as any).lastName || ''}`.trim();
    }
    return p.student as string || 'N/A';
  }

  getClassName(cls: any): string {
    if (typeof cls === 'object' && cls) return cls.name || 'N/A';
    return cls || 'N/A';
  }

  openPromoteModal(): void {
    this.promoteData = { fromClass: '', toClass: '', remarks: '' };
    this.showPromoteModal.set(true);
  }

  closePromoteModal(): void { this.showPromoteModal.set(false); }

  submitPromotion(): void {
    this.saving.set(true);
    this.api.post('/promotions', this.promoteData).subscribe({
      next: () => {
        this.toast.success('Bulk promotion completed');
        this.closePromoteModal();
        this.saving.set(false);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message?.join?.(', ') || 'Failed to promote');
      }
    });
  }
}
