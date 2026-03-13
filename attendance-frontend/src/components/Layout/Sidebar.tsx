import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useActiveSessionCount } from '../../hooks/useActiveSessionCount';
import type { UserRole } from '../../types';

interface NavItem {
  to: string;
  icon: string;
  label: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard', roles: ['lecturer'] },
  { to: '/admin', icon: 'dashboard', label: 'Dashboard', roles: ['admin'] },
  { to: '/student', icon: 'dashboard', label: 'Dashboard', roles: ['student'] },
  { to: '/courses', icon: 'book', label: 'My Courses', roles: ['lecturer'] },
  { to: '/session/schedule', icon: 'event', label: 'Schedule Classes', roles: ['lecturer'] },
  { to: '/reports', icon: 'assessment', label: 'Reports', roles: ['lecturer'] },
  // Admin
  { to: '/admin/analytics', icon: 'analytics', label: 'Analytics', roles: ['admin'] },
  { to: '/admin/courses', icon: 'school', label: 'Courses', roles: ['admin'] },
  { to: '/admin/students', icon: 'groups', label: 'Students', roles: ['admin'] },
  // Student
  { to: '/scan', icon: 'qr_code_scanner', label: 'Scan QR Code', roles: ['student'] },
  { to: '/history', icon: 'history', label: 'My Attendance', roles: ['student'] },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const activeSessionCount = useActiveSessionCount(user?.role === 'student');

  if (!user) return null;

  const visibleNav = NAV_ITEMS.filter((item) => item.roles.includes(user.role));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          w-64 bg-[#173F7A] text-white flex flex-col fixed h-full z-50 shrink-0
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        {/* Logo + close button (mobile) */}
        <div className="p-5 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/Cavendish_University.jpg"
                alt="Cavendish University Uganda"
                className="h-9 w-9 rounded-full object-cover shrink-0 border-2 border-white/30"
              />
              <div className="flex flex-col">
                <span className="text-sm font-bold leading-tight">Cavendish University</span>
                <span className="text-[9px] uppercase tracking-widest text-white/70">Uganda</span>
              </div>
            </div>
            {/* Close button — mobile only */}
            <button
              onClick={onClose}
              className="lg:hidden h-8 w-8 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close menu"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Nav */}
          <nav className="flex flex-col gap-1">
            {visibleNav.map((item) => {
              const active =
                item.to === '/admin' || item.to === '/student'
                  ? location.pathname === item.to
                  : location.pathname === item.to || location.pathname.startsWith(item.to + '/');
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    active ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl relative">
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  {item.to === '/scan' && activeSessionCount > 0 && (
                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                      {activeSessionCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User footer */}
        <div className="mt-auto p-5 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-9 w-9 rounded-full bg-[#C8B27A] flex items-center justify-center text-[#173F7A] font-bold text-sm shrink-0">
              {getInitials(user.full_name)}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold truncate">{user.full_name}</span>
              <span className="text-xs text-white/60 capitalize">{user.role}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full py-2 bg-[#C8B27A] hover:bg-[#b89d60] text-[#173F7A] font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
