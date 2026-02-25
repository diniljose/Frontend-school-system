import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  status: string;
  date: string;
  note?: string;
  rollNumber?: number;
}

interface DateStats {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

@Component({
  selector: 'app-attendance-report',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>📊 Attendance Reports</h1>
        <p>Analyze attendance patterns with date ranges and filters</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" (click)="exportReport('csv')" [disabled]="!records().length">
          📥 Export CSV
        </button>
        <button class="btn btn-primary" (click)="exportReport('pdf')" [disabled]="!records().length">
          📄 Export PDF
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card filter-section">
      <div class="filter-row">
        <div class="filter-group">
          <label>Class *</label>
          <select class="form-select" [(ngModel)]="selectedClass" (change)="onClassChange()">
            <option value="">Select class</option>
            @for (c of classes(); track c._id) {
              <option [value]="c._id">{{ c.name }} (Grade {{ c.grade }})</option>
            }
          </select>
        </div>
        <div class="filter-group">
          <label>Section</label>
          <select class="form-select" [(ngModel)]="selectedSection">
            <option value="">All Sections</option>
            @for (s of availableSections(); track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>
        </div>
        <div class="filter-group">
          <label>Report Type</label>
          <select class="form-select" [(ngModel)]="reportType" (change)="onReportTypeChange()">
            <option value="daily">Daily</option>
            <option value="range">Date Range</option>
            <option value="monthly">Monthly Summary</option>
          </select>
        </div>
      </div>
      <div class="filter-row">
        @if (reportType === 'daily') {
          <div class="filter-group">
            <label>Date</label>
            <input type="date" class="form-input" [(ngModel)]="selectedDate" />
          </div>
        }
        @if (reportType === 'range' || reportType === 'monthly') {
          <div class="filter-group">
            <label>From Date</label>
            <input type="date" class="form-input" [(ngModel)]="fromDate" />
          </div>
          <div class="filter-group">
            <label>To Date</label>
            <input type="date" class="form-input" [(ngModel)]="toDate" />
          </div>
        }
        <div class="filter-group">
          <label>Status Filter</label>
          <select class="form-select" [(ngModel)]="statusFilter">
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>
        </div>
        <div class="filter-group btn-group">
          <button class="btn btn-primary" (click)="loadReport()" [disabled]="loading()">
            @if (loading()) { <span class="spinner"></span> }
            Generate Report
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Stats -->
    @if (reportLoaded && records().length) {
      <div class="stats-grid">
        <div class="stat-card total">
          <span class="stat-value">{{ totalRecords }}</span>
          <span class="stat-label">Total Students</span>
        </div>
        <div class="stat-card present">
          <span class="stat-value">{{ presentCount }}</span>
          <span class="stat-label">Present</span>
          <span class="stat-percent">{{ presentPercent }}%</span>
        </div>
        <div class="stat-card absent">
          <span class="stat-value">{{ absentCount }}</span>
          <span class="stat-label">Absent</span>
          <span class="stat-percent">{{ absentPercent }}%</span>
        </div>
        <div class="stat-card late">
          <span class="stat-value">{{ lateCount }}</span>
          <span class="stat-label">Late</span>
          <span class="stat-percent">{{ latePercent }}%</span>
        </div>
      </div>

      <!-- Attendance Chart (text-based bar) -->
      <div class="card chart-section">
        <h3>📈 Attendance Distribution</h3>
        <div class="bar-chart">
          <div class="bar-item">
            <span class="bar-label">Present</span>
            <div class="bar-container">
              <div class="bar present" [style.width.%]="presentPercent"></div>
            </div>
            <span class="bar-value">{{ presentPercent }}%</span>
          </div>
          <div class="bar-item">
            <span class="bar-label">Absent</span>
            <div class="bar-container">
              <div class="bar absent" [style.width.%]="absentPercent"></div>
            </div>
            <span class="bar-value">{{ absentPercent }}%</span>
          </div>
          <div class="bar-item">
            <span class="bar-label">Late</span>
            <div class="bar-container">
              <div class="bar late" [style.width.%]="latePercent"></div>
            </div>
            <span class="bar-value">{{ latePercent }}%</span>
          </div>
        </div>
      </div>
    }

    <!-- Monthly Summary View -->
    @if (reportType === 'monthly' && dateStats().length) {
      <div class="card">
        <h3>📅 Daily Breakdown</h3>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Total</th>
                <th>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              @for (d of dateStats(); track d.date) {
                <tr>
                  <td>{{ formatDate(d.date) }}</td>
                  <td class="present-cell">{{ d.present }}</td>
                  <td class="absent-cell">{{ d.absent }}</td>
                  <td class="late-cell">{{ d.late }}</td>
                  <td>{{ d.total }}</td>
                  <td>
                    <span class="percent-badge" [class]="getPercentClass(d.percentage)">
                      {{ d.percentage }}%
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }

    <!-- Records Table -->
    @if (reportLoaded) {
      <div class="card">
        <div class="table-header">
          <h3>📋 Attendance Records</h3>
          <span class="record-count">{{ filteredRecords().length }} records</span>
        </div>
        @if (filteredRecords().length) {
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  @if (reportType !== 'daily') { <th>Date</th> }
                  <th>Status</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                @for (record of filteredRecords(); track record.studentId + record.date; let i = $index) {
                  <tr>
                    <td>{{ i + 1 }}</td>
                    <td>{{ record.studentName }}</td>
                    @if (reportType !== 'daily') { <td>{{ formatDate(record.date) }}</td> }
                    <td>
                      <span class="status-badge" [class]="'status-' + record.status">
                        {{ record.status }}
                      </span>
                    </td>
                    <td>{{ record.note || '-' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <p>No attendance records found for the selected criteria</p>
          </div>
        }
      </div>
    }

    <!-- Initial state -->
    @if (!reportLoaded) {
      <div class="card empty-state">
        <div class="empty-icon">📋</div>
        <h3>Generate an Attendance Report</h3>
        <p>Select a class, date range, and click "Generate Report" to view attendance data</p>
      </div>
    }
  `,
  styles: [`
    .header-actions { display: flex; gap: var(--space-2); }
    
    .filter-section { margin-bottom: var(--space-4); }
    .filter-row { display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: flex-end; margin-bottom: var(--space-3); }
    .filter-row:last-child { margin-bottom: 0; }
    .filter-group { display: flex; flex-direction: column; gap: var(--space-1); min-width: 150px; }
    .filter-group label { font-size: var(--text-xs); font-weight: 500; color: var(--text-secondary); }
    .filter-group.btn-group { justify-content: flex-end; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-4); }
    .stat-card { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: var(--space-4); text-align: center; position: relative; }
    .stat-value { display: block; font-size: var(--text-3xl); font-weight: 700; }
    .stat-label { display: block; font-size: var(--text-sm); color: var(--text-muted); margin-top: var(--space-1); }
    .stat-percent { position: absolute; top: var(--space-2); right: var(--space-3); font-size: var(--text-xs); font-weight: 600; padding: 2px 6px; border-radius: var(--radius-full); }
    .stat-card.total .stat-value { color: var(--color-primary); }
    .stat-card.present .stat-value { color: #10b981; }
    .stat-card.present .stat-percent { background: rgba(16,185,129,0.1); color: #059669; }
    .stat-card.absent .stat-value { color: #ef4444; }
    .stat-card.absent .stat-percent { background: rgba(239,68,68,0.1); color: #dc2626; }
    .stat-card.late .stat-value { color: #f59e0b; }
    .stat-card.late .stat-percent { background: rgba(245,158,11,0.1); color: #d97706; }

    .chart-section { margin-bottom: var(--space-4); }
    .chart-section h3 { margin-bottom: var(--space-4); font-size: var(--text-base); }
    .bar-chart { display: flex; flex-direction: column; gap: var(--space-3); }
    .bar-item { display: grid; grid-template-columns: 80px 1fr 60px; align-items: center; gap: var(--space-3); }
    .bar-label { font-size: var(--text-sm); font-weight: 500; }
    .bar-container { height: 24px; background: var(--bg-muted); border-radius: var(--radius-md); overflow: hidden; }
    .bar { height: 100%; border-radius: var(--radius-md); transition: width 0.5s ease; }
    .bar.present { background: linear-gradient(90deg, #10b981, #34d399); }
    .bar.absent { background: linear-gradient(90deg, #ef4444, #f87171); }
    .bar.late { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
    .bar-value { font-size: var(--text-sm); font-weight: 600; text-align: right; }

    .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-3); }
    .table-header h3 { margin: 0; font-size: var(--text-base); }
    .record-count { font-size: var(--text-sm); color: var(--text-secondary); }
    .table-wrapper { overflow-x: auto; }

    .status-badge { display: inline-block; padding: 2px 10px; border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: 500; text-transform: capitalize; }
    .status-present { background: rgba(16,185,129,0.1); color: #059669; }
    .status-absent { background: rgba(239,68,68,0.1); color: #dc2626; }
    .status-late { background: rgba(245,158,11,0.1); color: #d97706; }

    .present-cell { color: #059669; font-weight: 500; }
    .absent-cell { color: #dc2626; font-weight: 500; }
    .late-cell { color: #d97706; font-weight: 500; }
    
    .percent-badge { display: inline-block; padding: 2px 8px; border-radius: var(--radius-full); font-size: var(--text-xs); font-weight: 600; }
    .percent-high { background: rgba(16,185,129,0.1); color: #059669; }
    .percent-medium { background: rgba(245,158,11,0.1); color: #d97706; }
    .percent-low { background: rgba(239,68,68,0.1); color: #dc2626; }

    .empty-state { text-align: center; padding: var(--space-8); color: var(--text-muted); }
    .empty-icon { font-size: 48px; margin-bottom: var(--space-3); opacity: 0.5; }
    .empty-state h3 { color: var(--text-primary); margin-bottom: var(--space-2); }
    .empty-state p { margin: 0; }

    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; margin-right: var(--space-2); }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .filter-group { min-width: 100%; }
      .header-actions { flex-direction: column; width: 100%; }
      .bar-item { grid-template-columns: 60px 1fr 50px; }
    }
  `]
})
export class AttendanceReportComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  
  loading = signal(false);
  classes = signal<any[]>([]);
  students = signal<any[]>([]);
  availableSections = signal<string[]>([]);
  records = signal<AttendanceRecord[]>([]);
  dateStats = signal<DateStats[]>([]);
  
  selectedClass = '';
  selectedSection = '';
  selectedDate = new Date().toISOString().split('T')[0];
  fromDate = '';
  toDate = '';
  reportType = 'daily';
  statusFilter = '';
  reportLoaded = false;

  // Computed stats
  get totalRecords(): number { return this.records().length; }
  get presentCount(): number { return this.records().filter(r => r.status === 'present').length; }
  get absentCount(): number { return this.records().filter(r => r.status === 'absent').length; }
  get lateCount(): number { return this.records().filter(r => r.status === 'late').length; }
  get presentPercent(): number { return this.totalRecords ? Math.round((this.presentCount / this.totalRecords) * 100) : 0; }
  get absentPercent(): number { return this.totalRecords ? Math.round((this.absentCount / this.totalRecords) * 100) : 0; }
  get latePercent(): number { return this.totalRecords ? Math.round((this.lateCount / this.totalRecords) * 100) : 0; }

  filteredRecords = signal<AttendanceRecord[]>([]);

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadClasses();
  }

  private setDefaultDates(): void {
    const today = new Date();
    this.toDate = today.toISOString().split('T')[0];
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    this.fromDate = firstOfMonth.toISOString().split('T')[0];
  }

  loadClasses(): void {
    this.api.get<any>('/classes', { limit: 100 }).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        this.classes.set(Array.isArray(data) ? data : []);
      }
    });
  }

  private loadStudentsForClass(): void {
    if (!this.selectedClass) return;
    const params: any = { classId: this.selectedClass, limit: 500, status: 'active' };
    if (this.selectedSection) params.section = this.selectedSection;
    
    this.api.get<any>('/students', params).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        this.students.set(Array.isArray(data) ? data : []);
      }
    });
  }

  onClassChange(): void {
    const cls = this.classes().find(c => c._id === this.selectedClass);
    if (cls?.sections?.length) {
      this.availableSections.set(cls.sections.map((s: any) => typeof s === 'string' ? s : s.name));
    } else {
      this.availableSections.set(['A', 'B', 'C', 'D']);
    }
    this.selectedSection = '';
    this.loadStudentsForClass();
  }

  onReportTypeChange(): void {
    this.reportLoaded = false;
    this.records.set([]);
    this.dateStats.set([]);
  }

  loadReport(): void {
    if (!this.selectedClass) {
      this.toast.error('Please select a class');
      return;
    }

    this.loading.set(true);
    this.reportLoaded = false;

    // Backend API uses 'date' param for single day, not 'fromDate'/'toDate'
    // For date ranges, we need to fetch multiple days
    if (this.reportType === 'daily') {
      this.loadSingleDayReport();
    } else {
      this.loadDateRangeReport();
    }
  }

  private loadSingleDayReport(): void {
    const params: any = { classId: this.selectedClass, date: this.selectedDate };
    if (this.selectedSection) params.section = this.selectedSection;

    this.api.get<any>('/attendance', params).subscribe({
      next: (res) => this.processAttendanceResponse(res),
      error: () => this.handleLoadError()
    });
  }

  private loadDateRangeReport(): void {
    // Use optimized single API call with date range
    const params: any = { 
      classId: this.selectedClass, 
      fromDate: this.fromDate,
      toDate: this.toDate
    };
    if (this.selectedSection) params.section = this.selectedSection;

    this.api.get<any>('/attendance', params).subscribe({
      next: (res) => {
        const data = res?.data?.data || res?.data || [];
        const attendanceData = Array.isArray(data) ? data : [];
        
        const allRecords: AttendanceRecord[] = [];
        attendanceData.forEach((attendance: any) => {
          const dateStr = attendance.date?.split('T')[0] || this.fromDate;
          this.parseAttendanceData([attendance], dateStr).forEach(r => allRecords.push(r));
        });
        
        this.records.set(allRecords);
        this.applyStatusFilter();
        
        if (this.reportType === 'monthly') {
          this.calculateDateStats(allRecords);
        }
        
        this.reportLoaded = true;
        this.loading.set(false);
      },
      error: () => this.handleLoadError()
    });
  }

  private processAttendanceResponse(res: any): void {
    const data = res.data?.data || res.data || [];
    const records = this.parseAttendanceData(data, this.selectedDate);
    
    this.records.set(records);
    this.applyStatusFilter();
    
    if (this.reportType === 'monthly') {
      this.calculateDateStats(records);
    }
    
    this.reportLoaded = true;
    this.loading.set(false);
  }

  private parseAttendanceData(data: any[], defaultDate: string): AttendanceRecord[] {
    const records: AttendanceRecord[] = [];
    const items = Array.isArray(data) ? data : [];
    
    items.forEach((attendance: any) => {
      // Backend returns { date, class, section, records: [{ student, status, remarks }] }
      const attendanceDate = attendance.date?.split('T')[0] || defaultDate;
      
      if (attendance.records && Array.isArray(attendance.records)) {
        // Nested records structure from backend
        attendance.records.forEach((rec: any) => {
          records.push({
            studentId: rec.student?._id || rec.student || '',
            studentName: this.getStudentName(rec.student, attendance),
            status: rec.status || 'unknown',
            date: attendanceDate,
            note: rec.remarks || ''
          });
        });
      } else {
        // Flat structure (fallback)
        records.push({
          studentId: attendance.studentId || attendance._id || '',
          studentName: attendance.studentName || attendance.name || 
            (attendance.student?.firstName ? `${attendance.student.firstName} ${attendance.student.lastName}` : 'Unknown'),
          status: attendance.status || 'unknown',
          date: attendanceDate,
          note: attendance.note || attendance.remarks || ''
        });
      }
    });
    
    return records;
  }

  private getStudentName(student: any, attendance: any): string {
    // Student could be populated object or just ID
    if (typeof student === 'object' && student) {
      if (student.firstName) return `${student.firstName} ${student.lastName || ''}`.trim();
      if (student.name) return student.name;
    }
    // Try to find in loaded students
    const studentData = this.students().find(s => s._id === (student?._id || student));
    if (studentData) {
      return `${studentData.firstName} ${studentData.lastName || ''}`.trim();
    }
    // Fallback: just show "Student" + last 4 chars of ID
    const id = student?._id || student || '';
    return id ? `Student ...${String(id).slice(-4)}` : 'Unknown';
  }

  private handleLoadError(): void {
    this.records.set([]);
    this.filteredRecords.set([]);
    this.reportLoaded = true;
    this.loading.set(false);
  }

  applyStatusFilter(): void {
    if (this.statusFilter) {
      this.filteredRecords.set(this.records().filter(r => r.status === this.statusFilter));
    } else {
      this.filteredRecords.set(this.records());
    }
  }

  calculateDateStats(records: AttendanceRecord[]): void {
    const byDate: { [key: string]: DateStats } = {};
    
    records.forEach(r => {
      const date = r.date?.split('T')[0] || '';
      if (!byDate[date]) {
        byDate[date] = { date, present: 0, absent: 0, late: 0, total: 0, percentage: 0 };
      }
      byDate[date].total++;
      if (r.status === 'present') byDate[date].present++;
      else if (r.status === 'absent') byDate[date].absent++;
      else if (r.status === 'late') byDate[date].late++;
    });

    const stats = Object.values(byDate).map(d => ({
      ...d,
      percentage: d.total ? Math.round((d.present / d.total) * 100) : 0
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    this.dateStats.set(stats);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getPercentClass(percent: number): string {
    if (percent >= 80) return 'percent-high';
    if (percent >= 60) return 'percent-medium';
    return 'percent-low';
  }

  exportReport(format: 'csv' | 'pdf'): void {
    if (!this.filteredRecords().length) {
      this.toast.error('No records to export');
      return;
    }

    if (format === 'csv') {
      this.exportCSV();
    } else {
      this.exportPDF();
    }
  }

  private exportCSV(): void {
    const headers = this.reportType === 'daily' 
      ? ['#', 'Student Name', 'Status', 'Note']
      : ['#', 'Student Name', 'Date', 'Status', 'Note'];
    
    const rows = this.filteredRecords().map((r, i) => {
      const base = [i + 1, r.studentName];
      if (this.reportType !== 'daily') base.push(this.formatDate(r.date));
      base.push(r.status, r.note || '');
      return base;
    });

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success('CSV exported successfully');
  }

  private exportPDF(): void {
    // Create printable HTML and open print dialog
    const cls = this.classes().find(c => c._id === this.selectedClass);
    const className = cls ? `${cls.name} (Grade ${cls.grade})` : '';
    
    const content = `
      <html>
      <head>
        <title>Attendance Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 24px; margin-bottom: 10px; }
          .meta { margin-bottom: 20px; color: #666; }
          .stats { display: flex; gap: 20px; margin-bottom: 20px; }
          .stat { padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
          .present { color: #059669; }
          .absent { color: #dc2626; }
          .late { color: #d97706; }
        </style>
      </head>
      <body>
        <h1>Attendance Report</h1>
        <div class="meta">
          <p><strong>Class:</strong> ${className} ${this.selectedSection ? '- Section ' + this.selectedSection : ''}</p>
          <p><strong>Date:</strong> ${this.reportType === 'daily' ? this.formatDate(this.selectedDate) : this.formatDate(this.fromDate) + ' to ' + this.formatDate(this.toDate)}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div class="stats">
          <div class="stat"><strong>Total:</strong> ${this.totalRecords}</div>
          <div class="stat present"><strong>Present:</strong> ${this.presentCount} (${this.presentPercent}%)</div>
          <div class="stat absent"><strong>Absent:</strong> ${this.absentCount} (${this.absentPercent}%)</div>
          <div class="stat late"><strong>Late:</strong> ${this.lateCount} (${this.latePercent}%)</div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Student Name</th>${this.reportType !== 'daily' ? '<th>Date</th>' : ''}<th>Status</th><th>Note</th></tr></thead>
          <tbody>
            ${this.filteredRecords().map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td>${r.studentName}</td>
                ${this.reportType !== 'daily' ? `<td>${this.formatDate(r.date)}</td>` : ''}
                <td class="${r.status}">${r.status}</td>
                <td>${r.note || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.print();
    }
    this.toast.success('PDF export ready - print dialog opened');
  }
}
