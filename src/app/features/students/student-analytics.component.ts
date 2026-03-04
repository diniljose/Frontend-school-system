import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

interface SubjectAnalysis {
  subjectId: string;
  subjectName: string;
  averagePercentage: number;
  highestPercentage: number;
  lowestPercentage: number;
  trend: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
  passRate: number;
  examCount: number;
}

interface ExamResult {
  examId: string;
  examName: string;
  examType: string;
  date: string;
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  grade: string;
  rank?: number;
  isPassed: boolean;
}

interface AnalyticsData {
  student: any;
  summary: {
    totalExams: number;
    averagePercentage: number;
    passedExams: number;
    failedExams: number;
    bestGrade: string;
    overallTrend: string;
  };
  examResults: ExamResult[];
  subjectAnalysis: SubjectAnalysis[];
  examComparisons: any[];
  suggestions: string[];
}

@Component({
  selector: 'app-student-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule, BaseChartDirective],
  template: `
    <div class="page-header">
      <div>
        <h1>📊 Student Performance Analytics</h1>
        <p>Comprehensive analysis of {{ student()?.firstName }} {{ student()?.lastName }}'s academic performance</p>
      </div>
      <div class="header-actions">
        <a [routerLink]="['/students', studentId]" class="btn btn-secondary">← Back to Profile</a>
        <button class="btn btn-primary" (click)="loadAnalytics()">🔄 Refresh</button>
      </div>
    </div>

    @if (loading()) {
      <div class="grid grid-4">
        @for (_ of [1,2,3,4]; track _) { <div class="skeleton" style="height:120px"></div> }
      </div>
      <div class="skeleton" style="height:400px;margin-top:24px"></div>
    } @else if (!analytics() || !analytics()?.examResults?.length) {
      <div class="card empty-state">
        <div class="empty-icon">📊</div>
        <h2>No Results Available</h2>
        <p>No examination results have been entered for this student yet.</p>
        <p class="text-muted">Analytics will be available once results are entered for completed exams.</p>
        <div class="empty-actions">
          <a routerLink="/results/entry" class="btn btn-primary">📝 Enter Marks</a>
          <a [routerLink]="['/students', studentId]" class="btn btn-secondary">View Student Profile</a>
        </div>
      </div>
    } @else {
      <!-- Summary Stats -->
      <div class="grid grid-4">
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(99,102,241,0.12);color:#6366f1">📚</div>
          <div class="stat-label">Exams Taken</div>
          <div class="stat-value">{{ analytics()?.summary?.totalExams || 0 }}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background:rgba(59,130,246,0.12);color:#3b82f6">📈</div>
          <div class="stat-label">Average Score</div>
          <div class="stat-value">{{ (analytics()?.summary?.averagePercentage || 0).toFixed(1) }}%</div>
        </div>
        <div class="stat-card success">
          <div class="stat-icon" style="background:rgba(34,197,94,0.12);color:#22c55e">✅</div>
          <div class="stat-label">Passed</div>
          <div class="stat-value">{{ analytics()?.summary?.passedExams || 0 }}</div>
        </div>
        <div class="stat-card danger">
          <div class="stat-icon" style="background:rgba(239,68,68,0.12);color:#ef4444">❌</div>
          <div class="stat-label">Failed</div>
          <div class="stat-value">{{ analytics()?.summary?.failedExams || 0 }}</div>
        </div>
      </div>

      <!-- Overall Trend Indicator -->
      <div class="trend-banner" [class]="getTrendBannerClass()">
        <span class="trend-icon">{{ getTrendEmoji() }}</span>
        <div class="trend-content">
          <strong>Overall Performance Trend: {{ analytics()?.summary?.overallTrend | titlecase }}</strong>
          <p>{{ getTrendMessage() }}</p>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:var(--space-6)">
        <!-- Performance Trend Chart -->
        <div class="card">
          <h3>📈 Performance Trend</h3>
          <p class="text-muted">Percentage scores across exams</p>
          @if (hasChartData()) {
            <div style="height:300px;margin-top:var(--space-4)">
              <canvas baseChart [datasets]="performanceChartData.datasets" [labels]="performanceChartData.labels"
                [options]="lineChartOptions" type="line"></canvas>
            </div>
          } @else {
            <div class="empty-chart">Not enough data points</div>
          }
        </div>

        <!-- Subject Performance Chart -->
        <div class="card">
          <h3>📚 Subject-wise Performance</h3>
          <p class="text-muted">Average scores by subject</p>
          @if (hasSubjectData()) {
            <div style="height:300px;margin-top:var(--space-4)">
              <canvas baseChart [datasets]="subjectChartData.datasets" [labels]="subjectChartData.labels"
                [options]="barChartOptions" type="bar"></canvas>
            </div>
          } @else {
            <div class="empty-chart">No subject data available</div>
          }
        </div>
      </div>

      <!-- Subject Analysis with Trends -->
      @if (analytics()?.subjectAnalysis?.length) {
        <div class="card" style="margin-top:var(--space-6)">
          <h3>📋 Subject Analysis & Recommendations</h3>
          <p class="text-muted">Detailed breakdown with improvement suggestions</p>
          <div class="subject-grid">
            @for (sub of analytics()?.subjectAnalysis || []; track sub.subjectId) {
              <div class="subject-card" [class.needs-attention]="sub.averagePercentage < 50" [class.good]="sub.averagePercentage >= 70">
                <div class="subject-header">
                  <span class="subject-name">{{ sub.subjectName }}</span>
                  <span class="trend-badge" [class]="'trend-' + sub.trend">
                    {{ getTrendIcon(sub.trend) }} 
                    {{ sub.trendPercentage > 0 ? '+' : '' }}{{ sub.trendPercentage?.toFixed(1) || 0 }}%
                  </span>
                </div>
                <div class="subject-score">{{ sub.averagePercentage?.toFixed(1) }}%</div>
                <div class="subject-meta">
                  <span class="meta-item">↑ Best: {{ sub.highestPercentage?.toFixed(0) }}%</span>
                  <span class="meta-item">↓ Lowest: {{ sub.lowestPercentage?.toFixed(0) }}%</span>
                </div>
                <div class="pass-rate-bar">
                  <div class="pass-rate-fill" [style.width.%]="sub.passRate"></div>
                </div>
                <span class="pass-rate-text">{{ sub.passRate?.toFixed(0) }}% pass rate ({{ sub.examCount }} exams)</span>
                <div class="subject-advice">
                  @if (sub.averagePercentage < 40) {
                    <span class="advice critical">⚠️ Needs immediate attention - consider extra tutoring</span>
                  } @else if (sub.averagePercentage < 60) {
                    <span class="advice warning">📌 Focus required - practice more problems</span>
                  } @else if (sub.trend === 'declining') {
                    <span class="advice declining">📉 Performance declining - review recent topics</span>
                  } @else if (sub.trend === 'improving') {
                    <span class="advice improving">🌟 Great progress! Keep it up</span>
                  } @else {
                    <span class="advice neutral">✓ Steady performance</span>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Exam History Table -->
      @if (analytics()?.examResults?.length) {
        <div class="card" style="margin-top:var(--space-6)">
          <h3>📅 Exam History</h3>
          <table class="data-table">
            <thead>
              <tr><th>Exam</th><th>Type</th><th>Date</th><th>Score</th><th>Percentage</th><th>Grade</th><th>Status</th><th>Rank</th></tr>
            </thead>
            <tbody>
              @for (exam of analytics()?.examResults || []; track exam.examId) {
                <tr>
                  <td><strong>{{ exam.examName }}</strong></td>
                  <td><span class="badge badge-info">{{ exam.examType }}</span></td>
                  <td>{{ exam.date | date:'mediumDate' }}</td>
                  <td>{{ exam.obtainedMarks }}/{{ exam.totalMarks }}</td>
                  <td>{{ exam.percentage?.toFixed(1) }}%</td>
                  <td><span class="badge" [class]="getGradeBadge(exam.grade)">{{ exam.grade }}</span></td>
                  <td>
                    @if (exam.isPassed) {
                      <span class="badge badge-success">✅ Pass</span>
                    } @else {
                      <span class="badge badge-danger">❌ Fail</span>
                    }
                  </td>
                  <td>{{ exam.rank || '-' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Exam Comparisons -->
      @if (analytics()?.examComparisons?.length) {
        <div class="card" style="margin-top:var(--space-6)">
          <h3>🔄 Exam-to-Exam Comparison</h3>
          <p class="text-muted">See how performance changed between consecutive exams</p>
          <div class="comparisons-list">
            @for (comp of analytics()?.examComparisons || []; track comp.currentExam?.examId) {
              <div class="comparison-card">
                <div class="comp-header">
                  <span class="comp-from">{{ comp.previousExam?.examName }}</span>
                  <span class="comp-arrow">→</span>
                  <span class="comp-to">{{ comp.currentExam?.examName }}</span>
                  <span class="comp-diff" [class.positive]="comp.overallDifference > 0" [class.negative]="comp.overallDifference < 0">
                    {{ comp.overallDifference > 0 ? '+' : '' }}{{ comp.overallDifference?.toFixed(1) }}%
                  </span>
                </div>
                <div class="comp-subjects">
                  @for (sub of comp.subjectComparisons || []; track sub.subjectId) {
                    <div class="comp-subject" [class]="'status-' + sub.status">
                      <span class="sub-name">{{ sub.subjectName }}</span>
                      <span class="sub-score">{{ sub.currentPercentage?.toFixed(0) }}%</span>
                      @switch (sub.status) {
                        @case ('improved') { <span class="sub-change positive">↑ +{{ sub.difference?.toFixed(0) }}%</span> }
                        @case ('declined') { <span class="sub-change negative">↓ {{ sub.difference?.toFixed(0) }}%</span> }
                        @case ('same') { <span class="sub-change neutral">→ same</span> }
                        @default { <span class="sub-change new">NEW</span> }
                      }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- Personalized Suggestions -->
      <div class="card suggestions-card" style="margin-top:var(--space-6)">
        <h3>💡 Personalized Recommendations</h3>
        <div class="suggestions-list">
          @for (suggestion of getSuggestions(); track suggestion) {
            <div class="suggestion-item">
              <span class="suggestion-icon">💡</span>
              <p>{{ suggestion }}</p>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .empty-state { text-align: center; padding: var(--space-12); }
    .empty-icon { font-size: 64px; opacity: 0.5; margin-bottom: var(--space-4); }
    .empty-state h2 { margin-bottom: var(--space-2); }
    .empty-state .text-muted { color: var(--text-tertiary); margin-bottom: var(--space-6); }
    .empty-actions { display: flex; gap: var(--space-3); justify-content: center; }

    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-4); }
    .stat-card.success { border-color: #22c55e; background: rgba(34,197,94,0.05); }
    .stat-card.danger { border-color: #ef4444; background: rgba(239,68,68,0.05); }
    .stat-icon { width: 40px; height: 40px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 18px; margin-bottom: var(--space-2); }
    .stat-label { font-size: var(--text-sm); color: var(--text-tertiary); }
    .stat-value { font-size: var(--text-2xl); font-weight: 700; color: var(--text-primary); }

    .trend-banner { display: flex; align-items: center; gap: var(--space-4); padding: var(--space-4); border-radius: var(--radius-lg); margin-top: var(--space-6); }
    .trend-banner.improving { background: rgba(34,197,94,0.1); border: 1px solid #22c55e; }
    .trend-banner.declining { background: rgba(239,68,68,0.1); border: 1px solid #ef4444; }
    .trend-banner.stable { background: rgba(59,130,246,0.1); border: 1px solid #3b82f6; }
    .trend-banner .trend-icon { font-size: 32px; }
    .trend-banner .trend-content p { margin: 0; font-size: var(--text-sm); color: var(--text-secondary); }

    .empty-chart { display: flex; align-items: center; justify-content: center; height: 200px; color: var(--text-tertiary); font-style: italic; }

    .subject-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); margin-top: var(--space-4); }
    .subject-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-4); transition: all 0.2s; }
    .subject-card.needs-attention { border-color: #f59e0b; background: rgba(245,158,11,0.05); }
    .subject-card.good { border-color: #22c55e; }
    .subject-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); }
    .subject-name { font-weight: 600; font-size: var(--text-lg); }
    .trend-badge { font-size: var(--text-sm); padding: 2px 8px; border-radius: 4px; }
    .trend-badge.trend-improving { background: rgba(34,197,94,0.15); color: #15803d; }
    .trend-badge.trend-declining { background: rgba(239,68,68,0.15); color: #dc2626; }
    .trend-badge.trend-stable { background: rgba(107,114,128,0.15); color: #4b5563; }
    .subject-score { font-size: var(--text-3xl); font-weight: 700; color: var(--primary); }
    .subject-meta { display: flex; gap: var(--space-4); font-size: var(--text-sm); color: var(--text-secondary); margin: var(--space-2) 0; }
    .pass-rate-bar { width: 100%; height: 8px; background: var(--bg-secondary); border-radius: 4px; overflow: hidden; margin: var(--space-2) 0; }
    .pass-rate-fill { height: 100%; background: #22c55e; transition: width 0.3s; }
    .pass-rate-text { font-size: var(--text-xs); color: var(--text-tertiary); }
    .subject-advice { margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--border); }
    .advice { font-size: var(--text-sm); }
    .advice.critical { color: #dc2626; }
    .advice.warning { color: #d97706; }
    .advice.declining { color: #ea580c; }
    .advice.improving { color: #15803d; }
    .advice.neutral { color: var(--text-secondary); }

    .comparisons-list { display: flex; flex-direction: column; gap: var(--space-4); margin-top: var(--space-4); }
    .comparison-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: var(--space-4); }
    .comp-header { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3); padding-bottom: var(--space-3); border-bottom: 1px solid var(--border); font-weight: 600; }
    .comp-arrow { color: var(--text-tertiary); }
    .comp-diff { margin-left: auto; padding: 4px 12px; border-radius: 6px; font-size: var(--text-sm); }
    .comp-diff.positive { background: rgba(34,197,94,0.15); color: #15803d; }
    .comp-diff.negative { background: rgba(239,68,68,0.15); color: #dc2626; }
    .comp-subjects { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .comp-subject { display: flex; align-items: center; gap: var(--space-2); padding: 6px 12px; background: var(--bg-secondary); border-radius: 6px; font-size: var(--text-sm); }
    .sub-name { color: var(--text-secondary); }
    .sub-score { font-weight: 600; }
    .sub-change { font-weight: 500; }
    .sub-change.positive { color: #15803d; }
    .sub-change.negative { color: #dc2626; }
    .sub-change.neutral { color: var(--text-tertiary); }
    .sub-change.new { color: #3b82f6; }

    .suggestions-card { background: linear-gradient(135deg, rgba(99,102,241,0.05), rgba(59,130,246,0.05)); }
    .suggestions-list { display: flex; flex-direction: column; gap: var(--space-3); margin-top: var(--space-4); }
    .suggestion-item { display: flex; gap: var(--space-3); padding: var(--space-3); background: var(--surface); border-radius: var(--radius-md); border: 1px solid var(--border); }
    .suggestion-icon { font-size: 20px; }
    .suggestion-item p { margin: 0; color: var(--text-secondary); }

    .text-muted { color: var(--text-tertiary); font-size: var(--text-sm); }
    .grid { display: grid; gap: var(--space-4); }
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-4 { grid-template-columns: repeat(4, 1fr); }
    @media (max-width: 900px) { .grid-4 { grid-template-columns: repeat(2, 1fr); } .grid-2 { grid-template-columns: 1fr; } }
  `]
})
export class StudentAnalyticsComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  studentId = '';
  loading = signal(true);
  student = signal<any>(null);
  analytics = signal<AnalyticsData | null>(null);

  // Chart configurations
  performanceChartData: ChartData<'line'> = { labels: [], datasets: [] };
  subjectChartData: ChartData<'bar'> = { labels: [], datasets: [] };

  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Percentage' } },
      x: { title: { display: true, text: 'Exams' } }
    }
  };

  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Average %' } }
    }
  };

  ngOnInit(): void {
    this.studentId = this.route.snapshot.params['studentId'];
    this.loadStudent();
    this.loadAnalytics();
  }

  loadStudent(): void {
    this.api.get<any>(`/students/${this.studentId}`).subscribe({
      next: (res) => this.student.set(res.data || res),
      error: () => this.toast.error('Failed to load student')
    });
  }

  loadAnalytics(): void {
    this.loading.set(true);
    this.api.get<any>(`/results/analytics/student/${this.studentId}`).subscribe({
      next: (res) => {
        const data = res.data || res;
        this.analytics.set(data);
        this.buildCharts(data);
        this.loading.set(false);
      },
      error: () => {
        this.analytics.set(null);
        this.loading.set(false);
      }
    });
  }

  buildCharts(data: AnalyticsData): void {
    // Performance trend line chart
    if (data?.examResults?.length > 0) {
      const sorted = [...data.examResults].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      this.performanceChartData = {
        labels: sorted.map(e => e.examName),
        datasets: [{
          data: sorted.map(e => e.percentage),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: sorted.map(e => e.isPassed ? '#22c55e' : '#ef4444')
        }]
      };
    }

    // Subject bar chart
    if (data?.subjectAnalysis?.length > 0) {
      this.subjectChartData = {
        labels: data.subjectAnalysis.map(s => s.subjectName),
        datasets: [{
          data: data.subjectAnalysis.map(s => s.averagePercentage),
          backgroundColor: data.subjectAnalysis.map(s => 
            s.averagePercentage >= 70 ? '#22c55e' :
            s.averagePercentage >= 50 ? '#f59e0b' : '#ef4444'
          ),
          borderRadius: 4
        }]
      };
    }
  }

  hasChartData(): boolean {
    return (this.analytics()?.examResults?.length || 0) >= 2;
  }

  hasSubjectData(): boolean {
    return (this.analytics()?.subjectAnalysis?.length || 0) > 0;
  }

  getTrendBannerClass(): string {
    const trend = this.analytics()?.summary?.overallTrend;
    if (trend === 'improving') return 'improving';
    if (trend === 'declining') return 'declining';
    return 'stable';
  }

  getTrendEmoji(): string {
    const trend = this.analytics()?.summary?.overallTrend;
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '➡️';
  }

  getTrendMessage(): string {
    const trend = this.analytics()?.summary?.overallTrend;
    const avg = this.analytics()?.summary?.averagePercentage || 0;
    if (trend === 'improving') {
      return `Great progress! Performance is trending upward with ${avg.toFixed(1)}% average.`;
    }
    if (trend === 'declining') {
      return `Performance needs attention. Consider reviewing study habits and seeking help.`;
    }
    return `Consistent performance at ${avg.toFixed(1)}% average.`;
  }

  getTrendIcon(trend: string): string {
    if (trend === 'improving') return '📈';
    if (trend === 'declining') return '📉';
    return '➡️';
  }

  getGradeBadge(grade: string): string {
    if (grade?.startsWith('A')) return 'badge-success';
    if (grade?.startsWith('B')) return 'badge-info';
    if (grade?.startsWith('C')) return 'badge-warning';
    return 'badge-danger';
  }

  getSuggestions(): string[] {
    const data = this.analytics();
    const suggestions: string[] = [];

    if (!data) return ['No data available for suggestions.'];

    const avg = data.summary?.averagePercentage || 0;
    const failedExams = data.summary?.failedExams || 0;
    const passedExams = data.summary?.passedExams || 0;

    // Overall performance suggestions
    if (avg >= 90) {
      suggestions.push('Outstanding performance! Consider helping peers or exploring advanced topics.');
    } else if (avg >= 75) {
      suggestions.push('Very good performance. Focus on subjects below 80% to achieve excellence.');
    } else if (avg >= 60) {
      suggestions.push('Good progress. Identify weak areas and allocate more study time to improve.');
    } else if (avg >= 50) {
      suggestions.push('Performance needs improvement. Consider creating a structured study schedule.');
    } else {
      suggestions.push('Immediate attention required. Seek help from teachers or tutoring services.');
    }

    // Subject-specific suggestions
    const weakSubjects = (data.subjectAnalysis || []).filter(s => s.averagePercentage < 50);
    if (weakSubjects.length > 0) {
      suggestions.push(`Focus on: ${weakSubjects.map(s => s.subjectName).join(', ')} - these subjects need extra attention.`);
    }

    const decliningSubjects = (data.subjectAnalysis || []).filter(s => s.trend === 'declining');
    if (decliningSubjects.length > 0) {
      suggestions.push(`Review recent topics in: ${decliningSubjects.map(s => s.subjectName).join(', ')} - performance is declining.`);
    }

    const strongSubjects = (data.subjectAnalysis || []).filter(s => s.averagePercentage >= 80);
    if (strongSubjects.length > 0) {
      suggestions.push(`Strong in: ${strongSubjects.map(s => s.subjectName).join(', ')} - maintain this excellent performance!`);
    }

    // Exam performance suggestions
    if (failedExams > 0 && passedExams > 0) {
      const passRate = (passedExams / (passedExams + failedExams)) * 100;
      if (passRate < 70) {
        suggestions.push(`Pass rate is ${passRate.toFixed(0)}%. Focus on consistent preparation for all exams.`);
      }
    }

    if (data.summary?.overallTrend === 'declining') {
      suggestions.push('Performance is declining. Consider discussing with teachers to identify and address issues.');
    }

    return suggestions.length > 0 ? suggestions : ['Keep up the consistent effort!'];
  }
}
