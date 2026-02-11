import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-result-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, BaseChartDirective],
  template: `
    <div class="page-header">
      <div><h1>📊 Result Analytics</h1><p>Performance trends and insights</p></div>
      <a routerLink="/results" class="btn btn-secondary">← Back</a>
    </div>

    <div class="grid grid-4">
      <div class="stat-card"><div class="stat-icon" style="background:rgba(34,197,94,0.12);color:#22c55e">🏆</div><div class="stat-label">Pass Rate</div><div class="stat-value">94%</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(99,102,241,0.12);color:#6366f1">📈</div><div class="stat-label">Avg Score</div><div class="stat-value">78.5%</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(245,158,11,0.12);color:#f59e0b">⭐</div><div class="stat-label">Top Score</div><div class="stat-value">98.2%</div></div>
      <div class="stat-card"><div class="stat-icon" style="background:rgba(239,68,68,0.12);color:#ef4444">📉</div><div class="stat-label">Fail Rate</div><div class="stat-value">6%</div></div>
    </div>

    <div class="grid grid-2" style="margin-top:var(--space-6)">
      <div class="card">
        <h3 style="margin-bottom:var(--space-4)">📊 Grade Distribution</h3>
        <div style="height:300px">
          <canvas baseChart [datasets]="gradeChartData.datasets" [labels]="gradeChartData.labels"
            [options]="chartOptions" type="doughnut"></canvas>
        </div>
      </div>
      <div class="card">
        <h3 style="margin-bottom:var(--space-4)">📈 Subject-wise Average</h3>
        <div style="height:300px">
          <canvas baseChart [datasets]="subjectChartData.datasets" [labels]="subjectChartData.labels"
            [options]="barOptions" type="bar"></canvas>
        </div>
      </div>
    </div>

    <div class="card" style="margin-top:var(--space-6)">
      <h3 style="margin-bottom:var(--space-4)">🏅 Top Performers</h3>
      <table class="data-table">
        <thead><tr><th>Rank</th><th>Student</th><th>Class</th><th>Percentage</th><th>Grade</th></tr></thead>
        <tbody>
          @for (s of topStudents(); track s.rank) {
            <tr>
              <td><span class="rank-badge">{{ s.rank }}</span></td>
              <td><strong>{{ s.name }}</strong></td>
              <td>{{ s.class }}</td>
              <td>{{ s.percentage }}%</td>
              <td><span class="badge badge-success">{{ s.grade }}</span></td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
  styles: [`
    .rank-badge {
      width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
      background: var(--primary); color: white; font-weight: 700; font-size: var(--text-sm);
    }
  `]
})
export class ResultAnalyticsComponent implements OnInit {
  private api = inject(ApiService);

  topStudents = signal([
    { rank: 1, name: 'Emily Johnson', class: '10A', percentage: 98.2, grade: 'A+' },
    { rank: 2, name: 'Michael Chen', class: '10B', percentage: 96.8, grade: 'A+' },
    { rank: 3, name: 'Sarah Williams', class: '10A', percentage: 95.4, grade: 'A+' },
    { rank: 4, name: 'David Brown', class: '9A', percentage: 94.1, grade: 'A' },
    { rank: 5, name: 'Jessica Davis', class: '10B', percentage: 93.7, grade: 'A' },
  ]);

  gradeChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['A+ (90-100)', 'A (80-89)', 'B (70-79)', 'C (60-69)', 'D (50-59)', 'F (<50)'],
    datasets: [{ data: [85, 142, 198, 89, 34, 12], backgroundColor: ['#22c55e', '#3b82f6', '#6366f1', '#f59e0b', '#f97316', '#ef4444'] }]
  };

  subjectChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Math', 'Science', 'English', 'History', 'CS', 'Art'],
    datasets: [{ data: [78, 82, 85, 72, 88, 90], label: 'Average %', backgroundColor: '#6366f1' }]
  };

  chartOptions: ChartConfiguration<'doughnut'>['options'] = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };
  barOptions: ChartConfiguration<'bar'>['options'] = { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } };

  ngOnInit(): void {}
}
