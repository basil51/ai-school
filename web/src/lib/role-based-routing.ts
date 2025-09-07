/**
 * Role-based routing utilities
 */

export type UserRole = 'student' | 'teacher' | 'admin' | 'super_admin' | 'guardian';

/**
 * Get role-specific dashboard path
 */
export function getRoleDashboard(role: UserRole, locale: string = 'en'): string {
  switch (role) {
    case 'student': return `/${locale}/student/dashboard`;
    case 'teacher': return `/${locale}/teacher/dashboard`;
    case 'admin': return `/${locale}/admin/dashboard`;
    case 'super_admin': return `/${locale}/super-admin/dashboard`;
    case 'guardian': return `/${locale}/guardian/dashboard`;
    default: return `/${locale}/student/dashboard`;
  }
}

/**
 * Role-based route mapping
 */
export const roleBasedRoutes: Record<UserRole, string[]> = {
  student: ['/student', '/shared'],
  teacher: ['/teacher', '/shared'],
  admin: ['/admin', '/shared'],
  super_admin: ['/super-admin', '/admin', '/shared'],
  guardian: ['/guardian', '/shared']
};

/**
 * Check if user has access to a specific route
 */
export function hasRoleAccess(userRole: UserRole, pathname: string): boolean {
  const allowedRoutes = roleBasedRoutes[userRole] || [];
  return allowedRoutes.some(route => pathname.includes(route));
}

/**
 * Get role-specific navigation items
 */
export function getRoleNavigationItems(role: UserRole) {
  const baseItems = {
    student: [
      { label: 'Dashboard', path: '/student/dashboard' },
      { label: 'AI Teacher', path: '/student/ai-teacher' },
      { label: 'My Courses', path: '/student/courses' },
      { label: 'Assessments', path: '/student/assessments' },
      { label: 'Achievements', path: '/student/achievements' },
      { label: 'Study Chat', path: '/student/chat' },
      { label: 'My Progress', path: '/student/progress' },
      { label: 'Adaptive Teaching', path: '/student/adaptive-teaching' },
    ],
    teacher: [
      { label: 'Dashboard', path: '/teacher/dashboard' },
      { label: 'My Subjects', path: '/teacher/curriculum' },
      { label: 'Assessments', path: '/teacher/assessments' },
      { label: 'My Students', path: '/teacher/students' },
      { label: 'Class Progress', path: '/teacher/progress' },
      { label: 'Upload Content', path: '/teacher/rag' },
      { label: 'Student Chat', path: '/teacher/chat' },
      { label: 'Adaptive Teaching', path: '/teacher/adaptive-teaching' },
    ],
    admin: [
      { label: 'Dashboard', path: '/admin/dashboard' },
      { label: 'Manage Users', path: '/admin/users' },
      { label: 'Curriculum', path: '/admin/curriculum' },
      { label: 'School Analytics', path: '/admin/analytics' },
      { label: 'School Settings', path: '/admin/settings' },
      { label: 'Documents', path: '/admin/documents' },
      { label: 'Guardians', path: '/admin/guardians' },
      { label: 'Evaluations', path: '/admin/evaluations' },
      { label: 'Chat Management', path: '/admin/chat' },
    ],
    super_admin: [
      { label: 'Dashboard', path: '/super-admin/dashboard' },
      { label: 'Organizations', path: '/super-admin/organizations' },
      { label: 'All Users', path: '/super-admin/users' },
      { label: 'Global Analytics', path: '/super-admin/analytics' },
      { label: 'System Settings', path: '/super-admin/settings' },
    ],
    guardian: [
      { label: 'Dashboard', path: '/guardian/dashboard' },
      { label: 'My Children', path: '/guardian/children' },
      { label: 'Progress Reports', path: '/guardian/reports' },
      { label: 'Teacher Chat', path: '/guardian/chat' },
    ],
  };

  return baseItems[role] || [];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    student: 'Student',
    teacher: 'Teacher',
    admin: 'Administrator',
    super_admin: 'Super Administrator',
    guardian: 'Guardian',
  };

  return displayNames[role] || 'User';
}

/**
 * Get role color theme
 */
export function getRoleTheme(role: UserRole): { primary: string; secondary: string; gradient: string } {
  const themes: Record<UserRole, { primary: string; secondary: string; gradient: string }> = {
    student: {
      primary: 'violet',
      secondary: 'blue',
      gradient: 'from-violet-600 to-blue-600'
    },
    teacher: {
      primary: 'blue',
      secondary: 'indigo',
      gradient: 'from-blue-600 to-indigo-600'
    },
    admin: {
      primary: 'green',
      secondary: 'emerald',
      gradient: 'from-green-600 to-emerald-600'
    },
    super_admin: {
      primary: 'purple',
      secondary: 'pink',
      gradient: 'from-purple-600 to-pink-600'
    },
    guardian: {
      primary: 'pink',
      secondary: 'rose',
      gradient: 'from-pink-600 to-rose-600'
    },
  };

  return themes[role] || themes.student;
}
