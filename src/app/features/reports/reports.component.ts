import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

interface ReportConfig {
  key: string;
  icon: string;
  title: string;
  description: string;
  format: string;
  filters?: any;
}

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>📊 {{ 'nav.reports' | translate }}</h1>
        <p>Generate comprehensive reports for your school</p>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="quick-stats">
      <div class="stat-item"><span class="stat-num">{{ stats().students }}</span><span class="stat-lbl">Students</span></div>
      <div class="stat-item"><span class="stat-num">{{ stats().teachers }}</span><span class="stat-lbl">Teachers</span></div>
      <div class="stat-item"><span class="stat-num">{{ stats().classes }}</span><span class="stat-lbl">Classes</span></div>
      <div class="stat-item"><span class="stat-num">{{ stats().attendance }}%</span><span class="stat-lbl">Avg Attendance</span></div>
    </div>

    <div class="report-grid">
      @for (report of reports; track report.key) {
        <div class="report-card card" [class.expanded]="expandedReport === report.key">
          <div class="report-header" (click)="toggleExpand(report.key)">
            <div class="report-icon">{{ report.icon }}</div>
            <div class="report-info">
              <h3>{{ report.title }}</h3>
              <p>{{ report.description }}</p>
            </div>
            <span class="expand-icon">{{ expandedReport === report.key ? '▼' : '▶' }}</span>
          </div>
          
          @if (expandedReport === report.key) {
            <div class="report-filters">
              <!-- Student Report Filters -->
              @if (report.key === 'students') {
                <div class="filter-row">
                  <div class="filter-item">
                    <label>Class</label>
                    <select class="form-select" [(ngModel)]="report.filters.classId">
                      <option value="">All Classes</option>
                      @for (c of classes(); track c._id) {
                        <option [value]="c._id">{{ c.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="filter-item">
                    <label>Section</label>
                    <select class="form-select" [(ngModel)]="report.filters.section">
                      <option value="">All Sections</option>
                      @for (s of ['A','B','C','D']; track s) {
                        <option [value]="s">{{ s }}</option>
                      }
                    </select>
                  </div>
                  <div class="filter-item">
                    <label>Status</label>
                    <select class="form-select" [(ngModel)]="report.filters.status">
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="graduated">Graduated</option>
                    </select>
                  </div>
                </div>
              }

              <!-- Attendance Report Filters -->
              @if (report.key === 'attendance') {
                <div class="filter-row">
                  <div class="filter-item">
                    <label>Class</label>
                    <select class="form-select" [(ngModel)]="report.filters.classId">
                      <option value="">All Classes</option>
                      @for (c of classes(); track c._id) {
                        <option [value]="c._id">{{ c.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="filter-item">
                    <label>From Date</label>
                    <input type="date" class="form-input" [(ngModel)]="report.filters.fromDate" />
                  </div>
                  <div class="filter-item">
                    <label>To Date</label>
                    <input type="date" class="form-input" [(ngModel)]="report.filters.toDate" />
                  </div>
                </div>
              }

              <!-- Results Report Filters -->
              @if (report.key === 'results') {
                <div class="filter-row">
                  <div class="filter-item">
                    <label>Class</label>
                    <select class="form-select" [(ngModel)]="report.filters.classId" (change)="onClassFilterChange(report)">
                      <option value="">All Classes</option>
                      @for (c of classes(); track c._id) {
                        <option [value]="c._id">{{ c.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="filter-item">
                    <label>Section</label>
                    <select class="form-select" [(ngModel)]="report.filters.section">
                      <option value="">All Sections</option>
                      @for (s of getSectionsForClass(report.filters.classId); track s) {
                        <option [value]="s">{{ s }}</option>
                      }
                    </select>
                  </div>
                  <div class="filter-item">
                    <label>Exam</label>
                    <select class="form-select" [(ngModel)]="report.filters.examId">
                      <option value="">All Exams</option>
                      @for (e of getFilteredExams(report.filters.classId); track e._id) {
                        <option [value]="e._id">{{ e.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="filter-item">
                    <label>Include</label>
                    <select class="form-select" [(ngModel)]="report.filters.include">
                      <option value="">All Students</option>
                      <option value="toppers">Top 10</option>
                      <option value="failed">Failed Students</option>
                    </select>
                  </div>
                </div>
              }

              <!-- Fees Report Filters -->
              @if (report.key === 'fees') {
                <div class="filter-row">
                  <div class="filter-item">
                    <label>Status</label>
                    <select class="form-select" [(ngModel)]="report.filters.status">
                      <option value="">All</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  </div>
                  <div class="filter-item">
                    <label>From Date</label>
                    <input type="date" class="form-input" [(ngModel)]="report.filters.fromDate" />
                  </div>
                  <div class="filter-item">
                    <label>To Date</label>
                    <input type="date" class="form-input" [(ngModel)]="report.filters.toDate" />
                  </div>
                </div>
              }

              <!-- Teachers Report Filters -->
              @if (report.key === 'teachers') {
                <div class="filter-row">
                  <div class="filter-item">
                    <label>Status</label>
                    <select class="form-select" [(ngModel)]="report.filters.status">
                      <option value="">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div class="filter-item">
                    <label>Include</label>
                    <select class="form-select" [(ngModel)]="report.filters.include">
                      <option value="basic">Basic Info</option>
                      <option value="detailed">With Assignments</option>
                      <option value="full">Full Details</option>
                    </select>
                  </div>
                </div>
              }

              <!-- Transport Report Filters -->
              @if (report.key === 'transport') {
                <div class="filter-row">
                  <div class="filter-item">
                    <label>Report Type</label>
                    <select class="form-select" [(ngModel)]="report.filters.type">
                      <option value="vehicles">Vehicle List</option>
                      <option value="routes">Routes Summary</option>
                      <option value="students">Student Transport</option>
                    </select>
                  </div>
                </div>
              }

              <div class="report-actions">
                <select class="form-select format-select" [(ngModel)]="report.format">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
                <button class="btn btn-primary" (click)="generate(report)" [disabled]="generating() === report.key">
                  @if (generating() === report.key) { <span class="spinner"></span> }
                  Generate Report
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Recent Reports -->
    <div class="card recent-section">
      <h3>📁 Recent Reports</h3>
      @if (recentReports().length) {
        <div class="recent-list">
          @for (r of recentReports(); track r.id) {
            <div class="recent-item">
              <span class="recent-icon">{{ r.icon }}</span>
              <div class="recent-info">
                <span class="recent-name">{{ r.name }}</span>
                <span class="recent-date">{{ r.date }}</span>
              </div>
              <button class="btn btn-ghost btn-sm" (click)="redownload(r)">📥</button>
            </div>
          }
        </div>
      } @else {
        <p class="no-recent">No reports generated yet. Generate a report above to see it here.</p>
      }
    </div>
  `,
  styles: [`
    .quick-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
    .stat-item { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: var(--space-4); text-align: center; }
    .stat-num { display: block; font-size: var(--text-2xl); font-weight: 700; color: var(--color-primary); }
    .stat-lbl { font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; }

    .report-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: var(--space-4); margin-bottom: var(--space-6); }
    
    .report-card { border: 1px solid var(--border-color); transition: all 0.2s; overflow: hidden; }
    .report-card:hover { border-color: var(--color-primary); }
    .report-card.expanded { border-color: var(--color-primary); }
    
    .report-header { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4); cursor: pointer; }
    .report-icon { font-size: 32px; flex-shrink: 0; }
    .report-info { flex: 1; min-width: 0; }
    .report-info h3 { font-size: var(--text-base); font-weight: 600; margin: 0 0 var(--space-1); }
    .report-info p { font-size: var(--text-sm); color: var(--text-secondary); margin: 0; }
    .expand-icon { color: var(--text-muted); font-size: 12px; }

    .report-filters { padding: 0 var(--space-4) var(--space-4); border-top: 1px solid var(--border-color); padding-top: var(--space-4); background: var(--bg-muted); }
    .filter-row { display: flex; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-4); }
    .filter-item { display: flex; flex-direction: column; gap: var(--space-1); min-width: 140px; flex: 1; }
    .filter-item label { font-size: var(--text-xs); font-weight: 500; color: var(--text-secondary); }

    .report-actions { display: flex; gap: var(--space-3); justify-content: flex-end; align-items: center; padding-top: var(--space-3); border-top: 1px solid var(--border-color); }
    .format-select { width: 100px; }

    .recent-section { margin-top: var(--space-4); }
    .recent-section h3 { margin-bottom: var(--space-4); font-size: var(--text-base); }
    .recent-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .recent-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); background: var(--bg-muted); border-radius: var(--radius-md); }
    .recent-icon { font-size: 20px; }
    .recent-info { flex: 1; }
    .recent-name { display: block; font-weight: 500; font-size: var(--text-sm); }
    .recent-date { display: block; font-size: var(--text-xs); color: var(--text-muted); }
    .no-recent { text-align: center; color: var(--text-muted); padding: var(--space-4); }

    .spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; margin-right: 6px; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .quick-stats { grid-template-columns: repeat(2, 1fr); }
      .report-grid { grid-template-columns: 1fr; }
      .filter-row { flex-direction: column; }
      .filter-item { min-width: 100%; }
      .report-actions { flex-direction: column; }
      .format-select { width: 100%; }
    }
  `]
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  
  generating = signal('');
  classes = signal<any[]>([]);
  exams = signal<any[]>([]);
  stats = signal({ students: 0, teachers: 0, classes: 0, attendance: 0 });
  recentReports = signal<any[]>([]);
  
  expandedReport = '';

  reports: ReportConfig[] = [
    { 
      key: 'students', icon: '🎓', title: 'Student Report', 
      description: 'Complete student data with academic records', 
      format: 'pdf',
      filters: { classId: '', section: '', status: '' }
    },
    { 
      key: 'attendance', icon: '📋', title: 'Attendance Report', 
      description: 'Daily/monthly attendance summary', 
      format: 'pdf',
      filters: { classId: '', fromDate: '', toDate: '' }
    },
    { 
      key: 'results', icon: '📝', title: 'Results Report', 
      description: 'Exam results analysis and grade distribution', 
      format: 'pdf',
      filters: { classId: '', section: '', examId: '', include: '' }
    },
    { 
      key: 'fees', icon: '💰', title: 'Financial Report', 
      description: 'Fee collection, pending dues, revenue', 
      format: 'excel',
      filters: { status: '', fromDate: '', toDate: '' }
    },
    { 
      key: 'teachers', icon: '👨‍🏫', title: 'Staff Report', 
      description: 'Teaching staff details and assignments', 
      format: 'pdf',
      filters: { status: '', include: 'basic' }
    },
    { 
      key: 'transport', icon: '🚌', title: 'Transport Report', 
      description: 'Vehicle utilization and route details', 
      format: 'pdf',
      filters: { type: 'vehicles' }
    },
  ];

  ngOnInit(): void {
    this.initDateFilters();
    this.loadClasses();
    this.loadExams();
    this.loadStats();
    this.loadRecentReports();
  }

  private initDateFilters(): void {
    const today = new Date();
    const toDate = today.toISOString().split('T')[0];
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    
    this.reports.forEach(r => {
      if (r.filters?.fromDate !== undefined) r.filters.fromDate = firstOfMonth;
      if (r.filters?.toDate !== undefined) r.filters.toDate = toDate;
    });
  }

  loadClasses(): void {
    this.api.get<any>('/classes', { limit: 100 }).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        this.classes.set(Array.isArray(data) ? data : []);
      }
    });
  }

  loadExams(): void {
    this.api.get<any>('/exams', { limit: 100 }).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        this.exams.set(Array.isArray(data) ? data : []);
      }
    });
  }

  loadStats(): void {
    // Load stats from multiple endpoints
    Promise.all([
      this.api.get<any>('/students', { limit: 1 }).toPromise().catch(() => ({ data: { total: 0 } })),
      this.api.get<any>('/teachers', { limit: 1 }).toPromise().catch(() => ({ data: { total: 0 } })),
      this.api.get<any>('/classes', { limit: 1 }).toPromise().catch(() => ({ data: { total: 0 } })),
    ]).then(([students, teachers, classes]) => {
      this.stats.set({
        students: students?.data?.total || students?.data?.length || 0,
        teachers: teachers?.data?.total || teachers?.data?.length || 0,
        classes: classes?.data?.total || classes?.data?.length || 0,
        attendance: 85 // Placeholder, would need actual calculation
      });
    });
  }

  loadRecentReports(): void {
    // Load from localStorage
    const saved = localStorage.getItem('recentReports');
    if (saved) {
      try {
        this.recentReports.set(JSON.parse(saved).slice(0, 5));
      } catch {}
    }
  }

  toggleExpand(key: string): void {
    this.expandedReport = this.expandedReport === key ? '' : key;
  }

  getFilteredExams(classId: string): any[] {
    if (!classId) return this.exams();
    
    return this.exams().filter(exam => {
      // Check if exam is assigned to this class via schedule
      const hasScheduleForClass = exam.schedule?.some((s: any) => {
        const scheduleClassId = typeof s.class === 'object' ? s.class._id : s.class;
        return scheduleClassId === classId;
      });
      if (hasScheduleForClass) return true;
      
      // Check if exam is directly assigned to this class
      const hasClassAssignment = exam.classes?.some((c: any) => {
        const examClassId = typeof c === 'object' ? c._id : c;
        return examClassId === classId;
      });
      return hasClassAssignment;
    });
  }

  getSectionsForClass(classId: string): string[] {
    if (!classId) return ['A', 'B', 'C', 'D'];
    const cls = this.classes().find(c => c._id === classId);
    if (!cls?.sections?.length) return ['A', 'B', 'C', 'D'];
    return cls.sections.map((s: any) => typeof s === 'string' ? s : s.name);
  }

  onClassFilterChange(report: ReportConfig): void {
    // Reset exam selection when class changes
    if (report.filters?.examId) {
      report.filters.examId = '';
    }
    if (report.filters?.section) {
      report.filters.section = '';
    }
  }

  generate(report: ReportConfig): void {
    this.generating.set(report.key);

    // Special handling for attendance - need to fetch per-date since backend uses single date param
    if (report.key === 'attendance') {
      this.generateAttendanceReport(report);
      return;
    }

    // Build endpoint and fetch data
    const endpoint = this.getEndpoint(report);
    const params = this.buildParams(report);

    this.api.get<any>(endpoint, params).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        const records = Array.isArray(data) ? data : [];
        
        if (!records.length) {
          this.toast.info('No data found for the selected criteria');
          this.generating.set('');
          return;
        }

        // Transform data to be user-friendly (no MongoDB IDs)
        const transformedData = this.transformDataForExport(report.key, records);
        this.exportData(report, transformedData);
        this.saveToRecent(report);
        this.generating.set('');
      },
      error: () => {
        // Generate sample data for demo
        const sampleData = this.getSampleData(report);
        this.exportData(report, sampleData);
        this.saveToRecent(report);
        this.generating.set('');
      }
    });
  }

  private generateAttendanceReport(report: ReportConfig): void {
    const filters = report.filters || {};
    const fromDate = filters.fromDate || new Date().toISOString().split('T')[0];
    const toDate = filters.toDate || fromDate;
    const classId = filters.classId;

    if (!classId) {
      this.toast.error('Please select a class for attendance report');
      this.generating.set('');
      return;
    }

    // Use optimized single API call with date range (backend handles this efficiently)
    const params: any = { classId, fromDate, toDate };
    if (filters.section) params.section = filters.section;

    this.api.get<any>('/attendance', params).subscribe({
      next: (res) => {
        const data = res?.data?.data || res?.data || [];
        const records = Array.isArray(data) ? data : [];

        if (!records.length) {
          this.toast.info('No attendance data found for the selected date range');
          this.generating.set('');
          return;
        }

        const transformedData = this.transformDataForExport('attendance', records);
        this.exportData(report, transformedData);
        this.saveToRecent(report);
        this.generating.set('');
      },
      error: () => {
        const sampleData = this.getSampleData(report);
        this.exportData(report, sampleData);
        this.saveToRecent(report);
        this.generating.set('');
      }
    });
  }

  private transformDataForExport(reportKey: string, data: any[]): any[] {
    switch (reportKey) {
      case 'students':
        return data.map((s, idx) => ({
          'Roll No': s.rollNumber || idx + 1,
          'First Name': s.firstName || '',
          'Last Name': s.lastName || '',
          'Class': s.currentClass?.name || s.className || this.getClassName(s.currentClass) || '-',
          'Section': s.currentSection || '-',
          'Gender': s.gender || '-',
          'Date of Birth': s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString() : '-',
          'Email': s.email || '-',
          'Phone': s.phone || s.contactNumber || '-',
          'Status': s.status || 'active',
          'Admission Date': s.admissionDate ? new Date(s.admissionDate).toLocaleDateString() : '-'
        }));
      
      case 'teachers':
        return data.map(t => ({
          'Name': `${t.firstName || ''} ${t.lastName || ''}`.trim() || t.name || '-',
          'Email': t.email || '-',
          'Phone': t.phone || t.contactNumber || '-',
          'Qualification': t.qualification || '-',
          'Specialization': t.specialization || '-',
          'Experience (Years)': t.experience || '-',
          'Status': t.isActive ? 'Active' : 'Inactive',
          'Join Date': t.joiningDate ? new Date(t.joiningDate).toLocaleDateString() : '-'
        }));
      
      case 'attendance':
        // Handle nested attendance structure
        const flatRecords: any[] = [];
        data.forEach(attendance => {
          const date = attendance.date ? new Date(attendance.date).toLocaleDateString() : '-';
          const className = attendance.class?.name || this.getClassName(attendance.class) || '-';
          const section = attendance.section || '-';
          
          if (attendance.records && Array.isArray(attendance.records)) {
            attendance.records.forEach((rec: any) => {
              flatRecords.push({
                'Date': date,
                'Class': className,
                'Section': section,
                'Student': rec.student?.firstName 
                  ? `${rec.student.firstName} ${rec.student.lastName || ''}`.trim()
                  : 'Student',
                'Status': rec.status || '-',
                'Remarks': rec.remarks || '-'
              });
            });
          }
        });
        return flatRecords.length ? flatRecords : data.map(a => ({
          'Date': a.date ? new Date(a.date).toLocaleDateString() : '-',
          'Student': a.studentName || '-',
          'Status': a.status || '-'
        }));
      
      case 'results':
        return data.map(r => ({
          'Student': r.student?.firstName 
            ? `${r.student.firstName} ${r.student.lastName || ''}`.trim()
            : r.studentName || '-',
          'Exam': r.exam?.name || this.getExamName(r.exam) || '-',
          'Subject': r.subject?.name || '-',
          'Marks Obtained': r.marksObtained ?? '-',
          'Total Marks': r.totalMarks ?? '-',
          'Grade': r.grade || '-',
          'Percentage': r.percentage ? `${r.percentage}%` : '-',
          'Status': r.status || 'Pending'
        }));
      
      case 'fees':
        return data.map(f => ({
          'Student': f.student?.firstName 
            ? `${f.student.firstName} ${f.student.lastName || ''}`.trim()
            : f.studentName || '-',
          'Fee Type': f.feeType || f.type || '-',
          'Amount': f.amount ? `₹${f.amount}` : '-',
          'Paid Amount': f.paidAmount ? `₹${f.paidAmount}` : '₹0',
          'Due Amount': f.dueAmount ? `₹${f.dueAmount}` : '-',
          'Due Date': f.dueDate ? new Date(f.dueDate).toLocaleDateString() : '-',
          'Status': f.status || 'Pending',
          'Payment Date': f.paymentDate ? new Date(f.paymentDate).toLocaleDateString() : '-'
        }));
      
      case 'transport':
        return data.map(v => ({
          'Vehicle No': v.vehicleNumber || v.number || '-',
          'Type': v.type || '-',
          'Capacity': v.capacity || '-',
          'Driver': v.driver?.name || v.driverName || '-',
          'Route': v.route?.name || v.routeName || '-',
          'Status': v.status || 'Active'
        }));
      
      default:
        // Generic transformation - remove _id fields and format dates
        return data.map(item => {
          const transformed: any = {};
          Object.entries(item).forEach(([key, value]) => {
            // Skip MongoDB IDs
            if (key === '_id' || key === '__v' || key.endsWith('Id')) return;
            
            // Format key to be readable
            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
            
            // Handle values
            if (value === null || value === undefined) {
              transformed[formattedKey] = '-';
            } else if (typeof value === 'object' && (value as any)._id) {
              // Extract name from populated object
              transformed[formattedKey] = (value as any).name || (value as any).firstName || '-';
            } else if (key.toLowerCase().includes('date') && typeof value === 'string') {
              transformed[formattedKey] = new Date(value).toLocaleDateString();
            } else {
              transformed[formattedKey] = value;
            }
          });
          return transformed;
        });
    }
  }

  private getClassName(classId: any): string {
    if (!classId) return '-';
    if (typeof classId === 'object') return classId.name || '-';
    const cls = this.classes().find(c => c._id === classId);
    return cls?.name || '-';
  }

  private getExamName(examId: any): string {
    if (!examId) return '-';
    if (typeof examId === 'object') return examId.name || '-';
    const exam = this.exams().find(e => e._id === examId);
    return exam?.name || '-';
  }

  private getEndpoint(report: ReportConfig): string {
    const endpoints: { [key: string]: string } = {
      students: '/students',
      attendance: '/attendance',
      results: '/results',
      fees: '/fees',
      teachers: '/teachers',
      transport: '/transport/vehicles'
    };
    return endpoints[report.key] || '/reports';
  }

  private buildParams(report: ReportConfig): any {
    const params: any = { limit: 1000 };
    const filters = report.filters || {};
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params[key] = value;
    });
    
    return params;
  }

  private getSampleData(report: ReportConfig): any[] {
    // Sample data for demo purposes when API is not available
    switch (report.key) {
      case 'students':
        return [
          { rollNumber: 1, firstName: 'John', lastName: 'Doe', class: 'Class 1', section: 'A', status: 'active' },
          { rollNumber: 2, firstName: 'Jane', lastName: 'Smith', class: 'Class 1', section: 'A', status: 'active' },
          { rollNumber: 3, firstName: 'Bob', lastName: 'Wilson', class: 'Class 2', section: 'B', status: 'active' },
        ];
      case 'teachers':
        return [
          { firstName: 'Sarah', lastName: 'Johnson', email: 'sarah@school.com', subject: 'Mathematics', status: 'active' },
          { firstName: 'Michael', lastName: 'Brown', email: 'michael@school.com', subject: 'Science', status: 'active' },
        ];
      case 'attendance':
        return [
          { studentName: 'John Doe', date: '2026-01-15', status: 'present' },
          { studentName: 'Jane Smith', date: '2026-01-15', status: 'absent' },
          { studentName: 'Bob Wilson', date: '2026-01-15', status: 'present' },
        ];
      default:
        return [{ message: 'Sample data', date: new Date().toISOString() }];
    }
  }

  private exportData(report: ReportConfig, data: any[]): void {
    if (report.format === 'csv') {
      this.exportCSV(report, data);
    } else if (report.format === 'excel') {
      this.exportCSV(report, data); // CSV works for Excel too
    } else {
      this.exportPDF(report, data);
    }
  }

  private exportCSV(report: ReportConfig, data: any[]): void {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]).filter(k => !k.startsWith('_'));
    const rows = data.map(item => headers.map(h => {
      const val = item[h];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val).replace(/,/g, ';');
    }));

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.key}-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.toast.success(`${report.title} exported as CSV`);
  }

  private exportPDF(report: ReportConfig, data: any[]): void {
    if (!data.length) return;
    
    const headers = Object.keys(data[0]).filter(k => !k.startsWith('_'));
    
    const content = `
      <html>
      <head>
        <title>${report.title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { font-size: 24px; margin-bottom: 5px; }
          .meta { color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; font-weight: 600; }
          tr:nth-child(even) { background: #fafafa; }
        </style>
      </head>
      <body>
        <h1>${report.icon} ${report.title}</h1>
        <div class="meta">
          Generated: ${new Date().toLocaleString()}<br>
          Total Records: ${data.length}
        </div>
        <table>
          <thead><tr>${headers.map(h => `<th>${this.formatHeader(h)}</th>`).join('')}</tr></thead>
          <tbody>
            ${data.map(item => `
              <tr>${headers.map(h => {
                const val = item[h];
                if (val === null || val === undefined) return '<td>-</td>';
                if (typeof val === 'object') return `<td>${JSON.stringify(val)}</td>`;
                return `<td>${val}</td>`;
              }).join('')}</tr>
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
    this.toast.success(`${report.title} ready for print/PDF`);
  }

  private formatHeader(str: string): string {
    return str.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
  }

  private saveToRecent(report: ReportConfig): void {
    const recent = this.recentReports();
    const newEntry = {
      id: Date.now(),
      key: report.key,
      icon: report.icon,
      name: `${report.title} (${report.format.toUpperCase()})`,
      date: new Date().toLocaleString(),
      filters: { ...report.filters },
      format: report.format
    };
    
    const updated = [newEntry, ...recent.filter(r => r.key !== report.key)].slice(0, 5);
    this.recentReports.set(updated);
    localStorage.setItem('recentReports', JSON.stringify(updated));
  }

  redownload(r: any): void {
    const report = this.reports.find(rep => rep.key === r.key);
    if (report) {
      report.filters = { ...r.filters };
      report.format = r.format;
      this.generate(report);
    }
  }
}
