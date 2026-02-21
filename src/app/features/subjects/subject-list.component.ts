import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Subject } from '../../core/models';

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.subjects' | translate }}</h1><p>Manage curriculum subjects</p></div>
      <button class="btn btn-primary" (click)="showForm.set(true)">+ Add Subject</button>
    </div>

    @if (showForm()) {
      <div class="card animate-in" style="max-width:600px;margin-bottom:var(--space-6)">
        <h3>{{ editId() ? 'Edit' : 'New' }} Subject</h3>
        <form (ngSubmit)="onSubmit()">
          <div class="grid grid-2">
            <div class="form-group"><label>Name *</label><input type="text" class="form-input" [(ngModel)]="form.name" name="name" required /></div>
            <div class="form-group"><label>Code *</label><input type="text" class="form-input" [(ngModel)]="form.code" name="code" required /></div>
          </div>
          <div class="form-group"><label>Type</label><textarea class="form-textarea" [(ngModel)]="form.type" name="type" rows="2"></textarea></div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="cancelForm()">Cancel</button>
            <button type="submit" class="btn btn-primary">{{ editId() ? 'Update' : 'Create' }}</button>
          </div>
        </form>
      </div>
    }

    <div class="card">
      @if (loading()) {
        @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:48px;margin-bottom:8px"></div> }
      } @else {
        <table class="data-table">
          <thead><tr><th>Name</th><th>Code</th><th>Type</th><th>Actions</th></tr></thead>
          <tbody>
            @for (s of subjects(); track s._id) {
              <tr>
                <td><strong>{{ s.name }}</strong></td>
                <td><span class="badge badge-primary">{{ s.code }}</span></td>
                <td>{{ s.type || '—' }}</td>
                <td class="action-btns">
                  <button class="btn btn-ghost btn-sm" (click)="edit(s)">Edit</button>
                  <button class="btn btn-ghost btn-sm" style="color:var(--danger)" (click)="delete(s._id)">Delete</button>
                </td>
              </tr>
            } @empty { <tr><td colspan="4" class="empty-state">No subjects found</td></tr> }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4); }
    .action-btns { display: flex; gap: var(--space-1); }
    .empty-state { text-align: center; padding: var(--space-8) !important; color: var(--text-tertiary); }
  `]
})
export class SubjectListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  loading = signal(true);
  subjects = signal<Subject[]>([]);
  showForm = signal(false);
  editId = signal<string | null>(null);
  form: any = {};

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading.set(true);
    this.api.get<any>('/subjects').subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.subjects.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
  edit(s: Subject): void {
    this.form = { name: s.name, code: s.code, type: s.type || '' };
    this.editId.set(s._id);
    this.showForm.set(true);
  }
  cancelForm(): void { this.form = {}; this.editId.set(null); this.showForm.set(false); }
  onSubmit(): void {
    const payload = { name: this.form.name, code: this.form.code, type: this.form.type || undefined };
    const obs = this.editId() ? this.api.patch(`/subjects/${this.editId()}`, payload) : this.api.post('/subjects', payload);
    obs.subscribe({ next: () => { this.toast.success('Saved'); this.cancelForm(); this.load(); }, error: (err) => this.toast.error(err?.error?.message || 'Failed') });
  }
  delete(id: string): void {
    if (!confirm('Delete this subject?')) return;
    this.api.delete(`/subjects/${id}`).subscribe({ next: () => { this.toast.success('Deleted'); this.load(); } });
  }
}
