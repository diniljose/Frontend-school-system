import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Parent } from '../../core/models';

@Component({
  selector: 'app-parent-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.parents' | translate }}</h1><p>Manage parent / guardian records</p></div>
    </div>
    <div class="card">
      <div class="table-toolbar">
        <input type="text" class="form-input" style="max-width:320px" placeholder="Search parents..." [(ngModel)]="search" (input)="onSearch()" />
      </div>
      @if (loading()) {
        @for (i of [1,2,3,4]; track i) { <div class="skeleton" style="height:52px;margin-bottom:8px"></div> }
      } @else {
        <table class="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Children</th><th>Actions</th></tr></thead>
          <tbody>
            @for (p of parents(); track p._id) {
              <tr>
                <td><div class="user-cell"><div class="avatar-sm">{{ p.firstName?.charAt(0) }}{{ p.lastName?.charAt(0) }}</div><div><div class="user-name">{{ p.firstName }} {{ p.lastName }}</div></div></div></td>
                <td>{{ p.email }}</td>
                <td>{{ p.phone || '—' }}</td>
                <td>{{ p.children?.length || 0 }}</td>
                <td><button class="btn btn-ghost btn-sm" style="color:var(--danger)" (click)="delete(p._id)">Delete</button></td>
              </tr>
            } @empty { <tr><td colspan="5" class="empty-state">No parents found</td></tr> }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .table-toolbar { margin-bottom: var(--space-4); }
    .user-cell { display: flex; align-items: center; gap: var(--space-3); }
    .avatar-sm { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: #10b981; color: white; font-size: var(--text-xs); font-weight: 600; }
    .user-name { font-weight: 500; }
    .empty-state { text-align: center; padding: var(--space-8) !important; color: var(--text-tertiary); }
  `]
})
export class ParentListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  loading = signal(true);
  parents = signal<Parent[]>([]);
  search = '';
  private searchTimeout: any;

  ngOnInit(): void { this.load(); }
  onSearch(): void { clearTimeout(this.searchTimeout); this.searchTimeout = setTimeout(() => this.load(), 400); }
  load(): void {
    this.loading.set(true);
    const params: any = {};
    if (this.search) params.search = this.search;
    this.api.get<any>('/parents', params).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.parents.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
  delete(id: string): void {
    if (!confirm('Delete this parent?')) return;
    this.api.delete(`/parents/${id}`).subscribe({ next: () => { this.toast.success('Deleted'); this.load(); } });
  }
}
