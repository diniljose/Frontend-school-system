import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-school-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div><h1>{{ isEdit() ? 'Edit School' : 'Add School' }}</h1></div>
      <a routerLink="/schools" class="btn btn-secondary">← Back</a>
    </div>
    <form (ngSubmit)="onSubmit()" class="form-card card" style="max-width:800px">
      <div class="grid grid-2">
        <div class="form-group"><label>School Name *</label><input type="text" class="form-input" [(ngModel)]="school.name" name="name" required /></div>
        <div class="form-group"><label>Email *</label><input type="email" class="form-input" [(ngModel)]="school.email" name="email" required /></div>
      </div>
      <div class="grid grid-2">
        <div class="form-group"><label>Phone</label><input type="tel" class="form-input" [(ngModel)]="school.phone" name="phone" /></div>
        <div class="form-group"><label>Website</label><input type="url" class="form-input" [(ngModel)]="school.website" name="website" /></div>
      </div>
      <div class="form-group"><label>Address</label><textarea class="form-textarea" [(ngModel)]="school.address" name="address" rows="2"></textarea></div>
      <div class="form-actions">
        <a routerLink="/schools" class="btn btn-secondary">Cancel</a>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ isEdit() ? 'Update' : 'Create' }}</button>
      </div>
    </form>
  `,
  styles: [`.form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--border); }`]
})
export class SchoolFormComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  isEdit = signal(false);
  saving = signal(false);
  school: any = {};

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) { this.isEdit.set(true); this.api.get(`/schools/${id}`).subscribe({ next: (s) => this.school = { ...(s.data || s) } }); }
  }
  onSubmit(): void {
    this.saving.set(true);
    const obs = this.isEdit() ? this.api.patch(`/schools/${this.school._id}`, this.school) : this.api.post('/schools', this.school);
    obs.subscribe({
      next: () => { this.toast.success(this.isEdit() ? 'Updated' : 'Created'); this.router.navigate(['/schools']); },
      error: () => { this.saving.set(false); this.toast.error('Failed'); }
    });
  }
}
