import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Teacher } from '../../core/models';

@Component({
  selector: 'app-class-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div><h1>{{ isEdit() ? 'Edit Class' : 'Create Class' }}</h1></div>
      <a routerLink="/classes" class="btn btn-secondary">← Back</a>
    </div>
    <form (ngSubmit)="onSubmit()" class="form-card card" style="max-width:700px">
      <div class="grid grid-2">
        <div class="form-group"><label>Class Name *</label><input type="text" class="form-input" [(ngModel)]="cls.name" name="name" placeholder="e.g. Grade 10" required /></div>
        <div class="form-group"><label>Section *</label><input type="text" class="form-input" [(ngModel)]="cls.section" name="section" placeholder="e.g. A" required /></div>
      </div>
      <div class="grid grid-2">
        <div class="form-group">
          <label>Class Teacher</label>
          <select class="form-select" [(ngModel)]="cls.classTeacher" name="teacher">
            <option value="">Select Teacher</option>
            @for (t of teachers(); track t._id) { <option [value]="t._id">{{ t.firstName }} {{ t.lastName }}</option> }
          </select>
        </div>
        <div class="form-group"><label>Room Number</label><input type="text" class="form-input" [(ngModel)]="cls.roomNumber" name="room" /></div>
      </div>
      <div class="form-group"><label>Capacity</label><input type="number" class="form-input" [(ngModel)]="cls.capacity" name="capacity" /></div>
      <div class="form-actions">
        <a routerLink="/classes" class="btn btn-secondary">Cancel</a>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ isEdit() ? 'Update' : 'Create' }}</button>
      </div>
    </form>
  `,
  styles: [`.form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--border); }`]
})
export class ClassFormComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  isEdit = signal(false);
  saving = signal(false);
  teachers = signal<Teacher[]>([]);
  cls: any = {};

  ngOnInit(): void {
    this.api.get<any>('/teachers').subscribe({ next: (res) => this.teachers.set(res.data?.items || []) });
    const id = this.route.snapshot.params['id'];
    if (id) { this.isEdit.set(true); this.api.get(`/classes/${id}`).subscribe({ next: (c: any) => { const d = c.data || c; this.cls = { ...d, section: d.sections?.[0]?.name || '', classTeacher: d.sections?.[0]?.classTeacher?._id || d.sections?.[0]?.classTeacher || '' }; } }); }
  }
  onSubmit(): void {
    this.saving.set(true);
    const obs = this.isEdit() ? this.api.patch(`/classes/${this.cls._id}`, this.cls) : this.api.post('/classes', this.cls);
    obs.subscribe({
      next: () => { this.toast.success(this.isEdit() ? 'Updated' : 'Created'); this.router.navigate(['/classes']); },
      error: () => { this.saving.set(false); this.toast.error('Failed to save'); }
    });
  }
}
