import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { ClassModel, PaginatedResult } from '../../core/models';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.classes' | translate }}</h1><p>Manage classes and sections</p></div>
      <button class="btn btn-primary" routerLink="/classes/new">+ Add Class</button>
    </div>
    <div class="card">
      @if (loading()) {
        @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:52px;margin-bottom:8px"></div> }
      } @else {
        <div class="class-grid">
          @for (c of classes(); track c._id) {
            <div class="class-card card" [routerLink]="['/classes', c._id]" style="cursor:pointer">
              <div class="class-icon">🏫</div>
              <h3>{{ c.name }} <span class="section-badge">{{ getSectionNames(c) }}</span></h3>
              <div class="class-meta">
                <span>👨‍🏫 {{ getTeacherName(c) }}</span>
                <span>🎓 {{ c.capacity || 0 }} capacity</span>
              </div>
            </div>
          } @empty {
            <div class="empty-state">No classes found. Create your first class.</div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .class-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); }
    .class-card { transition: var(--transition-fast); border: 1px solid var(--border); }
    .class-card:hover { border-color: var(--primary); transform: translateY(-2px); }
    .class-icon { font-size: 32px; margin-bottom: var(--space-2); }
    .class-card h3 { display: flex; align-items: center; gap: var(--space-2); }
    .section-badge { font-size: var(--text-sm); padding: 2px 8px; border-radius: var(--radius-sm); background: var(--primary); color: white; font-weight: 500; }
    .class-meta { display: flex; flex-direction: column; gap: var(--space-1); font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-3); }
    .empty-state { text-align: center; padding: var(--space-8); color: var(--text-tertiary); grid-column: 1 / -1; }
  `]
})
export class ClassListComponent implements OnInit {
  private api = inject(ApiService);
  loading = signal(true);
  classes = signal<ClassModel[]>([]);

  ngOnInit(): void {
    this.api.get<PaginatedResult<ClassModel>>('/classes').subscribe({
      next: (res) => { this.classes.set(res.data?.items || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getSectionNames(c: any): string {
    if (!c.sections?.length) return '';
    return c.sections.map((s: any) => typeof s === 'string' ? s : s.name).join(', ');
  }

  getTeacherName(c: any): string {
    // classTeacher may be at top level or inside sections
    if (c.classTeacher && typeof c.classTeacher === 'object') {
      return `${c.classTeacher.firstName || ''} ${c.classTeacher.lastName || ''}`.trim() || 'Unassigned';
    }
    // Check first section's classTeacher
    const sec = c.sections?.[0];
    if (sec?.classTeacher && typeof sec.classTeacher === 'object') {
      return `${sec.classTeacher.firstName || ''} ${sec.classTeacher.lastName || ''}`.trim() || 'Unassigned';
    }
    return 'Unassigned';
  }
}
