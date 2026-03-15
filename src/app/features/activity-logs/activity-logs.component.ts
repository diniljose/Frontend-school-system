import { Component, inject, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

interface ActivityLog {
  _id: string;
  action: string;
  resource: string;
  resourceId?: string;
  description?: string;
  previousData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
  user?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
    profileImage?: string;
  };
  icon?: string;
  title?: string;
  createdAt: string;
}

interface GroupedActivities {
  date: string;
  label: string;
  activities: ActivityLog[];
}

interface FilterOptions {
  resources: string[];
  actions: string[];
  users: { _id: string; name: string; email: string; role: string }[];
  canViewAllUsers: boolean;
  canExport: boolean;
}

interface Stats {
  total: number;
  byAction: { action: string; count: number }[];
  byResource: { resource: string; count: number }[];
  hourlyDistribution: { hour: number; count: number }[];
  topUsers: { user: any; activityCount: number }[];
}

@Component({
  selector: 'app-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>📋 Activity Logs</h1>
        <p>Track and monitor all system activities</p>
      </div>
      <div class="header-actions">
        @if (filterOptions()?.canExport) {
          <button class="btn btn-secondary" (click)="exportLogs()" [disabled]="exporting()">
            <span class="material-icons">download</span>
            {{ exporting() ? 'Exporting...' : 'Export' }}
          </button>
        }
        <button class="btn btn-ghost" (click)="toggleStats()">
          <span class="material-icons">{{ showStats() ? 'close' : 'analytics' }}</span>
          {{ showStats() ? 'Hide Stats' : 'View Stats' }}
        </button>
      </div>
    </div>

    <!-- Stats Panel -->
    @if (showStats() && stats()) {
      <div class="stats-panel">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon total"><span class="material-icons">history</span></div>
            <div class="stat-info">
              <span class="stat-value">{{ stats()?.total || 0 }}</span>
              <span class="stat-label">Total Activities</span>
            </div>
          </div>
          @for (item of stats()?.byAction?.slice(0, 4); track item.action) {
            <div class="stat-card">
              <div class="stat-icon" [class]="'action-' + item.action">
                <span class="material-icons">{{ getActionIcon(item.action) }}</span>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ item.count }}</span>
                <span class="stat-label">{{ formatActionLabel(item.action) }}</span>
              </div>
            </div>
          }
        </div>

        @if (stats()?.topUsers?.length) {
          <div class="top-users card">
            <h3>Top Active Users</h3>
            <div class="users-list">
              @for (item of stats()?.topUsers; track item.user._id) {
                <div class="user-item">
                  <div class="user-avatar" [style.background]="getAvatarColor(item.user.email)">
                    {{ getInitials(item.user) }}
                  </div>
                  <div class="user-info">
                    <span class="user-name">{{ item.user.firstName }} {{ item.user.lastName }}</span>
                    <span class="user-role badge">{{ item.user.role }}</span>
                  </div>
                  <span class="user-count">{{ item.activityCount }} actions</span>
                </div>
              }
            </div>
          </div>
        }
      </div>
    }

    <!-- Filters -->
    <div class="card filter-bar">
      <div class="filter-group">
        <div class="filter-item">
          <label>Action</label>
          <select class="form-select" [(ngModel)]="filters.action" (change)="loadActivities()">
            <option value="">All Actions</option>
            @for (action of filterOptions()?.actions || []; track action) {
              <option [value]="action">{{ formatActionLabel(action) }}</option>
            }
          </select>
        </div>
        <div class="filter-item">
          <label>Resource</label>
          <select class="form-select" [(ngModel)]="filters.resource" (change)="loadActivities()">
            <option value="">All Resources</option>
            @for (resource of filterOptions()?.resources || []; track resource) {
              <option [value]="resource">{{ resource }}</option>
            }
          </select>
        </div>
        @if (filterOptions()?.canViewAllUsers) {
          <div class="filter-item">
            <label>User</label>
            <select class="form-select" [(ngModel)]="filters.userId" (change)="loadActivities()">
              <option value="">All Users</option>
              @for (user of filterOptions()?.users || []; track user._id) {
                <option [value]="user._id">{{ user.name || user.email }}</option>
              }
            </select>
          </div>
        }
        <div class="filter-item">
          <label>From</label>
          <input type="date" class="form-input" [(ngModel)]="filters.fromDate" (change)="loadActivities()" />
        </div>
        <div class="filter-item">
          <label>To</label>
          <input type="date" class="form-input" [(ngModel)]="filters.toDate" (change)="loadActivities()" />
        </div>
        <div class="filter-item filter-search">
          <label>Search</label>
          <input type="text" class="form-input" [ngModel]="filters.search"
                 (ngModelChange)="onSearchChange($event)"
                 placeholder="Search activities..." />
        </div>
        <button class="btn btn-ghost" (click)="clearFilters()">
          <span class="material-icons">clear</span>
        </button>
      </div>
    </div>

    <!-- Timeline -->
    <div class="activities-container">
      @if (loading()) {
        <div class="timeline-skeleton">
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-group">
              <div class="skeleton-date"></div>
              @for (j of [1,2,3]; track j) {
                <div class="skeleton-item"></div>
              }
            </div>
          }
        </div>
      } @else if (groupedActivities().length) {
        <div class="timeline">
          @for (group of groupedActivities(); track group.date) {
            <div class="timeline-group">
              <div class="timeline-date">
                <span class="date-label">{{ group.label }}</span>
                <span class="date-count">{{ group.activities.length }} activities</span>
              </div>
              <div class="timeline-items">
                @for (activity of group.activities; track activity._id) {
                  <div class="timeline-item" (click)="viewActivityDetail(activity)">
                    <div class="timeline-icon" [class]="'action-' + activity.action">
                      <span class="material-icons">{{ activity.icon || getActionIcon(activity.action) }}</span>
                    </div>
                    <div class="timeline-content">
                      <div class="timeline-header">
                        <span class="timeline-title">{{ activity.title || getActivityTitle(activity) }}</span>
                        <span class="timeline-time">{{ formatTime(activity.createdAt) }}</span>
                      </div>
                      <p class="timeline-description">{{ activity.description || generateDescription(activity) }}</p>
                      <div class="timeline-meta">
                        @if (activity.user) {
                          <div class="meta-user">
                            <div class="user-avatar-sm" [style.background]="getAvatarColor(activity.user.email)">
                              {{ getInitials(activity.user) }}
                            </div>
                            <span>{{ activity.user.firstName || '' }} {{ activity.user.lastName || activity.user.email }}</span>
                          </div>
                        }
                        <span class="meta-resource badge">{{ activity.resource }}</span>
                      </div>
                    </div>
                    <button class="expand-btn btn btn-ghost btn-sm">
                      <span class="material-icons">chevron_right</span>
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (meta().totalPages > 1) {
          <div class="pagination">
            <button class="btn btn-ghost" [disabled]="meta().page <= 1" (click)="goToPage(meta().page - 1)">
              <span class="material-icons">chevron_left</span>
            </button>
            <span class="page-info">Page {{ meta().page }} of {{ meta().totalPages }}</span>
            <button class="btn btn-ghost" [disabled]="!meta().hasMore" (click)="goToPage(meta().page + 1)">
              <span class="material-icons">chevron_right</span>
            </button>
          </div>
        }
      } @else {
        <div class="empty-state card">
          <div class="empty-icon"><span class="material-icons">history</span></div>
          <h3>No Activities Found</h3>
          <p>No activity logs match your current filters</p>
          <button class="btn btn-primary" (click)="clearFilters()">Clear Filters</button>
        </div>
      }
    </div>

    <!-- Activity Detail Modal -->
    @if (selectedActivity()) {
      <div class="modal-overlay" (click)="closeDetailModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>
              <span class="material-icons" [class]="'action-icon action-' + selectedActivity()?.action">
                {{ getActionIcon(selectedActivity()?.action || '') }}
              </span>
              Activity Details
            </h2>
            <button class="close-btn" (click)="closeDetailModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-item">
                <label>Action</label>
                <span class="badge" [class]="'action-' + selectedActivity()?.action">
                  {{ formatActionLabel(selectedActivity()?.action || '') }}
                </span>
              </div>
              <div class="detail-item">
                <label>Resource</label>
                <span class="badge">{{ selectedActivity()?.resource }}</span>
              </div>
              <div class="detail-item">
                <label>Resource ID</label>
                <code>{{ selectedActivity()?.resourceId || 'N/A' }}</code>
              </div>
              <div class="detail-item">
                <label>Timestamp</label>
                <span>{{ formatDateTime(selectedActivity()?.createdAt || '') }}</span>
              </div>
              @if (selectedActivity()?.user) {
                <div class="detail-item full-width">
                  <label>Performed By</label>
                  <div class="user-detail">
                    <div class="user-avatar" [style.background]="getAvatarColor(selectedActivity()?.user?.email || '')">
                      {{ getInitials(selectedActivity()?.user) }}
                    </div>
                    <div>
                      <strong>{{ selectedActivity()?.user?.firstName }} {{ selectedActivity()?.user?.lastName }}</strong>
                      <span class="text-muted">{{ selectedActivity()?.user?.email }}</span>
                      <span class="badge">{{ selectedActivity()?.user?.role }}</span>
                    </div>
                  </div>
                </div>
              }
              <div class="detail-item full-width">
                <label>Description</label>
                <p>{{ selectedActivity()?.description || generateDescription(selectedActivity()!) }}</p>
              </div>
              @if (selectedActivity()?.ipAddress) {
                <div class="detail-item">
                  <label>IP Address</label>
                  <code>{{ selectedActivity()?.ipAddress }}</code>
                </div>
              }
              @if (selectedActivity()?.userAgent) {
                <div class="detail-item full-width">
                  <label>User Agent</label>
                  <code class="text-sm">{{ selectedActivity()?.userAgent }}</code>
                </div>
              }
            </div>

            <!-- Data Changes -->
            @if (selectedActivity()?.previousData || selectedActivity()?.newData) {
              <div class="data-changes">
                <h4>Data Changes</h4>
                <div class="changes-grid">
                  @if (selectedActivity()?.previousData) {
                    <div class="change-panel previous">
                      <span class="panel-label">Before</span>
                      <pre>{{ selectedActivity()?.previousData | json }}</pre>
                    </div>
                  }
                  @if (selectedActivity()?.newData) {
                    <div class="change-panel new">
                      <span class="panel-label">After</span>
                      <pre>{{ selectedActivity()?.newData | json }}</pre>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }
    .page-header h1 { margin: 0 0 0.25rem; font-size: 1.75rem; }
    .page-header p { margin: 0; color: var(--text-secondary); }
    .header-actions { display: flex; gap: 0.5rem; }
    .header-actions .btn { display: flex; align-items: center; gap: 0.5rem; }

    /* Stats Panel */
    .stats-panel {
      margin-bottom: 1.5rem;
      animation: slideDown 0.3s ease;
    }
    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--primary-light);
      color: var(--primary);
    }
    .stat-icon.total { background: #e0e7ff; color: #4f46e5; }
    .stat-icon.action-create { background: #d1fae5; color: #059669; }
    .stat-icon.action-update { background: #fef3c7; color: #d97706; }
    .stat-icon.action-delete { background: #fee2e2; color: #dc2626; }
    .stat-icon.action-login { background: #dbeafe; color: #2563eb; }
    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.5rem; font-weight: 700; color: var(--text-primary); }
    .stat-label { font-size: 0.875rem; color: var(--text-secondary); }

    .top-users { padding: 1rem; }
    .top-users h3 { margin: 0 0 1rem; font-size: 1rem; }
    .users-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .user-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: 8px;
      background: var(--bg-secondary);
    }
    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: white;
      font-size: 0.875rem;
    }
    .user-avatar-sm {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: white;
      font-size: 0.625rem;
    }
    .user-info { flex: 1; display: flex; flex-direction: column; }
    .user-name { font-weight: 500; }
    .user-role { font-size: 0.75rem; }
    .user-count { font-size: 0.875rem; color: var(--text-secondary); }

    /* Filter Bar */
    .filter-bar { margin-bottom: 1.5rem; padding: 1rem; }
    .filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: flex-end;
    }
    .filter-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .filter-item label { font-size: 0.75rem; color: var(--text-secondary); font-weight: 500; }
    .filter-item .form-select, .filter-item .form-input {
      min-width: 150px;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-primary);
      color: var(--text-primary);
    }
    .filter-search { flex: 1; min-width: 200px; }
    .filter-search .form-input { width: 100%; }

    /* Timeline */
    .activities-container { position: relative; }
    .timeline { display: flex; flex-direction: column; gap: 2rem; }
    .timeline-group { position: relative; }
    .timeline-date {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
    }
    .date-label {
      font-weight: 600;
      font-size: 1rem;
      color: var(--text-primary);
    }
    .date-count {
      font-size: 0.75rem;
      color: var(--text-secondary);
      padding: 0.125rem 0.5rem;
      background: var(--bg-secondary);
      border-radius: 999px;
    }
    .timeline-items {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-left: 1rem;
      border-left: 2px solid var(--border-color);
    }
    .timeline-item {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-left: -1.5rem;
    }
    .timeline-item:hover {
      border-color: var(--primary);
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .timeline-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      background: var(--bg-secondary, #f3f4f6);
      color: var(--text-secondary, #6b7280);
    }
    .timeline-icon .material-icons { font-size: 1.25rem; }
    .timeline-icon.action-create,
    .timeline-icon.action-CREATE { background: var(--success-bg, rgba(34, 197, 94, 0.15)); color: var(--success, #16a34a); }
    .timeline-icon.action-update,
    .timeline-icon.action-UPDATE { background: var(--warning-bg, rgba(245, 158, 11, 0.15)); color: var(--warning, #d97706); }
    .timeline-icon.action-delete,
    .timeline-icon.action-DELETE { background: var(--danger-bg, rgba(239, 68, 68, 0.15)); color: var(--danger, #dc2626); }
    .timeline-icon.action-login,
    .timeline-icon.action-LOGIN,
    .timeline-icon.action-read,
    .timeline-icon.action-READ { background: var(--info-bg, rgba(59, 130, 246, 0.15)); color: var(--info, #2563eb); }
    .timeline-icon.action-logout,
    .timeline-icon.action-LOGOUT { background: var(--bg-muted, rgba(0,0,0,0.05)); color: var(--text-secondary, #6b7280); }
    .timeline-icon.action-fee_payment { background: var(--success-bg, rgba(34, 197, 94, 0.15)); color: var(--success, #16a34a); }
    .timeline-icon.action-attendance_mark { background: rgba(124, 58, 237, 0.15); color: #7c3aed; }
    .timeline-icon.action-result_publish { background: rgba(219, 39, 119, 0.15); color: #db2777; }
    .timeline-content { flex: 1; min-width: 0; }
    .timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem; }
    .timeline-title { font-weight: 600; color: var(--text-primary); }
    .timeline-time { font-size: 0.75rem; color: var(--text-secondary); }
    .timeline-description {
      margin: 0 0 0.5rem;
      font-size: 0.875rem;
      color: var(--text-secondary);
      line-height: 1.4;
    }
    .timeline-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .meta-user {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-secondary);
    }
    .meta-resource { font-size: 0.625rem; padding: 0.125rem 0.375rem; }
    .expand-btn { opacity: 0; transition: opacity 0.2s; }
    .timeline-item:hover .expand-btn { opacity: 1; }

    /* Skeleton Loading */
    .timeline-skeleton { display: flex; flex-direction: column; gap: 2rem; }
    .skeleton-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .skeleton-date {
      width: 120px;
      height: 24px;
      background: var(--bg-secondary);
      border-radius: 6px;
      animation: pulse 1.5s ease-in-out infinite;
    }
    .skeleton-item {
      height: 80px;
      background: var(--bg-secondary);
      border-radius: 12px;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
      padding: 1rem;
    }
    .page-info { font-size: 0.875rem; color: var(--text-secondary); }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
    }
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; }
    .empty-icon .material-icons { font-size: 4rem; color: var(--text-secondary); }
    .empty-state h3 { margin: 0 0 0.5rem; }
    .empty-state p { color: var(--text-secondary); margin-bottom: 1.5rem; }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .modal-content {
      background: var(--bg-surface, var(--card-bg, #fff));
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 16px;
      width: 90%;
      max-width: 700px;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      color: var(--text-primary, #1f2937);
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--border-color, #e5e7eb);
      background: var(--bg-muted, rgba(0,0,0,0.02));
    }
    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--text-primary, #1f2937);
    }
    .action-icon { font-size: 1.25rem; }
    .close-btn {
      background: var(--bg-secondary, #f3f4f6);
      border: 1px solid var(--border-color, #e5e7eb);
      font-size: 1rem;
      cursor: pointer;
      color: var(--text-secondary, #6b7280);
      padding: 0.5rem;
      border-radius: 8px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    .close-btn:hover { 
      background: var(--danger-bg, #fee2e2);
      color: var(--danger, #dc2626);
      border-color: var(--danger, #dc2626);
    }
    .modal-body { 
      padding: 1.5rem;
      background: var(--bg-surface, var(--card-bg, #fff));
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .detail-item { 
      display: flex; 
      flex-direction: column; 
      gap: 0.5rem;
      padding: 0.75rem;
      background: var(--bg-muted, rgba(0,0,0,0.02));
      border-radius: 8px;
      border: 1px solid var(--border-color, #e5e7eb);
    }
    .detail-item.full-width { grid-column: span 2; }
    .detail-item label { 
      font-size: 0.7rem; 
      color: var(--text-secondary, #6b7280); 
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .detail-item span,
    .detail-item p {
      color: var(--text-primary, #1f2937);
      margin: 0;
    }
    .detail-item code {
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      font-size: 0.8rem;
      padding: 0.375rem 0.625rem;
      background: var(--bg-secondary, #f3f4f6);
      color: var(--text-primary, #1f2937);
      border-radius: 6px;
      border: 1px solid var(--border-color, #e5e7eb);
    }
    .user-detail {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--bg-secondary, #f3f4f6);
      border-radius: 10px;
      border: 1px solid var(--border-color, #e5e7eb);
    }
    .user-detail > div { display: flex; flex-direction: column; gap: 0.25rem; }
    .user-detail strong { color: var(--text-primary, #1f2937); }
    .text-muted { font-size: 0.75rem; color: var(--text-secondary, #6b7280); }
    .text-sm { font-size: 0.75rem; word-break: break-all; color: var(--text-secondary, #6b7280); }

    /* Data Changes */
    .data-changes { 
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color, #e5e7eb);
    }
    .data-changes h4 { 
      margin: 0 0 1rem; 
      font-size: 0.875rem;
      color: var(--text-primary, #1f2937);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .data-changes h4::before {
      content: '📝';
    }
    .changes-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .change-panel {
      position: relative;
      border-radius: 10px;
      overflow: hidden;
      border: 1px solid var(--border-color, #e5e7eb);
    }
    .panel-label {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      font-size: 0.625rem;
      padding: 0.25rem 0.5rem;
      border-radius: 6px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .change-panel.previous { 
      background: var(--danger-bg, rgba(239, 68, 68, 0.1));
    }
    .change-panel.previous .panel-label { 
      background: var(--danger, #dc2626); 
      color: #fff;
    }
    .change-panel.new { 
      background: var(--success-bg, rgba(34, 197, 94, 0.1));
    }
    .change-panel.new .panel-label { 
      background: var(--success, #16a34a); 
      color: #fff;
    }
    .change-panel pre {
      margin: 0;
      padding: 2rem 1rem 1rem;
      font-size: 0.75rem;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
      overflow-x: auto;
      max-height: 250px;
      color: var(--text-primary, #1f2937);
      background: transparent;
      line-height: 1.5;
    }

    /* Badge */
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.625rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      background: var(--bg-secondary, #f3f4f6);
      color: var(--text-secondary, #6b7280);
      border: 1px solid var(--border-color, #e5e7eb);
    }
    .badge.action-create,
    .badge.action-CREATE { 
      background: var(--success-bg, rgba(34, 197, 94, 0.15)); 
      color: var(--success, #16a34a);
      border-color: var(--success, #16a34a);
    }
    .badge.action-update,
    .badge.action-UPDATE { 
      background: var(--warning-bg, rgba(245, 158, 11, 0.15)); 
      color: var(--warning, #d97706);
      border-color: var(--warning, #d97706);
    }
    .badge.action-delete,
    .badge.action-DELETE { 
      background: var(--danger-bg, rgba(239, 68, 68, 0.15)); 
      color: var(--danger, #dc2626);
      border-color: var(--danger, #dc2626);
    }
    .badge.action-login,
    .badge.action-LOGIN,
    .badge.action-read,
    .badge.action-READ { 
      background: var(--info-bg, rgba(59, 130, 246, 0.15)); 
      color: var(--info, #2563eb);
      border-color: var(--info, #2563eb);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .page-header { flex-direction: column; gap: 1rem; }
      .filter-group { flex-direction: column; }
      .filter-item { width: 100%; }
      .filter-item .form-select, .filter-item .form-input { width: 100%; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .detail-grid { grid-template-columns: 1fr; }
      .detail-item.full-width { grid-column: span 1; }
      .changes-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class ActivityLogsComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  
  private destroy$ = new Subject<void>();
  private searchSubject$ = new Subject<string>();

  loading = signal(true);
  exporting = signal(false);
  showStats = signal(false);
  
  groupedActivities = signal<GroupedActivities[]>([]);
  stats = signal<Stats | null>(null);
  filterOptions = signal<FilterOptions | null>(null);
  selectedActivity = signal<ActivityLog | null>(null);
  
  meta = signal({ page: 1, limit: 20, total: 0, totalPages: 0, hasMore: false });
  
  filters = {
    action: '',
    resource: '',
    userId: '',
    fromDate: '',
    toDate: '',
    search: ''
  };

  ngOnInit() {
    // Configure debounced search
    this.searchSubject$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.meta.update(m => ({ ...m, page: 1 }));
      this.loadActivities();
    });
    
    this.loadFilterOptions();
    this.loadActivities();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  onSearchChange(value: string) {
    this.filters.search = value;
    this.searchSubject$.next(value);
  }

  loadFilterOptions() {
    this.api.get<any>('activity-logs/filter-options').subscribe({
      next: (res) => {
        const data = res.data?.data || res.data;
        if (data) {
          this.filterOptions.set(data);
        }
      }
    });
  }

  loadActivities() {
    this.loading.set(true);
    
    const params: any = {
      page: this.meta().page,
      limit: this.meta().limit,
      groupByDate: true
    };
    
    if (this.filters.action) params.action = this.filters.action;
    if (this.filters.resource) params.resource = this.filters.resource;
    if (this.filters.userId) params.userId = this.filters.userId;
    if (this.filters.fromDate) params.fromDate = this.filters.fromDate;
    if (this.filters.toDate) params.toDate = this.filters.toDate;
    if (this.filters.search) params.search = this.filters.search;
    
    this.api.get<any>('activity-logs', params).subscribe({
      next: (res) => {
        const responseData = res.data?.data || res.data;
        const meta = res.data?.meta || responseData?.meta;
        this.groupedActivities.set(responseData || []);
        if (meta) {
          this.meta.set({ ...this.meta(), ...meta });
        }
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load activity logs');
        this.loading.set(false);
      }
    });
  }

  loadStats() {
    const params: any = {};
    if (this.filters.fromDate) params.fromDate = this.filters.fromDate;
    if (this.filters.toDate) params.toDate = this.filters.toDate;
    
    this.api.get<any>('activity-logs/stats', params).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data;
        if (data) {
          this.stats.set(data);
        }
      }
    });
  }

  toggleStats() {
    this.showStats.update(v => !v);
    if (this.showStats() && !this.stats()) {
      this.loadStats();
    }
  }

  clearFilters() {
    this.filters = {
      action: '',
      resource: '',
      userId: '',
      fromDate: '',
      toDate: '',
      search: ''
    };
    this.meta.update(m => ({ ...m, page: 1 }));
    this.loadActivities();
  }

  goToPage(page: number) {
    this.meta.update(m => ({ ...m, page }));
    this.loadActivities();
  }

  viewActivityDetail(activity: ActivityLog) {
    this.selectedActivity.set(activity);
  }

  closeDetailModal() {
    this.selectedActivity.set(null);
  }

  exportLogs() {
    this.exporting.set(true);
    // TODO: Implement export functionality
    setTimeout(() => {
      this.toast.info('Export feature coming soon');
      this.exporting.set(false);
    }, 1000);
  }

  // Helper methods
  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      'create': 'add_circle',
      'update': 'edit',
      'delete': 'delete',
      'login': 'login',
      'logout': 'logout',
      'password_change': 'lock',
      'password_reset': 'lock_reset',
      'role_change': 'admin_panel_settings',
      'permission_change': 'security',
      'fee_payment': 'payments',
      'attendance_mark': 'fact_check',
      'result_publish': 'grade',
      'promotion': 'moving',
      'transfer': 'swap_horiz',
      'notification_send': 'notifications',
      'settings_change': 'settings',
      'export': 'download',
      'bulk_operation': 'dynamic_feed'
    };
    return icons[action] || 'history';
  }

  formatActionLabel(action: string): string {
    return action.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  getActivityTitle(activity: ActivityLog): string {
    const action = this.formatActionLabel(activity.action);
    return `${activity.resource} ${action}`;
  }

  generateDescription(activity: ActivityLog): string {
    if (activity.description) return activity.description;
    const userName = activity.user 
      ? `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim() || activity.user.email
      : 'Someone';
    const verb = activity.action.replace('_', ' ');
    return `${userName} ${verb} ${activity.resource.toLowerCase()}`;
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  formatDateTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getAvatarColor(email: string): string {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4'];
    let hash = 0;
    for (let i = 0; i < (email || '').length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  getInitials(user: any): string {
    if (!user) return '?';
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    if (first || last) return (first + last).toUpperCase();
    return (user.email?.charAt(0) || '?').toUpperCase();
  }
}
