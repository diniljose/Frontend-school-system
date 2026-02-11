import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { School, PaginatedResult } from '../../core/models';

@Component({
  selector: 'app-school-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>🏫 Schools</h1><p>Manage all registered schools</p></div>
      <button class="btn btn-primary" routerLink="/schools/new">+ Add School</button>
    </div>
    <div class="card">
      @if (loading()) {
        @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:80px;margin-bottom:12px"></div> }
      } @else {
        <div class="school-grid">
          @for (s of schools(); track s._id) {
            <div class="school-card card" [routerLink]="['/schools', s._id]" style="cursor:pointer">
              <div class="school-icon">🏫</div>
              <h3>{{ s.name }}</h3>
              <p>{{ s.address }}</p>
              <div class="school-meta">
                <span class="badge badge-success">Active</span>
                <span>📞 {{ s.phone || '—' }}</span>
              </div>
            </div>
          } @empty { <div class="empty-state">No schools found</div> }
        </div>
      }
    </div>
  `,
  styles: [`
    .school-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-4); }
    .school-card { border: 1px solid var(--border); transition: var(--transition-fast); }
    .school-card:hover { border-color: var(--primary); transform: translateY(-2px); }
    .school-icon { font-size: 40px; margin-bottom: var(--space-2); }
    .school-card p { font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-3); }
    .school-meta { display: flex; justify-content: space-between; align-items: center; font-size: var(--text-sm); }
    .empty-state { text-align: center; padding: var(--space-8); color: var(--text-tertiary); grid-column: 1 / -1; }
  `]
})
export class SchoolListComponent implements OnInit {
  private api = inject(ApiService);
  loading = signal(true);
  schools = signal<School[]>([]);

  ngOnInit(): void {
    this.api.get<PaginatedResult<School>>('/schools').subscribe({
      next: (res) => { this.schools.set(res.data?.items || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
