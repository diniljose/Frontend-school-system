import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { Notification } from '../../core/models';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>{{ 'nav.notifications' | translate }}</h1><p>Send and manage notifications</p></div>
      <button class="btn btn-primary" (click)="openCreateModal()">+ New Notification</button>
    </div>

    <div class="card">
      @if (loading()) {
        @for (i of [1,2,3]; track i) { <div class="skeleton" style="height:72px;margin-bottom:8px"></div> }
      } @else {
        <div class="notification-list">
          @for (n of notifications(); track n._id) {
            <div class="notification-item" [class.unread]="!n.isRead">
              <div class="notification-icon">
                {{ getTypeIcon(n.type) }}
              </div>
              <div class="notification-body">
                <div class="notification-header">
                  <h4>{{ n.title }}</h4>
                  <div class="notification-meta">
                    @if (n.priority) { <span class="badge" [class]="getPriorityClass(n.priority)">{{ n.priority }}</span> }
                    @if (n.type) { <span class="badge badge-info">{{ n.type }}</span> }
                  </div>
                </div>
                <p class="notification-message">{{ n.message }}</p>
                <span class="notification-time">{{ n.createdAt | date:'medium' }}</span>
              </div>
              <div class="notification-actions">
                <button class="btn btn-ghost btn-sm" style="color:var(--danger)" (click)="delete(n._id)">Delete</button>
              </div>
            </div>
          } @empty { <div class="empty-state">No notifications yet</div> }
        </div>
      }
    </div>

    <!-- Create Notification Modal -->
    @if (showCreateModal()) {
      <div class="modal-backdrop" (click)="closeCreateModal()">
        <div class="modal-content card" (click)="$event.stopPropagation()">
          <h2>Create Notification</h2>
          <form (ngSubmit)="submitNotification()">
            <div class="form-group">
              <label>Title *</label>
              <input type="text" class="form-input" [(ngModel)]="newNotification.title" name="title" required />
            </div>
            <div class="form-group">
              <label>Message *</label>
              <textarea class="form-input" [(ngModel)]="newNotification.message" name="message" rows="3" required></textarea>
            </div>
            <div class="grid grid-3">
              <div class="form-group">
                <label>Type</label>
                <select class="form-select" [(ngModel)]="newNotification.type" name="type">
                  <option value="">Select</option>
                  <option value="announcement">Announcement</option>
                  <option value="assignment">Assignment</option>
                  <option value="exam">Exam</option>
                  <option value="fee">Fee</option>
                  <option value="attendance">Attendance</option>
                  <option value="result">Result</option>
                  <option value="event">Event</option>
                  <option value="holiday">Holiday</option>
                  <option value="meeting">Meeting</option>
                  <option value="alert">Alert</option>
                  <option value="reminder">Reminder</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div class="form-group">
                <label>Priority</label>
                <select class="form-select" [(ngModel)]="newNotification.priority" name="priority">
                  <option value="">Select</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div class="form-group">
                <label>Recipients</label>
                <select class="form-select" [(ngModel)]="newNotification.recipientType" name="recipientType">
                  <option value="">All</option>
                  <option value="all">All</option>
                  <option value="students">Students</option>
                  <option value="teachers">Teachers</option>
                  <option value="parents">Parents</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Cancel</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                @if (saving()) { <span class="spinner"></span> }
                Send Notification
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .notification-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .notification-item { display: flex; gap: var(--space-3); padding: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius); transition: var(--transition-fast); }
    .notification-item:hover { border-color: var(--primary); }
    .notification-item.unread { background: var(--primary-bg); border-left: 3px solid var(--primary); }
    .notification-icon { font-size: 1.5rem; flex-shrink: 0; }
    .notification-body { flex: 1; min-width: 0; }
    .notification-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-2); margin-bottom: var(--space-1); }
    .notification-header h4 { margin: 0; font-size: var(--text-base); }
    .notification-meta { display: flex; gap: var(--space-1); flex-shrink: 0; }
    .notification-message { color: var(--text-secondary); font-size: var(--text-sm); margin: 0 0 var(--space-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .notification-time { font-size: var(--text-xs); color: var(--text-tertiary); }
    .notification-actions { flex-shrink: 0; }
    .empty-state { text-align: center; padding: var(--space-8); color: var(--text-tertiary); }
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { width: 90%; max-width: 600px; padding: var(--space-6); }
    .form-actions { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-4); }
    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class NotificationListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  notifications = signal<Notification[]>([]);
  showCreateModal = signal(false);
  saving = signal(false);
  newNotification: any = {};

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.get<any>('/notifications').subscribe({
      next: (res) => {
        this.notifications.set(res.data?.items || res.data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getTypeIcon(type?: string): string {
    const icons: Record<string, string> = {
      announcement: '📢', assignment: '📝', exam: '📋', fee: '💰',
      attendance: '✅', result: '📊', event: '🎉', holiday: '🏖️',
      meeting: '🤝', alert: '🚨', reminder: '⏰', general: '📩',
    };
    return icons[type || ''] || '📩';
  }

  getPriorityClass(priority?: string): string {
    switch (priority) {
      case 'urgent': return 'badge-danger';
      case 'high': return 'badge-warning';
      case 'medium': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  openCreateModal(): void {
    this.newNotification = { title: '', message: '', type: '', priority: '', recipientType: '' };
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void { this.showCreateModal.set(false); }

  submitNotification(): void {
    this.saving.set(true);
    const payload = { ...this.newNotification };
    // Remove empty optional fields
    if (!payload.type) delete payload.type;
    if (!payload.priority) delete payload.priority;
    if (!payload.recipientType) delete payload.recipientType;

    this.api.post('/notifications', payload).subscribe({
      next: () => {
        this.toast.success('Notification sent');
        this.closeCreateModal();
        this.saving.set(false);
        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message?.join?.(', ') || 'Failed to send notification');
      }
    });
  }

  delete(id: string): void {
    if (!confirm('Delete this notification?')) return;
    this.api.delete(`/notifications/${id}`).subscribe({ next: () => { this.toast.success('Deleted'); this.load(); } });
  }
}
