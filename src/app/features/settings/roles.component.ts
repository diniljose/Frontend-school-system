import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

interface Role {
  _id: string;
  name: string;
  code: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
  isActive: boolean;
}

interface PermissionModule {
  code: string;
  name: string;
  description: string;
  permissions: string[];
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div>
        <h1>🔐 Roles & Permissions</h1>
        <p>Create custom roles with granular access control for your school staff</p>
      </div>
      <button class="btn btn-primary" (click)="openAddModal()">
        <span class="btn-icon">+</span> Create Role
      </button>
    </div>

    <div class="card">
      @if (loading()) {
        <div class="loading-grid">
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-card">
              <div class="skeleton skeleton-header"></div>
              <div class="skeleton skeleton-text"></div>
              <div class="skeleton skeleton-pills"></div>
            </div>
          }
        </div>
      } @else {
        <div class="roles-grid">
          @for (role of roles(); track role._id) {
            <div class="role-card" [class.system]="role.isSystemRole" [class.inactive]="!role.isActive">
              <div class="role-card-header">
                <div class="role-icon" [style.background]="getRoleColor(role.code)">
                  {{ role.name.charAt(0).toUpperCase() }}
                </div>
                <div class="role-meta">
                  <h3>{{ role.name }}</h3>
                  <code class="role-code">{{ role.code }}</code>
                </div>
                @if (role.isSystemRole) {
                  <span class="badge badge-system">Built-in</span>
                }
              </div>

              @if (role.description) {
                <p class="role-desc">{{ role.description }}</p>
              }

              <div class="perm-summary">
                <div class="perm-stat">
                  <span class="perm-count">{{ role.permissions.length }}</span>
                  <span class="perm-label">permissions</span>
                </div>
                <div class="perm-stat">
                  <span class="perm-count">{{ getModuleCount(role.permissions) }}</span>
                  <span class="perm-label">modules</span>
                </div>
              </div>

              <div class="perm-pills">
                @for (module of getActiveModules(role.permissions).slice(0, 4); track module) {
                  <span class="perm-pill">{{ module }}</span>
                }
                @if (getActiveModules(role.permissions).length > 4) {
                  <span class="perm-pill perm-pill-more">+{{ getActiveModules(role.permissions).length - 4 }}</span>
                }
              </div>

              <div class="role-actions">
                <button class="btn btn-ghost btn-sm" (click)="viewRole(role)">
                  <span>👁️</span> View
                </button>
                <button class="btn btn-ghost btn-sm" (click)="editRole(role)">
                  <span>✏️</span> Edit
                </button>
                @if (!role.isSystemRole) {
                  <button class="btn btn-ghost btn-sm btn-danger" (click)="deleteRole(role._id)">
                    <span>🗑️</span> Delete
                  </button>
                }
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <div class="empty-icon">🎭</div>
              <h3>No Roles Defined</h3>
              <p>Get started by initializing the default roles for your school</p>
              <button class="btn btn-primary" (click)="initializeDefaults()">
                Initialize Default Roles
              </button>
            </div>
          }
        </div>
      }
    </div>

    <!-- Add/Edit Role Modal -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title-section">
              <h2>{{ modalMode() === 'view' ? 'View Role' : (editingRole() ? 'Edit Role' : 'Create New Role') }}</h2>
              <p>{{ modalMode() === 'view' ? 'Review role permissions' : 'Configure role name, code, and permissions' }}</p>
            </div>
            <button class="modal-close" (click)="closeModal()">×</button>
          </div>

          <div class="modal-body">
            @if (modalMode() !== 'view') {
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label required">Role Name</label>
                  <input type="text" class="form-input" [(ngModel)]="formData.name" placeholder="e.g. Senior Teacher" />
                </div>
                <div class="form-group">
                  <label class="form-label required">Role Code</label>
                  <input
                    type="text"
                    class="form-input"
                    [(ngModel)]="formData.code"
                    placeholder="e.g. senior_teacher"
                    [disabled]="editingRole()?.isSystemRole === true"
                  />
                  <small class="form-hint">Lowercase with underscores. Used for identification.</small>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea
                  class="form-input"
                  [(ngModel)]="formData.description"
                  rows="2"
                  placeholder="Brief description of this role's responsibilities"
                ></textarea>
              </div>
            } @else {
              <div class="view-header">
                <div class="view-icon" [style.background]="getRoleColor(editingRole()?.code || '')">
                  {{ editingRole()?.name?.charAt(0)?.toUpperCase() || 'R' }}
                </div>
                <div class="view-meta">
                  <h3>{{ editingRole()?.name }}</h3>
                  <code>{{ editingRole()?.code }}</code>
                  @if (editingRole()?.description) {
                    <p>{{ editingRole()?.description }}</p>
                  }
                </div>
              </div>
            }

            <div class="permissions-section">
              <div class="section-header">
                <h3>Module Permissions</h3>
                @if (modalMode() !== 'view') {
                  <div class="quick-actions">
                    <button class="btn btn-xs btn-ghost" (click)="selectAllPermissions()">Select All</button>
                    <button class="btn btn-xs btn-ghost" (click)="clearAllPermissions()">Clear All</button>
                  </div>
                }
              </div>

              <div class="modules-grid">
                @for (module of permissionModules(); track module.code) {
                  <div class="module-card" [class.active]="hasAnyPermission(module.code)" [class.readonly]="modalMode() === 'view'">
                    <div class="module-header">
                      <div class="module-icon">{{ getModuleIcon(module.code) }}</div>
                      <div class="module-info">
                        <h4>{{ module.name }}</h4>
                        <small>{{ module.description }}</small>
                      </div>
                      @if (modalMode() !== 'view') {
                        <label class="toggle-all" title="Toggle all permissions for this module">
                          <input
                            type="checkbox"
                            [checked]="hasAllPermissions(module.code)"
                            [indeterminate]="hasSomePermissions(module.code)"
                            (change)="toggleModulePermissions(module.code)"
                          />
                        </label>
                      }
                    </div>

                    <div class="perm-row">
                      @for (perm of module.permissions; track perm) {
                        <label class="perm-toggle" [class.checked]="formData.permissions.includes(perm)" [class.disabled]="modalMode() === 'view'">
                          <input
                            type="checkbox"
                            [checked]="formData.permissions.includes(perm)"
                            (change)="togglePermission(perm)"
                            [disabled]="modalMode() === 'view'"
                          />
                          <span class="perm-name">{{ getActionLabel(perm) }}</span>
                          <span class="perm-icon">{{ getActionIcon(perm) }}</span>
                        </label>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="selected-summary">
              <strong>{{ formData.permissions.length }}</strong> permissions selected across
              <strong>{{ getModuleCount(formData.permissions) }}</strong> modules
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="closeModal()">
              {{ modalMode() === 'view' ? 'Close' : 'Cancel' }}
            </button>
            @if (modalMode() !== 'view') {
              <button class="btn btn-primary" (click)="saveRole()" [disabled]="saving()">
                {{ saving() ? 'Saving...' : (editingRole() ? 'Update Role' : 'Create Role') }}
              </button>
            } @else {
              <button class="btn btn-primary" (click)="editRole(editingRole()!)">
                Edit Role
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* Header Styles */
    .btn-icon {
      font-weight: 600;
      margin-right: 4px;
    }

    /* Loading Skeleton */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--space-4);
    }

    .skeleton-card {
      padding: var(--space-5);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
    }

    .skeleton-header {
      height: 48px;
      width: 100%;
      margin-bottom: var(--space-3);
      border-radius: var(--radius);
    }

    .skeleton-text {
      height: 20px;
      width: 60%;
      margin-bottom: var(--space-3);
      border-radius: var(--radius-sm);
    }

    .skeleton-pills {
      height: 28px;
      width: 80%;
      border-radius: var(--radius);
    }

    /* Roles Grid */
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: var(--space-4);
    }

    .role-card {
      background: var(--bg-primary);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }

    .role-card:hover {
      border-color: var(--primary);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
      transform: translateY(-2px);
    }

    .role-card.system {
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(168, 85, 247, 0.03) 100%);
    }

    .role-card.inactive {
      opacity: 0.6;
    }

    .role-card-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .role-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .role-meta {
      flex: 1;
      min-width: 0;
    }

    .role-meta h3 {
      font-size: var(--text-lg);
      font-weight: 600;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .role-code {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      background: var(--bg-secondary);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .badge-system {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: white;
      font-size: var(--text-xs);
      padding: 4px 8px;
      border-radius: 12px;
      font-weight: 500;
    }

    .role-desc {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.5;
    }

    .perm-summary {
      display: flex;
      gap: var(--space-4);
      padding: var(--space-3);
      background: var(--bg-secondary);
      border-radius: var(--radius);
    }

    .perm-stat {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .perm-count {
      font-size: var(--text-xl);
      font-weight: 700;
      color: var(--primary);
    }

    .perm-stat .perm-label {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .perm-pills {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1);
    }

    .perm-pill {
      font-size: var(--text-xs);
      padding: 4px 10px;
      background: rgba(99, 102, 241, 0.1);
      color: var(--primary);
      border-radius: 16px;
      font-weight: 500;
      text-transform: capitalize;
    }

    .perm-pill-more {
      background: var(--bg-tertiary);
      color: var(--text-secondary);
    }

    .role-actions {
      display: flex;
      gap: var(--space-2);
      padding-top: var(--space-2);
      border-top: 1px solid var(--border);
      margin-top: auto;
    }

    .role-actions .btn-ghost {
      flex: 1;
      justify-content: center;
    }

    .btn-danger {
      color: #ef4444 !important;
    }

    .btn-danger:hover {
      background: rgba(239, 68, 68, 0.1) !important;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: var(--space-12);
      grid-column: 1 / -1;
    }

    .empty-icon {
      font-size: 64px;
      margin-bottom: var(--space-4);
    }

    .empty-state h3 {
      font-size: var(--text-xl);
      margin-bottom: var(--space-2);
    }

    .empty-state p {
      color: var(--text-secondary);
      margin-bottom: var(--space-6);
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: var(--space-4);
    }

    .modal-content {
      background: var(--bg-primary);
      border-radius: var(--radius-xl);
      width: 100%;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .modal-lg {
      max-width: 900px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    .modal-title-section h2 {
      font-size: var(--text-xl);
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    .modal-title-section p {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 0;
    }

    .modal-close {
      font-size: 28px;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--text-tertiary);
      line-height: 1;
      padding: 4px;
      transition: color 0.2s;
    }

    .modal-close:hover {
      color: var(--text-primary);
    }

    .modal-body {
      padding: var(--space-6);
      overflow-y: auto;
      flex: 1;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--border);
      background: var(--bg-secondary);
    }

    /* Form Styles */
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .form-group {
      margin-bottom: var(--space-4);
    }

    .form-label {
      display: block;
      font-size: var(--text-sm);
      font-weight: 500;
      margin-bottom: var(--space-2);
    }

    .form-label.required::after {
      content: ' *';
      color: #ef4444;
    }

    .form-hint {
      display: block;
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      margin-top: 4px;
    }

    /* View Mode Header */
    .view-header {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4);
      background: var(--bg-secondary);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-5);
    }

    .view-icon {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: 700;
      color: white;
    }

    .view-meta h3 {
      font-size: var(--text-xl);
      margin: 0 0 4px 0;
    }

    .view-meta code {
      font-size: var(--text-sm);
      color: var(--text-tertiary);
    }

    .view-meta p {
      font-size: var(--text-sm);
      color: var(--text-secondary);
      margin: 8px 0 0 0;
    }

    /* Permissions Section */
    .permissions-section {
      margin-top: var(--space-4);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-4);
    }

    .section-header h3 {
      font-size: var(--text-lg);
      font-weight: 600;
      margin: 0;
    }

    .quick-actions {
      display: flex;
      gap: var(--space-2);
    }

    .btn-xs {
      padding: 4px 8px;
      font-size: var(--text-xs);
    }

    /* Modules Grid */
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: var(--space-3);
      max-height: 400px;
      overflow-y: auto;
      padding: var(--space-1);
    }

    .module-card {
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--space-4);
      transition: all 0.2s;
      background: var(--bg-primary);
    }

    .module-card:hover {
      border-color: var(--primary-light);
    }

    .module-card.active {
      border-color: var(--primary);
      background: rgba(99, 102, 241, 0.02);
    }

    .module-card.readonly .perm-toggle {
      cursor: default;
    }

    .module-header {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      margin-bottom: var(--space-3);
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--border);
    }

    .module-icon {
      font-size: 24px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-secondary);
      border-radius: var(--radius);
    }

    .module-info {
      flex: 1;
      min-width: 0;
    }

    .module-info h4 {
      font-size: var(--text-sm);
      font-weight: 600;
      margin: 0;
    }

    .module-info small {
      font-size: var(--text-xs);
      color: var(--text-tertiary);
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .toggle-all input {
      width: 18px;
      height: 18px;
      cursor: pointer;
      accent-color: var(--primary);
    }

    .perm-row {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-2);
    }

    .perm-toggle {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      cursor: pointer;
      transition: all 0.15s;
      font-size: var(--text-xs);
    }

    .perm-toggle:hover:not(.disabled) {
      border-color: var(--primary-light);
      background: var(--bg-secondary);
    }

    .perm-toggle.checked {
      border-color: var(--primary);
      background: rgba(99, 102, 241, 0.08);
    }

    .perm-toggle.disabled {
      cursor: default;
      opacity: 0.8;
    }

    .perm-toggle input {
      display: none;
    }

    .perm-name {
      flex: 1;
      font-weight: 500;
      text-transform: capitalize;
    }

    .perm-icon {
      font-size: 14px;
    }

    /* Selected Summary */
    .selected-summary {
      margin-top: var(--space-4);
      padding: var(--space-3);
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%);
      border-radius: var(--radius);
      text-align: center;
      font-size: var(--text-sm);
      color: var(--text-secondary);
    }

    .selected-summary strong {
      color: var(--primary);
    }

    /* Responsive */
    @media (max-width: 640px) {
      .form-row {
        grid-template-columns: 1fr;
      }

      .roles-grid {
        grid-template-columns: 1fr;
      }

      .modules-grid {
        grid-template-columns: 1fr;
      }

      .perm-row {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class RolesComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  saving = signal(false);
  roles = signal<Role[]>([]);
  showModal = signal(false);
  modalMode = signal<'add' | 'edit' | 'view'>('add');
  editingRole = signal<Role | null>(null);
  permissionModules = signal<PermissionModule[]>([]);

  formData = {
    name: '',
    code: '',
    description: '',
    permissions: [] as string[],
  };

  private moduleIcons: Record<string, string> = {
    user: '👤',
    student: '🎓',
    teacher: '👨‍🏫',
    parent: '👪',
    class: '🏫',
    subject: '📚',
    exam: '📝',
    result: '📊',
    attendance: '✅',
    fee: '💰',
    timetable: '📅',
    transport: '🚌',
    'academic-year': '📆',
    notification: '🔔',
    report: '📈',
    settings: '⚙️',
    transfer: '🔄',
    promotion: '⬆️',
  };

  private roleColors: Record<string, string> = {
    principal: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    vice_principal: 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
    senior_teacher: 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)',
    class_teacher: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    subject_teacher: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
    accountant: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
    librarian: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
    receptionist: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 100%)',
    lab_assistant: 'linear-gradient(135deg, #84cc16 0%, #22c55e 100%)',
  };

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  loadRoles(): void {
    this.loading.set(true);
    this.api.get<any>('/roles').subscribe({
      next: (res) => {
        const roles = res?.data?.items || res?.data || res || [];
        this.roles.set(Array.isArray(roles) ? roles : []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load roles:', err);
        this.loading.set(false);
      }
    });
  }

  loadPermissions(): void {
    this.api.get<any>('/roles/permissions').subscribe({
      next: (res) => {
        const data = res?.data || res || {};
        const modules = data.modules || [];
        this.permissionModules.set(modules);
      },
      error: (err) => console.error('Failed to load permissions:', err)
    });
  }

  getRoleColor(code: string): string {
    return this.roleColors[code] || 'linear-gradient(135deg, #64748b 0%, #475569 100%)';
  }

  getModuleIcon(code: string): string {
    return this.moduleIcons[code] || '📋';
  }

  getModuleCount(permissions: string[]): number {
    const modules = new Set(permissions.map(p => p.split(':')[0]));
    return modules.size;
  }

  getActiveModules(permissions: string[]): string[] {
    const modules = new Set(permissions.map(p => p.split(':')[0]));
    return Array.from(modules);
  }

  getActionLabel(perm: string): string {
    const action = perm.split(':')[1];
    return action || perm;
  }

  getActionIcon(perm: string): string {
    const action = perm.split(':')[1];
    const icons: Record<string, string> = {
      create: '➕',
      view: '👁️',
      update: '✏️',
      delete: '🗑️',
    };
    return icons[action] || '•';
  }

  hasAnyPermission(moduleCode: string): boolean {
    return this.formData.permissions.some(p => p.startsWith(`${moduleCode}:`));
  }

  hasAllPermissions(moduleCode: string): boolean {
    const module = this.permissionModules().find(m => m.code === moduleCode);
    if (!module) return false;
    return module.permissions.every(p => this.formData.permissions.includes(p));
  }

  hasSomePermissions(moduleCode: string): boolean {
    const module = this.permissionModules().find(m => m.code === moduleCode);
    if (!module) return false;
    const hasAny = module.permissions.some(p => this.formData.permissions.includes(p));
    const hasAll = module.permissions.every(p => this.formData.permissions.includes(p));
    return hasAny && !hasAll;
  }

  toggleModulePermissions(moduleCode: string): void {
    const module = this.permissionModules().find(m => m.code === moduleCode);
    if (!module) return;

    const hasAll = this.hasAllPermissions(moduleCode);
    if (hasAll) {
      // Remove all permissions for this module
      this.formData.permissions = this.formData.permissions.filter(
        p => !module.permissions.includes(p)
      );
    } else {
      // Add all permissions for this module
      module.permissions.forEach(p => {
        if (!this.formData.permissions.includes(p)) {
          this.formData.permissions.push(p);
        }
      });
    }
  }

  togglePermission(perm: string): void {
    const idx = this.formData.permissions.indexOf(perm);
    if (idx === -1) {
      this.formData.permissions.push(perm);
    } else {
      this.formData.permissions.splice(idx, 1);
    }
  }

  selectAllPermissions(): void {
    const allPerms = this.permissionModules().flatMap(m => m.permissions);
    this.formData.permissions = [...allPerms];
  }

  clearAllPermissions(): void {
    this.formData.permissions = [];
  }

  openAddModal(): void {
    this.formData = { name: '', code: '', description: '', permissions: [] };
    this.editingRole.set(null);
    this.modalMode.set('add');
    this.showModal.set(true);
  }

  viewRole(role: Role): void {
    this.editingRole.set(role);
    this.formData = {
      name: role.name,
      code: role.code,
      description: role.description || '',
      permissions: [...role.permissions],
    };
    this.modalMode.set('view');
    this.showModal.set(true);
  }

  editRole(role: Role): void {
    this.editingRole.set(role);
    this.formData = {
      name: role.name,
      code: role.code,
      description: role.description || '',
      permissions: [...role.permissions],
    };
    this.modalMode.set('edit');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingRole.set(null);
    this.modalMode.set('add');
    this.formData = { name: '', code: '', description: '', permissions: [] };
  }

  saveRole(): void {
    if (!this.formData.name || !this.formData.code) {
      this.toast.error('Name and code are required');
      return;
    }

    this.saving.set(true);
    const editing = this.editingRole();

    const request = editing
      ? this.api.patch(`/roles/${editing._id}`, this.formData)
      : this.api.post('/roles', this.formData);

    request.subscribe({
      next: () => {
        this.toast.success(editing ? 'Role updated successfully' : 'Role created successfully');
        this.closeModal();
        this.loadRoles();
        this.saving.set(false);
      },
      error: (err) => {
        this.toast.error('Failed to save role', err.error?.message);
        this.saving.set(false);
      }
    });
  }

  deleteRole(id: string): void {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) return;

    this.api.delete(`/roles/${id}`).subscribe({
      next: () => {
        this.toast.success('Role deleted');
        this.loadRoles();
      },
      error: (err) => this.toast.error('Failed to delete role', err.error?.message)
    });
  }

  initializeDefaults(): void {
    this.loading.set(true);
    this.api.post('/roles/initialize', {}).subscribe({
      next: () => {
        this.toast.success('Default roles initialized successfully');
        this.loadRoles();
      },
      error: (err) => {
        this.toast.error('Failed to initialize roles', err.error?.message);
        this.loading.set(false);
      }
    });
  }
}
