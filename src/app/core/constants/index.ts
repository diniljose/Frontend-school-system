import { UserRole } from '../models';

export interface MenuItem {
  label: string;
  icon: string;
  route: string;
  translationKey: string;
  roles: UserRole[];
  children?: MenuItem[];
  badge?: string;
}

export const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard', icon: 'grid', route: '/dashboard', translationKey: 'nav.dashboard', roles: Object.values(UserRole) },
  { label: 'Schools', icon: 'building', route: '/schools', translationKey: 'nav.schools', roles: [UserRole.PLATFORM_ADMIN] },
  { label: 'Pending Approvals', icon: 'clock', route: '/schools/pending', translationKey: 'nav.pending_approvals', roles: [UserRole.PLATFORM_ADMIN] },
  { label: 'Users', icon: 'users-cog', route: '/users', translationKey: 'nav.users', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL] },
  { label: 'Roles', icon: 'shield', route: '/roles', translationKey: 'nav.roles', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL] },
  { label: 'Academic Years', icon: 'calendar-range', route: '/academic-years', translationKey: 'nav.academic_years', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL] },
  { label: 'Classes', icon: 'layout-grid', route: '/classes', translationKey: 'nav.classes', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL, UserRole.TEACHER, UserRole.CLASS_TEACHER] },
  { label: 'Subjects', icon: 'book-open', route: '/subjects', translationKey: 'nav.subjects', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.CLASS_TEACHER] },
  { label: 'Students', icon: 'graduation-cap', route: '/students', translationKey: 'nav.students', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL, UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PARENT] },
  { label: 'Pending Students', icon: 'user-check', route: '/pending-students', translationKey: 'nav.pending_students', roles: [UserRole.PRINCIPAL, UserRole.CLASS_TEACHER] },
  { label: 'Teachers', icon: 'briefcase', route: '/teachers', translationKey: 'nav.teachers', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL] },
  { label: 'Pending Teachers', icon: 'user-plus', route: '/pending-teachers', translationKey: 'nav.pending_teachers', roles: [UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL] },
  { label: 'Parents', icon: 'heart-handshake', route: '/parents', translationKey: 'nav.parents', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL, UserRole.CLASS_TEACHER] },
  { label: 'Attendance', icon: 'clipboard-check', route: '/attendance', translationKey: 'nav.attendance', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL, UserRole.VICE_PRINCIPAL, UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.PARENT, UserRole.STUDENT] },
  { label: 'Exams', icon: 'file-text', route: '/exams', translationKey: 'nav.exams', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.STUDENT, UserRole.PARENT] },
  { label: 'Results', icon: 'bar-chart-2', route: '/results', translationKey: 'nav.results', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.STUDENT, UserRole.PARENT] },
  { label: 'Fees', icon: 'credit-card', route: '/fees', translationKey: 'nav.fees', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL, UserRole.ACCOUNTANT, UserRole.PARENT, UserRole.STUDENT] },
  { label: 'Transport', icon: 'bus', route: '/transport', translationKey: 'nav.transport', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL, UserRole.PARENT, UserRole.STUDENT] },
  { label: 'Timetable', icon: 'clock', route: '/timetable', translationKey: 'nav.timetable', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL, UserRole.TEACHER, UserRole.CLASS_TEACHER, UserRole.STUDENT, UserRole.PARENT] },
  { label: 'Promotions', icon: 'trending-up', route: '/promotions', translationKey: 'nav.promotions', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL] },
  { label: 'Transfers', icon: 'shuffle', route: '/transfers', translationKey: 'nav.transfers', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL] },
  { label: 'Notifications', icon: 'bell', route: '/notifications', translationKey: 'nav.notifications', roles: Object.values(UserRole) },
  { label: 'Reports', icon: 'pie-chart', route: '/reports', translationKey: 'nav.reports', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL, UserRole.ACCOUNTANT] },
  { label: 'Subscriptions', icon: 'package', route: '/subscriptions', translationKey: 'nav.subscriptions', roles: [UserRole.PLATFORM_ADMIN] },
  { label: 'Settings', icon: 'settings', route: '/settings', translationKey: 'nav.settings', roles: [UserRole.PLATFORM_ADMIN, UserRole.PRINCIPAL] },
];

export const THEME_PRESETS: { name: string; key: string; primary: string; accent: string }[] = [
  { name: 'Ocean', key: 'ocean', primary: '#3b82f6', accent: '#06b6d4' },
  { name: 'Emerald', key: 'emerald', primary: '#10b981', accent: '#34d399' },
  { name: 'Sunset', key: 'sunset', primary: '#f59e0b', accent: '#ef4444' },
  { name: 'Violet', key: 'violet', primary: '#8b5cf6', accent: '#a78bfa' },
  { name: 'Rose', key: 'rose', primary: '#f43f5e', accent: '#fb7185' },
  { name: 'Slate', key: 'slate', primary: '#64748b', accent: '#94a3b8' },
];

