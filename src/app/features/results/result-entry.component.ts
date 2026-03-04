import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

interface ExamScheduleSubject {
  subjectId: string;
  subjectName: string;
  date: string;
  maxMarks: number;
  passingMarks: number;
  status: string;
}

interface ClassSchedule {
  classId: string;
  className: string;
  section: string;
  subjects: ExamScheduleSubject[];
}

interface ExamForEntry {
  _id: string;
  name: string;
  examType: string;
  academicYear: any;
  startDate: string;
  endDate: string;
  status: string;
  resultsPublished: boolean;
  classSchedules: ClassSchedule[];
  totalSubjectsToEnter: number;
}

interface StudentMark {
  studentId: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  rollNumber: string;
  photo?: string;
  resultId: string | null;
  subjects: {
    subjectId: string;
    subjectName: string;
    maxMarks: number;
    passingMarks: number;
    obtainedMarks: number | null;
    grade: string;
    isPassed: boolean | null;
  }[];
  totalMarks: number | null;
  obtainedMarks: number | null;
  percentage: number | null;
  grade: string;
  isPublished: boolean;
}

@Component({
  selector: 'app-result-entry',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>📝 Result Entry</h1>
        <p>Enter marks for completed exams</p>
      </div>
      <div class="header-actions">
        <a routerLink="/results" class="btn btn-secondary">← Back to Results</a>
      </div>
    </div>

    <!-- Step 1: Select Exam -->
    <div class="card mb-4">
      <h3 class="section-title">Step 1: Select Exam</h3>
      
      <div class="filter-row">
        <select class="form-select" [(ngModel)]="selectedAcademicYear" (change)="loadExams()">
          <option value="">All Academic Years</option>
          @for (ay of academicYears(); track ay._id) {
            <option [value]="ay._id">{{ ay.name }}</option>
          }
        </select>
      </div>

      @if (loadingExams()) {
        <div class="loading-skeleton">
          @for (_ of [1,2,3]; track _) {
            <div class="skeleton" style="height: 60px; margin-bottom: 8px"></div>
          }
        </div>
      } @else if (exams().length === 0) {
        <div class="empty-state">
          <p>No exams available for result entry. Exams appear here after their scheduled dates have passed.</p>
        </div>
      } @else {
        <div class="exam-list">
          @for (exam of exams(); track exam._id) {
            <div class="exam-card" [class.selected]="selectedExam()?._id === exam._id" (click)="selectExam(exam)">
              <div class="exam-info">
                <h4>{{ exam.name }}</h4>
                <p class="exam-meta">
                  <span class="badge badge-info">{{ exam.examType }}</span>
                  <span>{{ exam.startDate | date:'mediumDate' }} - {{ exam.endDate | date:'mediumDate' }}</span>
                  @if (exam.resultsPublished) {
                    <span class="badge badge-success">Results Published</span>
                  }
                </p>
              </div>
              <div class="exam-stats">
                <span class="stat">{{ exam.totalSubjectsToEnter }} subjects</span>
                <span class="stat">{{ exam.classSchedules.length }} class(es)</span>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Step 2: Select Class/Section -->
    @if (selectedExam()) {
      <div class="card mb-4">
        <h3 class="section-title">Step 2: Select Class & Section</h3>
        
        <div class="class-section-grid">
          @for (cs of selectedExam()!.classSchedules; track cs.classId + cs.section) {
            <button 
              class="class-section-btn" 
              [class.selected]="selectedClassId === cs.classId && selectedSection === cs.section"
              (click)="selectClassSection(cs.classId, cs.section)">
              <span class="class-name">{{ cs.className || 'Class' }}</span>
              <span class="section-name">Section {{ cs.section === 'all' ? 'All' : cs.section }}</span>
              <span class="subject-count">{{ cs.subjects.length }} subjects</span>
            </button>
          }
        </div>
      </div>
    }

    <!-- Step 3: Enter Marks -->
    @if (selectedExam() && selectedClassId && studentsData()) {
      <div class="card">
        <div class="entry-header">
          <h3 class="section-title">Step 3: Enter Marks</h3>
          <div class="entry-stats">
            <span>Total Students: {{ studentsData()!.totalStudents }}</span>
            <span>Results Entered: {{ studentsData()!.resultsEntered }}</span>
          </div>
        </div>

        @if (loadingStudents()) {
          <div class="loading-skeleton">
            @for (_ of [1,2,3,4,5]; track _) {
              <div class="skeleton" style="height: 52px; margin-bottom: 8px"></div>
            }
          </div>
        } @else {
          <!-- Subject tabs -->
          <div class="subject-tabs">
            <button 
              class="tab-btn" 
              [class.active]="!selectedSubjectId" 
              (click)="selectedSubjectId = ''">
              All Subjects
            </button>
            @for (sub of studentsData()!.subjects; track sub.subjectId) {
              <button 
                class="tab-btn" 
                [class.active]="selectedSubjectId === sub.subjectId"
                (click)="selectedSubjectId = sub.subjectId">
                {{ sub.subjectName }}
                <span class="max-marks">({{ sub.maxMarks }})</span>
              </button>
            }
          </div>

          <!-- Marks entry table -->
          <div class="table-container">
            <table class="data-table marks-table">
              <thead>
                <tr>
                  <th class="sticky-col">Roll No</th>
                  <th class="sticky-col-2">Student Name</th>
                  @if (!selectedSubjectId) {
                    @for (sub of studentsData()!.subjects; track sub.subjectId) {
                      <th class="marks-col">
                        <div class="subject-header">
                          <span>{{ sub.subjectName }}</span>
                          <small>Max: {{ sub.maxMarks }}</small>
                        </div>
                      </th>
                    }
                    <th>Total</th>
                    <th>%</th>
                    <th>Grade</th>
                  } @else {
                    <th class="marks-col">Marks (Max: {{ getSelectedSubject()?.maxMarks }})</th>
                    <th>Pass: {{ getSelectedSubject()?.passingMarks }}</th>
                    <th>Status</th>
                  }
                </tr>
              </thead>
              <tbody>
                @for (student of studentsData()!.students; track student.studentId; let i = $index) {
                  <tr [class.has-result]="student.resultId">
                    <td class="sticky-col">{{ student.rollNumber || '-' }}</td>
                    <td class="sticky-col-2">
                      <div class="student-info">
                        @if (student.photo) {
                          <img [src]="student.photo" alt="" class="student-avatar">
                        } @else {
                          <div class="student-avatar-placeholder">{{ student.firstName[0] }}</div>
                        }
                        <span>{{ student.firstName }} {{ student.lastName }}</span>
                      </div>
                    </td>
                    @if (!selectedSubjectId) {
                      @for (sub of student.subjects; track sub.subjectId; let j = $index) {
                        <td class="marks-col">
                          <input 
                            type="number" 
                            class="marks-input"
                            [class.pass]="isPass(sub)"
                            [class.fail]="isFail(sub)"
                            [min]="0" 
                            [max]="sub.maxMarks"
                            [value]="sub.obtainedMarks ?? ''"
                            (input)="updateMark(i, j, $event)"
                            placeholder="-">
                        </td>
                      }
                      <td class="total-col">{{ calculateStudentTotal(student) }}</td>
                      <td>{{ calculateStudentPercentage(student) }}%</td>
                      <td><span class="badge" [class]="getGradeBadge(calculateStudentGrade(student))">{{ calculateStudentGrade(student) }}</span></td>
                    } @else {
                      @for (sub of student.subjects; track sub.subjectId) {
                        @if (sub.subjectId === selectedSubjectId) {
                          <td class="marks-col">
                            <input 
                              type="number" 
                              class="marks-input wide"
                              [class.pass]="isPass(sub)"
                              [class.fail]="isFail(sub)"
                              [min]="0" 
                              [max]="sub.maxMarks"
                              [value]="sub.obtainedMarks ?? ''"
                              (input)="updateMarkForSubject(i, sub.subjectId, $event)"
                              placeholder="Enter marks">
                          </td>
                          <td>{{ sub.passingMarks }}</td>
                          <td>
                            @if (sub.obtainedMarks !== null) {
                              <span class="badge" [class]="isPass(sub) ? 'badge-success' : 'badge-danger'">
                                {{ isPass(sub) ? 'PASS' : 'FAIL' }}
                              </span>
                            } @else {
                              <span class="badge badge-secondary">-</span>
                            }
                          </td>
                        }
                      }
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Save Actions -->
          <div class="save-actions">
            <div class="save-info">
              <span class="modified-count">{{ getModifiedCount() }} students modified</span>
            </div>
            <div class="action-buttons">
              <button class="btn btn-secondary" (click)="resetChanges()" [disabled]="getModifiedCount() === 0">
                Reset Changes
              </button>
              <button class="btn btn-primary" (click)="saveMarks()" [disabled]="saving() || getModifiedCount() === 0">
                @if (saving()) {
                  <span class="spinner"></span> Saving...
                } @else {
                  💾 Save Marks
                }
              </button>
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .mb-4 { margin-bottom: var(--space-4); }
    .section-title { margin-bottom: var(--space-4); font-size: var(--text-lg); }
    .filter-row { margin-bottom: var(--space-4); max-width: 300px; }
    
    .exam-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .exam-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4);
      border: 2px solid var(--border);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 0.2s;
    }
    .exam-card:hover { border-color: var(--primary); background: var(--surface-hover); }
    .exam-card.selected { border-color: var(--primary); background: rgba(var(--primary-rgb), 0.1); }
    .exam-info h4 { margin: 0 0 var(--space-2); }
    .exam-meta { display: flex; gap: var(--space-3); align-items: center; color: var(--text-secondary); font-size: var(--text-sm); }
    .exam-stats { display: flex; gap: var(--space-4); }
    .exam-stats .stat { font-weight: 600; color: var(--text-secondary); }
    
    .class-section-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: var(--space-3);
    }
    .class-section-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
      padding: var(--space-4);
      border: 2px solid var(--border);
      border-radius: var(--radius-lg);
      background: var(--surface);
      cursor: pointer;
      transition: all 0.2s;
    }
    .class-section-btn:hover { border-color: var(--primary); }
    .class-section-btn.selected { border-color: var(--primary); background: rgba(var(--primary-rgb), 0.1); }
    .class-section-btn .class-name { font-weight: 600; font-size: var(--text-lg); }
    .class-section-btn .section-name { color: var(--text-secondary); }
    .class-section-btn .subject-count { font-size: var(--text-sm); color: var(--primary); }
    
    .entry-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
    .entry-stats { display: flex; gap: var(--space-4); color: var(--text-secondary); }
    
    .subject-tabs {
      display: flex;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
      flex-wrap: wrap;
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--border);
    }
    .tab-btn {
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      cursor: pointer;
      font-size: var(--text-sm);
      transition: all 0.2s;
    }
    .tab-btn:hover { border-color: var(--primary); }
    .tab-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
    .tab-btn .max-marks { opacity: 0.7; margin-left: var(--space-1); }
    
    .table-container { overflow-x: auto; max-height: 600px; overflow-y: auto; }
    .marks-table { min-width: 100%; }
    .marks-table th, .marks-table td { white-space: nowrap; }
    .sticky-col { position: sticky; left: 0; background: var(--surface); z-index: 1; }
    .sticky-col-2 { position: sticky; left: 60px; background: var(--surface); z-index: 1; }
    
    .subject-header { display: flex; flex-direction: column; gap: 2px; }
    .subject-header small { color: var(--text-tertiary); font-weight: normal; }
    
    .student-info { display: flex; align-items: center; gap: var(--space-2); }
    .student-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }
    .student-avatar-placeholder {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: var(--text-sm);
      font-weight: 600;
    }
    
    .marks-col { min-width: 80px; }
    .marks-input {
      width: 60px;
      padding: var(--space-1) var(--space-2);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      text-align: center;
      font-size: var(--text-sm);
    }
    .marks-input.wide { width: 100px; }
    .marks-input:focus { outline: none; border-color: var(--primary); }
    .marks-input.pass { background: rgba(34, 197, 94, 0.1); border-color: #22c55e; }
    .marks-input.fail { background: rgba(239, 68, 68, 0.1); border-color: #ef4444; }
    
    .total-col { font-weight: 600; }
    
    .has-result { background: rgba(var(--primary-rgb), 0.05); }
    
    .save-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: var(--space-4);
      padding-top: var(--space-4);
      border-top: 1px solid var(--border);
    }
    .modified-count { color: var(--text-secondary); }
    .action-buttons { display: flex; gap: var(--space-3); }
    
    .empty-state {
      text-align: center;
      padding: var(--space-8);
      color: var(--text-secondary);
    }
    
    .loading-skeleton { padding: var(--space-4); }
    
    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ResultEntryComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  academicYears = signal<any[]>([]);
  exams = signal<ExamForEntry[]>([]);
  selectedExam = signal<ExamForEntry | null>(null);
  studentsData = signal<{
    exam: any;
    classId: string;
    section: string;
    subjects: any[];
    students: StudentMark[];
    totalStudents: number;
    resultsEntered: number;
  } | null>(null);

  loadingExams = signal(false);
  loadingStudents = signal(false);
  saving = signal(false);

  private route = inject(ActivatedRoute);
  private preSelectedExamId = '';

  selectedAcademicYear = '';
  selectedClassId = '';
  selectedSection = '';
  selectedSubjectId = '';

  // Store original data for reset
  private originalStudentsData: StudentMark[] = [];
  private modifiedStudents = new Set<string>();

  ngOnInit(): void {
    // Check for query params to pre-select exam
    this.route.queryParams.subscribe(params => {
      if (params['examId']) {
        this.preSelectedExamId = params['examId'];
      }
    });
    this.loadAcademicYears();
    this.loadExams();
  }

  loadAcademicYears(): void {
    this.api.get<any>('/academic-years').subscribe({
      next: (res) => {
        const data = res.data?.items || res.data?.data || res.data || [];
        this.academicYears.set(Array.isArray(data) ? data : []);
        // Set current academic year as default
        const current = data.find((ay: any) => ay.isCurrent);
        if (current) {
          this.selectedAcademicYear = current._id;
          this.loadExams();
        }
      }
    });
  }

  loadExams(): void {
    this.loadingExams.set(true);
    const params: any = {};
    if (this.selectedAcademicYear) {
      params.academicYearId = this.selectedAcademicYear;
    }

    this.api.get<any>('/results/entry/exams', params).subscribe({
      next: (res) => {
        const examsList = res.data?.exams || res.data || [];
        this.exams.set(examsList);
        this.loadingExams.set(false);
        
        // Auto-select exam if passed via query param
        if (this.preSelectedExamId && examsList.length > 0) {
          const preSelected = examsList.find((e: any) => e._id === this.preSelectedExamId);
          if (preSelected) {
            this.selectExam(preSelected);
          }
        }
      },
      error: () => {
        this.loadingExams.set(false);
        this.toast.error('Failed to load exams');
      }
    });
  }

  selectExam(exam: ExamForEntry): void {
    this.selectedExam.set(exam);
    this.selectedClassId = '';
    this.selectedSection = '';
    this.studentsData.set(null);
  }

  selectClassSection(classId: string, section: string): void {
    this.selectedClassId = classId;
    this.selectedSection = section;
    this.loadStudents();
  }

  loadStudents(): void {
    if (!this.selectedExam() || !this.selectedClassId) return;

    this.loadingStudents.set(true);
    const examId = this.selectedExam()!._id;
    const section = this.selectedSection || 'all';

    this.api.get<any>(`/results/entry/${examId}/${this.selectedClassId}/${section}`).subscribe({
      next: (res) => {
        const data = res.data || res;
        this.studentsData.set(data);
        // Store original data for reset
        this.originalStudentsData = JSON.parse(JSON.stringify(data.students || []));
        this.modifiedStudents.clear();
        this.loadingStudents.set(false);
      },
      error: () => {
        this.loadingStudents.set(false);
        this.toast.error('Failed to load students');
      }
    });
  }

  updateMark(studentIndex: number, subjectIndex: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value === '' ? null : parseFloat(input.value);
    
    const data = this.studentsData();
    if (!data) return;

    const student = data.students[studentIndex];
    const subject = student.subjects[subjectIndex];
    
    // Validate
    if (value !== null && (value < 0 || value > subject.maxMarks)) {
      this.toast.warning(`Marks must be between 0 and ${subject.maxMarks}`);
      input.value = subject.obtainedMarks?.toString() ?? '';
      return;
    }

    subject.obtainedMarks = value;
    this.modifiedStudents.add(student.studentId);
    this.studentsData.set({ ...data });
  }

  updateMarkForSubject(studentIndex: number, subjectId: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value === '' ? null : parseFloat(input.value);
    
    const data = this.studentsData();
    if (!data) return;

    const student = data.students[studentIndex];
    const subjectIndex = student.subjects.findIndex(s => s.subjectId === subjectId);
    if (subjectIndex === -1) return;

    const subject = student.subjects[subjectIndex];
    
    if (value !== null && (value < 0 || value > subject.maxMarks)) {
      this.toast.warning(`Marks must be between 0 and ${subject.maxMarks}`);
      input.value = subject.obtainedMarks?.toString() ?? '';
      return;
    }

    subject.obtainedMarks = value;
    this.modifiedStudents.add(student.studentId);
    this.studentsData.set({ ...data });
  }

  isPass(subject: { obtainedMarks: number | null; passingMarks: number }): boolean {
    return subject.obtainedMarks !== null && subject.obtainedMarks >= subject.passingMarks;
  }

  isFail(subject: { obtainedMarks: number | null; passingMarks: number }): boolean {
    return subject.obtainedMarks !== null && subject.obtainedMarks < subject.passingMarks;
  }

  calculateStudentTotal(student: StudentMark): number {
    return student.subjects.reduce((sum, s) => sum + (s.obtainedMarks || 0), 0);
  }

  calculateStudentPercentage(student: StudentMark): string {
    const total = student.subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    const obtained = this.calculateStudentTotal(student);
    return total > 0 ? ((obtained / total) * 100).toFixed(1) : '0.0';
  }

  calculateStudentGrade(student: StudentMark): string {
    const percentage = parseFloat(this.calculateStudentPercentage(student));
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  }

  getGradeBadge(grade: string): string {
    if (grade.startsWith('A')) return 'badge-success';
    if (grade.startsWith('B')) return 'badge-info';
    if (grade.startsWith('C')) return 'badge-warning';
    return 'badge-danger';
  }

  getSelectedSubject(): any {
    const data = this.studentsData();
    if (!data) return null;
    return data.subjects.find(s => s.subjectId === this.selectedSubjectId);
  }

  getModifiedCount(): number {
    return this.modifiedStudents.size;
  }

  resetChanges(): void {
    const data = this.studentsData();
    if (!data) return;

    data.students = JSON.parse(JSON.stringify(this.originalStudentsData));
    this.modifiedStudents.clear();
    this.studentsData.set({ ...data });
    this.toast.info('Changes reset');
  }

  saveMarks(): void {
    const data = this.studentsData();
    if (!data || !this.selectedExam()) return;

    // Build marks array for modified students
    const marks = data.students
      .filter(s => this.modifiedStudents.has(s.studentId))
      .map(student => ({
        studentId: student.studentId,
        subjects: student.subjects
          .filter(s => s.obtainedMarks !== null)
          .map(s => ({
            subjectId: s.subjectId,
            obtainedMarks: s.obtainedMarks!
          }))
      }))
      .filter(m => m.subjects.length > 0);

    if (marks.length === 0) {
      this.toast.warning('No valid marks to save');
      return;
    }

    this.saving.set(true);

    const payload = {
      examId: this.selectedExam()!._id,
      classId: this.selectedClassId,
      section: this.selectedSection || 'all',
      academicYearId: this.selectedAcademicYear || this.selectedExam()!.academicYear?._id,
      marks
    };

    this.api.post<any>('/results/entry/bulk', payload).subscribe({
      next: (res) => {
        this.saving.set(false);
        const data = res.data || res;
        this.toast.success(`Saved marks for ${data.success || 0} students`);
        if (data.failed > 0) {
          this.toast.warning(`${data.failed} entries failed`);
        }
        // Reload to refresh data
        this.loadStudents();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err.error?.message || 'Failed to save marks');
      }
    });
  }
}
