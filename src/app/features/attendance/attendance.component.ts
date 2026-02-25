import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ClassModel, Student } from '../../core/models';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.attendance' | translate }}</h1><p>Mark and manage daily attendance</p></div>
    </div>

    <div class="card">
      <div class="attendance-toolbar">
        <div class="form-group">
          <label>Date</label>
          <input type="date" class="form-input" [(ngModel)]="selectedDate" (change)="loadAttendance()" />
        </div>
        <div class="form-group">
          <label>Class</label>
          <select class="form-select" [(ngModel)]="selectedClass" (change)="onClassChange()">
            <option value="">Select class</option>
            @for (c of classes(); track c._id) { <option [value]="c._id">{{ c.name }} (Grade {{ c.grade }})</option> }
          </select>
        </div>
        <div class="form-group">
          <label>Section</label>
          <select class="form-select" [(ngModel)]="selectedSection" (change)="loadAttendance()" [disabled]="!selectedClass || availableSections().length === 0">
            <option value="">{{ selectedClass && availableSections().length === 0 ? 'No sections' : 'All Sections' }}</option>
            @for (s of availableSections(); track s) { <option [value]="s">{{ s }}</option> }
          </select>
        </div>
        <button class="btn btn-primary" [disabled]="!selectedClass || savingAll()" (click)="saveAll()">
          @if (savingAll()) { <span class="spinner-sm"></span> }
          💾 Save Attendance
        </button>
      </div>
    </div>

    @if (selectedClass) {
      <div class="card" style="margin-top:var(--space-4)">
        <div class="attendance-summary">
          <div class="summary-item present">✅ Present: {{ presentCount() }}</div>
          <div class="summary-item absent">❌ Absent: {{ absentCount() }}</div>
          <div class="summary-item late">⏰ Late: {{ lateCount() }}</div>
          <div class="summary-total">📊 Total: {{ records().length }}</div>
        </div>

        @if (loading()) {
          @for (i of [1,2,3,4,5]; track i) { <div class="skeleton" style="height:52px;margin-bottom:8px"></div> }
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead><tr><th>Roll</th><th>Student Name</th><th>Section</th><th>Status</th><th>Note</th></tr></thead>
              <tbody>
                @for (record of records(); track record.studentId; let i = $index) {
                  <tr>
                    <td>{{ record.rollNumber || (i + 1) }}</td>
                    <td><strong>{{ record.studentName }}</strong></td>
                    <td><span class="section-badge">{{ record.section || '-' }}</span></td>
                    <td>
                      <div class="status-btns">
                        <button class="status-btn present" [class.active]="record.status === 'present'" (click)="record.status = 'present'; updateCounts()">Present</button>
                        <button class="status-btn absent" [class.active]="record.status === 'absent'" (click)="record.status = 'absent'; updateCounts()">Absent</button>
                        <button class="status-btn late" [class.active]="record.status === 'late'" (click)="record.status = 'late'; updateCounts()">Late</button>
                      </div>
                    </td>
                    <td><input type="text" class="form-input note-input" [(ngModel)]="record.note" [ngModelOptions]="{standalone: true}" placeholder="Optional note" /></td>
                  </tr>
                } @empty { <tr><td colspan="5" class="empty-state">No students found. Select a class{{ availableSections().length > 0 ? ' and section' : '' }} to load students.</td></tr> }
              </tbody>
            </table>
          </div>
        }
      </div>
    } @else {
      <div class="card" style="margin-top:var(--space-4)">
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h3>Select Class to Mark Attendance</h3>
          <p>Choose a class and optionally a section from the filters above to load the student list.</p>
        </div>
      </div>
    }
  `,
  styles: [`
    .attendance-toolbar { display: flex; gap: var(--space-4); align-items: flex-end; flex-wrap: wrap; }
    .attendance-toolbar .form-group { margin-bottom: 0; min-width: 140px; flex: 1; max-width: 200px; }
    .attendance-summary { display: flex; gap: var(--space-3); margin-bottom: var(--space-4); flex-wrap: wrap; }
    .summary-item, .summary-total { padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); font-weight: 600; font-size: var(--text-sm); }
    .summary-item.present { background: rgba(34,197,94,0.1); color: #16a34a; }
    .summary-item.absent { background: rgba(239,68,68,0.1); color: #dc2626; }
    .summary-item.late { background: rgba(245,158,11,0.1); color: #d97706; }
    .summary-total { background: var(--bg-muted); color: var(--text-secondary); }
    .section-badge { display: inline-flex; min-width: 24px; height: 24px; align-items: center; justify-content: center; border-radius: 50%; background: var(--bg-muted); font-weight: 600; font-size: var(--text-xs); padding: 0 4px; }
    .table-responsive { overflow-x: auto; margin: 0 -var(--space-6); padding: 0 var(--space-6); }
    .status-btns { display: flex; gap: var(--space-1); flex-wrap: wrap; }
    .status-btn {
      padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); border: 1px solid var(--border-color);
      background: var(--bg-surface); cursor: pointer; font-size: var(--text-xs); font-weight: 500; transition: var(--transition-fast);
      white-space: nowrap;
    }
    .status-btn:hover { background: var(--bg-surface-hover); }
    .status-btn.present.active { background: #22c55e; color: white; border-color: #22c55e; }
    .status-btn.absent.active { background: #ef4444; color: white; border-color: #ef4444; }
    .status-btn.late.active { background: #f59e0b; color: white; border-color: #f59e0b; }
    .note-input { max-width: 150px; font-size: var(--text-xs); padding: 4px 8px; height: 32px; }
    .empty-state { text-align: center; padding: var(--space-8) !important; color: var(--text-muted); }
    .empty-icon { font-size: 48px; margin-bottom: var(--space-3); opacity: 0.6; }
    .empty-state h3 { font-size: var(--text-lg); color: var(--text-secondary); margin-bottom: var(--space-2); }
    .empty-state p { font-size: var(--text-sm); max-width: 300px; margin: 0 auto; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 768px) {
      .attendance-toolbar { flex-direction: column; align-items: stretch; }
      .attendance-toolbar .form-group { max-width: none; }
      .attendance-toolbar .btn { width: 100%; }
      .status-btns { gap: 2px; }
      .status-btn { padding: 4px 6px; font-size: 10px; }
      .note-input { max-width: 100px; }
    }
  `]
})
export class AttendanceComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loading = signal(false);
  savingAll = signal(false);
  classes = signal<ClassModel[]>([]);
  availableSections = signal<string[]>([]);
  records = signal<any[]>([]);
  selectedDate = new Date().toISOString().split('T')[0];
  selectedClass = '';
  selectedSection = '';

  presentCount = signal(0);
  absentCount = signal(0);
  lateCount = signal(0);

  ngOnInit(): void {
    this.api.get<any>('/classes').subscribe({ 
      next: (res) => {
        const data = res.data?.data || res.data || res || [];
        this.classes.set(Array.isArray(data) ? data : []);
      } 
    });
  }

  onClassChange(): void {
    const selectedClassData = this.classes().find(c => c._id === this.selectedClass);
    if (selectedClassData?.sections && Array.isArray(selectedClassData.sections)) {
      this.availableSections.set(selectedClassData.sections.map((s: any) => typeof s === 'string' ? s : s.name));
    } else {
      this.availableSections.set([]);
    }
    this.selectedSection = '';
    this.loadAttendance();
  }

  loadAttendance(): void {
    if (!this.selectedClass) {
      this.records.set([]);
      this.updateCounts();
      return;
    }
    
    this.loading.set(true);
    
    const params: any = { classId: this.selectedClass, date: this.selectedDate };
    if (this.selectedSection) {
      params.section = this.selectedSection;
    }
    
    this.api.get<any>(`/attendance`, params).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || res || [];
        const attendanceData = Array.isArray(data) ? data : [];
        if (attendanceData.length === 0) {
          // Load students for fresh attendance
          this.loadStudentsForAttendance();
        } else {
          this.records.set(attendanceData);
          this.updateCounts();
          this.loading.set(false);
        }
      },
      error: () => {
        this.loadStudentsForAttendance();
      },
    });
  }

  private loadStudentsForAttendance(): void {
    const params: any = { classId: this.selectedClass, status: 'active', limit: 500 };
    if (this.selectedSection) {
      params.section = this.selectedSection;
    }
    
    this.api.get<any>(`/students`, params).subscribe({
      next: (sRes) => {
        const studentsData = sRes.data?.data || sRes.data?.items || sRes.data || [];
        const students = Array.isArray(studentsData) ? studentsData : [];
        this.records.set(students.map((s: any) => ({
          studentId: s._id, 
          studentName: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Unknown',
          section: s.currentSection || '',
          rollNumber: s.rollNumber || '',
          status: 'present', 
          note: ''
        })));
        this.updateCounts();
        this.loading.set(false);
      },
      error: () => {
        this.records.set([]);
        this.updateCounts();
        this.loading.set(false);
      },
    });
  }

  updateCounts(): void {
    const r = this.records();
    this.presentCount.set(r.filter(x => x.status === 'present').length);
    this.absentCount.set(r.filter(x => x.status === 'absent').length);
    this.lateCount.set(r.filter(x => x.status === 'late').length);
  }

  saveAll(): void {
    if (!this.selectedClass || this.records().length === 0) {
      this.toast.error('No attendance data to save');
      return;
    }
    
    this.updateCounts();
    this.savingAll.set(true);
    
    // Strip out display-only fields (section, rollNumber) from records before saving
    const cleanRecords = this.records().map(r => ({
      studentId: r.studentId,
      studentName: r.studentName,
      status: r.status,
      note: r.note || ''
    }));
    
    this.api.post('/attendance', {
      classId: this.selectedClass,
      section: this.selectedSection || undefined,
      date: this.selectedDate,
      records: cleanRecords
    }).subscribe({
      next: () => { this.toast.success('Attendance saved!'); this.savingAll.set(false); },
      error: () => { this.toast.error('Failed to save'); this.savingAll.set(false); },
    });
  }
}
