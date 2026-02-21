import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { User, UserRole } from '../../core/models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.users' | translate }}</h1><p>Manage system users and roles</p></div>
      <button class="btn btn-primary" routerLink="/users/new">+ Add User</button>
    </div>
    <div class="card">
      <div class="table-toolbar">
        <input type="text" class="form-input" style="max-width:320px" placeholder="Search users..." [(ngModel)]="search" (input)="onSearch()" />
        <select class="form-select" style="width:180px" [(ngModel)]="filterRole" (change)="load()">
          <option value="">All Roles</option>
          <option value="principal">Principal</option>
          <option value="vice_principal">Vice Principal</option>
          <option value="teacher">Teacher</option>
          <option value="class_teacher">Class Teacher</option>
          <option value="student">Student</option>
          <option value="parent">Parent</option>
          <option value="accountant">Accountant</option>
          <option value="librarian">Librarian</option>
          <option value="receptionist">Receptionist</option>
        </select>
      </div>
      @if (loading()) {
        @for (i of [1,2,3,4,5]; track i) { <div class="skeleton" style="height:52px;margin-bottom:8px"></div> }
      } @else {
        <table class="data-table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            @for (u of users(); track u._id) {
              <tr>
                <td><div class="user-cell"><div class="avatar-sm">{{ u.firstName?.charAt(0) }}{{ u.lastName?.charAt(0) }}</div><div><div class="user-name">{{ u.firstName }} {{ u.lastName }}</div></div></div></td>
                <td>{{ u.email }}</td>
                <td><span class="badge badge-primary">{{ u.role }}</span></td>
                <td><span class="badge" [class]="u.isActive ? 'badge-success' : 'badge-warning'">{{ u.isActive ? 'Active' : 'Inactive' }}</span></td>
                <td class="action-btns">
                  <a [routerLink]="['/users', u._id]" class="btn btn-ghost btn-sm">Edit</a>
                  <button class="btn btn-ghost btn-sm" style="color:var(--danger)" (click)="delete(u._id)">Delete</button>
                </td>
              </tr>
            } @empty { <tr><td colspan="5" class="empty-state">No users found</td></tr> }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .table-toolbar { display: flex; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap; }
    .user-cell { display: flex; align-items: center; gap: var(--space-3); }
    .avatar-sm { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; font-size: var(--text-xs); font-weight: 600; }
    .user-name { font-weight: 500; }
    .action-btns { display: flex; gap: var(--space-1); }
    .empty-state { text-align: center; padding: var(--space-8) !important; color: var(--text-tertiary); }
  `]
})
export class UserListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  loading = signal(true);
  users = signal<User[]>([]);
  search = '';
  filterRole = '';
  private searchTimeout: any;

  ngOnInit(): void { this.load(); }
  onSearch(): void { clearTimeout(this.searchTimeout); this.searchTimeout = setTimeout(() => this.load(), 400); }
  load(): void {
    this.loading.set(true);
    const params: any = {};
    if (this.search) params.search = this.search;
    if (this.filterRole) params.role = this.filterRole;
    this.api.get<any>('/users', params).subscribe({
      next: (res) => { 
        const data = res.data?.data || res.data?.items || res.data || [];
        this.users.set(Array.isArray(data) ? data : []);
        this.loading.set(false); 
      },
      error: () => this.loading.set(false),
    });
  }
  delete(id: string): void {
    if (!confirm('Delete this user?')) return;
    this.api.delete(`/users/${id}`).subscribe({ next: () => { this.toast.success('Deleted'); this.load(); } });
  }
}
