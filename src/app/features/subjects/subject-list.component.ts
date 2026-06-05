import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Subject } from '../../core/models';

// Subject types matching backend enum
const SUBJECT_TYPES = [
  { value: 'core', label: 'Core Subject', description: 'Mandatory core curriculum subjects', icon: '📚' },
  { value: 'elective', label: 'Elective', description: 'Optional subjects students can choose', icon: '🎯' },
  { value: 'language', label: 'Language', description: 'Language learning subjects', icon: '🌐' },
  { value: 'practical', label: 'Practical', description: 'Hands-on practical subjects', icon: '🔬' },
  { value: 'theory', label: 'Theory', description: 'Theoretical subjects', icon: '📖' },
  { value: 'lab', label: 'Laboratory', description: 'Lab-based subjects', icon: '🧪' },
  { value: 'activity', label: 'Activity', description: 'Extra-curricular activities', icon: '🎨' },
  { value: 'sports', label: 'Sports', description: 'Physical education & sports', icon: '⚽' },
];

@Component({
  selector: 'app-subject-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-container">
      <!-- Page Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-icon">📖</div>
          <div>
            <h1>{{ 'nav.subjects' | translate }}</h1>
            <p class="header-subtitle">Manage and organize curriculum subjects for your school</p>
          </div>
        </div>
        <button class="btn btn-primary btn-with-icon" (click)="openForm()">
          <span class="btn-icon">+</span>
          <span>Add Subject</span>
        </button>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="mini-stat">
          <span class="mini-stat-value">{{ subjects().length }}</span>
          <span class="mini-stat-label">Total Subjects</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-value">{{ getTypeCount('core') }}</span>
          <span class="mini-stat-label">Core Subjects</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-value">{{ getTypeCount('elective') }}</span>
          <span class="mini-stat-label">Electives</span>
        </div>
        <div class="mini-stat">
          <span class="mini-stat-value">{{ getTypeCount('language') }}</span>
          <span class="mini-stat-label">Languages</span>
        </div>
      </div>

      <!-- Form Modal -->
      @if (showForm()) {
        <div class="modal-overlay" (click)="cancelForm()">
          <div class="modal-content animate-scale-in" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editId() ? '✏️ Edit Subject' : '➕ New Subject' }}</h2>
              <button class="btn btn-ghost btn-icon modal-close" (click)="cancelForm()">✕</button>
            </div>
            <form (ngSubmit)="onSubmit()" class="modal-body">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label">
                    <span class="label-icon">📝</span>
                    Subject Name *
                  </label>
                  <input 
                    type="text" 
                    class="form-input" 
                    [(ngModel)]="form.name" 
                    name="name" 
                    placeholder="e.g., Mathematics, English" 
                    required 
                  />
                  <span class="form-hint">Enter the full subject name</span>
                </div>
                <div class="form-group">
                  <label class="form-label">
                    <span class="label-icon">🏷️</span>
                    Subject Code *
                  </label>
                  <input 
                    type="text" 
                    class="form-input" 
                    [(ngModel)]="form.code" 
                    name="code" 
                    placeholder="e.g., MATH, ENG" 
                    required 
                    style="text-transform: uppercase"
                  />
                  <span class="form-hint">Unique identifier for the subject</span>
                </div>
              </div>
              
              <div class="form-group">
                <label class="form-label">
                  <span class="label-icon">📂</span>
                  Subject Type *
                </label>
                <div class="type-selector">
                  @for (type of subjectTypes; track type.value) {
                    <div 
                      class="type-option" 
                      [class.selected]="form.type === type.value"
                      (click)="form.type = type.value"
                    >
                      <span class="type-icon">{{ type.icon }}</span>
                      <div class="type-content">
                        <span class="type-label">{{ type.label }}</span>
                        <span class="type-description">{{ type.description }}</span>
                      </div>
                      <span class="type-check" *ngIf="form.type === type.value">✓</span>
                    </div>
                  }
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="cancelForm()">Cancel</button>
                <button type="submit" class="btn btn-primary" [disabled]="!form.name || !form.code || !form.type">
                  {{ editId() ? 'Update Subject' : 'Create Subject' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Subjects Grid -->
      <div class="subjects-container">
        @if (loading()) {
          <div class="subjects-grid">
            @for (i of [1,2,3,4,5,6]; track i) {
              <div class="subject-card skeleton-card">
                <div class="skeleton skeleton-icon"></div>
                <div class="skeleton skeleton-text"></div>
                <div class="skeleton skeleton-text-sm"></div>
              </div>
            }
          </div>
        } @else if (subjects().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📚</div>
            <h3>No Subjects Found</h3>
            <p>Get started by adding your first subject to the curriculum</p>
            <button class="btn btn-primary" (click)="openForm()">+ Add First Subject</button>
          </div>
        } @else {
          <div class="subjects-grid">
            @for (subject of subjects(); track subject._id; let i = $index) {
              <div class="subject-card animate-in" [style.animation-delay]="(i * 0.05) + 's'">
                <div class="subject-header">
                  <div class="subject-type-badge" [attr.data-type]="subject.type || 'core'">
                    {{ getTypeIcon(subject.type || 'core') }}
                  </div>
                  <div class="subject-actions">
                    <button class="btn btn-ghost btn-sm btn-icon" (click)="edit(subject)" title="Edit">✏️</button>
                    <button class="btn btn-ghost btn-sm btn-icon" (click)="delete(subject._id)" title="Delete">🗑️</button>
                  </div>
                </div>
                <div class="subject-body">
                  <h3 class="subject-name">{{ subject.name }}</h3>
                  <div class="subject-meta">
                    <span class="subject-code">{{ subject.code }}</span>
                    <span class="subject-type-label">{{ getTypeLabel(subject.type || 'core') }}</span>
                  </div>
                </div>
                <div class="subject-footer">
                  <div class="subject-stats">
                    <span class="stat-item" title="Subject Type">
                      <span class="stat-icon">📂</span>
                      <span>{{ (subject.type || 'core') | titlecase }}</span>
                    </span>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-6);
      flex-wrap: wrap;
      gap: var(--space-4);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: var(--space-4);
    }

    .header-icon {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
      border-radius: var(--radius-xl);
      font-size: 28px;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
    }

    .header-subtitle {
      color: var(--text-secondary);
      margin-top: var(--space-1);
      font-size: var(--text-sm);
    }

    .btn-with-icon {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-5);
    }

    .btn-icon {
      font-size: var(--text-lg);
      font-weight: 600;
    }

    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .mini-stat {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-1);
      transition: all var(--transition-fast);
    }

    .mini-stat:hover {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-md);
    }

    .mini-stat-value {
      font-size: var(--text-2xl);
      font-weight: 700;
      color: var(--color-primary);
      font-family: var(--font-mono);
    }

    .mini-stat-label {
      font-size: var(--text-xs);
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Subjects Grid */
    .subjects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--space-5);
    }

    .subject-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      padding: var(--space-5);
      transition: all var(--transition-base);
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .subject-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--color-primary);
    }

    .subject-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .subject-type-badge {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-lg);
      font-size: 24px;
      background: var(--bg-muted);
    }

    .subject-type-badge[data-type="core"] { background: rgba(59, 130, 246, 0.12); }
    .subject-type-badge[data-type="elective"] { background: rgba(139, 92, 246, 0.12); }
    .subject-type-badge[data-type="language"] { background: rgba(6, 182, 212, 0.12); }
    .subject-type-badge[data-type="practical"] { background: rgba(16, 185, 129, 0.12); }
    .subject-type-badge[data-type="theory"] { background: rgba(245, 158, 11, 0.12); }
    .subject-type-badge[data-type="lab"] { background: rgba(236, 72, 153, 0.12); }
    .subject-type-badge[data-type="activity"] { background: rgba(251, 146, 60, 0.12); }
    .subject-type-badge[data-type="sports"] { background: rgba(34, 197, 94, 0.12); }

    .subject-actions {
      display: flex;
      gap: var(--space-1);
      opacity: 0;
      transition: opacity var(--transition-fast);
    }

    .subject-card:hover .subject-actions {
      opacity: 1;
    }

    .subject-body {
      flex: 1;
    }

    .subject-name {
      font-size: var(--text-lg);
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--space-2);
    }

    .subject-meta {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
    }

    .subject-code {
      display: inline-flex;
      padding: var(--space-1) var(--space-2);
      background: var(--color-primary);
      color: white;
      border-radius: var(--radius-md);
      font-size: var(--text-xs);
      font-weight: 600;
      font-family: var(--font-mono);
    }

    .subject-type-label {
      font-size: var(--text-xs);
      color: var(--text-muted);
      text-transform: capitalize;
    }

    .subject-footer {
      padding-top: var(--space-3);
      border-top: 1px solid var(--border-color);
    }

    .subject-stats {
      display: flex;
      gap: var(--space-4);
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .stat-icon {
      font-size: 14px;
    }

    /* Modal Styles */
    .modal-content {
      max-width: 640px;
      width: 100%;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--border-color);
    }

    .modal-header h2 {
      font-size: var(--text-xl);
      font-weight: 600;
    }

    .modal-close {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full);
    }

    .modal-body {
      padding: var(--space-6);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding-top: var(--space-6);
      margin-top: var(--space-4);
      border-top: 1px solid var(--border-color);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-5);
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: var(--text-sm);
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--space-2);
    }

    .label-icon {
      font-size: 14px;
    }

    .form-hint {
      font-size: var(--text-xs);
      color: var(--text-muted);
      margin-top: var(--space-1);
    }

    /* Type Selector */
    .type-selector {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-3);
      max-height: 320px;
      overflow-y: auto;
      padding: var(--space-1);
    }

    .type-option {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3);
      border: 2px solid var(--border-color);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all var(--transition-fast);
      position: relative;
    }

    .type-option:hover {
      border-color: var(--color-primary);
      background: var(--bg-surface-hover);
    }

    .type-option.selected {
      border-color: var(--color-primary);
      background: rgba(59, 130, 246, 0.08);
    }

    .type-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-muted);
      border-radius: var(--radius-md);
      font-size: 20px;
      flex-shrink: 0;
    }

    .type-content {
      flex: 1;
      min-width: 0;
    }

    .type-label {
      display: block;
      font-weight: 600;
      font-size: var(--text-sm);
      color: var(--text-primary);
    }

    .type-description {
      display: block;
      font-size: var(--text-xs);
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .type-check {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-primary);
      color: white;
      border-radius: var(--radius-full);
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--space-12) var(--space-4);
      background: var(--bg-surface);
      border: 2px dashed var(--border-color);
      border-radius: var(--radius-xl);
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: var(--space-4);
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: var(--text-lg);
      margin-bottom: var(--space-2);
    }

    .empty-state p {
      color: var(--text-muted);
      margin-bottom: var(--space-6);
    }

    /* Skeleton Loading */
    .skeleton-card {
      min-height: 180px;
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
      padding: var(--space-5);
    }

    .skeleton-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
    }

    .skeleton-text {
      height: 24px;
      width: 70%;
    }

    .skeleton-text-sm {
      height: 16px;
      width: 50%;
    }

    /* Animation */
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    .animate-scale-in {
      animation: scaleIn 0.2s ease-out;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .type-selector {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
      }

      .header-icon {
        width: 48px;
        height: 48px;
        font-size: 24px;
      }

      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .modal-content {
        margin: var(--space-4);
        max-height: calc(100vh - var(--space-8));
      }

      .modal-body {
        padding: var(--space-4);
      }

      .type-selector {
        grid-template-columns: 1fr;
        max-height: 240px;
      }

      .subjects-grid {
        grid-template-columns: 1fr;
      }

      .subject-actions {
        opacity: 1;
      }
    }

    @media (max-width: 480px) {
      .stats-row {
        grid-template-columns: 1fr;
      }

      h1 {
        font-size: var(--text-xl);
      }
    }
  `]
})
export class SubjectListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  
  loading = signal(true);
  subjects = signal<Subject[]>([]);
  showForm = signal(false);
  editId = signal<string | null>(null);
  form: any = { name: '', code: '', type: 'core' };
  
  subjectTypes = SUBJECT_TYPES;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.get<any>('/subjects').subscribe({
      next: (res) => {
        const data = res.data?.data || res.data?.items || res.data || [];
        this.subjects.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openForm(): void {
    this.form = { name: '', code: '', type: 'core' };
    this.editId.set(null);
    this.showForm.set(true);
  }

  edit(s: Subject): void {
    this.form = { name: s.name, code: s.code, type: s.type || 'core' };
    this.editId.set(s._id);
    this.showForm.set(true);
  }

  cancelForm(): void {
    this.form = { name: '', code: '', type: 'core' };
    this.editId.set(null);
    this.showForm.set(false);
  }

  onSubmit(): void {
    const payload = { 
      name: this.form.name, 
      code: this.form.code.toUpperCase(), 
      type: this.form.type 
    };
    const obs = this.editId() 
      ? this.api.patch(`/subjects/${this.editId()}`, payload) 
      : this.api.post('/subjects', payload);
    
    obs.subscribe({
      next: () => {
        this.toast.success(this.editId() ? 'Subject updated successfully' : 'Subject created successfully');
        this.cancelForm();
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Operation failed')
    });
  }

  delete(id: string): void {
    if (!confirm('Are you sure you want to delete this subject? This action cannot be undone.')) return;
    this.api.delete(`/subjects/${id}`).subscribe({
      next: () => {
        this.toast.success('Subject deleted successfully');
        this.load();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Delete failed')
    });
  }

  getTypeIcon(type: string): string {
    const found = SUBJECT_TYPES.find(t => t.value === type);
    return found?.icon || '📄';
  }

  getTypeLabel(type: string): string {
    const found = SUBJECT_TYPES.find(t => t.value === type);
    return found?.label || type || 'Unknown';
  }

  getTypeCount(type: string): number {
    return this.subjects().filter(s => s.type === type).length;
  }
}
