import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Result } from '../../core/models';

@Component({
  selector: 'app-result-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.results' | translate }}</h1><p>View and manage examination results</p></div>
      <div class="header-actions">
        <a routerLink="/results/analytics" class="btn btn-secondary">📊 Analytics</a>
      </div>
    </div>
    <div class="card">
      <div class="table-toolbar">
        <input type="text" class="form-input" style="max-width:320px" placeholder="Search by student name..." [(ngModel)]="search" (input)="onSearch()" />
        <select class="form-select" style="width:180px" [(ngModel)]="filterExam" (change)="load()">
          <option value="">All Exams</option>
          <option value="midterm">Midterm</option>
          <option value="final">Final</option>
        </select>
      </div>
      @if (loading()) {
        @for (i of [1,2,3,4,5]; track i) { <div class="skeleton" style="height:52px;margin-bottom:8px"></div> }
      } @else {
        <table class="data-table">
          <thead><tr><th>Student</th><th>Exam</th><th>Total Marks</th><th>Percentage</th><th>Grade</th><th>Actions</th></tr></thead>
          <tbody>
            @for (r of results(); track r._id) {
              <tr>
                <td><strong>{{ r.student }}</strong></td>
                <td>{{ r.exam }}</td>
                <td>{{ r.totalMarks }}</td>
                <td>{{ r.percentage }}%</td>
                <td><span class="badge" [class]="getGradeBadge(r.grade || '')">{{ r.grade }}</span></td>
                <td>
                  <a [routerLink]="['/results/report-card', r.student]" class="btn btn-ghost btn-sm">📄 Report Card</a>
                </td>
              </tr>
            } @empty { <tr><td colspan="6" class="empty-state">No results found</td></tr> }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: [`
    .header-actions { display: flex; gap: var(--space-3); }
    .table-toolbar { display: flex; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap; }
    .empty-state { text-align: center; padding: var(--space-8) !important; color: var(--text-tertiary); }
  `]
})
export class ResultListComponent implements OnInit {
  private api = inject(ApiService);
  loading = signal(true);
  results = signal<Result[]>([]);
  search = '';
  filterExam = '';
  private searchTimeout: any;

  ngOnInit(): void { this.load(); }
  onSearch(): void { clearTimeout(this.searchTimeout); this.searchTimeout = setTimeout(() => this.load(), 400); }
  load(): void {
    this.loading.set(true);
    const params: any = {};
    if (this.search) params.search = this.search;
    if (this.filterExam) params.examType = this.filterExam;
    this.api.get<any>('/results', params).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.results.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
  getGradeBadge(grade: string): string {
    if (grade?.startsWith('A')) return 'badge-success';
    if (grade?.startsWith('B')) return 'badge-info';
    if (grade?.startsWith('C')) return 'badge-warning';
    return 'badge-danger';
  }
}
