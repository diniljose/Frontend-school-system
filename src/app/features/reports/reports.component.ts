import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.reports' | translate }}</h1><p>Generate and download reports</p></div>
    </div>

    <div class="report-grid">
      @for (report of reports; track report.key) {
        <div class="report-card card">
          <div class="report-icon">{{ report.icon }}</div>
          <h3>{{ report.title }}</h3>
          <p>{{ report.description }}</p>
          <div class="report-options">
            <select class="form-select" [(ngModel)]="report.format">
              <option value="pdf">PDF</option>
              <option value="excel">Excel</option>
              <option value="csv">CSV</option>
            </select>
            <button class="btn btn-primary btn-sm" (click)="generate(report)" [disabled]="generating() === report.key">
              @if (generating() === report.key) { <span class="spinner-sm"></span> }
              Generate
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .report-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-4); }
    .report-card { text-align: center; border: 1px solid var(--border); transition: var(--transition-fast); }
    .report-card:hover { border-color: var(--primary); transform: translateY(-2px); }
    .report-icon { font-size: 40px; margin-bottom: var(--space-3); }
    .report-card h3 { font-size: var(--text-lg); margin-bottom: var(--space-1); }
    .report-card p { font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-4); }
    .report-options { display: flex; gap: var(--space-3); justify-content: center; align-items: center; }
    .report-options .form-select { width: 120px; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ReportsComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  generating = signal('');

  reports = [
    { key: 'students', icon: '🎓', title: 'Student Report', description: 'Complete student data with academic records', format: 'pdf' },
    { key: 'attendance', icon: '📋', title: 'Attendance Report', description: 'Daily/monthly attendance summary', format: 'pdf' },
    { key: 'results', icon: '📝', title: 'Results Report', description: 'Exam results analysis and grade distribution', format: 'pdf' },
    { key: 'fees', icon: '💰', title: 'Financial Report', description: 'Fee collection, pending dues, revenue', format: 'excel' },
    { key: 'teachers', icon: '👨‍🏫', title: 'Staff Report', description: 'Teaching staff details and assignments', format: 'pdf' },
    { key: 'transport', icon: '🚌', title: 'Transport Report', description: 'Vehicle utilization and route details', format: 'pdf' },
  ];

  generate(report: any): void {
    this.generating.set(report.key);
    this.api.get(`/reports/${report.key}`, { format: report.format }).subscribe({
      next: () => { this.toast.success(`${report.title} generated successfully`); this.generating.set(''); },
      error: () => { this.toast.info('Report generation - API endpoint coming soon'); this.generating.set(''); },
    });
  }
}
