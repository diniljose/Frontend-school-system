import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div><h1>{{ isEdit() ? 'Edit Vehicle' : 'Add Vehicle' }}</h1></div>
      <a routerLink="/transport" class="btn btn-secondary">← Back</a>
    </div>
    <form (ngSubmit)="onSubmit()" class="form-card card" style="max-width:800px">
      <h3 class="section-title" style="border-top:none;padding-top:0;margin-top:0">Vehicle Details</h3>
      <div class="grid grid-3">
        <div class="form-group"><label>Vehicle Number *</label><input type="text" class="form-input" [(ngModel)]="vehicle.vehicleNumber" name="vn" required /></div>
        <div class="form-group"><label>Capacity</label><input type="number" class="form-input" [(ngModel)]="vehicle.capacity" name="cap" /></div>
        <div class="form-group"><label>Route Name</label><input type="text" class="form-input" [(ngModel)]="vehicle.routeName" name="route" /></div>
      </div>
      <h3 class="section-title">Driver Information</h3>
      <div class="grid grid-3">
        <div class="form-group"><label>Driver Name</label><input type="text" class="form-input" [(ngModel)]="vehicle.driverName" name="dn" /></div>
        <div class="form-group"><label>Driver Phone</label><input type="tel" class="form-input" [(ngModel)]="vehicle.driverPhone" name="dp" /></div>
        <div class="form-group"><label>License Number</label><input type="text" class="form-input" [(ngModel)]="vehicle.licenseNumber" name="ln" /></div>
      </div>
      <div class="form-actions">
        <a routerLink="/transport" class="btn btn-secondary">Cancel</a>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ isEdit() ? 'Update' : 'Create' }}</button>
      </div>
    </form>
  `,
  styles: [`
    .section-title { font-size: var(--text-lg); font-weight: 600; margin-top: var(--space-6); margin-bottom: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border); }
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--border); }
  `]
})
export class VehicleFormComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  isEdit = signal(false);
  saving = signal(false);
  vehicle: any = {};

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) { this.isEdit.set(true); this.api.get(`/transport/${id}`).subscribe({ next: (v) => this.vehicle = { ...(v.data || v) } }); }
  }
  onSubmit(): void {
    this.saving.set(true);
    const obs = this.isEdit() ? this.api.patch(`/transport/${this.vehicle._id}`, this.vehicle) : this.api.post('/transport', this.vehicle);
    obs.subscribe({
      next: () => { this.toast.success(this.isEdit() ? 'Updated' : 'Created'); this.router.navigate(['/transport']); },
      error: () => { this.saving.set(false); this.toast.error('Failed'); }
    });
  }
}
