import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { AcademicYear } from '../../core/models';

@Component({
  selector: 'app-academic-year-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.academic_years' | translate }}</h1><p>Manage academic year sessions</p></div>
      <button class="btn btn-primary" (click)="showForm.set(true)">+ Add Academic Year</button>
    </div>

    @if (showForm()) {
      <div class="card animate-in" style="max-width:600px;margin-bottom:var(--space-6)">
        <h3>{{ editId() ? 'Edit' : 'New' }} Academic Year</h3>
        <form (ngSubmit)="onSubmit()">
          <div class="form-group"><label>Name *</label><input type="text" class="form-input" [(ngModel)]="form.name" name="name" placeholder="2024-25" required /></div>
          <div class="grid grid-2">
            <div class="form-group"><label>Start Date *</label><input type="date" class="form-input" [(ngModel)]="form.startDate" name="start" required /></div>
            <div class="form-group"><label>End Date *</label><input type="date" class="form-input" [(ngModel)]="form.endDate" name="end" required /></div>
          </div>
          <div class="form-group">
            <label class="checkbox-label"><input type="checkbox" [(ngModel)]="form.isCurrent" name="current" /> Set as current academic year</label>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="cancelForm()">Cancel</button>
            <button type="submit" class="btn btn-primary">{{ editId() ? 'Update' : 'Create' }}</button>
          </div>
        </form>
      </div>
    }

    <div class="card">
      @if (loading()) {
        @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:60px;margin-bottom:8px"></div> }
      } @else {
        <div class="year-grid">
          @for (y of years(); track y._id) {
            <div class="year-card" [class.current]="y.isCurrent">
              <div class="year-info">
                <h3>📅 {{ y.name }}</h3>
                <p>{{ y.startDate | date:'mediumDate' }} — {{ y.endDate | date:'mediumDate' }}</p>
              </div>
              @if (y.isCurrent) { <span class="badge badge-success">Current</span> }
              <div class="year-actions">
                <button class="btn btn-ghost btn-sm" (click)="edit(y)">Edit</button>
                <button class="btn btn-ghost btn-sm" style="color:var(--danger)" (click)="delete(y._id)">Delete</button>
              </div>
            </div>
          } @empty { <div class="empty-state">No academic years configured</div> }
        </div>
      }
    </div>
  `,
  styles: [`
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4); }
    .checkbox-label { display: flex; align-items: center; gap: var(--space-2); cursor: pointer; }
    .year-grid { display: flex; flex-direction: column; gap: var(--space-3); }
    .year-card {
      display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); border-radius: var(--radius-lg);
      border: 1px solid var(--border); transition: var(--transition-fast);
    }
    .year-card.current { border-color: var(--primary); background: rgba(99,102,241,0.04); }
    .year-card h3 { font-size: var(--text-base); }
    .year-card p { font-size: var(--text-sm); color: var(--text-secondary); }
    .year-actions { margin-left: auto; display: flex; gap: var(--space-1); }
    .empty-state { text-align: center; padding: var(--space-8); color: var(--text-tertiary); }
  `]
})
export class AcademicYearListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  loading = signal(true);
  years = signal<AcademicYear[]>([]);
  showForm = signal(false);
  editId = signal<string | null>(null);
  form: any = {};

  ngOnInit(): void { this.load(); }
  load(): void {
    this.api.get<any>('/academic-years').subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.years.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
  edit(y: AcademicYear): void {
    this.form = {
      name: y.name,
      startDate: this.toDateInput(y.startDate),
      endDate: this.toDateInput(y.endDate),
      isCurrent: y.isCurrent || false,
    };
    this.editId.set(y._id);
    this.showForm.set(true);
  }
  private toDateInput(d: any): string {
    if (!d) return '';
    const date = new Date(d);
    return date.toISOString().split('T')[0];
  }
  cancelForm(): void { this.form = {}; this.editId.set(null); this.showForm.set(false); }
  onSubmit(): void {
    const payload = {
      name: this.form.name,
      startDate: this.form.startDate,
      endDate: this.form.endDate,
      isCurrent: this.form.isCurrent || false,
    };
    const obs = this.editId() ? this.api.patch(`/academic-years/${this.editId()}`, payload) : this.api.post('/academic-years', payload);
    obs.subscribe({ next: () => { this.toast.success('Saved'); this.cancelForm(); this.load(); }, error: (err) => this.toast.error(err?.error?.message || 'Failed') });
  }
  delete(id: string): void {
    if (!confirm('Delete?')) return;
    this.api.delete(`/academic-years/${id}`).subscribe({ next: () => { this.toast.success('Deleted'); this.load(); } });
  }
}
