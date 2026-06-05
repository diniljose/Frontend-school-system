import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Transport } from '../../core/models';

@Component({
  selector: 'app-vehicle-list',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>🚌 Transport</h1><p>Manage vehicles and routes</p></div>
      <div class="header-actions">
        <a routerLink="/transport/tracking" class="btn btn-secondary">📍 GPS Tracking</a>
        <a routerLink="/transport/new" class="btn btn-primary">+ Add Vehicle</a>
      </div>
    </div>
    <div class="card">
      @if (loading()) {
        @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:100px;margin-bottom:12px"></div> }
      } @else {
        <div class="vehicle-grid">
          @for (v of vehicles(); track v._id) {
            <div class="vehicle-card card">
              <div class="vehicle-header">
                <span class="vehicle-icon">🚌</span>
                <div>
                  <h3>{{ v.vehicleNumber }}</h3>
                  <p class="vehicle-route">{{ v.routeName || 'No route assigned' }}</p>
                </div>
                <span class="badge" [class]="v.status === 'active' ? 'badge-success' : 'badge-warning'">{{ v.status || 'Active' }}</span>
              </div>
              <div class="vehicle-meta">
                <span>👤 {{ v.driver?.name || 'Unassigned' }}</span>
                <span>📱 {{ v.driver?.phone || '—' }}</span>
                <span>💺 {{ v.capacity || 0 }} seats</span>
              </div>
              <div class="vehicle-actions">
                <a [routerLink]="['/transport', v._id]" class="btn btn-ghost btn-sm">Edit</a>
                <button class="btn btn-ghost btn-sm" style="color:var(--danger)" (click)="delete(v._id)">Delete</button>
              </div>
            </div>
          } @empty { <div class="empty-state">No vehicles registered</div> }
        </div>
      }
    </div>
  `,
  styles: [`
    .header-actions { display: flex; gap: var(--space-3); }
    .vehicle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: var(--space-4); }
    .vehicle-card { border: 1px solid var(--border); transition: var(--transition-fast); }
    .vehicle-card:hover { border-color: var(--primary); }
    .vehicle-header { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3); }
    .vehicle-icon { font-size: 32px; }
    .vehicle-route { font-size: var(--text-sm); color: var(--text-secondary); }
    .vehicle-header .badge { margin-left: auto; }
    .vehicle-meta { display: flex; gap: var(--space-4); font-size: var(--text-sm); color: var(--text-secondary); margin-bottom: var(--space-3); flex-wrap: wrap; }
    .vehicle-actions { display: flex; gap: var(--space-2); }
    .empty-state { text-align: center; padding: var(--space-8); color: var(--text-tertiary); grid-column: 1 / -1; }
  `]
})
export class VehicleListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  loading = signal(true);
  vehicles = signal<Transport[]>([]);

  ngOnInit(): void { this.load(); }
  load(): void {
    this.api.get<any>('/transport').subscribe({
      next: (res) => { this.vehicles.set(res.data || res || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
  delete(id: string): void {
    if (!confirm('Delete this vehicle?')) return;
    this.api.delete(`/transport/${id}`).subscribe({ next: () => { this.toast.success('Deleted'); this.load(); } });
  }
}
