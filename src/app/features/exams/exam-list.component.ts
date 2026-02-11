import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Exam, PaginatedResult } from '../../core/models';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.exams' | translate }}</h1><p>Schedule and manage examinations</p></div>
      <button class="btn btn-primary" routerLink="/exams/new">+ Create Exam</button>
    </div>
    <div class="card">
      @if (loading()) {
        @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:80px;margin-bottom:12px"></div> }
      } @else {
        <div class="exam-grid">
          @for (exam of exams(); track exam._id) {
            <div class="exam-card card">
              <div class="exam-header">
                <h3>{{ exam.name }}</h3>
                <span class="badge badge-info">{{ exam.examType }}</span>
              </div>
              <div class="exam-meta">
                <span>📅 {{ exam.startDate | date:'mediumDate' }} - {{ exam.endDate | date:'mediumDate' }}</span>
                <span>📝 {{ exam.examType }}</span>
              </div>
              <div class="exam-actions">
                <a [routerLink]="['/exams', exam._id]" class="btn btn-ghost btn-sm">Edit</a>
                <button class="btn btn-ghost btn-sm" style="color:var(--danger)" (click)="delete(exam._id)">Delete</button>
              </div>
            </div>
          } @empty { <div class="empty-state">No exams scheduled. Create your first exam.</div> }
        </div>
      }
    </div>
  `,
  styles: [`
    .exam-grid { display: grid; gap: var(--space-4); }
    .exam-card { border: 1px solid var(--border); transition: var(--transition-fast); }
    .exam-card:hover { border-color: var(--primary); }
    .exam-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); }
    .exam-meta { display: flex; gap: var(--space-4); font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-3); }
    .exam-actions { display: flex; gap: var(--space-2); }
    .empty-state { text-align: center; padding: var(--space-8); color: var(--text-tertiary); }
  `]
})
export class ExamListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  loading = signal(true);
  exams = signal<Exam[]>([]);

  ngOnInit(): void { this.load(); }
  load(): void {
    this.api.get<PaginatedResult<Exam>>('/exams').subscribe({
      next: (res) => { this.exams.set(res.data?.items || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
  delete(id: string): void {
    if (!confirm('Delete this exam?')) return;
    this.api.delete(`/exams/${id}`).subscribe({ next: () => { this.toast.success('Deleted'); this.load(); } });
  }
}
