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
}

/**
 * Dynamic permission-based menu configuration
 * Menu items are shown based on user's actual permissions from their role
 * Permissions are managed by principal and stored in the database
 * When permissions change, menu updates automatically
 */
export const MENU_ITEMS: MenuItem[] = [
  // Always visible to authenticated users
  { label: 'Dashboard', icon: 'grid', route: '/dashboard', translationKey: 'nav.dashboard', permission: '*' },
  
  // Platform admin only
  { label: 'Schools', icon: 'building', route: '/schools', translationKey: 'nav.schools', permission: 'admin' },
  { label: 'Pending Approvals', icon: 'clock', route: '/schools/pending', translationKey: 'nav.pending_approvals', permission: 'admin' },
  { label: 'Subscriptions', icon: 'package', route: '/subscriptions', translationKey: 'nav.subscriptions', permission: 'admin' },
  
  // Permission-based items - shown based on role permissions from database
  { label: 'Users', icon: 'users-cog', route: '/users', translationKey: 'nav.users', permission: 'user:view' },
  { label: 'Roles', icon: 'shield', route: '/roles', translationKey: 'nav.roles', permission: 'role:view' },
  { label: 'Academic Years', icon: 'calendar-range', route: '/academic-years', translationKey: 'nav.academic_years', permission: 'academic-year:view' },
  { label: 'Classes', icon: 'layout-grid', route: '/classes', translationKey: 'nav.classes', permission: 'class:view' },
  { label: 'Subjects', icon: 'book-open', route: '/subjects', translationKey: 'nav.subjects', permission: 'subject:view' },
  { label: 'Students', icon: 'graduation-cap', route: '/students', translationKey: 'nav.students', permission: 'student:view' },
  { label: 'Pending Students', icon: 'user-check', route: '/pending-students', translationKey: 'nav.pending_students', permission: 'student:approve' },
  { label: 'Teachers', icon: 'briefcase', route: '/teachers', translationKey: 'nav.teachers', permission: 'teacher:view' },
  { label: 'Pending Teachers', icon: 'user-plus', route: '/pending-teachers', translationKey: 'nav.pending_teachers', permission: 'teacher:approve' },
  { label: 'Parents', icon: 'heart-handshake', route: '/parents', translationKey: 'nav.parents', permission: 'parent:view' },
  { label: 'Attendance', icon: 'clipboard-check', route: '/attendance', translationKey: 'nav.attendance', permission: 'attendance:view' },
  { label: 'Exams', icon: 'file-text', route: '/exams', translationKey: 'nav.exams', permission: 'exam:view' },
  { label: 'Results', icon: 'bar-chart-2', route: '/results', translationKey: 'nav.results', permission: 'result:view' },
  { label: 'Fees', icon: 'credit-card', route: '/fees', translationKey: 'nav.fees', permission: 'fee:view' },
  { label: 'Transport', icon: 'bus', route: '/transport', translationKey: 'nav.transport', permission: 'transport:view' },
  { label: 'Timetable', icon: 'clock', route: '/timetable', translationKey: 'nav.timetable', permission: 'timetable:view' },
  { label: 'Enrollments', icon: 'user-plus', route: '/enrollments', translationKey: 'nav.enrollments', permission: 'enrollment:view' },
  { label: 'Promotions', icon: 'trending-up', route: '/promotions', translationKey: 'nav.promotions', permission: 'promotion:view' },
  { label: 'Transfers', icon: 'shuffle', route: '/transfers', translationKey: 'nav.transfers', permission: 'transfer:view' },
  { label: 'Events', icon: 'calendar', route: '/events', translationKey: 'nav.events', permission: 'event:view' },
  { label: 'Activity Logs', icon: 'history', route: '/activity-logs', translationKey: 'nav.activity_logs', permission: 'activity-log:view' },
  { label: 'Reports', icon: 'pie-chart', route: '/reports', translationKey: 'nav.reports', permission: 'report:view' },
  { label: 'Settings', icon: 'settings', route: '/settings', translationKey: 'nav.settings', permission: 'settings:view' },
  
  // Always visible
  { label: 'Notifications', icon: 'bell', route: '/notifications', translationKey: 'nav.notifications', permission: '*' },
];

export const THEME_PRESETS: { name: string; key: string; primary: string; accent: string }[] = [
  { name: 'Ocean', key: 'ocean', primary: '#3b82f6', accent: '#06b6d4' },
  { name: 'Emerald', key: 'emerald', primary: '#10b981', accent: '#34d399' },
  { name: 'Sunset', key: 'sunset', primary: '#f59e0b', accent: '#ef4444' },
  { name: 'Violet', key: 'violet', primary: '#8b5cf6', accent: '#a78bfa' },
  { name: 'Rose', key: 'rose', primary: '#f43f5e', accent: '#fb7185' },
  { name: 'Slate', key: 'slate', primary: '#64748b', accent: '#94a3b8' },
];

