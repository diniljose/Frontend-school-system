import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { Student } from '../../core/models';

@Component({
  selector: 'app-student-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>Student Profile</h1>
        <p>Detailed information about the student</p>
      </div>
      <div class="header-actions">
        <a routerLink="/students" class="btn btn-secondary">← Back</a>
        @if (student()) {
          <a [routerLink]="['/students', student()!._id, 'edit']" class="btn btn-primary">Edit</a>
        }
      </div>
    </div>

    @if (loading()) {
      <div class="skeleton" style="height:400px"></div>
    } @else if (student()) {
      <div class="profile-grid">
        <div class="card profile-card">
          <div class="profile-header">
            <div class="avatar-lg">{{ student()!.firstName?.charAt(0) }}{{ student()!.lastName?.charAt(0) }}</div>
            <h2>{{ student()!.firstName }} {{ student()!.lastName }}</h2>
            <p class="profile-subtitle">Roll: {{ student()!.rollNumber }}</p>
            <span class="badge" [class]="student()!.status === 'active' ? 'badge-success' : 'badge-warning'">{{ student()!.status }}</span>
          </div>
          <div class="profile-info">
            <div class="info-row"><span class="label">Email</span><span>{{ student()!.email || '—' }}</span></div>
            <div class="info-row"><span class="label">Phone</span><span>{{ student()!.contact?.phone || '—' }}</span></div>
            <div class="info-row"><span class="label">Gender</span><span>{{ student()!.gender }}</span></div>
            <div class="info-row"><span class="label">Date of Birth</span><span>{{ student()!.dateOfBirth | date:'mediumDate' }}</span></div>
            <div class="info-row"><span class="label">Admission No.</span><span>{{ student()!.admissionNumber || '—' }}</span></div>
            <div class="info-row"><span class="label">Address</span><span>{{ student()!.contact?.address || '—' }}</span></div>
          </div>
        </div>

        <div class="detail-tabs">
          <div class="tab-bar">
            @for (tab of tabs; track tab.key) {
              <button class="tab-btn" [class.active]="activeTab() === tab.key" (click)="activeTab.set(tab.key)">{{ tab.label }}</button>
            }
          </div>

          @switch (activeTab()) {
            @case ('attendance') {
              <div class="card tab-content animate-in">
                <h3>Attendance Summary</h3>
                <div class="grid grid-3">
                  <div class="stat-card mini"><div class="stat-value" style="color:#22c55e">92%</div><div class="stat-label">Present</div></div>
                  <div class="stat-card mini"><div class="stat-value" style="color:#ef4444">5%</div><div class="stat-label">Absent</div></div>
                  <div class="stat-card mini"><div class="stat-value" style="color:#f59e0b">3%</div><div class="stat-label">Late</div></div>
                </div>
              </div>
            }
            @case ('results') {
              <div class="card tab-content animate-in">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4)">
                  <h3>Exam Results</h3>
                  <a [routerLink]="['/results/report-card', student()!._id]" class="btn btn-primary btn-sm">📄 Report Card</a>
                </div>
                <table class="data-table">
                  <thead><tr><th>Exam</th><th>Subject</th><th>Marks</th><th>Grade</th></tr></thead>
                  <tbody>
                    <tr><td>Midterm 2024</td><td>Mathematics</td><td>85/100</td><td><span class="badge badge-success">A</span></td></tr>
                    <tr><td>Midterm 2024</td><td>Science</td><td>78/100</td><td><span class="badge badge-info">B+</span></td></tr>
                    <tr><td>Midterm 2024</td><td>English</td><td>92/100</td><td><span class="badge badge-success">A+</span></td></tr>
                  </tbody>
                </table>
              </div>
            }
            @case ('fees') {
              <div class="card tab-content animate-in">
                <h3>Fee Records</h3>
                <table class="data-table">
                  <thead><tr><th>Fee Type</th><th>Amount</th><th>Due Date</th><th>Status</th></tr></thead>
                  <tbody>
                    <tr><td>Tuition Fee</td><td>$1,500</td><td>Jan 15, 2024</td><td><span class="badge badge-success">Paid</span></td></tr>
                    <tr><td>Transport Fee</td><td>$200</td><td>Jan 15, 2024</td><td><span class="badge badge-warning">Pending</span></td></tr>
                  </tbody>
                </table>
              </div>
            }
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .header-actions { display: flex; gap: var(--space-3); }
    .profile-grid { display: grid; grid-template-columns: 320px 1fr; gap: var(--space-6); }
    @media (max-width: 900px) { .profile-grid { grid-template-columns: 1fr; } }
    .profile-card { text-align: center; }
    .profile-header { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); margin-bottom: var(--space-6); }
    .avatar-lg {
      width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      background: var(--primary); color: white; font-size: var(--text-2xl); font-weight: 700;
    }
    .profile-subtitle { color: var(--text-secondary); font-size: var(--text-sm); }
    .profile-info { text-align: left; }
    .info-row { display: flex; justify-content: space-between; padding: var(--space-3) 0; border-bottom: 1px solid var(--border); font-size: var(--text-sm); }
    .info-row:last-child { border-bottom: none; }
    .info-row .label { color: var(--text-tertiary); }
    .tab-bar { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); border-bottom: 1px solid var(--border); }
    .tab-btn {
      padding: var(--space-2) var(--space-4); background: none; border: none; border-bottom: 2px solid transparent;
      cursor: pointer; font-size: var(--text-sm); font-weight: 500; color: var(--text-secondary); transition: var(--transition-fast);
    }
    .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }
    .tab-content h3 { margin-bottom: var(--space-4); }
    .stat-card.mini { padding: var(--space-4); text-align: center; }
  `]
})
export class StudentDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  loading = signal(true);
  student = signal<Student | null>(null);
  activeTab = signal('attendance');

  tabs = [
    { key: 'attendance', label: '📋 Attendance' },
    { key: 'results', label: '📝 Results' },
    { key: 'fees', label: '💰 Fees' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.api.get<Student>(`/students/${id}`).subscribe({
      next: (res) => { this.student.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
