import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ClassModel } from '../../core/models';

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ isEdit() ? 'Edit Exam' : 'Create Exam' }}</h1>
        <p>{{ isEdit() ? 'Update examination details' : 'Schedule a new examination' }}</p>
      </div>
      <a routerLink="/exams" class="btn btn-secondary">← Back</a>
    </div>

    <form (ngSubmit)="onSubmit()" class="form-card card">
      <div class="grid grid-2">
        <div class="form-group">
          <label>Exam Name *</label>
          <input type="text" class="form-input" [(ngModel)]="exam.name" name="name" required placeholder="e.g. First Term Exam" />
        </div>
        <div class="form-group">
          <label>Exam Type *</label>
          <select class="form-select" [(ngModel)]="exam.examType" name="examType" required>
            <option value="">Select Type</option>
            <option value="midterm">Mid Term</option>
            <option value="final">Final</option>
            <option value="quarterly">Quarterly</option>
            <option value="half_yearly">Half Yearly</option>
            <option value="unit_test">Unit Test</option>
            <option value="monthly">Monthly</option>
            <option value="weekly">Weekly</option>
            <option value="practical">Practical</option>
            <option value="oral">Oral</option>
            <option value="project">Project</option>
            <option value="other">Other</option>
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

      <div class="grid grid-2">
        <div class="form-group">
          <label>Class</label>
          <select class="form-select" [(ngModel)]="exam.classId" name="classId">
            <option value="">Select Class</option>
            @for (c of classes(); track c._id) { <option [value]="c._id">{{ c.name }}</option> }
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select class="form-select" [(ngModel)]="exam.status" name="status">
            <option value="">Select Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label>Description</label>
        <textarea class="form-input" [(ngModel)]="exam.description" name="description" rows="3" placeholder="Optional exam description"></textarea>
      </div>

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
    .form-card { max-width: 800px; }
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--border); }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
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
  exam: any = {};
  private examId = '';

  ngOnInit(): void {
    this.loadClasses();
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit.set(true);
      this.examId = id;
      this.api.get(`/exams/${id}`).subscribe({
        next: (res: any) => {
          const data = res.data || res;
          this.exam = {
            name: data.name || '',
            examType: data.examType || '',
            startDate: data.startDate ? String(data.startDate).substring(0, 10) : '',
            endDate: data.endDate ? String(data.endDate).substring(0, 10) : '',
            classId: data.classes?.[0]?._id || data.classes?.[0] || (typeof data.classId === 'object' ? data.classId?._id : data.classId) || '',
            status: data.status || '',
            description: data.description || '',
            maxMarks: data.maxMarks || '',
            passMarks: data.passMarks || '',
          };
        },
        error: () => this.toast.error('Failed to load exam'),
      });
    }
  }

  loadClasses(): void {
    this.api.get<any>('/classes').subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.classes.set(Array.isArray(data) ? data : []);
      }
    });
  }

  onSubmit(): void {
    this.saving.set(true);
    const payload: any = {
      name: this.exam.name,
      examType: this.exam.examType,
    };
    if (this.exam.startDate) payload.startDate = this.exam.startDate;
    if (this.exam.endDate) payload.endDate = this.exam.endDate;
    if (this.exam.status) payload.status = this.exam.status;
    if (this.exam.description) payload.description = this.exam.description;
    if (this.exam.maxMarks) payload.maxMarks = +this.exam.maxMarks;
    if (this.exam.passMarks) payload.passMarks = +this.exam.passMarks;
    // If classId is set, put it into classes array
    if (this.exam.classId) {
      payload.classes = [this.exam.classId];
    }
    const obs = this.isEdit()
      ? this.api.patch(`/exams/${this.examId}`, payload)
      : this.api.post('/exams', payload);
    obs.subscribe({
      next: () => {
        this.toast.success(this.isEdit() ? 'Exam updated' : 'Exam created');
        this.router.navigate(['/exams']);
      },
      error: (err) => { this.saving.set(false); this.toast.error(err?.error?.message?.join?.(', ') || err?.error?.message || 'Failed to save exam'); }
    });
  }
}
