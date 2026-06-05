import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-result-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule, BaseChartDirective],
  template: `
    <div class="page-header">
      <div><h1>📊 Result Analytics</h1><p>Performance trends and insights</p></div>
      <div class="header-actions">
        <a routerLink="/results" class="btn btn-secondary">← Back</a>
        <a routerLink="/results/entry" class="btn btn-primary">📝 Enter Marks</a>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="filters-grid">
        <div class="filter-group">
          <label>Exam</label>
          <select class="form-select" [(ngModel)]="selectedExamId" (change)="onExamChange()">
            <option value="">Select Exam</option>
            @for (exam of exams(); track exam._id) {
              <option [value]="exam._id">{{ exam.name }}</option>
            }
          </select>
        </div>
        <div class="filter-group">
          <label>Class</label>
          <select class="form-select" [(ngModel)]="selectedClassId" (change)="onClassChange()">
            <option value="">Select Class</option>
            @for (cls of classes(); track cls._id) {
              <option [value]="cls._id">{{ cls.name }}</option>
            }
          </select>
        </div>
        <div class="filter-group">
          <label>Section</label>
          <select class="form-select" [(ngModel)]="selectedSection" (change)="loadAnalytics()">
            <option value="">All Sections</option>
            @for (sec of sections(); track sec) {
              <option [value]="sec">Section {{ sec }}</option>
            }
          </select>
        </div>
      </div>
    </div>

    @if (loading()) {
      <div class="grid grid-4">
        @for (_ of [1,2,3,4]; track _) {
          <div class="skeleton" style="height: 100px"></div>
        }
      </div>
    } @else if (analytics()) {
      <!-- Stats Cards -->
      <div class="grid grid-4">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(99,102,241,0.12);color:#6366f1">👥</div>
          <div class="stat-label">Total Students</div>
          <div class="stat-value">{{ analytics()?.statistics?.totalStudents || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(34,197,94,0.12);color:#22c55e">🏆</div>
          <div class="stat-label">Pass Rate</div>
          <div class="stat-value">{{ getPassRate() }}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:#3b82f6">📈</div>
          <div class="stat-label">Average Score</div>
          <div class="stat-value">{{ analytics()?.statistics?.averagePercentage?.toFixed(1) || 0 }}%</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b">⭐</div>
          <div class="stat-label">Highest Score</div>
          <div class="stat-value">{{ analytics()?.statistics?.highestPercentage?.toFixed(1) || 0 }}%</div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:var(--space-6)">
        <!-- Grade Distribution -->
        <div class="card">
          <h3 style="margin-bottom:var(--space-4)">📊 Grade Distribution</h3>
          <div style="height:300px">
            @if (hasGradeData()) {
              <canvas baseChart [datasets]="gradeChartData.datasets" [labels]="gradeChartData.labels"
                [options]="chartOptions" type="doughnut"></canvas>
            } @else {
              <div class="empty-chart">No grade data available</div>
            }
          </div>
        </div>

        <!-- Subject-wise Average -->
        <div class="card">
          <h3 style="margin-bottom:var(--space-4)">📈 Subject-wise Average</h3>
          <div style="height:300px">
            @if (hasSubjectData()) {
              <canvas baseChart [datasets]="subjectChartData.datasets" [labels]="subjectChartData.labels"
                [options]="barOptions" type="bar"></canvas>
            } @else {
              <div class="empty-chart">No subject data available</div>
            }
          </div>
        </div>
      </div>

      <!-- Top Performers -->
      <div class="card" style="margin-top:var(--space-6)">
        <h3 style="margin-bottom:var(--space-4)">🏅 Top Performers</h3>
        @if (analytics()?.topPerformers?.length) {
          <table class="data-table">
            <thead><tr><th>Rank</th><th>Student</th><th>Roll No</th><th>Percentage</th><th>Grade</th><th>Actions</th></tr></thead>
            <tbody>
              @for (s of analytics()?.topPerformers || []; track s.studentId) {
                <tr>
                  <td><span class="rank-badge">{{ s.rank }}</span></td>
                  <td><strong>{{ s.studentName }}</strong></td>
                  <td>{{ s.rollNumber || s.admissionNumber }}</td>
                  <td>{{ s.percentage?.toFixed(1) }}%</td>
                  <td><span class="badge badge-success">{{ s.grade }}</span></td>
                  <td>
                    <a [routerLink]="['/students', s.studentId]" class="btn btn-ghost btn-sm">View Profile</a>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="empty-state">No results data available</p>
        }
      </div>

      <!-- Subject Analysis -->
      <div class="card" style="margin-top:var(--space-6)">
        <h3 style="margin-bottom:var(--space-4)">📚 Subject Analysis</h3>
        @if (analytics()?.subjectAnalysis?.length) {
          <table class="data-table">
            <thead><tr><th>Subject</th><th>Avg %</th><th>Highest</th><th>Lowest</th><th>Pass Rate</th><th>Status</th></tr></thead>
            <tbody>
              @for (sub of analytics()?.subjectAnalysis || []; track sub.subjectId) {
                <tr>
                  <td><strong>{{ sub.subjectName }}</strong></td>
                  <td>{{ sub.averagePercentage?.toFixed(1) }}%</td>
                  <td class="text-success">{{ sub.highestPercentage?.toFixed(1) }}%</td>
                  <td class="text-danger">{{ sub.lowestPercentage?.toFixed(1) }}%</td>
                  <td>
                    <div class="progress-bar-container">
                      <div class="progress-bar" [style.width.%]="sub.passRate" [class.good]="sub.passRate >= 70" [class.medium]="sub.passRate >= 50 && sub.passRate < 70" [class.low]="sub.passRate < 50"></div>
                    </div>
                    <span class="pass-rate-text">{{ sub.passRate?.toFixed(0) }}%</span>
                  </td>
                  <td>
                    @if (sub.passRate >= 80) {
                      <span class="badge badge-success">Excellent</span>
                    } @else if (sub.passRate >= 60) {
                      <span class="badge badge-info">Good</span>
                    } @else if (sub.passRate >= 40) {
                      <span class="badge badge-warning">Needs Attention</span>
                    } @else {
                      <span class="badge badge-danger">Critical</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="empty-state">No subject analysis available</p>
        }
      </div>

      <!-- All Students -->
      <div class="card" style="margin-top:var(--space-6)">
        <div class="card-header">
          <h3>📋 All Students</h3>
          <span class="text-muted">{{ analytics()?.students?.length || 0 }} students</span>
        </div>
        @if (analytics()?.students?.length) {
          <table class="data-table">
            <thead><tr><th>Rank</th><th>Student</th><th>Roll No</th><th>Marks</th><th>%</th><th>Grade</th><th>Status</th></tr></thead>
            <tbody>
              @for (s of analytics()?.students || []; track s.studentId) {
                <tr [class.failed]="!s.isPassed">
                  <td>{{ s.rank }}</td>
                  <td><a [routerLink]="['/students', s.studentId]">{{ s.studentName }}</a></td>
                  <td>{{ s.rollNumber || '-' }}</td>
                  <td>{{ s.obtainedMarks }}/{{ s.totalMarks }}</td>
                  <td>{{ s.percentage?.toFixed(1) }}%</td>
                  <td><span class="badge" [class]="getGradeBadge(s.grade)">{{ s.grade }}</span></td>
                  <td>
                    <span class="badge" [class]="s.isPassed ? 'badge-success' : 'badge-danger'">
                      {{ s.isPassed ? 'PASS' : 'FAIL' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <p class="empty-state">No student data available</p>
        }
      </div>
    } @else {
      <div class="card">
        <div class="empty-state-large">
          <div class="empty-icon">📊</div>
          <h3>Select Exam and Class</h3>
          <p>Choose an exam and class from the filters above to view analytics</p>
        </div>
      </div>
    }
  `,
  styles: [`
    .mb-4 { margin-bottom: var(--space-4); }
    .filters-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--space-4); }
    .filter-group { display: flex; flex-direction: column; gap: var(--space-2); }
    .filter-group label { font-size: var(--text-sm); color: var(--text-secondary); }
    .header-actions { display: flex; gap: var(--space-3); }
    
    .rank-badge {
      width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
      background: var(--primary); color: white; font-weight: 700; font-size: var(--text-sm);
    }
    
    .empty-state { text-align: center; padding: var(--space-6); color: var(--text-tertiary); }
    .empty-state-large { text-align: center; padding: var(--space-12); }
    .empty-icon { font-size: 48px; margin-bottom: var(--space-4); }
    .empty-state-large h3 { margin-bottom: var(--space-2); }
    .empty-state-large p { color: var(--text-secondary); }
    
    .empty-chart { display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-tertiary); }
    
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
    .text-muted { color: var(--text-tertiary); }
    .text-success { color: #22c55e; }
    .text-danger { color: #ef4444; }
    
    .progress-bar-container {
      width: 80px;
      height: 8px;
      background: var(--surface-hover);
      border-radius: 4px;
      overflow: hidden;
      display: inline-block;
      vertical-align: middle;
      margin-right: var(--space-2);
    }
    .progress-bar { height: 100%; border-radius: 4px; }
    .progress-bar.good { background: #22c55e; }
    .progress-bar.medium { background: #f59e0b; }
    .progress-bar.low { background: #ef4444; }
    .pass-rate-text { font-size: var(--text-sm); }
    
    .failed { background: rgba(239, 68, 68, 0.05); }
    .failed td a { color: var(--text-primary); }
  `]
})
export class ResultAnalyticsComponent implements OnInit {
  private api = inject(ApiService);

  exams = signal<any[]>([]);
  classes = signal<any[]>([]);
  sections = signal<string[]>([]);
  analytics = signal<any>(null);
  loading = signal(false);

  selectedExamId = '';
  selectedClassId = '';
  selectedSection = '';

  gradeChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: [],
    datasets: [{ data: [], backgroundColor: ['#22c55e', '#3b82f6', '#6366f1', '#f59e0b', '#f97316', '#ef4444'] }]
  };

  subjectChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Average %', backgroundColor: '#6366f1' }]
  };

  chartOptions: ChartConfiguration<'doughnut'>['options'] = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };
  barOptions: ChartConfiguration<'bar'>['options'] = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } };

  ngOnInit(): void {
    this.loadFilters();
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

  onExamChange(): void {
    this.loadAnalytics();
  }

  onClassChange(): void {
    // Get sections for selected class
    const selectedClass = this.classes().find(c => c._id === this.selectedClassId);
    if (selectedClass?.sections?.length) {
      this.sections.set(selectedClass.sections.map((s: any) => typeof s === 'string' ? s : s.name || s));
    } else {
      // Default sections if not defined
      this.sections.set(['A', 'B', 'C', 'D']);
    }
    // Reset section selection when class changes
    this.selectedSection = '';
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    if (!this.selectedExamId || !this.selectedClassId) {
      this.analytics.set(null);
      return;
    }

    this.loading.set(true);
    const params: any = {};
    if (this.selectedSection) {
      params.section = this.selectedSection;
    }

    this.api.get<any>(`/results/analytics/class/${this.selectedExamId}/${this.selectedClassId}`, params).subscribe({
      next: (res) => {
        // The backend returns analytics data directly, but ApiService normalizes it
        // Extract the actual analytics data from the response
        const analyticsData = res.data || res;
        // If data was normalized and contains items/data array, we need the parent object
        const actualData = analyticsData?.statistics 
          ? analyticsData 
          : ((res as any).statistics ? res : null);
        
        this.analytics.set(actualData);
        if (actualData) {
          this.updateCharts(actualData);
        }
        this.loading.set(false);
      },
      error: () => {
        this.analytics.set(null);
        this.loading.set(false);
      }
    });
  }

  updateCharts(data: any): void {
    // Grade distribution chart
    if (data.gradeDistribution) {
      const grades = Object.keys(data.gradeDistribution).sort();
      this.gradeChartData = {
        labels: grades,
        datasets: [{
          data: grades.map(g => data.gradeDistribution[g]),
          backgroundColor: ['#22c55e', '#3b82f6', '#6366f1', '#f59e0b', '#f97316', '#ef4444']
        }]
      };
    }

    // Subject chart
    if (data.subjectAnalysis?.length) {
      this.subjectChartData = {
        labels: data.subjectAnalysis.map((s: any) => s.subjectName),
        datasets: [{
          data: data.subjectAnalysis.map((s: any) => s.averagePercentage),
          label: 'Average %',
          backgroundColor: '#6366f1'
        }]
      };
    }
  }

  hasGradeData(): boolean {
    return !!(this.gradeChartData.labels && this.gradeChartData.labels.length > 0);
  }

  hasSubjectData(): boolean {
    return !!(this.subjectChartData.labels && this.subjectChartData.labels.length > 0);
  }

  getPassRate(): string {
    const stats = this.analytics()?.statistics;
    if (!stats?.totalStudents) return '0';
    return ((stats.passCount / stats.totalStudents) * 100).toFixed(1);
  }

  getGradeBadge(grade: string): string {
    if (grade?.startsWith('A')) return 'badge-success';
    if (grade?.startsWith('B')) return 'badge-info';
    if (grade?.startsWith('C')) return 'badge-warning';
    return 'badge-danger';
  }
}
