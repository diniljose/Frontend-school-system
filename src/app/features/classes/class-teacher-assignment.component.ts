import { Component, inject, input, output, signal } from '@angular/core';
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
          <h2>Assign Class Teacher</h2>
          <button class="close-btn" (click)="onClose()">✕</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>Teacher *</label>
            <select [(ngModel)]="form.teacherId" class="form-select" (change)="onTeacherChange()">
              <option value="">Select a teacher</option>
              @for (t of teachers(); track t._id) {
                <option [value]="t._id">{{ t.firstName }} {{ t.lastName }} ({{ t.email }})</option>
              }
            </select>
          </div>

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
                    {{ s.name }}
                    <span class="capacity-text">(Cap: {{ s.capacity }})</span>
                  </label>
                }
              </div>
            </div>
          }

          <div class="form-group">
            <label>Academic Year</label>
            <select [(ngModel)]="form.academicYearId" class="form-select">
              <option value="">Current academic year</option>
              @for (ay of academicYears(); track ay._id) {
                <option [value]="ay._id">
                  {{ ay.name }}
                  @if (ay.isCurrent) { <span>(Current)</span> }
                </option>
              }
            </select>
          </div>

          @if (selectedTeacher()) {
            <div class="info-box">
              <strong>{{ selectedTeacher().firstName }} {{ selectedTeacher().lastName }}</strong>
              <p>Email: {{ selectedTeacher().email }}</p>
              <p>Designation: {{ selectedTeacher().designation || 'N/A' }}</p>
            </div>
          }
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="onClose()">Cancel</button>
          <button 
            class="btn btn-primary" 
            (click)="onAssign()" 
            [disabled]="!form.teacherId || !form.classId || !form.section || saving()">
            @if (saving()) { <span class="spinner"></span> }
            Assign Class Teacher
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
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: var(--radius-xl);
      box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
      max-width: 500px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-6);
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header h2 {
      margin: 0;
      font-size: var(--text-xl);
      font-weight: 700;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: var(--text-secondary);
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: var(--text-primary);
    }

    .modal-body {
      padding: var(--space-6);
    }

    .form-group {
      margin-bottom: var(--space-4);
    }

    .form-group label {
      display: block;
      margin-bottom: var(--space-2);
      font-weight: 600;
      font-size: var(--text-sm);
    }

    .form-select {
      width: 100%;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      font-size: var(--text-sm);
      background: white;
    }

    .form-select:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: inset 0 0 0 1px var(--color-primary);
    }

    .section-radio-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.2s;
    }

    .radio-label:hover {
      background: var(--bg-secondary);
    }

    .radio-label input[type="radio"] {
      cursor: pointer;
    }

    .radio-label input[type="radio"]:checked + :not(span) {
      color: var(--color-primary);
    }

    .capacity-text {
      font-size: var(--text-xs);
      color: var(--text-secondary);
      margin-left: auto;
    }

    .info-box {
      background: var(--bg-secondary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      margin-top: var(--space-4);
    }

    .info-box strong {
      display: block;
      font-size: var(--text-base);
      margin-bottom: var(--space-1);
    }

    .info-box p {
      margin: 0;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-6);
      border-top: 1px solid var(--border-color);
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
  `]
})
export class ClassTeacherAssignmentComponent {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  // Inputs/Outputs
  isOpen = input<boolean>(false);
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

  form = {
    teacherId: '',
    classId: '',
    section: '',
    academicYearId: '',
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    Promise.all([
      this.api.get<any>('/teachers', { limit: 1000 }).toPromise(),
      this.api.get<any>('/classes', { limit: 1000 }).toPromise(),
      this.api.get<any>('/academic-years').toPromise(),
    ]).then(([teachersRes, classesRes, yearsRes]) => {
      this.teachers.set(teachersRes?.data?.data || teachersRes?.data || []);
      this.classes.set(classesRes?.data?.data || classesRes?.data || []);
      
      const yearsData = yearsRes?.data?.data || yearsRes?.data || [];
      this.academicYears.set(Array.isArray(yearsData) ? yearsData : []);
      
      this.loading.set(false);
    }).catch(() => {
      this.toast.error('Failed to load data');
      this.loading.set(false);
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
      this.form.section = ''; // Reset section
    } else {
      this.availableSections.set([]);
      this.form.section = '';
    }
  }

  onAssign(): void {
    if (!this.form.teacherId || !this.form.classId || !this.form.section) {
      this.toast.error('Please fill all required fields');
      return;
    }

    this.saving.set(true);

    const payload = {
      teacher: this.form.teacherId,
      class: this.form.classId,
      academicYear: this.form.academicYearId || undefined,
      isClassTeacher: true,
    };

    // Create the class teacher assignment via API
    this.api.post('/class-teacher-assignments', payload).subscribe({
      next: (res) => {
        this.toast.success(`Class teacher assigned successfully`);
        this.onAssigned.emit(res.data);
        this.onClose();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message || 'Failed to assign class teacher');
      }
    });
  }

  onClose(): void {
    this.onOpenChange.emit(false);
    this.form = { teacherId: '', classId: '', section: '', academicYearId: '' };
    this.availableSections.set([]);
    this.selectedTeacher.set(null);
  }
}
