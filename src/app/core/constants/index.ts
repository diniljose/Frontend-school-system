import { UserRole } from '../models';

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  translationKey: string;
  /**
   * Permission required to view this menu item
   * - '*' = visible to all authenticated users
   * - 'admin' = platform admin only
   * - 'module:action' = requires specific permission (e.g., 'student:view', 'academic-year:view')
   */
  permission: string;
  children?: MenuItem[];
  badge?: string;
  /** Accent color for module identity */
  accent?: string;
}

/**
 * Navigation Group for organized sidebar
 */
export interface NavGroup {
  id: string;
  label: string;
  icon: string;
  translationKey: string;
  /** Permission to see group - if any item in group is visible, group is visible */
  permission?: string;
  /** Accent color for the group */
  accent: string;
  /** Gradient for module identity */
  gradient: string;
  items: MenuItem[];
  /** Whether group is expanded by default */
  defaultExpanded?: boolean;
}

/**
 * ENTERPRISE NAVIGATION ARCHITECTURE
 * Organized by business workflows for optimal UX
 */
export const NAV_GROUPS: NavGroup[] = [
  // ═══════════════════════════════════════════════════════════════
  // OVERVIEW - Always first, always visible
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'overview',
    label: 'Overview',
    icon: '🏠',
    translationKey: 'nav.group.overview',
    accent: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    defaultExpanded: true,
    items: [
      { label: 'Dashboard', icon: 'grid', route: '/dashboard', translationKey: 'nav.dashboard', permission: '*', accent: '#6366f1' },
      { label: 'Notifications', icon: 'bell', route: '/notifications', translationKey: 'nav.notifications', permission: '*', accent: '#8b5cf6' },
        { label: 'Pending Approvals', icon: 'clock', route: '/pending', translationKey: 'nav.pending_approvals', permission: 'admin' },
  { label: 'Subscriptions', icon: 'package', route: '/subscriptions', translationKey: 'nav.subscriptions', permission: 'admin' },    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // ACADEMIC MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'academic',
    label: 'Academic',
    icon: '🎓',
    translationKey: 'nav.group.academic',
    accent: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    items: [
      { label: 'Academic Years', icon: 'calendar-range', route: '/academic-years', translationKey: 'nav.academic_years', permission: 'academic-year:view', accent: '#10b981' },
      { label: 'Classes', icon: 'layout-grid', route: '/classes', translationKey: 'nav.classes', permission: 'class:view', accent: '#059669' },
      { label: 'Subjects', icon: 'book-open', route: '/subjects', translationKey: 'nav.subjects', permission: 'subject:view', accent: '#34d399' },
      { label: 'Timetable', icon: 'clock', route: '/timetable', translationKey: 'nav.timetable', permission: 'timetable:view', accent: '#6ee7b7' },
      { label: 'Exams', icon: 'file-text', route: '/exams', translationKey: 'nav.exams', permission: 'exam:view', accent: '#047857' },
      { label: 'Results', icon: 'bar-chart-2', route: '/results', translationKey: 'nav.results', permission: 'result:view', accent: '#065f46' },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // STUDENT MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'students',
    label: 'Students',
    icon: '👨‍🎓',
    translationKey: 'nav.group.students',
    accent: '#3b82f6',
    gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
    items: [
      { label: 'All Students', icon: 'graduation-cap', route: '/students', translationKey: 'nav.students', permission: 'student:view', accent: '#3b82f6' },
      { label: 'Pending Approval', icon: 'user-check', route: '/pending-students', translationKey: 'nav.pending_students', permission: 'student:approve', accent: '#f59e0b' },
      { label: 'Enrollments', icon: 'user-plus', route: '/enrollments', translationKey: 'nav.enrollments', permission: 'enrollment:view', accent: '#06b6d4' },
      { label: 'Attendance', icon: 'clipboard-check', route: '/attendance', translationKey: 'nav.attendance', permission: 'attendance:view', accent: '#8b5cf6' },
      { label: 'Promotions', icon: 'trending-up', route: '/promotions', translationKey: 'nav.promotions', permission: 'promotion:view', accent: '#10b981' },
      { label: 'Transfers', icon: 'shuffle', route: '/transfers', translationKey: 'nav.transfers', permission: 'transfer:view', accent: '#64748b' },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // STAFF MANAGEMENT
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'staff',
    label: 'Staff',
    icon: '👨‍🏫',
    translationKey: 'nav.group.staff',
    accent: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    items: [
      { label: 'Teachers', icon: 'briefcase', route: '/teachers', translationKey: 'nav.teachers', permission: 'teacher:view', accent: '#f59e0b' },
      { label: 'Pending Teachers', icon: 'user-plus', route: '/pending-teachers', translationKey: 'nav.pending_teachers', permission: 'teacher:approve', accent: '#d97706' },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // PARENTS & COMMUNICATION
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'communication',
    label: 'Communication',
    icon: '💬',
    translationKey: 'nav.group.communication',
    accent: '#ec4899',
    gradient: 'linear-gradient(135deg, #ec4899, #f472b6)',
    items: [
      { label: 'Parents', icon: 'heart-handshake', route: '/parents', translationKey: 'nav.parents', permission: 'parent:view', accent: '#ec4899' },
      { label: 'Events', icon: 'calendar', route: '/events', translationKey: 'nav.events', permission: 'event:view', accent: '#f472b6' },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // FINANCE
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'finance',
    label: 'Finance',
    icon: '💰',
    translationKey: 'nav.group.finance',
    accent: '#22c55e',
    gradient: 'linear-gradient(135deg, #22c55e, #4ade80)',
    items: [
      { label: 'Fees', icon: 'credit-card', route: '/fees', translationKey: 'nav.fees', permission: 'fee:view', accent: '#22c55e' },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // OPERATIONS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'operations',
    label: 'Operations',
    icon: '🚌',
    translationKey: 'nav.group.operations',
    accent: '#06b6d4',
    gradient: 'linear-gradient(135deg, #06b6d4, #22d3ee)',
    items: [
      { label: 'Transport', icon: 'bus', route: '/transport', translationKey: 'nav.transport', permission: 'transport:view', accent: '#06b6d4' },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // REPORTS & INSIGHTS
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'reports',
    label: 'Reports',
    icon: '📊',
    translationKey: 'nav.group.reports',
    accent: '#8b5cf6',
    gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
    items: [
      { label: 'Reports', icon: 'pie-chart', route: '/reports', translationKey: 'nav.reports', permission: 'report:view', accent: '#8b5cf6' },
      { label: 'Activity Logs', icon: 'history', route: '/activity-logs', translationKey: 'nav.activity_logs', permission: 'activity-log:view', accent: '#a78bfa' },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // ADMINISTRATION
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'admin',
    label: 'Administration',
    icon: '⚙️',
    translationKey: 'nav.group.admin',
    accent: '#64748b',
    gradient: 'linear-gradient(135deg, #64748b, #94a3b8)',
    items: [
      { label: 'Users', icon: 'users-cog', route: '/users', translationKey: 'nav.users', permission: 'user:view', accent: '#64748b' },
      { label: 'Roles', icon: 'shield', route: '/roles', translationKey: 'nav.roles', permission: 'role:view', accent: '#475569' },
      { label: 'Settings', icon: 'settings', route: '/settings', translationKey: 'nav.settings', permission: 'settings:view', accent: '#94a3b8' },
    ]
  },

  // ═══════════════════════════════════════════════════════════════
  // PLATFORM (Admin Only)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'platform',
    label: 'Platform',
    icon: '🏢',
    translationKey: 'nav.group.platform',
    permission: 'admin',
    accent: '#ef4444',
    gradient: 'linear-gradient(135deg, #ef4444, #f87171)',
    items: [
      { label: 'Schools', icon: 'building', route: '/schools', translationKey: 'nav.schools', permission: 'admin', accent: '#ef4444' },
      { label: 'Pending Approvals', icon: 'clock', route: '/schools/pending', translationKey: 'nav.pending_approvals', permission: 'admin', accent: '#f59e0b' },
      { label: 'Subscriptions', icon: 'package', route: '/subscriptions', translationKey: 'nav.subscriptions', permission: 'admin', accent: '#8b5cf6' },
    ]
  },
];

/**
 * Legacy flat menu items for backwards compatibility
 * @deprecated Use NAV_GROUPS instead for grouped navigation
 */
export const MENU_ITEMS: MenuItem[] = NAV_GROUPS.flatMap(group => group.items);

export const THEME_PRESETS: { name: string; key: string; primary: string; accent: string }[] = [
  { name: 'Ocean', key: 'ocean', primary: '#3b82f6', accent: '#06b6d4' },
  { name: 'Emerald', key: 'emerald', primary: '#10b981', accent: '#34d399' },
  { name: 'Sunset', key: 'sunset', primary: '#f59e0b', accent: '#ef4444' },
  { name: 'Violet', key: 'violet', primary: '#8b5cf6', accent: '#a78bfa' },
  { name: 'Rose', key: 'rose', primary: '#f43f5e', accent: '#fb7185' },
  { name: 'Slate', key: 'slate', primary: '#64748b', accent: '#94a3b8' },
];


