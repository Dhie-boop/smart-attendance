import type { UserRole } from '../types';

const ROLE_HOME_MAP: Record<UserRole, string> = {
  admin: '/admin',
  lecturer: '/dashboard',
  student: '/student',
};

export function isUserRole(value: unknown): value is UserRole {
  return value === 'admin' || value === 'lecturer' || value === 'student';
}

export function getHomeRouteByRole(role: unknown): string {
  if (!isUserRole(role)) return '/login';
  return ROLE_HOME_MAP[role];
}
