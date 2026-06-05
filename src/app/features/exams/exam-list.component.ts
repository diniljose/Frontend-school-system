import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Exam } from '../../core/models';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>📝 {{ 'nav.exams' | translate }}</h1><p>Schedule and manage examinations</p></div>
      <button class="btn btn-primary" routerLink="/exams/new">+ Create Exam</button>
    </div>

    <!-- Filters and Tabs -->
    <div class="card filter-bar">
      <div class="tabs">
        <button class="tab" [class.active]="activeTab() === 'all'" (click)="setTab('all')">All Exams</button>
        <button class="tab" [class.active]="activeTab() === 'upcoming'" (click)="setTab('upcoming')">
          📅 Upcoming <span class="badge badge-info">{{ upcomingCount() }}</span>
        </button>
        <button class="tab" [class.active]="activeTab() === 'ongoing'" (click)="setTab('ongoing')">
          🔴 Ongoing <span class="badge badge-warning">{{ ongoingCount() }}</span>
        </button>
        <button class="tab" [class.active]="activeTab() === 'completed'" (click)="setTab('completed')">
          ✅ Completed
        </button>
      </div>
      <div class="filters">
        <select class="form-select" [ngModel]="selectedClass()" (ngModelChange)="onClassChange($event)">
          <option value="">All Classes</option>
          @for (c of classes(); track c._id) {
            <option [value]="c._id">{{ c.name }}</option>
          }
        </select>
        <select class="form-select" [ngModel]="selectedSection()" (ngModelChange)="onSectionChange($event)">
          <option value="">All Sections</option>
          @for (sec of availableSections(); track sec) {
            <option [value]="sec">Section {{ sec }}</option>
          }
        </select>
        <select class="form-select" [ngModel]="selectedType()" (ngModelChange)="onTypeChange($event)">
          <option value="">All Types</option>
          <option value="unit_test">Unit Test</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="half_yearly">Half Yearly</option>
          <option value="midterm">Mid Term</option>
          <option value="final">Final</option>
        </select>
      </div>
    </div>

    @if (loading()) {
      <div class="exam-grid">
        @for (i of [1,2,3]; track i) { <div class="skeleton exam-skeleton"></div> }
      </div>
    } @else {
      <div class="exam-grid">
        @for (exam of filteredExams(); track exam._id) {
          <div class="exam-card card" [class.ongoing]="isOngoing(exam)" [class.completed]="isCompleted(exam)">
            <div class="exam-header">
              <div class="exam-title">
                <h3>{{ exam.name }}</h3>
                <span class="badge" [class]="getStatusBadge(exam)">{{ getExamStatus(exam) }}</span>
              </div>
              <span class="exam-type badge badge-info">{{ formatExamType(exam.examType) }}</span>
            </div>
            
            <div class="exam-meta">
              <div class="meta-item">
                <span class="meta-icon">📅</span>
                <span>{{ exam.startDate | date:'mediumDate' }} - {{ exam.endDate | date:'mediumDate' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-icon">🏫</span>
                <span>{{ getClassNames(exam) }}</span>
              </div>
              @if (exam.sections?.length) {
                <div class="meta-item">
                  <span class="meta-icon">📋</span>
                  <span>Sections: {{ exam.sections.join(', ') }}</span>
                </div>
              }
            </div>

            @if (exam.description) {
              <p class="exam-desc">{{ exam.description }}</p>
            }

            <!-- Schedule Preview -->
            @if (exam.schedule?.length) {
              <div class="schedule-preview">
                <button class="toggle-schedule" (click)="toggleSchedule(exam._id)">
                  {{ expandedExam() === exam._id ? '▼' : '▶' }} Schedule ({{ exam.schedule.length }} subjects)
                </button>
                @if (expandedExam() === exam._id) {
                  <div class="schedule-list">
                    @for (item of getGroupedSchedule(exam); track item.date) {
                      <div class="schedule-day">
                        <div class="day-header">{{ item.date | date:'EEEE, MMM d' }}</div>
                        @for (slot of item.slots; track slot._id) {
                          <div class="schedule-slot">
                            <span class="slot-time">{{ slot.startTime }} - {{ slot.endTime }}</span>
                            <span class="slot-subject">{{ getScheduleSubjectName(slot) }}</span>
                            @if (slot.section) {
                              <span class="slot-section">Section {{ slot.section }}</span>
                            }
                            @if (slot.room) {
                              <span class="slot-room">{{ slot.room }}</span>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <div class="exam-actions">
              <a [routerLink]="['/exams', exam._id]" class="btn btn-ghost btn-sm">✏️ Edit</a>
              <a [routerLink]="['/exams', exam._id, 'schedule']" class="btn btn-ghost btn-sm">📅 Schedule</a>
              @if (isCompleted(exam)) {
                <a [routerLink]="['/results/entry']" [queryParams]="{examId: exam._id}" class="btn btn-primary btn-sm">📝 Enter Marks</a>
              }
              <button class="btn btn-ghost btn-sm text-danger" (click)="delete(exam._id)">🗑️ Delete</button>
            </div>
          </div>
        } @empty { 
          <div class="empty-state">
            <span class="empty-icon">📝</span>
            <h3>No exams found</h3>
            <p>{{ activeTab() === 'all' ? 'Create your first exam to get started.' : 'No exams in this category.' }}</p>
            <button class="btn btn-primary" routerLink="/exams/new">+ Create Exam</button>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .filter-bar { 
      display: flex; 
      justify-content: space-between; 
      align-items: center; 
      flex-wrap: wrap; 
      gap: var(--space-4); 
      margin-bottom: var(--space-6); 
    }
    .tabs { display: flex; gap: var(--space-2); }
    .tab {
      padding: var(--space-2) var(--space-4);
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: var(--text-sm);
      font-weight: 500;
      color: var(--text-secondary);
      border-radius: var(--radius-md);
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .tab:hover { background: var(--surface-hover); }
    .tab.active { background: var(--primary); color: white; }
    .tab .badge { font-size: 10px; }
    .filters { display: flex; gap: var(--space-3); }
    .filters .form-select { width: 150px; }

    .exam-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: var(--space-4); }
    .exam-skeleton { height: 250px; border-radius: var(--radius-lg); }
    
    .exam-card { 
      border: 1px solid var(--border-color); 
      transition: all 0.2s; 
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .exam-card:hover { border-color: var(--primary); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .exam-card.ongoing { border-left: 4px solid var(--warning); }
    .exam-card.completed { opacity: 0.8; }
    
    .exam-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .exam-title { display: flex; align-items: center; gap: var(--space-2); }
    .exam-title h3 { font-size: var(--text-lg); font-weight: 600; margin: 0; }
    
    .exam-meta { display: flex; flex-direction: column; gap: var(--space-2); }
    .meta-item { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); color: var(--text-secondary); }
    .meta-icon { font-size: 14px; }
    
    .exam-desc { font-size: var(--text-sm); color: var(--text-tertiary); margin: 0; line-height: 1.5; }

    .schedule-preview { margin-top: var(--space-2); }
    .toggle-schedule {
      width: 100%;
      padding: var(--space-2);
      background: var(--surface-hover);
      border: none;
      border-radius: var(--radius-md);
      cursor: pointer;
      text-align: left;
      font-size: var(--text-sm);
      font-weight: 500;
    }
    .schedule-list { margin-top: var(--space-3); }
    .schedule-day { margin-bottom: var(--space-3); }
    .day-header { font-size: var(--text-sm); font-weight: 600; color: var(--primary); margin-bottom: var(--space-2); }
    .schedule-slot {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-2);
      background: var(--bg-surface);
      border-radius: var(--radius-sm);
      margin-bottom: var(--space-1);
      font-size: var(--text-sm);
    }
    .slot-time { font-weight: 500; color: var(--text-secondary); min-width: 100px; }
    .slot-subject { flex: 1; font-weight: 500; }
    .slot-section { color: var(--text-tertiary); font-size: var(--text-xs); }
    .slot-room { color: var(--text-tertiary); font-size: var(--text-xs); }
    
    .exam-actions { 
      display: flex; 
      gap: var(--space-2); 
      margin-top: auto; 
      padding-top: var(--space-3);
      border-top: 1px solid var(--border-color);
    }
    .text-danger { color: var(--danger) !important; }
    
    .empty-state { 
      grid-column: 1 / -1;
      text-align: center; 
      padding: var(--space-12); 
      background: var(--bg-surface);
      border-radius: var(--radius-lg);
      border: 2px dashed var(--border-color);
    }
    .empty-icon { font-size: 48px; display: block; margin-bottom: var(--space-4); }
    .empty-state h3 { margin: 0 0 var(--space-2); }
    .empty-state p { color: var(--text-tertiary); margin-bottom: var(--space-4); }

    .badge-success { background: rgba(16,185,129,0.15); color: #10b981; }
    .badge-warning { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .badge-info { background: rgba(99,102,241,0.15); color: #6366f1; }
    .badge-secondary { background: var(--surface-hover); color: var(--text-secondary); }

    @media (max-width: 768px) {
      .filter-bar { flex-direction: column; align-items: stretch; }
      .tabs { overflow-x: auto; }
      .filters { width: 100%; }
      .filters .form-select { flex: 1; }
      .exam-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ExamListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  
  loading = signal(true);
  exams = signal<any[]>([]);
  classes = signal<any[]>([]);
  subjects = signal<any[]>([]);
  subjectMap = signal<Map<string, string>>(new Map());
  activeTab = signal('all');
  expandedExam = signal<string>('');
  
  selectedClass = signal('');
  selectedSection = signal('');
  selectedType = signal('');

  // Computed counts
  upcomingCount = computed(() => this.exams().filter(e => this.isUpcoming(e)).length);
  ongoingCount = computed(() => this.exams().filter(e => this.isOngoing(e)).length);

  // Filtered exams based on tab and filters
  filteredExams = computed(() => {
    let result = this.exams();
    
    // Tab filter
    if (this.activeTab() === 'upcoming') {
      result = result.filter(e => this.isUpcoming(e));
    } else if (this.activeTab() === 'ongoing') {
      result = result.filter(e => this.isOngoing(e));
    } else if (this.activeTab() === 'completed') {
      result = result.filter(e => this.isCompleted(e));
    }

    // Class filter
    const classFilter = this.selectedClass();
    if (classFilter) {
      result = result.filter(e => {
        // Check if class is in the classes array (populated or ObjectId)
        const inClassesArray = e.classes?.some((c: any) => (c._id || c) === classFilter);
        // Also check if class is in any schedule item (fallback for legacy data)
        const inSchedule = e.schedule?.some((s: any) => (s.class?._id || s.class) === classFilter);
        return inClassesArray || inSchedule;
      });
    }

    // Section filter
    const sectionFilter = this.selectedSection();
    if (sectionFilter) {
      result = result.filter(e => {
        // Check if section is in the sections array
        const inSectionsArray = e.sections?.includes(sectionFilter);
        // Also check if section is in any schedule item
        const inSchedule = e.schedule?.some((s: any) => s.section === sectionFilter);
        return inSectionsArray || inSchedule;
      });
    }

    // Type filter
    const typeFilter = this.selectedType();
    if (typeFilter) {
      result = result.filter(e => e.examType === typeFilter);
    }

    return result;
  });

  ngOnInit(): void { 
    // Read query parameters to pre-set filters
    const params = this.route.snapshot.queryParams;
    if (params['classId']) {
      this.selectedClass.set(params['classId']);
    }
    if (params['section']) {
      this.selectedSection.set(params['section']);
    }
    
    this.load(); 
    this.loadClasses();
    this.loadSubjects();
  }

  load(): void {
    this.api.get<any>('/exams', { limit: 100 }).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.exams.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
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

  loadSubjects(): void {
    this.api.get<any>('/subjects', { limit: 100 }).subscribe({
      next: (res) => {
        const list = res.data?.data || res.data || [];
        this.subjects.set(list);
        const map = new Map<string, string>();
        list.forEach((s: any) => map.set(s._id, s.name || s.code || 'Subject'));
        this.subjectMap.set(map);
      }
    });
  }

  setTab(tab: string): void {
    this.activeTab.set(tab);
  }

  onClassChange(value: string): void {
    this.selectedClass.set(value);
    // Reset section when class changes
    this.selectedSection.set('');
  }

  onSectionChange(value: string): void {
    this.selectedSection.set(value);
  }

  onTypeChange(value: string): void {
    this.selectedType.set(value);
  }

  // Get sections from selected class
  availableSections = computed(() => {
    const classId = this.selectedClass();
    if (!classId) return [];
    const cls = this.classes().find(c => c._id === classId);
    if (!cls?.sections?.length) return [];
    return cls.sections.map((s: any) => typeof s === 'string' ? s : s.name).filter(Boolean);
  });

  toggleSchedule(examId: string): void {
    this.expandedExam.set(this.expandedExam() === examId ? '' : examId);
  }

  isUpcoming(exam: any): boolean {
    return new Date(exam.startDate) > new Date();
  }

  isOngoing(exam: any): boolean {
    const now = new Date();
    return new Date(exam.startDate) <= now && new Date(exam.endDate) >= now;
  }

  isCompleted(exam: any): boolean {
    return new Date(exam.endDate) < new Date();
  }

  getExamStatus(exam: any): string {
    if (exam.status === 'cancelled') return 'Cancelled';
    if (this.isOngoing(exam)) return 'Ongoing';
    if (this.isCompleted(exam)) return exam.resultsPublished ? 'Results Published' : 'Completed';
    return 'Scheduled';
  }

  getStatusBadge(exam: any): string {
    if (exam.status === 'cancelled') return 'badge-secondary';
    if (this.isOngoing(exam)) return 'badge-warning';
    if (this.isCompleted(exam)) return 'badge-success';
    return 'badge-info';
  }

  formatExamType(type: string): string {
    return type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Exam';
  }

  getClassNames(exam: any): string {
    if (exam.classes?.length) {
      return exam.classes.map((c: any) => c.name || 'Class').join(', ');
    }
    // Fallback: get unique class names from schedule
    if (exam.schedule?.length) {
      const classNames = new Set<string>();
      exam.schedule.forEach((s: any) => {
        const className = s.class?.name || (s.section ? `Section ${s.section}` : null);
        if (className) classNames.add(className);
      });
      if (classNames.size > 0) return Array.from(classNames).join(', ');
    }
    return 'All Classes';
  }

  getGroupedSchedule(exam: any): any[] {
    if (!exam.schedule?.length) return [];
    
    const grouped: { [date: string]: any[] } = {};
    exam.schedule.forEach((item: any) => {
      const dateKey = new Date(item.date).toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(item);
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, slots]) => ({
        date: new Date(date),
        slots: slots.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
      }));
  }

  delete(id: string): void {
    if (!confirm('Delete this exam? This action cannot be undone.')) return;
    this.api.delete(`/exams/${id}`).subscribe({ 
      next: () => { 
        this.toast.success('Exam deleted'); 
        this.load(); 
      },
      error: () => this.toast.error('Failed to delete exam')
    });
  }

  getSubjectName(subject: any): string {
    if (!subject) return 'Subject';
    // Check for denormalized name in schedule item
    if (typeof subject === 'string' && subject.length > 0 && subject.length < 100) {
      // It might be the subjectName field directly
      return subject;
    }
    if (typeof subject === 'object') {
      return subject.name || subject.code || 'Subject';
    }
    return 'Subject';
  }

  getScheduleSubjectName(slot: any): string {
    // 1. Try the denormalized subjectName field
    if (slot.subjectName) return slot.subjectName;
    // 2. Try populated subject object
    if (slot.subject && typeof slot.subject === 'object' && slot.subject.name) {
      return slot.subject.name;
    }
    // 3. Try lookup from subjects map by ID
    const subjectId = typeof slot.subject === 'string' ? slot.subject : slot.subject?._id;
    if (subjectId && this.subjectMap().has(subjectId)) {
      return this.subjectMap().get(subjectId) || 'Subject';
    }
    // 4. Fallback
    return 'Subject TBD';
  }
}
