import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';

interface Event {
  _id?: string;
  name: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  venue: string;
  responsibleTeachers: any[];
  assignedStudents: any[];
  leaders: any[];
  status: string;
  budget?: number;
  notes?: string;
}

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="page-header">
      <div><h1>📅 Event Management</h1><p>Organize and manage school events, assign teachers and students</p></div>
      <button class="btn btn-primary" (click)="openModal()">+ Add Event</button>
    </div>

    <!-- Filters -->
    <div class="card filter-bar">
      <div class="filter-group">
        <div class="filter-item">
          <label>Type</label>
          <select class="form-select" [(ngModel)]="filterType" (change)="loadEvents()">
            <option value="">All Types</option>
            @for (type of eventTypes; track type.value) {
              <option [value]="type.value">{{ type.label }}</option>
            }
          </select>
        </div>
        <div class="filter-item">
          <label>Status</label>
          <select class="form-select" [(ngModel)]="filterStatus" (change)="loadEvents()">
            <option value="">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div class="filter-item">
          <label>From Date</label>
          <input type="date" class="form-input" [(ngModel)]="filterFromDate" (change)="loadEvents()" />
        </div>
        <div class="filter-item">
          <label>To Date</label>
          <input type="date" class="form-input" [(ngModel)]="filterToDate" (change)="loadEvents()" />
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="st"><span class="st-val">{{ events().length }}</span><span class="st-lbl">Total Events</span></div>
      <div class="st upcoming"><span class="st-val">{{ getUpcomingCount() }}</span><span class="st-lbl">Upcoming</span></div>
      <div class="st ongoing"><span class="st-val">{{ getOngoingCount() }}</span><span class="st-lbl">Ongoing</span></div>
      <div class="st completed"><span class="st-val">{{ getCompletedCount() }}</span><span class="st-lbl">Completed</span></div>
    </div>

    <!-- Events Grid -->
    <div class="events-grid">
      @if (loading()) {
        @for (i of [1,2,3,4]; track i) {
          <div class="card skeleton" style="height:250px"></div>
        }
      } @else {
        @for (event of events(); track event._id) {
          <div class="event-card card" [class]="'status-' + event.status">
            <div class="event-header">
              <span class="event-type-badge" [class]="'type-' + event.type">{{ getTypeLabel(event.type) }}</span>
              <span class="event-status-badge" [class]="'status-' + event.status">{{ event.status }}</span>
            </div>
            <h3>{{ event.name }}</h3>
            <p class="event-desc">{{ event.description }}</p>
            <div class="event-meta">
              <div class="meta-item">📅 {{ formatDate(event.startDate) }} - {{ formatDate(event.endDate) }}</div>
              <div class="meta-item">📍 {{ event.venue || 'TBD' }}</div>
              @if (event.budget) {
                <div class="meta-item">💰 {{ event.budget | currency }}</div>
              }
            </div>
            <div class="event-participants">
              @if (event.responsibleTeachers?.length) {
                <div class="participant-group">
                  <span class="label">👨‍🏫 Teachers:</span>
                  <span class="count">{{ event.responsibleTeachers.length }}</span>
                </div>
              }
              @if (event.assignedStudents?.length) {
                <div class="participant-group">
                  <span class="label">🎓 Students:</span>
                  <span class="count">{{ event.assignedStudents.length }}</span>
                </div>
              }
              @if (event.leaders?.length) {
                <div class="participant-group">
                  <span class="label">⭐ Leaders:</span>
                  <span class="count">{{ event.leaders.length }}</span>
                </div>
              }
            </div>
            <div class="event-actions">
              <button class="btn btn-ghost btn-sm" (click)="viewEvent(event)">👁️ View</button>
              <button class="btn btn-ghost btn-sm" (click)="editEvent(event)">✏️ Edit</button>
              <button class="btn btn-ghost btn-sm" (click)="manageParticipants(event)">👥 Participants</button>
            </div>
          </div>
        } @empty {
          <div class="empty-state card">
            <div class="empty-icon">📅</div>
            <h3>No Events Found</h3>
            <p>Create your first event to get started</p>
            <button class="btn btn-primary" (click)="openModal()">+ Add Event</button>
          </div>
        }
      }
    </div>

    <!-- Event Modal -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingEvent ? 'Edit Event' : 'Add New Event' }}</h2>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-grid">
              <div class="form-group full-width">
                <label>Event Name *</label>
                <input type="text" class="form-input" [(ngModel)]="form.name" placeholder="Enter event name" />
              </div>
              <div class="form-group full-width">
                <label>Description</label>
                <textarea class="form-textarea" [(ngModel)]="form.description" placeholder="Event description" rows="3"></textarea>
              </div>
              <div class="form-group">
                <label>Event Type *</label>
                <select class="form-select" [(ngModel)]="form.type">
                  <option value="">Select type</option>
                  @for (type of eventTypes; track type.value) {
                    <option [value]="type.value">{{ type.label }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Venue</label>
                <input type="text" class="form-input" [(ngModel)]="form.venue" placeholder="Event location" />
              </div>
              <div class="form-group">
                <label>Start Date *</label>
                <input type="datetime-local" class="form-input" [(ngModel)]="form.startDate" />
              </div>
              <div class="form-group">
                <label>End Date *</label>
                <input type="datetime-local" class="form-input" [(ngModel)]="form.endDate" />
              </div>
              <div class="form-group">
                <label>Budget (Optional)</label>
                <input type="number" class="form-input" [(ngModel)]="form.budget" placeholder="0.00" />
              </div>
              <div class="form-group">
                <label>Status</label>
                <select class="form-select" [(ngModel)]="form.status">
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div class="form-group full-width">
                <label>Notes</label>
                <textarea class="form-textarea" [(ngModel)]="form.notes" placeholder="Additional notes" rows="2"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Cancel</button>
            <button class="btn btn-primary" (click)="saveEvent()" [disabled]="saving()">
              @if (saving()) { <span class="spinner"></span> }
              {{ editingEvent ? 'Update Event' : 'Create Event' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Participants Modal -->
    @if (showParticipantsModal()) {
      <div class="modal-overlay" (click)="closeParticipantsModal()">
        <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Manage Participants - {{ selectedEvent?.name }}</h2>
            <button class="close-btn" (click)="closeParticipantsModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="tabs">
              <button class="tab" [class.active]="activeTab === 'teachers'" (click)="activeTab = 'teachers'">👨‍🏫 Teachers</button>
              <button class="tab" [class.active]="activeTab === 'students'" (click)="activeTab = 'students'">🎓 Students</button>
              <button class="tab" [class.active]="activeTab === 'leaders'" (click)="activeTab = 'leaders'">⭐ Leaders</button>
            </div>

            @if (activeTab === 'teachers') {
              <div class="participant-section">
                <div class="section-header">
                  <h4>Responsible Teachers</h4>
                  <select class="form-select add-select" [(ngModel)]="selectedTeacherToAdd" (change)="addTeacher()">
                    <option value="">+ Add Teacher</option>
                    @for (t of availableTeachers(); track t._id) {
                      <option [value]="t._id">{{ t.firstName }} {{ t.lastName }}</option>
                    }
                  </select>
                </div>
                <div class="participant-list">
                  @for (t of selectedEvent?.responsibleTeachers || []; track t._id || t) {
                    <div class="participant-item">
                      <div class="participant-avatar">{{ getInitials(t) }}</div>
                      <div class="participant-info">
                        <span class="name">{{ t.firstName || 'Teacher' }} {{ t.lastName || '' }}</span>
                        <span class="email">{{ t.email || '' }}</span>
                      </div>
                      <button class="btn btn-ghost btn-sm" (click)="removeTeacher(t)">✕</button>
                    </div>
                  } @empty {
                    <div class="no-participants">No teachers assigned yet</div>
                  }
                </div>
              </div>
            }

            @if (activeTab === 'students') {
              <div class="participant-section">
                <div class="section-header">
                  <h4>Assigned Students</h4>
                  <div class="add-controls">
                    <select class="form-select" [(ngModel)]="filterClassForStudents" (change)="loadStudentsForEvent()">
                      <option value="">Select Class</option>
                      @for (c of classes(); track c._id) {
                        <option [value]="c._id">{{ c.name }}</option>
                      }
                    </select>
                    <select class="form-select add-select" [(ngModel)]="selectedStudentToAdd" (change)="addStudent()">
                      <option value="">+ Add Student</option>
                      @for (s of availableStudents(); track s._id) {
                        <option [value]="s._id">{{ s.firstName }} {{ s.lastName }}</option>
                      }
                    </select>
                  </div>
                </div>
                <div class="participant-list">
                  @for (s of selectedEvent?.assignedStudents || []; track s._id || s) {
                    <div class="participant-item">
                      <div class="participant-avatar student">{{ getInitials(s) }}</div>
                      <div class="participant-info">
                        <span class="name">{{ s.firstName || 'Student' }} {{ s.lastName || '' }}</span>
                        <span class="class">{{ s.currentClass?.name || '' }} {{ s.currentSection ? '- ' + s.currentSection : '' }}</span>
                      </div>
                      <button class="btn btn-ghost btn-sm leader-btn" (click)="toggleLeader(s)" [class.is-leader]="isLeader(s)" title="Toggle Leader">
                        {{ isLeader(s) ? '⭐' : '☆' }}
                      </button>
                      <button class="btn btn-ghost btn-sm" (click)="removeStudent(s)">✕</button>
                    </div>
                  } @empty {
                    <div class="no-participants">No students assigned yet</div>
                  }
                </div>
              </div>
            }

            @if (activeTab === 'leaders') {
              <div class="participant-section">
                <div class="section-header">
                  <h4>Event Leaders</h4>
                  <p class="section-hint">Leaders are selected from assigned students. Mark a student as leader from the Students tab.</p>
                </div>
                <div class="participant-list">
                  @for (l of selectedEvent?.leaders || []; track l._id || l) {
                    <div class="participant-item leader">
                      <div class="participant-avatar leader">⭐</div>
                      <div class="participant-info">
                        <span class="name">{{ l.firstName || 'Leader' }} {{ l.lastName || '' }}</span>
                        <span class="role">{{ l.leaderRole || 'Team Leader' }}</span>
                      </div>
                      <button class="btn btn-ghost btn-sm" (click)="removeLeader(l)">✕</button>
                    </div>
                  } @empty {
                    <div class="no-participants">No leaders assigned. Mark students as leaders from the Students tab.</div>
                  }
                </div>
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeParticipantsModal()">Close</button>
            <button class="btn btn-primary" (click)="saveParticipants()" [disabled]="savingParticipants()">
              @if (savingParticipants()) { <span class="spinner"></span> }
              Save Changes
            </button>
          </div>
        </div>
      </div>
    }

    <!-- View Event Modal -->
    @if (showViewModal()) {
      <div class="modal-overlay" (click)="closeViewModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ selectedEvent?.name }}</h2>
            <button class="close-btn" (click)="closeViewModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="event-detail">
              <div class="detail-row">
                <span class="label">Type:</span>
                <span class="value">{{ getTypeLabel(selectedEvent?.type || '') }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value status-badge" [class]="'status-' + selectedEvent?.status">{{ selectedEvent?.status }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span class="value">{{ formatDate(selectedEvent?.startDate || '') }} - {{ formatDate(selectedEvent?.endDate || '') }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Venue:</span>
                <span class="value">{{ selectedEvent?.venue || 'Not specified' }}</span>
              </div>
              @if (selectedEvent?.budget) {
                <div class="detail-row">
                  <span class="label">Budget:</span>
                  <span class="value">{{ selectedEvent?.budget | currency }}</span>
                </div>
              }
              <div class="detail-row full">
                <span class="label">Description:</span>
                <p class="value">{{ selectedEvent?.description || 'No description' }}</p>
              </div>
              @if (selectedEvent?.notes) {
                <div class="detail-row full">
                  <span class="label">Notes:</span>
                  <p class="value">{{ selectedEvent?.notes }}</p>
                </div>
              }
              <div class="detail-row">
                <span class="label">Teachers:</span>
                <span class="value">{{ selectedEvent?.responsibleTeachers?.length || 0 }} assigned</span>
              </div>
              <div class="detail-row">
                <span class="label">Students:</span>
                <span class="value">{{ selectedEvent?.assignedStudents?.length || 0 }} assigned</span>
              </div>
              <div class="detail-row">
                <span class="label">Leaders:</span>
                <span class="value">{{ selectedEvent?.leaders?.length || 0 }} assigned</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeViewModal()">Close</button>
            <button class="btn btn-primary" (click)="closeViewModal(); editEvent(selectedEvent!)">Edit Event</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .filter-bar { margin-bottom: var(--space-4); }
    .filter-group { display: flex; flex-wrap: wrap; gap: var(--space-4); align-items: flex-end; }
    .filter-item { display: flex; flex-direction: column; gap: var(--space-1); min-width: 150px; }
    .filter-item label { font-size: var(--text-xs); color: var(--text-secondary); font-weight: 500; }

    .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
    .st { background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: var(--space-4); text-align: center; }
    .st-val { display: block; font-size: var(--text-2xl); font-weight: 700; color: var(--color-primary); }
    .st-lbl { font-size: var(--text-xs); color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .st.upcoming .st-val { color: #3b82f6; }
    .st.ongoing .st-val { color: #f59e0b; }
    .st.completed .st-val { color: #10b981; }

    .events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--space-4); }
    
    .event-card { display: flex; flex-direction: column; gap: var(--space-3); }
    .event-card h3 { font-size: var(--text-lg); font-weight: 600; margin: 0; }
    .event-desc { font-size: var(--text-sm); color: var(--text-secondary); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin: 0; }
    
    .event-header { display: flex; justify-content: space-between; align-items: center; }
    .event-type-badge { font-size: var(--text-xs); padding: 2px 8px; border-radius: var(--radius-full); font-weight: 500; }
    .type-sports { background: rgba(239,68,68,0.1); color: #dc2626; }
    .type-cultural { background: rgba(168,85,247,0.1); color: #9333ea; }
    .type-academic { background: rgba(59,130,246,0.1); color: #2563eb; }
    .type-celebration { background: rgba(245,158,11,0.1); color: #d97706; }
    .type-competition { background: rgba(16,185,129,0.1); color: #059669; }
    .type-other { background: var(--bg-muted); color: var(--text-secondary); }
    
    .event-status-badge { font-size: var(--text-xs); padding: 2px 8px; border-radius: var(--radius-full); font-weight: 500; text-transform: capitalize; }
    .status-upcoming { background: rgba(59,130,246,0.1); color: #2563eb; }
    .status-ongoing { background: rgba(245,158,11,0.1); color: #d97706; }
    .status-completed { background: rgba(16,185,129,0.1); color: #059669; }
    .status-cancelled { background: rgba(239,68,68,0.1); color: #dc2626; }
    
    .event-meta { display: flex; flex-direction: column; gap: var(--space-1); font-size: var(--text-sm); color: var(--text-secondary); }
    .meta-item { display: flex; align-items: center; gap: var(--space-2); }
    
    .event-participants { display: flex; gap: var(--space-4); flex-wrap: wrap; padding-top: var(--space-2); border-top: 1px solid var(--border-color); }
    .participant-group { display: flex; align-items: center; gap: var(--space-1); font-size: var(--text-sm); }
    .participant-group .label { color: var(--text-secondary); }
    .participant-group .count { font-weight: 600; color: var(--text-primary); }
    
    .event-actions { display: flex; gap: var(--space-2); padding-top: var(--space-2); border-top: 1px solid var(--border-color); }

    .empty-state { text-align: center; padding: var(--space-8); grid-column: 1 / -1; }
    .empty-icon { font-size: 64px; margin-bottom: var(--space-4); opacity: 0.5; }
    .empty-state h3 { margin-bottom: var(--space-2); }
    .empty-state p { color: var(--text-secondary); margin-bottom: var(--space-4); }

    /* Modal styles */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: var(--space-4); }
    .modal-content { background: var(--bg-surface); border-radius: var(--radius-xl); max-width: 560px; width: 100%; max-height: 90vh; overflow-y: auto; }
    .modal-content.modal-lg { max-width: 720px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-4) var(--space-6); border-bottom: 1px solid var(--border-color); }
    .modal-header h2 { font-size: var(--text-lg); font-weight: 600; margin: 0; }
    .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: var(--text-muted); }
    .modal-body { padding: var(--space-6); }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding: var(--space-4) var(--space-6); border-top: 1px solid var(--border-color); }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .form-group { display: flex; flex-direction: column; gap: var(--space-1); }
    .form-group.full-width { grid-column: 1 / -1; }
    .form-group label { font-size: var(--text-sm); font-weight: 500; color: var(--text-secondary); }
    .form-textarea { min-height: 80px; resize: vertical; }

    /* Tabs */
    .tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); border-bottom: 1px solid var(--border-color); }
    .tab { padding: var(--space-2) var(--space-4); background: none; border: none; cursor: pointer; font-size: var(--text-sm); font-weight: 500; color: var(--text-secondary); border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .tab.active { color: var(--color-primary); border-bottom-color: var(--color-primary); }

    /* Participant section */
    .participant-section { padding: var(--space-4) 0; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); flex-wrap: wrap; gap: var(--space-2); }
    .section-header h4 { margin: 0; font-size: var(--text-base); }
    .section-hint { font-size: var(--text-sm); color: var(--text-secondary); margin: 0; }
    .add-select { width: 180px; }
    .add-controls { display: flex; gap: var(--space-2); }
    
    .participant-list { display: flex; flex-direction: column; gap: var(--space-2); max-height: 300px; overflow-y: auto; }
    .participant-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); background: var(--bg-muted); border-radius: var(--radius-md); }
    .participant-item.leader { background: rgba(245,158,11,0.1); }
    .participant-avatar { width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), #818cf8); color: white; display: flex; align-items: center; justify-content: center; font-size: var(--text-sm); font-weight: 600; flex-shrink: 0; }
    .participant-avatar.student { background: linear-gradient(135deg, #10b981, #34d399); }
    .participant-avatar.leader { background: linear-gradient(135deg, #f59e0b, #fbbf24); font-size: 18px; }
    .participant-info { flex: 1; min-width: 0; }
    .participant-info .name { display: block; font-weight: 500; font-size: var(--text-sm); }
    .participant-info .email, .participant-info .class, .participant-info .role { display: block; font-size: var(--text-xs); color: var(--text-secondary); }
    .no-participants { text-align: center; padding: var(--space-6); color: var(--text-muted); font-size: var(--text-sm); }
    .leader-btn.is-leader { color: #f59e0b; }

    /* Event detail */
    .event-detail { display: flex; flex-direction: column; gap: var(--space-3); }
    .detail-row { display: flex; gap: var(--space-3); }
    .detail-row .label { font-weight: 500; color: var(--text-secondary); min-width: 100px; }
    .detail-row .value { color: var(--text-primary); }
    .detail-row.full { flex-direction: column; }
    .detail-row.full .value { margin-top: var(--space-1); }

    .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .form-grid { grid-template-columns: 1fr; }
      .events-grid { grid-template-columns: 1fr; }
      .section-header { flex-direction: column; align-items: flex-start; }
      .add-controls { flex-direction: column; width: 100%; }
      .add-controls select { width: 100%; }
    }
  `]
})
export class EventListComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  saving = signal(false);
  savingParticipants = signal(false);
  events = signal<Event[]>([]);
  teachers = signal<any[]>([]);
  classes = signal<any[]>([]);
  availableTeachers = signal<any[]>([]);
  availableStudents = signal<any[]>([]);
  
  showModal = signal(false);
  showParticipantsModal = signal(false);
  showViewModal = signal(false);
  
  editingEvent: Event | null = null;
  selectedEvent: Event | null = null;
  activeTab = 'teachers';
  
  filterType = '';
  filterStatus = '';
  filterFromDate = '';
  filterToDate = '';
  filterClassForStudents = '';
  selectedTeacherToAdd = '';
  selectedStudentToAdd = '';

  eventTypes = [
    { value: 'sports', label: '🏃 Sports Day' },
    { value: 'cultural', label: '🎭 Cultural Event' },
    { value: 'academic', label: '📚 Academic Event' },
    { value: 'celebration', label: '🎉 Celebration' },
    { value: 'competition', label: '🏆 Competition' },
    { value: 'other', label: '📌 Other' },
  ];

  form: Event = this.getEmptyForm();

  ngOnInit(): void {
    this.loadEvents();
    this.loadTeachers();
    this.loadClasses();
  }

  private getEmptyForm(): Event {
    return {
      name: '',
      description: '',
      type: '',
      startDate: '',
      endDate: '',
      venue: '',
      responsibleTeachers: [],
      assignedStudents: [],
      leaders: [],
      status: 'upcoming',
      budget: undefined,
      notes: ''
    };
  }

  loadEvents(): void {
    this.loading.set(true);
    const params: any = {};
    if (this.filterType) params.type = this.filterType;
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.filterFromDate) params.fromDate = this.filterFromDate;
    if (this.filterToDate) params.toDate = this.filterToDate;

    this.api.get<any>('/events', params).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        this.events.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: () => {
        // Mock data for demo if API doesn't exist
        this.events.set([
          {
            _id: '1',
            name: 'Annual Sports Day',
            description: 'Annual sports competition featuring track and field events',
            type: 'sports',
            startDate: '2026-03-15T09:00',
            endDate: '2026-03-15T17:00',
            venue: 'School Ground',
            responsibleTeachers: [],
            assignedStudents: [],
            leaders: [],
            status: 'upcoming',
            budget: 50000
          },
          {
            _id: '2',
            name: 'Science Exhibition',
            description: 'Students showcase their science projects',
            type: 'academic',
            startDate: '2026-02-28T10:00',
            endDate: '2026-02-28T16:00',
            venue: 'School Hall',
            responsibleTeachers: [],
            assignedStudents: [],
            leaders: [],
            status: 'upcoming'
          }
        ]);
        this.loading.set(false);
      }
    });
  }

  loadTeachers(): void {
    this.api.get<any>('/teachers', { limit: 500, isActive: true }).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        this.teachers.set(Array.isArray(data) ? data : []);
        this.availableTeachers.set(this.teachers());
      }
    });
  }

  loadClasses(): void {
    this.api.get<any>('/classes', { limit: 100 }).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        this.classes.set(Array.isArray(data) ? data : []);
      }
    });
  }

  loadStudentsForEvent(): void {
    if (!this.filterClassForStudents) {
      this.availableStudents.set([]);
      return;
    }
    this.api.get<any>('/students', { classId: this.filterClassForStudents, status: 'active', limit: 500 }).subscribe({
      next: (res) => {
        const data = res.data?.data || res.data || [];
        this.availableStudents.set(Array.isArray(data) ? data : []);
      }
    });
  }

  getUpcomingCount(): number {
    return this.events().filter(e => e.status === 'upcoming').length;
  }

  getOngoingCount(): number {
    return this.events().filter(e => e.status === 'ongoing').length;
  }

  getCompletedCount(): number {
    return this.events().filter(e => e.status === 'completed').length;
  }

  getTypeLabel(type: string): string {
    return this.eventTypes.find(t => t.value === type)?.label || type;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getInitials(person: any): string {
    const first = person?.firstName?.charAt(0) || '';
    const last = person?.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  }

  openModal(): void {
    this.editingEvent = null;
    this.form = this.getEmptyForm();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingEvent = null;
  }

  editEvent(event: Event): void {
    this.editingEvent = event;
    this.form = { ...event };
    this.showModal.set(true);
  }

  viewEvent(event: Event): void {
    this.selectedEvent = event;
    this.showViewModal.set(true);
  }

  closeViewModal(): void {
    this.showViewModal.set(false);
    this.selectedEvent = null;
  }

  saveEvent(): void {
    if (!this.form.name || !this.form.type || !this.form.startDate || !this.form.endDate) {
      this.toast.error('Please fill in all required fields');
      return;
    }

    this.saving.set(true);

    const payload = { ...this.form };

    if (this.editingEvent?._id) {
      this.api.patch(`/events/${this.editingEvent._id}`, payload).subscribe({
        next: () => {
          this.toast.success('Event updated successfully');
          this.closeModal();
          this.loadEvents();
          this.saving.set(false);
        },
        error: () => {
          this.toast.error('Failed to update event');
          this.saving.set(false);
        }
      });
    } else {
      this.api.post('/events', payload).subscribe({
        next: () => {
          this.toast.success('Event created successfully');
          this.closeModal();
          this.loadEvents();
          this.saving.set(false);
        },
        error: () => {
          this.toast.error('Failed to create event');
          this.saving.set(false);
        }
      });
    }
  }

  manageParticipants(event: Event): void {
    this.selectedEvent = { ...event };
    this.activeTab = 'teachers';
    this.updateAvailableTeachers();
    this.showParticipantsModal.set(true);
  }

  closeParticipantsModal(): void {
    this.showParticipantsModal.set(false);
    this.selectedEvent = null;
  }

  updateAvailableTeachers(): void {
    const assignedIds = this.selectedEvent?.responsibleTeachers?.map((t: any) => t._id || t) || [];
    this.availableTeachers.set(this.teachers().filter(t => !assignedIds.includes(t._id)));
  }

  addTeacher(): void {
    if (!this.selectedTeacherToAdd || !this.selectedEvent) return;
    const teacher = this.teachers().find(t => t._id === this.selectedTeacherToAdd);
    if (teacher) {
      this.selectedEvent.responsibleTeachers = [...(this.selectedEvent.responsibleTeachers || []), teacher];
      this.updateAvailableTeachers();
    }
    this.selectedTeacherToAdd = '';
  }

  removeTeacher(teacher: any): void {
    if (!this.selectedEvent) return;
    this.selectedEvent.responsibleTeachers = this.selectedEvent.responsibleTeachers.filter(
      (t: any) => (t._id || t) !== (teacher._id || teacher)
    );
    this.updateAvailableTeachers();
  }

  addStudent(): void {
    if (!this.selectedStudentToAdd || !this.selectedEvent) return;
    const student = this.availableStudents().find(s => s._id === this.selectedStudentToAdd);
    if (student) {
      this.selectedEvent.assignedStudents = [...(this.selectedEvent.assignedStudents || []), student];
    }
    this.selectedStudentToAdd = '';
  }

  removeStudent(student: any): void {
    if (!this.selectedEvent) return;
    const studentId = student._id || student;
    this.selectedEvent.assignedStudents = this.selectedEvent.assignedStudents.filter(
      (s: any) => (s._id || s) !== studentId
    );
    this.selectedEvent.leaders = this.selectedEvent.leaders.filter(
      (l: any) => (l._id || l) !== studentId
    );
  }

  isLeader(student: any): boolean {
    const studentId = student._id || student;
    return this.selectedEvent?.leaders?.some((l: any) => (l._id || l) === studentId) || false;
  }

  toggleLeader(student: any): void {
    if (!this.selectedEvent) return;
    const studentId = student._id || student;
    
    if (this.isLeader(student)) {
      this.selectedEvent.leaders = this.selectedEvent.leaders.filter(
        (l: any) => (l._id || l) !== studentId
      );
    } else {
      this.selectedEvent.leaders = [...(this.selectedEvent.leaders || []), student];
    }
  }

  removeLeader(leader: any): void {
    if (!this.selectedEvent) return;
    const leaderId = leader._id || leader;
    this.selectedEvent.leaders = this.selectedEvent.leaders.filter(
      (l: any) => (l._id || l) !== leaderId
    );
  }

  saveParticipants(): void {
    if (!this.selectedEvent?._id) {
      this.toast.error('No event selected');
      return;
    }

    this.savingParticipants.set(true);

    const payload = {
      responsibleTeachers: this.selectedEvent.responsibleTeachers.map((t: any) => t._id || t),
      assignedStudents: this.selectedEvent.assignedStudents.map((s: any) => s._id || s),
      leaders: this.selectedEvent.leaders.map((l: any) => l._id || l)
    };

    this.api.patch(`/events/${this.selectedEvent._id}`, payload).subscribe({
      next: () => {
        this.toast.success('Participants updated successfully');
        this.closeParticipantsModal();
        this.loadEvents();
        this.savingParticipants.set(false);
      },
      error: () => {
        this.toast.error('Failed to update participants');
        this.savingParticipants.set(false);
      }
    });
  }
}
