import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ClassModel } from '../../core/models';

interface ExamScheduleItem {
  _id?: string;
  class: string;
  section?: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  passingMarks: number;
  room?: string;
  instructions?: string;
}

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ isEdit() ? '✏️ Edit Exam' : '📝 Create Exam' }}</h1>
        <p>{{ isEdit() ? 'Update examination details and schedule' : 'Schedule a new examination' }}</p>
      </div>
      <a routerLink="/exams" class="btn btn-secondary">← Back</a>
    </div>

    <form (ngSubmit)="onSubmit()" class="exam-form">
      <!-- Basic Info Card -->
      <div class="card section-card">
        <h3>📋 Basic Information</h3>
        <div class="grid grid-2">
          <div class="form-group">
            <label>Exam Name *</label>
            <input type="text" class="form-input" [(ngModel)]="exam.name" name="name" required placeholder="e.g. First Term Exam" />
          </div>
          <div class="form-group">
            <label>Exam Type *</label>
            <select class="form-select" [(ngModel)]="exam.examType" name="examType" required>
              <option value="">Select Type</option>
              <option value="unit_test">Unit Test</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="half_yearly">Half Yearly</option>
              <option value="midterm">Mid Term</option>
              <option value="final">Final</option>
              <option value="practical">Practical</option>
              <option value="oral">Oral</option>
              <option value="project">Project</option>
            </select>
          </div>
        </div>

        <div class="grid grid-2">
          <div class="form-group">
            <label>Start Date *</label>
            <input type="date" class="form-input" [(ngModel)]="exam.startDate" name="startDate" required />
          </div>
          <div class="form-group">
            <label>End Date *</label>
            <input type="date" class="form-input" [(ngModel)]="exam.endDate" name="endDate" required />
          </div>
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea class="form-input" [(ngModel)]="exam.description" name="description" rows="2" placeholder="Optional exam description"></textarea>
        </div>
      </div>

      <!-- Class & Section Assignment -->
      <div class="card section-card">
        <h3>🏫 Classes & Sections</h3>
        <p class="section-desc">Select which classes and sections this exam applies to. Leave sections empty to include all sections.</p>
        
        <div class="class-selection">
          @for (cls of classes(); track cls._id) {
            <label class="class-checkbox">
              <input type="checkbox" [checked]="isClassSelected(cls._id)" (change)="toggleClass(cls._id)" />
              <span class="checkbox-label">{{ cls.name }}</span>
            </label>
          }
        </div>

        @if (selectedClasses().length) {
          <div class="sections-selection">
            <label>Sections (optional - leave empty for all sections)</label>
            <div class="section-chips">
              @for (sec of ['A','B','C','D','E','F']; track sec) {
                <button type="button" class="chip" [class.selected]="isSectionSelected(sec)" (click)="toggleSection(sec)">
                  {{ sec }}
                </button>
              }
            </div>
          </div>
        }
      </div>

      <!-- Exam Schedule / Timetable -->
      <div class="card section-card">
        <div class="section-header">
          <h3>📅 Exam Schedule</h3>
          <button type="button" class="btn btn-secondary btn-sm" (click)="addScheduleItem()" [disabled]="!selectedClasses().length">
            + Add Subject
          </button>
        </div>
        @if (selectedClasses().length === 1) {
          <p class="section-desc">Define the exam timetable for <strong>{{ selectedClassObjects()[0]?.name }}</strong>{{ selectedSections().length === 1 ? ' Section ' + selectedSections()[0] : '' }}.</p>
        } @else {
          <p class="section-desc">Define the exam timetable with subjects, dates, and times for each class/section.</p>
        }

        @if (!selectedClasses().length) {
          <div class="empty-schedule">Select at least one class to add exam schedule</div>
        } @else if (!schedule().length) {
          <div class="empty-schedule">No subjects scheduled yet. Click "Add Subject" to create the exam timetable.</div>
        } @else {
          <div class="schedule-table">
            <div class="schedule-header">
              <span>Date</span>
              <span>Time</span>
              <span>Subject</span>
              @if (selectedClasses().length > 1) { <span>Class</span> }
              @if (selectedSections().length !== 1) { <span>Section</span> }
              <span>Marks</span>
              <span>Room</span>
              <span></span>
            </div>
            @for (item of schedule(); track $index; let i = $index) {
              <div class="schedule-row" [class.simplified]="selectedClasses().length === 1 && selectedSections().length === 1">
                <input type="date" class="form-input" [(ngModel)]="item.date" [name]="'schedDate'+i" required />
                <div class="time-inputs">
                  <input type="time" class="form-input" [(ngModel)]="item.startTime" [name]="'schedStart'+i" required />
                  <span>-</span>
                  <input type="time" class="form-input" [(ngModel)]="item.endTime" [name]="'schedEnd'+i" required />
                </div>
                <select class="form-select" [(ngModel)]="item.subject" [name]="'schedSubj'+i" required>
                  <option value="">Subject</option>
                  @for (s of subjects(); track s._id) {
                    <option [value]="s._id">{{ s.name }}</option>
                  }
                </select>
                @if (selectedClasses().length > 1) {
                  <select class="form-select" [(ngModel)]="item.class" [name]="'schedClass'+i" required>
                    <option value="">Class</option>
                    @for (c of selectedClassObjects(); track c._id) {
                      <option [value]="c._id">{{ c.name }}</option>
                    }
                  </select>
                }
                @if (selectedSections().length !== 1) {
                  <select class="form-select" [(ngModel)]="item.section" [name]="'schedSec'+i">
                    <option value="">All</option>
                    @for (sec of selectedSections().length ? selectedSections() : ['A','B','C','D']; track sec) {
                      <option [value]="sec">{{ sec }}</option>
                    }
                  </select>
                }
                <div class="marks-inputs">
                  <input type="number" class="form-input" [(ngModel)]="item.maxMarks" [name]="'schedMax'+i" placeholder="Max" min="0" />
                  <input type="number" class="form-input" [(ngModel)]="item.passingMarks" [name]="'schedPass'+i" placeholder="Pass" min="0" />
                </div>
                <input type="text" class="form-input" [(ngModel)]="item.room" [name]="'schedRoom'+i" placeholder="Room" />
                <button type="button" class="btn btn-ghost btn-sm text-danger" (click)="removeScheduleItem(i)">🗑️</button>
              </div>
            }
          </div>
        }
      </div>

      <!-- Study Leave Days -->
      <div class="card section-card">
        <h3>📖 Study Leave Days</h3>
        <p class="section-desc">Optionally specify dates within the exam period that are study/preparation days (no exams scheduled).</p>
        <div class="study-days">
          @for (day of studyLeaveDays(); track $index; let i = $index) {
            <div class="study-day-row">
              <input type="date" class="form-input" [(ngModel)]="studyLeaveDays()[i]" [name]="'studyDay'+i" />
              <button type="button" class="btn btn-ghost btn-sm text-danger" (click)="removeStudyDay(i)">🗑️</button>
            </div>
          }
          <button type="button" class="btn btn-ghost btn-sm" (click)="addStudyDay()">+ Add Study Day</button>
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <a routerLink="/exams" class="btn btn-secondary">Cancel</a>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          @if (saving()) { <span class="spinner"></span> }
          {{ isEdit() ? 'Update Exam' : 'Create Exam' }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .exam-form { display: flex; flex-direction: column; gap: var(--space-6); max-width: 1000px; }
    .section-card h3 { margin: 0 0 var(--space-4); font-size: var(--text-lg); }
    .section-desc { font-size: var(--text-sm); color: var(--text-secondary); margin: -8px 0 16px; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
    .section-header h3 { margin: 0; }
    
    .class-selection { display: flex; flex-wrap: wrap; gap: var(--space-3); }
    .class-checkbox { 
      display: flex; 
      align-items: center; 
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      background: var(--surface-hover);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s;
    }
    .class-checkbox:hover { background: var(--primary); color: white; }
    .class-checkbox input:checked + .checkbox-label { font-weight: 600; }
    
    .sections-selection { margin-top: var(--space-4); }
    .section-chips { display: flex; gap: var(--space-2); margin-top: var(--space-2); }
    .chip {
      padding: var(--space-2) var(--space-4);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-full);
      background: transparent;
      cursor: pointer;
      transition: all 0.2s;
    }
    .chip:hover { border-color: var(--primary); }
    .chip.selected { background: var(--primary); color: white; border-color: var(--primary); }
    
    .empty-schedule {
      text-align: center;
      padding: var(--space-8);
      color: var(--text-tertiary);
      background: var(--surface-hover);
      border-radius: var(--radius-md);
    }
    
    .schedule-table { display: flex; flex-direction: column; gap: var(--space-2); }
    .schedule-header {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      padding: var(--space-2);
      background: var(--surface-hover);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      font-weight: 600;
    }
    .schedule-header span { flex: 1; min-width: 60px; }
    .schedule-row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      align-items: center;
      padding: var(--space-2);
      background: var(--bg-secondary);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-2);
    }
    .schedule-row.simplified { background: var(--surface); border: 1px solid var(--border-color); }
    .schedule-row .form-input, .schedule-row .form-select { 
      padding: var(--space-2); 
      font-size: var(--text-sm);
      flex: 1;
      min-width: 100px;
    }
    .schedule-row input[type="date"] { min-width: 130px; max-width: 150px; }
    .time-inputs { display: flex; align-items: center; gap: 4px; min-width: 160px; }
    .time-inputs .form-input { width: 70px; min-width: 70px; flex: 0 0 auto; }
    .marks-inputs { display: flex; gap: 4px; min-width: 110px; }
    .marks-inputs .form-input { width: 50px; min-width: 50px; text-align: center; flex: 0 0 auto; }
    .schedule-row input[type="text"][placeholder="Room"] { max-width: 100px; }
    
    .study-days { display: flex; flex-direction: column; gap: var(--space-2); }
    .study-day-row { display: flex; gap: var(--space-2); align-items: center; }
    .study-day-row .form-input { width: 200px; }
    
    .form-actions { 
      display: flex; 
      justify-content: flex-end; 
      gap: var(--space-3); 
      padding-top: var(--space-4); 
      border-top: 1px solid var(--border-color); 
    }
    .text-danger { color: var(--danger) !important; }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) {
      .schedule-header, .schedule-row { 
        grid-template-columns: 1fr; 
        gap: var(--space-3);
      }
      .schedule-header { display: none; }
      .schedule-row {
        padding: var(--space-3);
        background: var(--surface-hover);
        border-radius: var(--radius-md);
      }
    }
  `]
})
export class ExamFormComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit = signal(false);
  saving = signal(false);
  classes = signal<ClassModel[]>([]);
  subjects = signal<any[]>([]);
  selectedClasses = signal<string[]>([]);
  selectedSections = signal<string[]>([]);
  schedule = signal<ExamScheduleItem[]>([]);
  studyLeaveDays = signal<string[]>([]);
  
  exam: any = {
    name: '',
    examType: '',
    startDate: '',
    endDate: '',
    description: '',
  };
  private examId = '';

  selectedClassObjects = signal<any[]>([]);

  ngOnInit(): void {
    this.loadClasses();
    this.loadSubjects();
    
    const id = this.route.snapshot.params['id'];
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.examId = id;
      this.loadExam();
    }
  }

  loadExam(): void {
    this.api.get(`/exams/${this.examId}`).subscribe({
      next: (res: any) => {
        const data = res.data || res;
        this.exam = {
          name: data.name || '',
          examType: data.examType || '',
          startDate: data.startDate ? String(data.startDate).substring(0, 10) : '',
          endDate: data.endDate ? String(data.endDate).substring(0, 10) : '',
          description: data.description || '',
        };
        
        // Load selected classes
        const classIds = (data.classes || []).map((c: any) => c._id || c);
        this.selectedClasses.set(classIds);
        this.updateSelectedClassObjects();
        
        // Load sections
        this.selectedSections.set(data.sections || []);
        
        // Load schedule
        const scheduleItems = (data.schedule || []).map((s: any) => ({
          _id: s._id,
          class: s.class?._id || s.class || '',
          section: s.section || '',
          subject: s.subject?._id || s.subject || '',
          date: s.date ? String(s.date).substring(0, 10) : '',
          startTime: s.startTime || '',
          endTime: s.endTime || '',
          maxMarks: s.maxMarks || 100,
          passingMarks: s.passingMarks || 40,
          room: s.room || '',
        }));
        this.schedule.set(scheduleItems);
        
        // Load study leave days
        const studyDays = (data.studyLeaveDays || []).map((d: any) =>
          d ? String(d).substring(0, 10) : ''
        );
        this.studyLeaveDays.set(studyDays);
      },
      error: () => this.toast.error('Failed to load exam'),
    });
  }

  loadClasses(): void {
    this.api.get<any>('/classes', { limit: 100 }).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.classes.set(Array.isArray(data) ? data : []);
        this.updateSelectedClassObjects();
      }
    });
  }

  loadSubjects(): void {
    this.api.get<any>('/subjects', { limit: 100 }).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.subjects.set(Array.isArray(data) ? data : []);
      }
    });
  }

  isClassSelected(classId: string): boolean {
    return this.selectedClasses().includes(classId);
  }

  toggleClass(classId: string): void {
    const current = this.selectedClasses();
    if (current.includes(classId)) {
      this.selectedClasses.set(current.filter(id => id !== classId));
    } else {
      this.selectedClasses.set([...current, classId]);
    }
    this.updateSelectedClassObjects();
  }

  updateSelectedClassObjects(): void {
    const selected = this.classes().filter(c => this.selectedClasses().includes(c._id));
    this.selectedClassObjects.set(selected);
  }

  isSectionSelected(section: string): boolean {
    return this.selectedSections().includes(section);
  }

  toggleSection(section: string): void {
    const current = this.selectedSections();
    if (current.includes(section)) {
      this.selectedSections.set(current.filter(s => s !== section));
    } else {
      this.selectedSections.set([...current, section]);
    }
  }

  addScheduleItem(): void {
    const defaultClass = this.selectedClasses()[0] || '';
    const defaultSection = this.selectedSections().length === 1 ? this.selectedSections()[0] : '';
    const newItem: ExamScheduleItem = {
      class: defaultClass,
      section: defaultSection,
      subject: '',
      date: this.exam.startDate || '',
      startTime: '09:00',
      endTime: '11:00',
      maxMarks: 100,
      passingMarks: 40,
      room: '',
    };
    this.schedule.set([...this.schedule(), newItem]);
  }

  removeScheduleItem(index: number): void {
    const current = this.schedule();
    current.splice(index, 1);
    this.schedule.set([...current]);
  }

  addStudyDay(): void {
    this.studyLeaveDays.set([...this.studyLeaveDays(), '']);
  }

  removeStudyDay(index: number): void {
    const current = this.studyLeaveDays();
    current.splice(index, 1);
    this.studyLeaveDays.set([...current]);
  }

  onSubmit(): void {
    if (!this.exam.name || !this.exam.examType || !this.exam.startDate || !this.exam.endDate) {
      this.toast.error('Please fill in all required fields');
      return;
    }

    this.saving.set(true);
    
    const payload: any = {
      name: this.exam.name,
      examType: this.exam.examType,
      startDate: this.exam.startDate,
      endDate: this.exam.endDate,
      description: this.exam.description || '',
      classes: this.selectedClasses(),
      sections: this.selectedSections(),
      schedule: this.schedule().filter(s => s.class && s.subject && s.date),
      studyLeaveDays: this.studyLeaveDays().filter(d => d),
    };

    const obs = this.isEdit()
      ? this.api.patch(`/exams/${this.examId}`, payload)
      : this.api.post('/exams', payload);
      
    obs.subscribe({
      next: () => {
        this.toast.success(this.isEdit() ? 'Exam updated successfully' : 'Exam created successfully');
        this.router.navigate(['/exams']);
      },
      error: (err) => { 
        this.saving.set(false); 
        this.toast.error(err?.error?.message?.join?.(', ') || err?.error?.message || 'Failed to save exam'); 
      }
    });
  }
}
