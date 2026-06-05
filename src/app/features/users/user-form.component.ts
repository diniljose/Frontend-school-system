import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { User, UserRole } from '../../core/models';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>{{ isEdit() ? 'Edit User' : 'Add New User' }}</h1>
        <p>{{ isEdit() ? 'Update user account' : 'Create a new user account' }}</p>
      </div>
      <a routerLink="/users" class="btn btn-secondary">← Back</a>
    </div>

    <form (ngSubmit)="onSubmit()" class="form-card card">
      <div class="grid grid-2">
        <div class="form-group">
          <label>First Name *</label>
          <input type="text" class="form-input" [(ngModel)]="user.firstName" name="firstName" required />
        </div>
        <div class="form-group">
          <label>Last Name *</label>
          <input type="text" class="form-input" [(ngModel)]="user.lastName" name="lastName" required />
        </div>
      </div>

      <div class="grid grid-2">
        <div class="form-group">
          <label>Email *</label>
          <input type="email" class="form-input" [(ngModel)]="user.email" name="email" required [disabled]="isEdit()" />
        </div>
        <div class="form-group">
          <label>Phone</label>
          <input type="tel" class="form-input" [(ngModel)]="user.phone" name="phone" />
        </div>
      </div>

      @if (!isEdit()) {
        <div class="form-group" style="max-width:400px">
          <label>Password *</label>
          <input type="password" class="form-input" [(ngModel)]="user.password" name="password" required minlength="8"
            placeholder="Min 8 chars, uppercase, lowercase, number, special" />
        </div>
      }

      <div class="grid grid-2">
        <div class="form-group">
          <label>Role *</label>
          <select class="form-select" [(ngModel)]="user.role" name="role" required>
            <option value="">Select Role</option>
            <option [value]="UserRole.PLATFORM_ADMIN">Super Admin</option>
            <option [value]="UserRole.PRINCIPAL">Principal / School Admin</option>
            <option [value]="UserRole.VICE_PRINCIPAL">Vice Principal</option>
            <option [value]="UserRole.TEACHER">Teacher</option>
            <option [value]="UserRole.CLASS_TEACHER">Class Teacher</option>
            <option [value]="UserRole.PARENT">Parent</option>
            <option [value]="UserRole.STUDENT">Student</option>
            <option [value]="UserRole.ACCOUNTANT">Accountant</option>
            <option [value]="UserRole.LIBRARIAN">Librarian</option>
            <option [value]="UserRole.RECEPTIONIST">Receptionist</option>
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select class="form-select" [(ngModel)]="user.isActive" name="isActive">
            <option [ngValue]="true">Active</option>
            <option [ngValue]="false">Inactive</option>
          </select>
        </div>
      </div>

      <div class="form-actions">
        <a routerLink="/users" class="btn btn-secondary">Cancel</a>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          @if (saving()) { <span class="spinner"></span> }
          {{ isEdit() ? 'Update User' : 'Create User' }}
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
export class UserFormComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  UserRole = UserRole;
  isEdit = signal(false);
  saving = signal(false);
  user: any = { isActive: true };
  private userId = '';

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit.set(true);
      this.userId = id;
      this.api.get<User>(`/users/${id}`).subscribe({
        next: (res: any) => {
          const data = res.data || res;
          this.user = {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone || '',
            role: data.role || '',
            isActive: data.isActive !== false,
          };
        },
        error: () => this.toast.error('Failed to load user'),
      });
    }
  }

  onSubmit(): void {
    this.saving.set(true);
    const payload: any = {
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      role: this.user.role,
      isActive: this.user.isActive,
    };
    if (!this.isEdit()) {
      payload.email = this.user.email;
      if (this.user.password) payload.password = this.user.password;
    }
    if (this.user.phone) payload.phone = this.user.phone;

    const obs = this.isEdit()
      ? this.api.patch(`/users/${this.userId}`, payload)
      : this.api.post('/users', payload);
    obs.subscribe({
      next: () => {
        this.toast.success(this.isEdit() ? 'User updated' : 'User created');
        this.router.navigate(['/users']);
      },
      error: (err) => { this.saving.set(false); this.toast.error(err?.error?.message?.join?.(', ') || err?.error?.message || 'Failed to save user'); }
    });
  }
}

