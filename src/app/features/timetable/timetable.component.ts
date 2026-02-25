import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ClassModel } from '../../core/models';

interface Period {
  day: string;
  periodNumber: number;
  periodType: string;
  subject?: string;
  teacher?: string;
  startTime: string;
  endTime: string;
  duration: number;
  room?: string;
}

interface TimeSlot {
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
  breakName?: string;
}

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>📅 {{ 'nav.timetable' | translate }}</h1>
        <p>Manage class schedules</p>
      </div>
    </div>

    <div class="card">
      <div class="timetable-toolbar">
        <div class="toolbar-left">
          <div class="filter-group">
            <label>Academic Year</label>
            <select class="form-select" [(ngModel)]="selectedAcademicYear" (change)="loadTimetable()">
              <option value="">Select academic year</option>
              @for (y of academicYears(); track y._id) {
                <option [value]="y._id">{{ y.name }}{{ y.isCurrent ? ' (Current)' : '' }}</option>
              }
            </select>
          </div>
          <div class="filter-group">
            <label>Class</label>
            <select class="form-select" [(ngModel)]="selectedClass" (change)="onClassChange()">
              <option value="">Select a class</option>
              @for (c of classes(); track c._id) { 
                <option [value]="c._id">{{ c.name }} (Grade {{ c.grade }})</option> 
              }
            </select>
          </div>
          <div class="filter-group">
            <label>Section</label>
            <select class="form-select" [(ngModel)]="selectedSection" (change)="loadTimetable()" [disabled]="!selectedClass">
              <option value="">Select section</option>
              @for (s of availableSections(); track s) {
                <option [value]="s">Section {{ s }}</option>
              }
            </select>
          </div>
          <button class="btn btn-secondary btn-sm" (click)="showTimeSettings.set(true)" title="Configure time slots">
            ⏰ Time Settings
          </button>
        </div>
        @if (selectedClass && selectedSection) {
          <div class="toolbar-right">
            <button class="btn btn-primary" (click)="saveTimetable()" [disabled]="saving()">
              @if (saving()) { <span class="spinner"></span> }
              💾 Save
            </button>
          </div>
        }
      </div>

      @if (selectedClass && selectedSection) {
        <div class="timetable-grid">
          <div class="tt-header">
            <div class="tt-time-col">Time</div>
            @for (day of days; track day.value) { 
              <div class="tt-day-col">{{ day.label }}</div> 
            }
          </div>
          @for (slot of timeSlots; track trackSlot($index, slot)) {
            <div class="tt-row" [class.break-row]="slot.isBreak">
              <div class="tt-time-col">
                <span class="time-range">{{ slot.startTime }} - {{ slot.endTime }}</span>
                @if (!slot.isBreak) {
                  <span class="period-badge">P{{ slot.periodNumber }}</span>
                }
              </div>
              @for (day of days; track day.value) {
                <div class="tt-cell" 
                     [class.break]="slot.isBreak"
                     [class.has-data]="getEntry(day.value, slot.periodNumber)?.subject"
                     (click)="!slot.isBreak && editCell(day.value, slot)">
                  @if (slot.isBreak) {
                    <span class="break-label">{{ slot.breakName || 'Break' }}</span>
                  } @else {
                    @if (getEntry(day.value, slot.periodNumber)?.subject) {
                      <div class="cell-content filled">
                        <span class="subject">{{ getSubjectName(getEntry(day.value, slot.periodNumber)?.subject) }}</span>
                        <span class="teacher">{{ getTeacherName(getEntry(day.value, slot.periodNumber)?.teacher) }}</span>
                        <button class="clear-btn" (click)="clearEntry(day.value, slot.periodNumber, $event)">✕</button>
                      </div>
                    } @else {
                      <div class="cell-content empty">
                        <span>+ Add</span>
                      </div>
                    }
                  }
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>Select Class and Section</h3>
          <p>Choose a class and section to view or create the timetable</p>
        </div>
      }
    </div>

    <!-- Edit Period Modal -->
    @if (showEditModal()) {
      <div class="modal-overlay" (click)="showEditModal.set(false)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingDay | titlecase }} - Period {{ editingSlot?.periodNumber }}</h2>
            <button class="close-btn" (click)="showEditModal.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <div class="time-info">{{ editingSlot?.startTime }} - {{ editingSlot?.endTime }}</div>
            
            <div class="form-group">
              <label>Subject *</label>
              <select class="form-select" [(ngModel)]="editForm.subject" (change)="onSubjectChange()">
                <option value="">Select subject</option>
                @for (s of subjects(); track s._id) {
                  <option [value]="s._id">{{ s.name }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Teacher</label>
              <select class="form-select" [(ngModel)]="editForm.teacher">
                <option value="">Select teacher</option>
                @for (t of teachers(); track t._id) {
                  <option [value]="t._id">{{ t.firstName }} {{ t.lastName }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Room (optional)</label>
              <input type="text" class="form-input" [(ngModel)]="editForm.room" placeholder="e.g., Room 101" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showEditModal.set(false)">Cancel</button>
            <button class="btn btn-primary" (click)="saveEntry()" [disabled]="!editForm.subject">Save</button>
          </div>
        </div>
      </div>
    }

    <!-- Time Settings Modal -->
    @if (showTimeSettings()) {
      <div class="modal-overlay" (click)="showTimeSettings.set(false)">
        <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>⏰ Time Slot Settings</h2>
            <button class="close-btn" (click)="showTimeSettings.set(false)">✕</button>
          </div>
          <div class="modal-body">
            <p class="hint">Configure the time slots for each period. Changes apply when you save the timetable.</p>
            
            <div class="time-slots-editor">
              @for (slot of timeSlots; track trackSlot($index, slot); let i = $index) {
                <div class="slot-row" [class.break-slot]="slot.isBreak">
                  <div class="slot-type">
                    @if (slot.isBreak) {
                      <input type="text" class="form-input break-name" [(ngModel)]="slot.breakName" placeholder="Break name" />
                    } @else {
                      <span class="period-label">Period {{ slot.periodNumber }}</span>
                    }
                  </div>
                  <div class="slot-times">
                    <input type="time" class="form-input" [(ngModel)]="slot.startTime" />
                    <span>to</span>
                    <input type="time" class="form-input" [(ngModel)]="slot.endTime" />
                  </div>
                  <div class="slot-actions">
                    <label class="break-toggle">
                      <input type="checkbox" [checked]="slot.isBreak" (change)="toggleBreak(i)" />
                      Break
                    </label>
                    @if (timeSlots.length > 1) {
                      <button class="btn btn-ghost btn-sm" (click)="removeSlot(i)">🗑️</button>
                    }
                  </div>
                </div>
              }
            </div>
            
            <button class="btn btn-secondary btn-sm" (click)="addSlot()">+ Add Time Slot</button>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="showTimeSettings.set(false)">Close</button>
            <button class="btn btn-primary" (click)="applyTimeSettings()">Apply</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
    .page-header h1 { font-size: var(--text-2xl); font-weight: 700; margin-bottom: var(--space-1); }
    .page-header p { color: var(--text-secondary); font-size: var(--text-sm); }
    
    .timetable-toolbar { 
      display: flex; justify-content: space-between; align-items: flex-end; 
      flex-wrap: wrap; gap: var(--space-4); margin-bottom: var(--space-4);
      padding-bottom: var(--space-4); border-bottom: 1px solid var(--border);
    }
    .toolbar-left { display: flex; gap: var(--space-4); align-items: flex-end; flex-wrap: wrap; }
    .filter-group { display: flex; flex-direction: column; gap: var(--space-1); }
    .filter-group label { font-size: var(--text-xs); font-weight: 500; color: var(--text-secondary); }
    .filter-group .form-select { min-width: 180px; }
    
    .timetable-grid {
      display: grid;
      grid-template-columns: 120px repeat(5, 1fr);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .tt-header {
      display: contents;
    }
    .tt-header > div {
      background: var(--surface-secondary);
      padding: var(--space-3);
      font-weight: 600;
      font-size: var(--text-sm);
      text-align: center;
      border-bottom: 1px solid var(--border);
    }
    .tt-row { display: contents; }
    .tt-time-col {
      padding: var(--space-3);
      background: var(--surface-secondary);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--space-1);
      border-bottom: 1px solid var(--border);
      font-size: var(--text-xs);
    }
    .time-range { font-weight: 500; color: var(--text-primary); }
    .period-badge { 
      background: var(--primary); color: white; 
      padding: 2px 6px; border-radius: var(--radius-sm); 
      font-size: 10px; font-weight: 600;
    }
    .tt-cell {
      padding: var(--space-2);
      border-bottom: 1px solid var(--border);
      border-left: 1px solid var(--border);
      min-height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s;
    }
    .tt-cell:hover:not(.break) { background: var(--surface-secondary); }
    .tt-cell.break { 
      background: linear-gradient(135deg, #fef3cd, #fff3cd); 
      cursor: default;
    }
    .tt-cell.has-data { background: rgba(59, 130, 246, 0.08); }
    
    .break-row .tt-time-col { background: #fff3cd; }
    .break-label { color: #856404; font-style: italic; font-size: var(--text-sm); }
    
    .cell-content { text-align: center; width: 100%; position: relative; }
    .cell-content.empty { color: var(--text-tertiary); font-size: var(--text-sm); }
    .cell-content.filled .subject { display: block; font-weight: 600; font-size: var(--text-sm); color: var(--text-primary); }
    .cell-content.filled .teacher { display: block; font-size: var(--text-xs); color: var(--text-secondary); margin-top: 2px; }
    .clear-btn {
      position: absolute; top: -4px; right: -4px;
      width: 18px; height: 18px; border-radius: 50%;
      background: var(--danger); color: white;
      border: none; cursor: pointer; font-size: 10px;
      display: none; align-items: center; justify-content: center;
    }
    .cell-content.filled:hover .clear-btn { display: flex; }
    
    .empty-state {
      text-align: center; padding: var(--space-12); color: var(--text-secondary);
    }
    .empty-icon { font-size: 48px; margin-bottom: var(--space-4); }
    .empty-state h3 { font-size: var(--text-lg); color: var(--text-primary); margin-bottom: var(--space-2); }
    
    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: var(--space-4);
    }
    .modal-content {
      background: var(--surface); border-radius: var(--radius-lg);
      width: 100%; max-width: 400px; box-shadow: var(--shadow-xl);
    }
    .modal-content.modal-lg { max-width: 600px; }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border);
    }
    .modal-header h2 { font-size: var(--text-lg); font-weight: 600; margin: 0; }
    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-secondary); }
    .modal-body { padding: var(--space-5); }
    .modal-footer { 
      padding: var(--space-4) var(--space-5); border-top: 1px solid var(--border);
      display: flex; justify-content: flex-end; gap: var(--space-3);
    }
    
    .time-info { 
      background: var(--surface-secondary); padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md); font-size: var(--text-sm); margin-bottom: var(--space-4);
      text-align: center; color: var(--text-secondary);
    }
    .form-group { margin-bottom: var(--space-4); }
    .form-group label { display: block; font-size: var(--text-sm); font-weight: 500; margin-bottom: var(--space-1); }
    
    .hint { color: var(--text-secondary); font-size: var(--text-sm); margin-bottom: var(--space-4); }
    
    .time-slots-editor { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-4); }
    .slot-row {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3); background: var(--surface-secondary);
      border-radius: var(--radius-md);
    }
    .slot-row.break-slot { background: #fff3cd; }
    .slot-type { min-width: 120px; }
    .period-label { font-weight: 600; }
    .break-name { width: 100px; padding: var(--space-1) var(--space-2); font-size: var(--text-sm); }
    .slot-times { display: flex; align-items: center; gap: var(--space-2); }
    .slot-times input { width: 100px; }
    .slot-times span { color: var(--text-secondary); }
    .slot-actions { display: flex; align-items: center; gap: var(--space-3); margin-left: auto; }
    .break-toggle { display: flex; align-items: center; gap: var(--space-1); font-size: var(--text-sm); cursor: pointer; }
    
    .spinner { 
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite;
      display: inline-block; margin-right: var(--space-2);
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class TimetableComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  classes = signal<ClassModel[]>([]);
  subjects = signal<any[]>([]);
  teachers = signal<any[]>([]);
  academicYears = signal<any[]>([]);
  availableSections = signal<string[]>([]);
  
  selectedClass = '';
  selectedSection = '';
  selectedAcademicYear = '';
  existingTimetableId = '';
  
  schedule: Period[] = [];
  
  saving = signal(false);
  loading = signal(false);
  showEditModal = signal(false);
  showTimeSettings = signal(false);
  
  editingDay = '';
  editingSlot: TimeSlot | null = null;
  editForm = { subject: '', teacher: '', room: '' };
  
  days = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' }
  ];
  
  // Default time slots - user can customize these
  timeSlots: TimeSlot[] = [
    { periodNumber: 1, startTime: '08:00', endTime: '08:45' },
    { periodNumber: 2, startTime: '08:45', endTime: '09:30' },
    { periodNumber: 3, startTime: '09:30', endTime: '10:15' },
    { periodNumber: 0, startTime: '10:15', endTime: '10:30', isBreak: true, breakName: 'Short Break' },
    { periodNumber: 4, startTime: '10:30', endTime: '11:15' },
    { periodNumber: 5, startTime: '11:15', endTime: '12:00' },
    { periodNumber: 6, startTime: '12:00', endTime: '12:45' },
    { periodNumber: 0, startTime: '12:45', endTime: '13:30', isBreak: true, breakName: 'Lunch Break' },
    { periodNumber: 7, startTime: '13:30', endTime: '14:15' },
    { periodNumber: 8, startTime: '14:15', endTime: '15:00' },
  ];

  ngOnInit(): void {
    this.loadClasses();
    this.loadSubjects();
    this.loadTeachers();
    this.loadAcademicYears();
  }

  loadClasses(): void {
    this.api.get<any>('/classes').subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        this.classes.set(Array.isArray(data) ? data : []);
      },
      error: () => this.classes.set([])
    });
  }

  loadSubjects(): void {
    this.api.get<any>('/subjects').subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        this.subjects.set(Array.isArray(data) ? data : []);
      },
      error: () => this.subjects.set([])
    });
  }

  loadTeachers(): void {
    this.api.get<any>('/teachers').subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        this.teachers.set(Array.isArray(data) ? data : []);
      },
      error: () => this.teachers.set([])
    });
  }

  loadAcademicYears(): void {
    this.api.get<any>('/academic-years').subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        this.academicYears.set(Array.isArray(data) ? data : []);
        // Auto-select current academic year
        const current = data.find((y: any) => y.isCurrent);
        if (current) {
          this.selectedAcademicYear = current._id;
        } else if (data.length > 0) {
          this.selectedAcademicYear = data[0]._id;
        }
      },
      error: () => this.academicYears.set([])
    });
  }

  onClassChange(): void {
    const cls = this.classes().find(c => c._id === this.selectedClass);
    if (cls?.sections?.length) {
      const sections = cls.sections.map((s: any) => typeof s === 'string' ? s : s.name);
      this.availableSections.set(sections);
      if (sections.length === 1) {
        this.selectedSection = sections[0];
        this.loadTimetable();
      } else {
        this.selectedSection = '';
        this.schedule = [];
      }
    } else {
      this.availableSections.set(['A', 'B', 'C', 'D']);
      this.selectedSection = '';
      this.schedule = [];
    }
  }

  loadTimetable(): void {
    if (!this.selectedClass || !this.selectedSection) return;
    
    this.loading.set(true);
    const params: any = { classId: this.selectedClass, section: this.selectedSection };
    if (this.selectedAcademicYear) {
      params.academicYearId = this.selectedAcademicYear;
    }
    this.api.get<any>(`/timetable`, params).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        if (Array.isArray(data) && data.length > 0) {
          const timetable = data[0];
          this.existingTimetableId = timetable._id || '';
          this.schedule = timetable.schedule || [];
          
          // Load saved time slots if available
          if (timetable.timeSlots?.length) {
            this.timeSlots = timetable.timeSlots;
          }
        } else {
          this.schedule = [];
          this.existingTimetableId = '';
        }
        this.loading.set(false);
      },
      error: () => {
        this.schedule = [];
        this.existingTimetableId = '';
        this.loading.set(false);
      }
    });
  }

  getEntry(day: string, periodNumber: number): Period | undefined {
    return this.schedule.find(s => s.day === day && s.periodNumber === periodNumber);
  }

  getSubjectName(subjectId: any): string {
    if (!subjectId) return '';
    if (typeof subjectId === 'object') return subjectId.name || subjectId.code || '';
    const sub = this.subjects().find(s => s._id === subjectId);
    return sub?.name || sub?.code || '';
  }

  getTeacherName(teacherId: any): string {
    if (!teacherId) return '';
    if (typeof teacherId === 'object') return `${teacherId.firstName || ''} ${teacherId.lastName || ''}`.trim();
    const t = this.teachers().find(tc => tc._id === teacherId);
    return t ? `${t.firstName || ''} ${t.lastName || ''}`.trim() : '';
  }

  editCell(day: string, slot: TimeSlot): void {
    this.editingDay = day;
    this.editingSlot = slot;
    
    const existing = this.getEntry(day, slot.periodNumber);
    if (existing) {
      this.editForm = {
        subject: (existing.subject as any)?._id || existing.subject || '',
        teacher: (existing.teacher as any)?._id || existing.teacher || '',
        room: existing.room || ''
      };
    } else {
      this.editForm = { subject: '', teacher: '', room: '' };
    }
    
    this.showEditModal.set(true);
  }

  onSubjectChange(): void {
    const subject = this.subjects().find(s => s._id === this.editForm.subject);
    if (subject?.teacher) {
      const teacherId = typeof subject.teacher === 'object' ? subject.teacher._id : subject.teacher;
      this.editForm.teacher = teacherId;
    }
  }

  saveEntry(): void {
    if (!this.editForm.subject || !this.editingSlot) return;

    const newEntry: Period = {
      day: this.editingDay,
      periodNumber: this.editingSlot.periodNumber,
      periodType: 'lecture',
      subject: this.editForm.subject,
      teacher: this.editForm.teacher || undefined,
      startTime: this.editingSlot.startTime,
      endTime: this.editingSlot.endTime,
      duration: 45,
      room: this.editForm.room || undefined
    };

    const existingIdx = this.schedule.findIndex(s => s.day === this.editingDay && s.periodNumber === this.editingSlot?.periodNumber);
    if (existingIdx >= 0) {
      this.schedule[existingIdx] = newEntry;
    } else {
      this.schedule.push(newEntry);
    }

    this.showEditModal.set(false);
    this.toast.success('Period updated. Click Save to persist changes.');
  }

  clearEntry(day: string, periodNumber: number, event: Event): void {
    event.stopPropagation();
    this.schedule = this.schedule.filter(s => !(s.day === day && s.periodNumber === periodNumber));
    this.toast.info('Period cleared.');
  }

  saveTimetable(): void {
    if (!this.selectedClass || !this.selectedSection || !this.selectedAcademicYear) {
      this.toast.error('Please select academic year, class and section');
      return;
    }

    this.saving.set(true);
    
    // Calculate timings from timeSlots
    const nonBreakSlots = this.timeSlots.filter(s => !s.isBreak);
    const breakSlots = this.timeSlots.filter(s => s.isBreak);
    const schoolStartTime = this.timeSlots[0]?.startTime || '08:00';
    const schoolEndTime = this.timeSlots[this.timeSlots.length - 1]?.endTime || '15:00';
    const periodDuration = this.calcDuration(nonBreakSlots[0]?.startTime, nonBreakSlots[0]?.endTime) || 45;
    const breakDuration = breakSlots.length > 0 ? this.calcDuration(breakSlots[0]?.startTime, breakSlots[0]?.endTime) || 15 : 15;
    const lunchBreak = breakSlots.find(b => b.breakName?.toLowerCase().includes('lunch'));
    const lunchDuration = lunchBreak ? this.calcDuration(lunchBreak.startTime, lunchBreak.endTime) || 45 : 45;
    
    const payload = {
      academicYear: this.selectedAcademicYear,
      class: this.selectedClass,
      section: this.selectedSection,
      effectiveFrom: new Date().toISOString(),
      workingDays: this.days.map(d => d.value),
      timings: {
        schoolStartTime,
        schoolEndTime,
        periodDuration,
        breakDuration,
        lunchDuration
      },
      breaks: breakSlots.map(b => ({
        name: b.breakName || 'Break',
        startTime: b.startTime,
        endTime: b.endTime,
        duration: this.calcDuration(b.startTime, b.endTime) || 15,
        days: this.days.map(d => d.value)
      })),
      schedule: this.schedule.map(s => ({
        day: s.day,
        periodNumber: s.periodNumber,
        periodType: s.periodType || 'lecture',
        subject: s.subject,
        teacher: s.teacher,
        startTime: s.startTime,
        endTime: s.endTime,
        duration: s.duration || periodDuration,
        room: s.room
      }))
    };

    const saveRequest = this.existingTimetableId 
      ? this.api.put(`/timetable/${this.existingTimetableId}`, payload)
      : this.api.post('/timetable', payload);

    saveRequest.subscribe({
      next: (res: any) => {
        this.existingTimetableId = res.data?._id || this.existingTimetableId;
        this.toast.success('Timetable saved!');
        this.saving.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message;
        this.toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Failed to save'));
        this.saving.set(false);
      }
    });
  }

  // Time Settings Methods
  addSlot(): void {
    const lastSlot = this.timeSlots[this.timeSlots.length - 1];
    const nextPeriod = this.timeSlots.filter(s => !s.isBreak).length + 1;
    this.timeSlots.push({
      periodNumber: nextPeriod,
      startTime: lastSlot?.endTime || '15:00',
      endTime: '15:45',
      isBreak: false
    });
  }

  removeSlot(index: number): void {
    this.timeSlots.splice(index, 1);
    this.renumberPeriods();
  }

  toggleBreak(index: number): void {
    const slot = this.timeSlots[index];
    slot.isBreak = !slot.isBreak;
    if (slot.isBreak) {
      slot.breakName = 'Break';
      slot.periodNumber = 0;
    }
    this.renumberPeriods();
  }

  renumberPeriods(): void {
    let periodNum = 1;
    this.timeSlots.forEach(slot => {
      if (!slot.isBreak) {
        slot.periodNumber = periodNum++;
      }
    });
  }

  applyTimeSettings(): void {
    this.renumberPeriods();
    this.showTimeSettings.set(false);
    this.toast.success('Time settings applied');
  }

  calcDuration(start: string, end: string): number {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  }

  trackSlot(index: number, slot: TimeSlot): string {
    return `${index}-${slot.periodNumber}-${slot.isBreak ? 'break' : 'period'}`;
  }
}
