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
        <a routerLink="/results/entry" class="btn btn-primary">📝 Enter Marks</a>
        <a routerLink="/results/analytics" class="btn btn-secondary">📊 Analytics</a>
      </div>
    </div>
    
    <!-- Filter Section -->
    <div class="card mb-4">
      <div class="filters-grid">
        <div class="filter-group">
          <label>Exam</label>
          <select class="form-select" [(ngModel)]="filterExamId" (change)="load()">
            <option value="">All Exams</option>
            @for (exam of exams(); track exam._id) {
              <option [value]="exam._id">{{ exam.name }}</option>
            }
          </select>
        </div>
        <div class="filter-group">
          <label>Class</label>
          <select class="form-select" [(ngModel)]="filterClassId" (change)="load()">
            <option value="">All Classes</option>
            @for (cls of classes(); track cls._id) {
              <option [value]="cls._id">{{ cls.name }}</option>
            }
          </select>
        </div>
        <div class="filter-group">
          <label>Search</label>
          <input type="text" class="form-input" placeholder="Search student..." [(ngModel)]="search" (input)="onSearch()" />
        </div>
      </div>
    </div>
    
    <div class="card">
      @if (loading()) {
        @for (i of [1,2,3,4,5]; track i) { <div class="skeleton" style="height:52px;margin-bottom:8px"></div> }
      } @else {
        <table class="data-table">
          <thead><tr><th>Student</th><th>Exam</th><th>Class</th><th>Total</th><th>Percentage</th><th>Grade</th><th>Rank</th><th>Actions</th></tr></thead>
          <tbody>
            @for (r of results(); track r._id) {
              <tr>
                <td><strong>{{ getStudentName(r.student) }}</strong><br><small class="text-muted">{{ getAdmissionNumber(r.student) }}</small></td>
                <td>{{ getExamName(r.exam) }}</td>
                <td>{{ getClassName(r.class) }}</td>
                <td>{{ r.obtainedMarks }}/{{ r.totalMarks }}</td>
                <td>{{ r.percentage?.toFixed(1) }}%</td>
                <td><span class="badge" [class]="getGradeBadge(r.grade || '')">{{ r.grade }}</span></td>
                <td>{{ r.rank || '-' }}</td>
                <td>
                  <div class="action-btns">
                    <a [routerLink]="['/results/report-card', getStudentId(r.student)]" [queryParams]="{examId: getExamId(r.exam)}" class="btn btn-ghost btn-sm" title="View Report Card">📄</a>
                    <a [routerLink]="['/students', getStudentId(r.student)]" class="btn btn-ghost btn-sm" title="View Student">👁️</a>
                  </div>
                </td>
              </tr>
            } @empty { <tr><td colspan="8" class="empty-state">No results found. <a routerLink="/results/entry">Enter marks</a> for completed exams.</td></tr> }
          </tbody>
        </table>
        
        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="pagination">
            <button class="btn btn-sm" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">← Prev</button>
            <span>Page {{ currentPage() }} of {{ totalPages() }}</span>
            <button class="btn btn-sm" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">Next →</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .header-actions { display: flex; gap: var(--space-3); }
    .mb-4 { margin-bottom: var(--space-4); }
    .filters-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); }
    .filter-group { display: flex; flex-direction: column; gap: var(--space-2); }
    .filter-group label { font-size: var(--text-sm); color: var(--text-secondary); }
    .empty-state { text-align: center; padding: var(--space-8) !important; color: var(--text-tertiary); }
    .empty-state a { color: var(--primary); }
    .text-muted { color: var(--text-tertiary); }
    .action-btns { display: flex; gap: var(--space-1); }
    .pagination { display: flex; justify-content: center; align-items: center; gap: var(--space-4); margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border); }
  `]
})
export class ResultListComponent implements OnInit {
  private api = inject(ApiService);
  loading = signal(true);
  results = signal<Result[]>([]);
  exams = signal<any[]>([]);
  classes = signal<any[]>([]);
  currentPage = signal(1);
  totalPages = signal(1);
  
  search = '';
  filterExamId = '';
  filterClassId = '';
  private searchTimeout: any;

  ngOnInit(): void {
    this.loadFilters();
    this.load();
  }
  
  loadFilters(): void {
    this.api.get<any>('/exams').subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        this.exams.set(Array.isArray(data) ? data : []);
      }
    });
    this.api.get<any>('/classes').subscribe({
      next: (res) => {
        const data = res.data?.items || res.data?.data || res.data || [];
        this.classes.set(Array.isArray(data) ? data : []);
      }
    });
  }
  
  onSearch(): void { clearTimeout(this.searchTimeout); this.searchTimeout = setTimeout(() => this.load(), 400); }
  
  load(): void {
    this.loading.set(true);
    const params: any = { page: this.currentPage(), limit: 20 };
    if (this.search) params.search = this.search;
    if (this.filterExamId) params.examId = this.filterExamId;
    if (this.filterClassId) params.classId = this.filterClassId;
    
    this.api.get<any>('/results', params).subscribe({
      next: (res) => {
        // Backend returns { data: [...], total, page, limit, totalPages }
        // ApiService normalizes it to { data: { data: [...], items: [...], ... } }
        const responseData = res.data || res;
        const data = responseData?.data || responseData?.items || responseData || [];
        const results = Array.isArray(data) ? data : [];
        
        // Map results to ensure proper field names from populated objects
        const mappedResults = results.map((r: any) => ({
          ...r,
          // Ensure student, exam, class are properly extracted
          _student: r.student, // Keep original for getters
          _exam: r.exam,
          _class: r.class,
        }));
        
        this.results.set(mappedResults);
        this.totalPages.set(responseData?.totalPages || responseData?.pages || 1);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
  
  goToPage(page: number): void {
    this.currentPage.set(page);
    this.load();
  }
  
  getStudentName(student: any): string {
    if (!student) return '-';
    if (typeof student === 'string') return student;
    return `${student.firstName || ''} ${student.lastName || ''}`.trim() || '-';
  }
  
  getStudentId(student: any): string {
    if (!student) return '';
    if (typeof student === 'string') return student;
    return student._id || '';
  }
  
  getAdmissionNumber(student: any): string {
    if (!student || typeof student === 'string') return '';
    return student.admissionNumber || student.rollNumber || '';
  }
  
  getExamName(exam: any): string {
    if (!exam) return '-';
    if (typeof exam === 'string') return exam;
    return exam.name || '-';
  }
  
  getExamId(exam: any): string {
    if (!exam) return '';
    if (typeof exam === 'string') return exam;
    return exam._id || '';
  }
  
  getClassName(cls: any): string {
    if (!cls) return '-';
    if (typeof cls === 'string') return cls;
    return cls.name || '-';
  }
  
  getGradeBadge(grade: string): string {
    if (grade?.startsWith('A')) return 'badge-success';
    if (grade?.startsWith('B')) return 'badge-info';
    if (grade?.startsWith('C')) return 'badge-warning';
    return 'badge-danger';
  }
}
