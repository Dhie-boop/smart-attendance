import { useState } from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useActiveSessionCount } from '../../hooks/useActiveSessionCount';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const { user, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeSessionCount = useActiveSessionCount(user?.role === 'student');

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f7f8]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-[#113e79] border-t-transparent animate-spin" />
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-[#f6f7f8]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area — offset by sidebar on large screens */}
      <div className="flex-1 lg:ml-64 min-h-screen flex flex-col overflow-x-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 h-14 bg-[#173F7A] text-white flex items-center gap-3 px-4 shadow-md">
          <button
            onClick={() => setSidebarOpen(true)}
            className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Open menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="flex items-center gap-2 flex-1">
            <img
              src="/Cavendish_University.jpg"
              alt="Cavendish University Uganda"
              className="h-7 w-7 rounded-full object-cover border border-white/30"
            />
            <span className="font-bold text-sm tracking-tight">Cavendish University</span>
          </div>
          {user?.role === 'student' && activeSessionCount > 0 && (
            <Link
              to="/scan"
              className="relative h-9 w-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              aria-label={`${activeSessionCount} active session${activeSessionCount > 1 ? 's' : ''}`}
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                {activeSessionCount}
              </span>
            </Link>
          )}
        </header>

        <Outlet />
      </div>
    </div>
  );
}
