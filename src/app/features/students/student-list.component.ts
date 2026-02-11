import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Student, PaginatedResult } from '../../core/models';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ 'nav.students' | translate }}</h1>
        <p>{{ 'student.manage_desc' | translate }}</p>
      </div>
      <button class="btn btn-primary" routerLink="/students/new">+ {{ 'student.add' | translate }}</button>
    </div>

    <div class="card">
      <div class="table-toolbar">
        <div class="search-box">
          <input type="text" class="form-input" placeholder="Search students..." [(ngModel)]="search" (input)="onSearch()" />
        </div>
        <div class="filters">
          <select class="form-select" [(ngModel)]="filterClass" (change)="loadStudents()">
            <option value="">All Classes</option>
            @for (c of classList(); track c) { <option [value]="c">{{ c }}</option> }
          </select>
          <select class="form-select" [(ngModel)]="filterStatus" (change)="loadStudents()">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <div class="skeleton-table">
          @for (i of [1,2,3,4,5]; track i) { <div class="skeleton" style="height:52px;margin-bottom:8px"></div> }
        </div>
      } @else {
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Roll No</th>
                <th>Class</th>
                <th>Gender</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (student of students(); track student._id) {
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="avatar-sm">{{ student.firstName?.charAt(0) }}{{ student.lastName?.charAt(0) }}</div>
                      <div>
                        <div class="user-name">{{ student.firstName }} {{ student.lastName }}</div>
                        <div class="user-email">{{ student.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ student.rollNumber }}</td>
                  <td>{{ getClassName(student.currentClass) }}</td>
                  <td>{{ student.gender }}</td>
                  <td><span class="badge" [class]="student.status === 'active' ? 'badge-success' : 'badge-warning'">{{ student.status }}</span></td>
                  <td>
                    <div class="action-btns">
                      <a [routerLink]="['/students', student._id]" class="btn btn-ghost btn-sm">View</a>
                      <a [routerLink]="['/students', student._id, 'edit']" class="btn btn-ghost btn-sm">Edit</a>
                      <button class="btn btn-ghost btn-sm" style="color:var(--danger)" (click)="deleteStudent(student._id)">Delete</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="empty-state">No students found</td></tr>
              }
            </tbody>
          </table>
        </div>

        @if (totalPages() > 1) {
          <div class="pagination">
            <button class="btn btn-ghost btn-sm" [disabled]="page() <= 1" (click)="goToPage(page() - 1)">← Prev</button>
            <span class="page-info">Page {{ page() }} of {{ totalPages() }}</span>
            <button class="btn btn-ghost btn-sm" [disabled]="page() >= totalPages()" (click)="goToPage(page() + 1)">Next →</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .table-toolbar { display: flex; justify-content: space-between; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap; }
    .search-box { flex: 1; min-width: 200px; }
    .search-box .form-input { width: 100%; }
    .filters { display: flex; gap: var(--space-3); }
    .filters .form-select { width: 160px; }
    .table-responsive { overflow-x: auto; }
    .user-cell { display: flex; align-items: center; gap: var(--space-3); }
    .avatar-sm {
      width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: var(--primary); color: white; font-size: var(--text-xs); font-weight: 600; flex-shrink: 0;
    }
    .user-name { font-weight: 500; }
    .user-email { font-size: var(--text-xs); color: var(--text-tertiary); }
    .action-btns { display: flex; gap: var(--space-1); }
    .empty-state { text-align: center; padding: var(--space-8) !important; color: var(--text-tertiary); }
    .pagination { display: flex; justify-content: center; align-items: center; gap: var(--space-4); margin-top: var(--space-4); }
    .page-info { font-size: var(--text-sm); color: var(--text-secondary); }
  `]
})
export class StudentListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  students = signal<Student[]>([]);
  classList = signal<string[]>([]);
  search = '';
  filterClass = '';
  filterStatus = '';
  page = signal(1);
  totalPages = signal(1);
  private searchTimeout: any;

  ngOnInit(): void { this.loadStudents(); }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => { this.page.set(1); this.loadStudents(); }, 400);
  }

  loadStudents(): void {
    this.loading.set(true);
    const params: any = { page: this.page(), limit: 20 };
    if (this.search) params.search = this.search;
    if (this.filterClass) params.class = this.filterClass;
    if (this.filterStatus) params.status = this.filterStatus;
    this.api.get<any>('/students', params).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.students.set(Array.isArray(data) ? data : []);
        this.totalPages.set(res.data?.pagination?.pages || res.data?.totalPages || 1);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  goToPage(p: number): void { this.page.set(p); this.loadStudents(); }

  deleteStudent(id: string): void {
    if (!confirm('Are you sure you want to delete this student?')) return;
    this.api.delete(`/students/${id}`).subscribe({
      next: () => { this.toast.success('Student deleted'); this.loadStudents(); },
      error: () => this.toast.error('Failed to delete student'),
    });
  }

  getClassName(currentClass: any): string {
    if (!currentClass) return '-';
    if (typeof currentClass === 'string') return currentClass;
    return currentClass.name || '-';
  }
}
