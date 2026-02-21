import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ClassModel } from '../../core/models';

@Component({
  selector: 'app-timetable',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.timetable' | translate }}</h1><p>View and manage class schedules</p></div>
    </div>

    <div class="card">
      <div class="timetable-toolbar">
        <select class="form-select" style="width:220px" [(ngModel)]="selectedClass" (change)="loadTimetable()">
          <option value="">Select a class</option>
          @for (c of classes(); track c._id) { <option [value]="c._id">{{ c.name }} - {{ c.sections?.join(', ') }}</option> }
        </select>
      </div>

      @if (selectedClass) {
        <div class="timetable-grid">
          <div class="tt-header">
            <div class="tt-time-col">Time</div>
            @for (day of days; track day) { <div class="tt-day-col">{{ day }}</div> }
          </div>
          @for (slot of timeSlots; track slot.time) {
            <div class="tt-row">
              <div class="tt-time-col">
                <span class="time-label">{{ slot.time }}</span>
              </div>
              @for (day of days; track day; let di = $index) {
                <div class="tt-cell" [class.break]="slot.isBreak" (click)="!slot.isBreak && editSlot(slot, di)">
                  @if (slot.isBreak) {
                    <span class="break-label">{{ slot.label }}</span>
                  } @else {
                    <div class="period-content">
                      <span class="subject-name">{{ getSlotSubject(slot.time, di) || 'Free' }}</span>
                      <span class="teacher-name">{{ getSlotTeacher(slot.time, di) }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="empty-state">Select a class to view timetable</div>
      }
    </div>
  `,
  styles: [`
    .timetable-toolbar { margin-bottom: var(--space-4); }
    .timetable-grid { overflow-x: auto; }
    .tt-header, .tt-row { display: grid; grid-template-columns: 100px repeat(6, 1fr); gap: 1px; }
    .tt-header { background: var(--surface-hover); font-weight: 600; font-size: var(--text-sm); }
    .tt-header > div, .tt-row > div { padding: var(--space-3); text-align: center; }
    .tt-time-col { background: var(--surface-hover); font-weight: 600; font-size: var(--text-xs); display: flex; align-items: center; justify-content: center; }
    .tt-day-col { padding: var(--space-3); }
    .tt-cell {
      border: 1px solid var(--border); border-radius: var(--radius-sm); padding: var(--space-2);
      min-height: 60px; display: flex; align-items: center; justify-content: center; cursor: pointer;
      transition: var(--transition-fast);
    }
    .tt-cell:hover:not(.break) { background: var(--surface-hover); }
    .tt-cell.break { background: rgba(245,158,11,0.08); cursor: default; }
    .break-label { font-size: var(--text-xs); color: var(--text-tertiary); font-style: italic; }
    .period-content { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .subject-name { font-size: var(--text-sm); font-weight: 500; }
    .teacher-name { font-size: var(--text-xs); color: var(--text-tertiary); }
    .empty-state { text-align: center; padding: var(--space-8); color: var(--text-tertiary); }
  `]
})
export class TimetableComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  loading = signal(false);
  classes = signal<ClassModel[]>([]);
  selectedClass = '';
  timetable = signal<any>(null);

  days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  timeSlots = [
    { time: '8:00', isBreak: false, label: '' },
    { time: '8:45', isBreak: false, label: '' },
    { time: '9:30', isBreak: true, label: '☕ Short Break' },
    { time: '9:45', isBreak: false, label: '' },
    { time: '10:30', isBreak: false, label: '' },
    { time: '11:15', isBreak: true, label: '🍽️ Lunch Break' },
    { time: '12:00', isBreak: false, label: '' },
    { time: '12:45', isBreak: false, label: '' },
    { time: '1:30', isBreak: false, label: '' },
  ];

  // Demo data
  private scheduleData: Record<string, string[]> = {
    '8:00': ['Math', 'Science', 'English', 'History', 'Math', 'Art'],
    '8:45': ['Science', 'Math', 'Hindi', 'English', 'CS', 'PE'],
    '9:45': ['English', 'Hindi', 'Math', 'CS', 'Science', 'Math'],
    '10:30': ['History', 'English', 'Science', 'Math', 'Hindi', 'CS'],
    '12:00': ['CS', 'Art', 'PE', 'Science', 'English', 'Hindi'],
    '12:45': ['PE', 'CS', 'History', 'Hindi', 'Art', 'Science'],
    '1:30': ['Art', 'PE', 'CS', 'Art', 'History', 'Free'],
  };

  ngOnInit(): void {
    this.api.get<any>('/classes').subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.classes.set(Array.isArray(data) ? data : []);
      }
    });
  }

  loadTimetable(): void {
    if (!this.selectedClass) return;
    this.loading.set(true);
    this.api.get<any>(`/timetable`, { classId: this.selectedClass }).subscribe({
      next: (res) => { this.timetable.set(res); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getSlotSubject(time: string, dayIndex: number): string {
    return this.scheduleData[time]?.[dayIndex] || '';
  }
  getSlotTeacher(time: string, dayIndex: number): string { return ''; }
  editSlot(slot: any, dayIndex: number): void {
    this.toast.info('Edit slot - coming soon');
  }
}
