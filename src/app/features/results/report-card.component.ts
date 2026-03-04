import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-report-card',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header no-print">
      <div><h1>📄 Report Card</h1><p>Student academic performance report</p></div>
      <div class="header-actions">
        <a routerLink="/results" class="btn btn-secondary">← Back</a>
        <button class="btn btn-primary" (click)="print()">🖨️ Print</button>
      </div>
    </div>

    @if (loading()) {
      <div class="skeleton" style="height:600px"></div>
    } @else if (!hasResults()) {
      <div class="card empty-state">
        <div class="empty-icon">📋</div>
        <h2>No Results Available</h2>
        <p>No examination results have been entered for this student yet.</p>
        <p class="text-muted">Results will appear here once teachers have entered marks for completed exams.</p>
        <a routerLink="/results/entry" class="btn btn-primary">📝 Enter Marks</a>
      </div>
    } @else {
      <div class="report-card card" id="reportCard">
        <div class="report-header">
          <div class="school-logo">🏫</div>
          <div class="school-info">
            <h2>EduCore International School</h2>
            <p>Academic Year 2024-25</p>
          </div>
        </div>

        <div class="student-info-grid">
          <div class="info-item"><span class="label">Student Name</span><span class="value">{{ student()?.firstName }} {{ student()?.lastName }}</span></div>
          <div class="info-item"><span class="label">Roll Number</span><span class="value">{{ student()?.rollNumber || student()?.admissionNumber || '-' }}</span></div>
          <div class="info-item"><span class="label">Class</span><span class="value">{{ getClassName() }}</span></div>
          <div class="info-item"><span class="label">Date of Birth</span><span class="value">{{ student()?.dateOfBirth | date:'mediumDate' }}</span></div>
        </div>

        <h3 class="section-title">{{ examName() || 'Examination' }} Results</h3>
        <table class="report-table">
          <thead>
            <tr><th>Subject</th><th>Max Marks</th><th>Obtained</th><th>Percentage</th><th>Grade</th></tr>
          </thead>
          <tbody>
            @for (sub of subjects(); track sub.name) {
              <tr>
                <td>{{ sub.name }}</td>
                <td>{{ sub.maxMarks }}</td>
                <td>{{ sub.obtainedMarks }}</td>
                <td>{{ sub.percentage }}%</td>
                <td><span class="grade" [class]="'grade-' + sub.grade?.charAt(0)?.toLowerCase()">{{ sub.grade }}</span></td>
              </tr>
            }
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td><strong>Total</strong></td>
              <td><strong>{{ totalMax() }}</strong></td>
              <td><strong>{{ totalObtained() }}</strong></td>
              <td><strong>{{ overallPercentage() }}%</strong></td>
              <td><strong>{{ overallGrade() }}</strong></td>
            </tr>
          </tfoot>
        </table>

        <div class="report-footer">
          <div class="signature-block">
            <div class="signature-line"></div>
            <span>Class Teacher</span>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <span>Principal</span>
          </div>
          <div class="signature-block">
            <div class="signature-line"></div>
            <span>Parent/Guardian</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .report-card { max-width: 800px; margin: 0 auto; }
    .report-header { display: flex; align-items: center; gap: var(--space-4); margin-bottom: var(--space-6); padding-bottom: var(--space-4); border-bottom: 2px solid var(--primary); text-align: center; justify-content: center; }
    .school-logo { font-size: 48px; }
    .school-info h2 { font-size: var(--text-2xl); }
    .school-info p { color: var(--text-secondary); }
    .student-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-6); }
    .info-item { display: flex; gap: var(--space-2); }
    .info-item .label { color: var(--text-tertiary); min-width: 120px; }
    .info-item .value { font-weight: 600; }
    .section-title { margin-bottom: var(--space-4); }
    .report-table { width: 100%; border-collapse: collapse; margin-bottom: var(--space-6); }
    .report-table th, .report-table td { padding: var(--space-3); text-align: left; border: 1px solid var(--border); }
    .report-table th { background: var(--surface-hover); font-weight: 600; }
    .total-row td { background: var(--surface-hover); }
    .grade { padding: 2px 8px; border-radius: var(--radius-sm); font-weight: 600; font-size: var(--text-sm); }
    .grade-a { background: rgba(34,197,94,0.15); color: #16a34a; }
    .grade-b { background: rgba(59,130,246,0.15); color: #2563eb; }
    .grade-c { background: rgba(245,158,11,0.15); color: #d97706; }
    .grade-d, .grade-f { background: rgba(239,68,68,0.15); color: #dc2626; }
    .report-footer { display: flex; justify-content: space-between; margin-top: var(--space-8); }
    .signature-block { text-align: center; }
    .signature-line { width: 150px; border-bottom: 1px solid var(--text-primary); margin-bottom: var(--space-2); height: 40px; }
    .no-print { }
    @media print {
      .no-print { display: none !important; }
      .report-card { box-shadow: none; border: none; }
    }
  `]
})
export class ReportCardComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  student = signal<any>(null);
  subjects = signal<any[]>([]);
  hasResults = signal(false);
  totalMax = signal(0);
  totalObtained = signal(0);
  overallPercentage = signal(0);
  overallGrade = signal('');
  examName = signal('');

  ngOnInit(): void {
    const studentId = this.route.snapshot.params['studentId'];
    const examId = this.route.snapshot.queryParams['examId'];
    
    // Load student info
    this.api.get<any>(`/students/${studentId}`).subscribe({
      next: (res) => {
        const s = res.data || res;
        this.student.set(s);
      },
    });
    
    // Build params for results query - filter by examId if provided
    const resultsParams: any = { studentId };
    if (examId) {
      resultsParams.examId = examId;
    }
    
    // Load results from backend
    this.api.get<any>(`/results`, resultsParams).subscribe({
      next: (res) => {
        const responseData = res.data || res;
        const data = responseData?.data || responseData?.items || responseData || [];
        const results = Array.isArray(data) ? data : [];
        
        if (results.length > 0 && results[0].subjects?.length > 0) {
          // Use the first matching result (the specific exam if examId provided, or most recent)
          const targetResult = results[0];
          
          // Set exam name for display
          const examInfo = targetResult.exam;
          this.examName.set(typeof examInfo === 'object' ? examInfo.name : examInfo || 'Examination');
          
          const subs = targetResult.subjects.map((s: any) => ({
            name: s.subject?.name || s.subjectName || 'Unknown',
            maxMarks: s.maxMarks || 100,
            obtainedMarks: s.obtainedMarks || 0,
            percentage: s.maxMarks > 0 ? Math.round((s.obtainedMarks / s.maxMarks) * 100) : 0,
            grade: s.grade || '-',
            isPassed: s.isPassed
          }));
          this.subjects.set(subs);
          this.hasResults.set(true);
        } else {
          // No results - show empty state
          this.subjects.set([]);
          this.hasResults.set(false);
        }
        this.calculateTotals();
        this.loading.set(false);
      },
      error: () => {
        // Error - show empty state
        this.subjects.set([]);
        this.hasResults.set(false);
        this.calculateTotals();
        this.loading.set(false);
      }
    });
  }

  calculateTotals(): void {
    const subs = this.subjects();
    const maxT = subs.reduce((a, s) => a + (s.maxMarks || 0), 0);
    const obtT = subs.reduce((a, s) => a + (s.obtainedMarks || 0), 0);
    this.totalMax.set(maxT);
    this.totalObtained.set(obtT);
    const pct = maxT > 0 ? Math.round((obtT / maxT) * 100) : 0;
    this.overallPercentage.set(pct);
    this.overallGrade.set(pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'F');
  }

  print(): void { window.print(); }

  getClassName(): string {
    const s = this.student();
    if (!s) return '-';
    // Try different possible class field formats
    if (s.currentClass?.name) return `${s.currentClass.name}${s.currentSection ? ' - ' + s.currentSection : ''}`;
    if (s.className) return `${s.className}${s.currentSection ? ' - ' + s.currentSection : ''}`;
    if (typeof s.currentClass === 'string' && s.currentClass.length < 20) return s.currentClass;
    if (typeof s.classId === 'object' && s.classId?.name) return s.classId.name;
    if (typeof s.classId === 'string' && s.classId.length < 20) return s.classId;
    return s.currentSection || '-';
  }
}
