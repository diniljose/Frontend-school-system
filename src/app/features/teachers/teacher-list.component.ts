import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Teacher } from '../../core/models';

@Component({
  selector: 'app-teacher-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.teachers' | translate }}</h1><p>Manage teaching staff</p></div>
      <button class="btn btn-primary" routerLink="/teachers/new">+ Add Teacher</button>
    </div>
    <div class="card">
      <div class="table-toolbar">
        <input type="text" class="form-input" style="max-width:320px" placeholder="Search teachers..." [(ngModel)]="search" (input)="onSearch()" />
      </div>
      @if (loading()) {
        @for (i of [1,2,3,4,5]; track i) { <div class="skeleton" style="height:52px;margin-bottom:8px"></div> }
      } @else {
        <table class="data-table">
          <thead><tr><th>Name</th><th>Staff ID</th><th>Subjects</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            @for (t of teachers(); track t._id; let idx = $index) {
              <tr>
                <td>
                  <div class="user-cell">
                    <div class="avatar-sm">{{ t.firstName?.charAt(0) }}{{ t.lastName?.charAt(0) }}</div>
                    <div><div class="user-name">{{ t.firstName }} {{ t.lastName }}</div><div class="user-email">{{ t.email }}</div></div>
                  </div>
                </td>
                <td>{{ t.employeeId || t.staffId || 'TCH-' + (idx + 1).toString().padStart(3, '0') }}</td>
                <td>{{ t.subjects?.length || 0 }} subjects</td>
                <td>{{ t.phone || '—' }}</td>
                <td><span class="badge badge-success">Active</span></td>
                <td class="action-btns">
                  <a [routerLink]="['/teachers', t._id, 'profile']" class="btn btn-ghost btn-sm" title="View Profile">👤</a>
                  <a [routerLink]="['/teachers', t._id, 'assignments']" class="btn btn-ghost btn-sm" title="Teaching Assignments">📚</a>
                  <a [routerLink]="['/teachers', t._id]" class="btn btn-ghost btn-sm">Edit</a>
                  <button class="btn btn-ghost btn-sm" style="color:var(--danger)" (click)="delete(t._id)">Delete</button>
                </td>
              </tr>
            } @empty { <tr><td colspan="6" class="empty-state">No teachers found</td></tr> }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .table-toolbar { margin-bottom: var(--space-4); }
    .user-cell { display: flex; align-items: center; gap: var(--space-3); }
    .avatar-sm { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; font-size: var(--text-xs); font-weight: 600; }
    .user-name { font-weight: 500; } .user-email { font-size: var(--text-xs); color: var(--text-tertiary); }
    .action-btns { display: flex; gap: var(--space-1); }
    .empty-state { text-align: center; padding: var(--space-8) !important; color: var(--text-tertiary); }
  `]
})
export class TeacherListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  loading = signal(true);
  teachers = signal<Teacher[]>([]);
  search = '';
  private searchTimeout: any;

  ngOnInit(): void { this.load(); }
  onSearch(): void { clearTimeout(this.searchTimeout); this.searchTimeout = setTimeout(() => this.load(), 400); }
  load(): void {
    this.loading.set(true);
    const params: any = {};
    if (this.search) params.search = this.search;
    this.api.get<any>('/teachers', params).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.teachers.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
  delete(id: string): void {
    if (!confirm('Delete this teacher?')) return;
    this.api.delete(`/teachers/${id}`).subscribe({ next: () => { this.toast.success('Deleted'); this.load(); } });
  }
}
