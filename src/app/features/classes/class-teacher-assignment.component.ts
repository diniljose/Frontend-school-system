import { Component, inject, input, output, signal, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-class-teacher-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen()" (click)="onClose()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2>{{ preSelectedClass() ? 'Assign Class Teacher' : 'Create Assignment' }}</h2>
            <p class="modal-subtitle" *ngIf="preSelectedClass()">
              {{ preSelectedClass().name }} {{ preSelectedSection() ? '- Section ' + preSelectedSection() : '' }}
            </p>
          </div>
          <button class="close-btn" (click)="onClose()">✕</button>
        </div>

        <div class="modal-body">
          <!-- Current Assignment Info -->
          @if (currentAssignment()) {
            <div class="current-assignment">
              <div class="assignment-badge">Currently Assigned</div>
              <div class="assignment-info">
                <div class="teacher-avatar">
                  {{ currentAssignment().teacher?.firstName?.charAt(0) }}{{ currentAssignment().teacher?.lastName?.charAt(0) }}
                </div>
                <div class="teacher-details">
                  <strong>{{ currentAssignment().teacher?.firstName }} {{ currentAssignment().teacher?.lastName }}</strong>
                  <span class="teacher-email">{{ currentAssignment().teacher?.email }}</span>
                  <span class="assignment-date">Assigned: {{ currentAssignment().assignedAt | date:'mediumDate' }}</span>
                </div>
                <button class="btn btn-outline btn-sm" (click)="removeCurrentAssignment()">
                  Remove
                </button>
              </div>
            </div>
            <div class="divider-or">
              <span>Replace with</span>
            </div>
          }

          <div class="form-group">
            <label>Teacher *</label>
            <select [(ngModel)]="form.teacherId" class="form-select" (change)="onTeacherChange()">
              <option value="">Select a teacher</option>
              @for (t of teachers(); track t._id) {
                <option [value]="t._id">{{ t.firstName }} {{ t.lastName }} ({{ t.email }})</option>
              }
            </select>
          </div>

          @if (!preSelectedClass()) {
            <div class="form-group">
              <label>Class *</label>
              <select [(ngModel)]="form.classId" class="form-select" (change)="onClassChange()">
                <option value="">Select a class</option>
                @for (c of classes(); track c._id) {
                  <option [value]="c._id">{{ c.name }} (Grade {{ c.grade }})</option>
                }
              </select>
            </div>

            @if (availableSections().length > 0) {
              <div class="form-group">
                <label>Section *</label>
                <div class="section-radio-group">
                  @for (s of availableSections(); track s) {
                    <label class="radio-label">
                      <input type="radio" [(ngModel)]="form.section" [value]="s.name" name="section" />
                      <span class="radio-text">{{ s.name }}</span>
                      <span class="capacity-text">(Cap: {{ s.capacity }})</span>
                    </label>
                  }
                </div>
              </div>
            }
          }

          <div class="form-group">
            <label>Academic Year</label>
            <select [(ngModel)]="form.academicYearId" class="form-select">
              @for (ay of academicYears(); track ay._id) {
                <option [value]="ay._id">
                  {{ ay.name }}
                  @if (ay.isCurrent) { (Current) }
                </option>
              }
            </select>
          </div>

          @if (selectedTeacher()) {
            <div class="selected-teacher-card">
              <div class="teacher-icon">👨‍🏫</div>
              <div class="teacher-info">
                <strong>{{ selectedTeacher().firstName }} {{ selectedTeacher().lastName }}</strong>
                <p>{{ selectedTeacher().email }}</p>
                <p class="designation">{{ selectedTeacher().designation || 'Teacher' }}</p>
              </div>
            </div>
          }
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="onClose()">Cancel</button>
          <button 
            class="btn btn-primary" 
            (click)="onAssign()" 
            [disabled]="!canAssign() || saving()">
            @if (saving()) { <span class="spinner"></span> }
            {{ currentAssignment() ? 'Replace Assignment' : 'Assign Class Teacher' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
    }

    .modal-content {
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
      max-width: 520px;
      width: 92%;
      max-height: 90vh;
      overflow-y: auto;
      border: 1px solid var(--border);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--border);
    }

    .modal-header h2 {
      margin: 0;
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--text-primary);
    }

    .modal-subtitle {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin-top: 4px;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--text-tertiary);
      padding: 0;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      transition: all 0.15s;
    }

    .close-btn:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .modal-body {
      padding: var(--space-6);
    }

    /* Current Assignment */
    .current-assignment {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .assignment-badge {
      font-size: var(--text-xs);
      font-weight: 600;
      color: var(--success);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: var(--space-3);
    }

    .assignment-info {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .teacher-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), #818cf8);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: var(--text-sm);
      flex-shrink: 0;
    }

    .teacher-details {
      flex: 1;
      min-width: 0;
    }

    .teacher-details strong {
      display: block;
      font-size: var(--text-sm);
      color: var(--text-primary);
    }

    .teacher-email {
      display: block;
      font-size: var(--text-xs);
      color: var(--text-secondary);
      margin-top: 2px;
    }

    .assignment-date {
      display: block;
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      margin-top: 4px;
    }

    .divider-or {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin: var(--space-4) 0;
      color: var(--text-tertiary);
      font-size: var(--text-sm);
    }

    .divider-or::before,
    .divider-or::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--border);
    }

    .form-group {
      margin-bottom: var(--space-4);
    }

    .form-group label {
      display: block;
      margin-bottom: var(--space-2);
      font-weight: 600;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .form-select {
      width: 100%;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      background: var(--surface);
      color: var(--text-primary);
      transition: all 0.15s;
    }

    .form-select:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
    }

    .section-radio-group {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.15s;
      background: var(--surface);
    }

    .radio-label:hover {
      background: var(--bg-secondary);
      border-color: var(--primary);
    }

    .radio-label:has(input:checked) {
      background: rgba(99, 102, 241, 0.1);
      border-color: var(--primary);
    }

    .radio-label input[type="radio"] {
      cursor: pointer;
      accent-color: var(--primary);
    }

    .radio-text {
      font-weight: 600;
      color: var(--text-primary);
    }

    .capacity-text {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
    }

    .selected-teacher-card {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      margin-top: var(--space-4);
    }

    .teacher-icon {
      font-size: 32px;
    }

    .teacher-info {
      flex: 1;
    }

    .teacher-info strong {
      display: block;
      font-size: var(--text-base);
      color: var(--text-primary);
    }

    .teacher-info p {
      margin: 2px 0 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .teacher-info .designation {
      color: var(--text-tertiary);
      font-size: var(--text-xs);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .btn-outline {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-secondary);
    }

    .btn-outline:hover {
      background: var(--bg-secondary);
      border-color: var(--text-tertiary);
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      display: inline-block;
      margin-right: var(--space-2);
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 480px) {
      .modal-content {
        width: 100%;
        max-height: 100vh;
        border-radius: 0;
      }

      .assignment-info {
        flex-wrap: wrap;
      }
    }
  `]
})
export class ClassTeacherAssignmentComponent implements OnChanges {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  // Inputs/Outputs
  isOpen = input<boolean>(false);
  preSelectedClass = input<any>(null);
  preSelectedSection = input<any>(null);
  onOpenChange = output<boolean>();
  onAssigned = output<any>();

  // State
  loading = signal(true);
  saving = signal(false);
  teachers = signal<any[]>([]);
  classes = signal<any[]>([]);
  academicYears = signal<any[]>([]);
  availableSections = signal<any[]>([]);
  selectedTeacher = signal<any>(null);
  currentAssignment = signal<any>(null);

  form = {
    teacherId: '',
    classId: '',
    section: '',
    academicYearId: '',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen()) {
      this.loadData();
      this.initializeFromPreselected();
    }
  }

  private initializeFromPreselected(): void {
    const preClass = this.preSelectedClass();
    const preSection = this.preSelectedSection();
    
    if (preClass) {
      this.form.classId = preClass._id;
      if (preClass.sections) {
        this.availableSections.set(preClass.sections);
      }
    }
    
    if (preSection) {
      // Handle both string and object formats
      this.form.section = typeof preSection === 'string' ? preSection : preSection.name;
    }
  }

  loadData(): void {
    this.loading.set(true);

    Promise.all([
      this.api.get<any>('/teachers', { limit: 1000, isActive: true }).toPromise(),
      this.api.get<any>('/classes', { limit: 1000 }).toPromise(),
      this.api.get<any>('/academic-years').toPromise(),
    ]).then(([teachersRes, classesRes, yearsRes]) => {
      this.teachers.set(teachersRes?.data?.data || teachersRes?.data || []);
      this.classes.set(classesRes?.data?.data || classesRes?.data || []);
      
      const yearsData = yearsRes?.data?.data || yearsRes?.data || [];
      const years = Array.isArray(yearsData) ? yearsData : [];
      this.academicYears.set(years);
      
      // Set default to current academic year
      const currentYear = years.find((y: any) => y.isCurrent);
      if (currentYear) {
        this.form.academicYearId = currentYear._id;
        // Now load current assignment if we have class/section
        if (this.form.classId) {
          this.loadCurrentAssignment();
        }
      }
      
      this.loading.set(false);
    }).catch(() => {
      this.toast.error('Failed to load data');
      this.loading.set(false);
    });
  }

  loadCurrentAssignment(): void {
    const classId = this.preSelectedClass()?._id || this.form.classId;
    if (!classId || !this.form.academicYearId) return;

    const params: any = {
      class: classId,
      academicYear: this.form.academicYearId,
      isClassTeacher: true,
      isActive: true,
    };
    if (this.form.section) {
      params.section = this.form.section;
    }

    this.api.get<any>('/class-teacher-assignments', params).subscribe({
      next: (res) => {
        const assignments = res.data || [];
        if (assignments.length > 0) {
          this.currentAssignment.set(assignments[0]);
        } else {
          this.currentAssignment.set(null);
        }
      },
      error: () => this.currentAssignment.set(null)
    });
  }

  onTeacherChange(): void {
    const teacher = this.teachers().find(t => t._id === this.form.teacherId);
    this.selectedTeacher.set(teacher || null);
  }

  onClassChange(): void {
    const cls = this.classes().find(c => c._id === this.form.classId);
    if (cls && cls.sections && Array.isArray(cls.sections)) {
      this.availableSections.set(cls.sections);
      this.form.section = '';
    } else {
      this.availableSections.set([]);
      this.form.section = '';
    }
    this.currentAssignment.set(null);
  }

  canAssign(): boolean {
    if (!this.form.teacherId || !this.form.academicYearId) {
      return false;
    }
    // If preSelectedClass is provided, use it; otherwise require classId
    const hasClass = this.preSelectedClass()?._id || this.form.classId;
    if (!hasClass) {
      return false;
    }
    // If class has sections, section is required
    if (this.availableSections().length > 0 && !this.form.section) {
      return false;
    }
    return true;
  }

  async removeCurrentAssignment(): Promise<void> {
    const assignment = this.currentAssignment();
    if (!assignment) return;

    if (!confirm('Remove current class teacher assignment?')) return;

    this.saving.set(true);
    this.api.delete(`/class-teacher-assignments/${assignment._id}`).subscribe({
      next: () => {
        this.toast.success('Assignment removed');
        this.currentAssignment.set(null);
        this.saving.set(false);
        this.onAssigned.emit(null);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Failed to remove assignment');
        this.saving.set(false);
      }
    });
  }

  onAssign(): void {
    if (!this.canAssign()) {
      this.toast.error('Please fill all required fields');
      return;
    }

    this.saving.set(true);

    // If there's an existing assignment, remove it first
    const removePromise = this.currentAssignment() 
      ? this.api.delete(`/class-teacher-assignments/${this.currentAssignment()._id}`).toPromise()
      : Promise.resolve();

    removePromise.then(() => {
      // Use preSelectedClass if available, otherwise form.classId
      const classId = this.preSelectedClass()?._id || this.form.classId;
      
      const payload: any = {
        teacher: this.form.teacherId,
        class: classId,
        academicYear: this.form.academicYearId,
        isClassTeacher: true,
      };
      
      if (this.form.section) {
        payload.section = this.form.section;
      }

      this.api.post('/class-teacher-assignments', payload).subscribe({
        next: (res) => {
          this.toast.success('Class teacher assigned successfully');
          this.onAssigned.emit(res.data);
          this.onClose();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err?.error?.message || 'Failed to assign class teacher');
        }
      });
    }).catch((err) => {
      this.saving.set(false);
      this.toast.error('Failed to update assignment');
    });
  }

  onClose(): void {
    this.onOpenChange.emit(false);
    this.form = { teacherId: '', classId: '', section: '', academicYearId: '' };
    this.availableSections.set([]);
    this.selectedTeacher.set(null);
    this.currentAssignment.set(null);
    this.saving.set(false);
  }
}
