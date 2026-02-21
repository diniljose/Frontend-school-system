import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

interface Role {
  _id: string;
  name: string;
  code: string;
  permissions: string[];
}

@Component({
  selector: 'app-teacher-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div><h1>{{ isEdit() ? 'Edit Teacher' : 'Add New Teacher' }}</h1></div>
      <a routerLink="/teachers" class="btn btn-secondary">← Back</a>
    </div>
    <form (ngSubmit)="onSubmit()" class="form-card card" style="max-width:900px">
      <h3 class="section-title" style="margin-top:0;border-top:none;padding-top:0">Personal Information</h3>
      <div class="grid grid-3">
        <div class="form-group"><label>First Name *</label><input type="text" class="form-input" [(ngModel)]="teacher.firstName" name="fn" required /></div>
        <div class="form-group"><label>Last Name *</label><input type="text" class="form-input" [(ngModel)]="teacher.lastName" name="ln" required /></div>
        <div class="form-group"><label>Email *</label><input type="email" class="form-input" [(ngModel)]="teacher.email" name="email" required /></div>
      </div>
      <div class="grid grid-3">
        <div class="form-group"><label>Employee ID</label><input type="text" class="form-input" [(ngModel)]="teacher.employeeId" name="eid" /></div>
        <div class="form-group"><label>Phone</label><input type="tel" class="form-input" [(ngModel)]="teacher.phone" name="phone" /></div>
        <div class="form-group">
          <label>Gender</label>
          <select class="form-select" [(ngModel)]="teacher.gender" name="gender">
            <option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
          </select>
        </div>
      </div>
      <div class="grid grid-3">
        <div class="form-group"><label>Date of Birth</label><input type="date" class="form-input" [(ngModel)]="teacher.dateOfBirth" name="dob" /></div>
        <div class="form-group"><label>Joining Date</label><input type="date" class="form-input" [(ngModel)]="teacher.joiningDate" name="jd" /></div>
        <div class="form-group"><label>Designation</label><input type="text" class="form-input" [(ngModel)]="teacher.designation" name="desig" placeholder="e.g. Senior Teacher" /></div>
      </div>
      <div class="grid grid-2">
        <div class="form-group">
          <label>Role *</label>
          <select class="form-select" [(ngModel)]="teacher.roleCode" name="roleCode" required>
            <option value="">Select Role</option>
            @for (role of roles(); track role._id) {
              <option [value]="role.code">{{ role.name }}</option>
            }
          </select>
          <small class="text-muted">Determines what permissions this teacher will have</small>
        </div>
        <div class="form-group">
          <label>Qualification</label>
          <input type="text" class="form-input" [(ngModel)]="teacher.qualification" name="qual" placeholder="e.g. M.Ed, B.Sc" />
        </div>
      </div>
      <div class="form-group">
        <label>Address</label>
        <input type="text" class="form-input" [(ngModel)]="teacher.address" name="addr" />
      </div>
      <div class="form-actions">
        <a routerLink="/teachers" class="btn btn-secondary">Cancel</a>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ isEdit() ? 'Update' : 'Create' }}</button>
      </div>
    </form>
  `,
  styles: [`
    .section-title { font-size: var(--text-lg); font-weight: 600; margin-top: var(--space-6); margin-bottom: var(--space-4); padding-top: var(--space-4); border-top: 1px solid var(--border); }
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); padding-top: var(--space-4); border-top: 1px solid var(--border); }
  `]
})
export class TeacherFormComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  isEdit = signal(false);
  saving = signal(false);
  roles = signal<Role[]>([]);
  teacher: any = { roleCode: '' };

  private teacherId = '';

  ngOnInit(): void {
    this.loadRoles();
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.isEdit.set(true);
      this.teacherId = id;
      this.api.get(`/teachers/${id}`).subscribe({
        next: (res: any) => {
          const t = res.data || res;
          this.teacher = {
            firstName: t.firstName || '',
            lastName: t.lastName || '',
            email: t.email || '',
            employeeId: t.employeeId || '',
            phone: t.phone || '',
            gender: t.gender || '',
            dateOfBirth: t.dateOfBirth ? t.dateOfBirth.substring(0, 10) : '',
            joiningDate: t.joiningDate ? t.joiningDate.substring(0, 10) : '',
            designation: t.designation || '',
            roleCode: t.roleCode || t.role?.code || '',
            qualification: t.qualification || '',
            address: t.address || '',
          };
        }
      });
    }
  }

  loadRoles(): void {
    this.api.get<any>('/roles').subscribe({
      next: (res) => {
        const raw = res.data?.data || res.data?.items || res.data || [];
        const allRoles = Array.isArray(raw) ? raw : [];
        const teacherRoles = allRoles.filter((r: Role) => 
          ['class_teacher', 'subject_teacher', 'accountant', 'librarian'].includes(r.code) || 
          (!r.code.startsWith('school_admin') && r.code !== 'principal' && r.code !== 'parent' && r.code !== 'student')
        );
        this.roles.set(teacherRoles);
      },
      error: (err) => console.error('Failed to load roles:', err)
    });
  }

  onSubmit(): void {
    this.saving.set(true);
    const payload: any = {
      firstName: this.teacher.firstName,
      lastName: this.teacher.lastName,
      email: this.teacher.email,
      roleCode: this.teacher.roleCode,
    };
    if (this.teacher.employeeId) payload.employeeId = this.teacher.employeeId;
    if (this.teacher.phone) payload.phone = this.teacher.phone;
    if (this.teacher.gender) payload.gender = this.teacher.gender;
    if (this.teacher.dateOfBirth) payload.dateOfBirth = this.teacher.dateOfBirth;
    if (this.teacher.joiningDate) payload.joiningDate = this.teacher.joiningDate;
    if (this.teacher.designation) payload.designation = this.teacher.designation;
    if (this.teacher.qualification) payload.qualification = this.teacher.qualification;
    if (this.teacher.address) payload.address = this.teacher.address;

    const obs = this.isEdit() ? this.api.patch(`/teachers/${this.teacherId}`, payload) : this.api.post('/teachers', payload);
    obs.subscribe({
      next: () => { this.toast.success(this.isEdit() ? 'Updated' : 'Created'); this.router.navigate(['/teachers']); },
      error: (err) => { this.saving.set(false); this.toast.error(err?.error?.message?.join?.(', ') || err?.error?.message || 'Failed to save'); }
    });
  }
}
