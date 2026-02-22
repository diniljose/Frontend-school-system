import { Component, inject, OnInit, signal } from '@angular/core';
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
        <div class="form-group" style="margin-bottom:0">
          <label>Date</label>
          <input type="date" class="form-input" [(ngModel)]="selectedDate" (change)="loadAttendance()" />
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label>Class</label>
          <select class="form-select" [(ngModel)]="selectedClass" (change)="onClassChange()">
            <option value="">Select class</option>
            @for (c of classes(); track c._id) { <option [value]="c._id">{{ c.name }} (Grade {{ c.grade }})</option> }
          </select>
        </div>
        @if (availableSections().length > 0) {
          <div class="form-group" style="margin-bottom:0">
            <label>Section</label>
            <select class="form-select" [(ngModel)]="selectedSection" (change)="loadAttendance()">
              <option value="">All Sections</option>
              @for (s of availableSections(); track s.name || s) { <option [value]="s.name || s">{{ s.name || s }}</option> }
            </select>
          </div>
        }
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
        </div>

        @if (loading()) {
          @for (i of [1,2,3,4,5]; track i) { <div class="skeleton" style="height:52px;margin-bottom:8px"></div> }
        } @else {
          <table class="data-table">
            <thead><tr><th>Roll</th><th>Student Name</th><th>Status</th><th>Note</th></tr></thead>
            <tbody>
              @for (record of records(); track record.studentId; let i = $index) {
                <tr>
                  <td>{{ i + 1 }}</td>
                  <td><strong>{{ record.studentName }}</strong></td>
                  <td>
                    <div class="status-btns">
                      <button class="status-btn present" [class.active]="record.status === 'present'" (click)="record.status = 'present'">Present</button>
                      <button class="status-btn absent" [class.active]="record.status === 'absent'" (click)="record.status = 'absent'">Absent</button>
                      <button class="status-btn late" [class.active]="record.status === 'late'" (click)="record.status = 'late'">Late</button>
                    </div>
                  </td>
                  <td><input type="text" class="form-input" [(ngModel)]="record.note" [ngModelOptions]="{standalone: true}" placeholder="Optional note" style="max-width:200px" /></td>
                </tr>
              } @empty { <tr><td colspan="4" class="empty-state">No students in this class</td></tr> }
            </tbody>
          </table>
        }
      </div>
    }
  `,
  styles: [`
    .attendance-toolbar { display: flex; gap: var(--space-4); align-items: flex-end; flex-wrap: wrap; }
    .attendance-summary { display: flex; gap: var(--space-4); margin-bottom: var(--space-4); flex-wrap: wrap; }
    .summary-item { padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); font-weight: 600; font-size: var(--text-sm); }
    .summary-item.present { background: rgba(34,197,94,0.1); color: #16a34a; }
    .summary-item.absent { background: rgba(239,68,68,0.1); color: #dc2626; }
    .summary-item.late { background: rgba(245,158,11,0.1); color: #d97706; }
    .status-btns { display: flex; gap: var(--space-1); }
    .status-btn {
      padding: var(--space-1) var(--space-3); border-radius: var(--radius-sm); border: 1px solid var(--border);
      background: var(--surface); cursor: pointer; font-size: var(--text-xs); font-weight: 500; transition: var(--transition-fast);
    }
    .status-btn.present.active { background: #22c55e; color: white; border-color: #22c55e; }
    .status-btn.absent.active { background: #ef4444; color: white; border-color: #ef4444; }
    .status-btn.late.active { background: #f59e0b; color: white; border-color: #f59e0b; }
    .empty-state { text-align: center; padding: var(--space-8) !important; color: var(--text-tertiary); }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AttendanceComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loading = signal(false);
  savingAll = signal(false);
  classes = signal<ClassModel[]>([]);
  availableSections = signal<any[]>([]);
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
    this.selectedSection = '';
    const selectedClass = this.classes().find(c => c._id === this.selectedClass);
    if (selectedClass && selectedClass.sections && selectedClass.sections.length > 0) {
      this.availableSections.set(selectedClass.sections);
    } else {
      this.availableSections.set([]);
    }
    this.loadAttendance();
  }

  loadAttendance(): void {
    if (!this.selectedClass) return;
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
          this.api.get<any>(`/students`, { classId: this.selectedClass, section: this.selectedSection || undefined }).subscribe({
            next: (sRes) => {
              const studentsData = sRes.data?.data || sRes.data?.items || sRes.data || [];
              const students = Array.isArray(studentsData) ? studentsData : [];
              this.records.set(students.map((s: any) => ({
                studentId: s._id, studentName: `${s.firstName} ${s.lastName}`, status: 'present', note: ''
              })));
              this.updateCounts();
              this.loading.set(false);
            },
            error: () => this.loading.set(false),
          });
        } else {
          this.records.set(attendanceData);
          this.updateCounts();
          this.loading.set(false);
        }
      },
      error: () => this.loading.set(false),
    });
  }

  updateCounts(): void {
    const r = this.records();
    this.presentCount.set(r.filter(x => x.status === 'present').length);
    this.absentCount.set(r.filter(x => x.status === 'absent').length);
    this.lateCount.set(r.filter(x => x.status === 'late').length);
  }

  saveAll(): void {
    this.updateCounts();
    this.savingAll.set(true);
    const payload: any = {
      classId: this.selectedClass,
      date: this.selectedDate,
      records: this.records()
    };
    if (this.selectedSection) {
      payload.section = this.selectedSection;
    }
    this.api.post('/attendance', payload).subscribe({
      next: () => { this.toast.success('Attendance saved!'); this.savingAll.set(false); },
      error: () => { this.toast.error('Failed to save'); this.savingAll.set(false); },
    });
  }
}
