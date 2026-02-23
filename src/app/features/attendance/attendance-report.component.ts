import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-attendance-report',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>Attendance Report</h1><p>View attendance by class, section, and date</p></div>
    </div>
    <div class="card">
      <form class="attendance-report-toolbar" (ngSubmit)="loadReport()">
        <label>Class:
          <select class="form-select" [(ngModel)]="selectedClass" name="class">
            <option value="">Select class</option>
            <option *ngFor="let c of classes()" [value]="c._id">{{ c.name }} (Grade {{ c.grade }})</option>
          </select>
        </label>
        <label>Section:
          <select class="form-select" [(ngModel)]="selectedSection" name="section">
            <option value="">All Sections</option>
            <option *ngFor="let s of availableSections()" [value]="s.name || s">{{ s.name || s }}</option>
          </select>
        </label>
        <label>Date:
          <input type="date" class="form-input" [(ngModel)]="selectedDate" name="date" />
        </label>
        <button class="btn btn-primary" type="submit">View Report</button>
      </form>
    </div>
    <div class="card" *ngIf="records().length">
      <table class="data-table">
        <thead><tr><th>Roll</th><th>Student Name</th><th>Status</th><th>Note</th></tr></thead>
        <tbody>
          <tr *ngFor="let record of records(); let i = index">
            <td>{{ i + 1 }}</td>
            <td>{{ record.studentName }}</td>
            <td>{{ record.status }}</td>
            <td>{{ record.note || record.remarks || '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="empty-state" *ngIf="!records().length && reportLoaded">No attendance records found for the selected criteria.</div>
  `,
  styles: [`
    .attendance-report-toolbar { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; margin-bottom: 1rem; }
    .empty-state { text-align: center; padding: 2rem; color: #888; }
  `]
})
export class AttendanceReportComponent implements OnInit {
  private api = inject(ApiService);
  classes = signal<any[]>([]);
  availableSections = signal<any[]>([]);
  records = signal<any[]>([]);
  selectedClass = '';
  selectedSection = '';
  selectedDate = new Date().toISOString().split('T')[0];
  reportLoaded = false;

  ngOnInit(): void {
    this.api.get<any>('/classes').subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || res || [];
        this.classes.set(Array.isArray(data) ? data : []);
      }
    });
  }

  loadReport(): void {
    if (!this.selectedClass || !this.selectedDate) return;
    const params: any = { classId: this.selectedClass, date: this.selectedDate };
    if (this.selectedSection) params.section = this.selectedSection;
    this.api.get<any>('/attendance', params).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || res || [];
        const records = Array.isArray(data) ? data : [];
        this.records.set(records.map((rec: any) => ({
          ...rec,
          studentName: rec.studentName || rec.name || (rec.firstName && rec.lastName ? `${rec.firstName} ${rec.lastName}` : ''),
        })));
        this.reportLoaded = true;
      },
      error: () => { this.records.set([]); this.reportLoaded = true; }
    });
  }
}
