import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/courses';
import type { DashboardStats } from '../../api/courses';

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 md:gap-5">
      <div className={`h-11 w-11 md:h-14 md:w-14 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <span className="material-symbols-outlined text-2xl md:text-3xl">{icon}</span>
      </div>
      <div>
        <p className="text-slate-500 text-xs md:text-sm font-medium uppercase tracking-wider">{label}</p>
        <h3 className="text-2xl md:text-3xl font-bold text-slate-900">{value}</h3>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .dashboardStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const greet = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 md:mb-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#173F7A]">
            {greet()}, {user?.full_name.split(' ')[0]}
          </h1>
          <p className="text-slate-500 text-sm md:text-base mt-1">Here is your system overview for today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 w-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-24 animate-pulse" />
          ))}
        </div>
      ) : !stats ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm mb-10">
          Failed to load dashboard data. Please try again.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
            <StatCard icon="groups" label="Total Students" value={stats.total_students} color="bg-[#173F7A]/10 text-[#173F7A]" />
            <StatCard icon="school" label="Total Lecturers" value={stats.total_lecturers} color="bg-[#C8B27A]/20 text-[#173F7A]" />
            <StatCard icon="menu_book" label="Total Courses" value={stats.total_courses} color="bg-emerald-100 text-emerald-600" />
            <StatCard icon="sensors" label="Active Sessions" value={stats.active_sessions} color="bg-amber-100 text-amber-600" />
            <StatCard icon="event_available" label="Total Sessions" value={stats.total_sessions} color="bg-blue-100 text-blue-600" />
            <StatCard icon="percent" label="Attendance Rate" value={`${stats.attendance_rate}%`} color="bg-green-100 text-green-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Students */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#173F7A] flex items-center gap-2">
                  <span className="material-symbols-outlined">person_add</span> Recently Registered Students
                </h2>
                <Link to="/admin/students" className="text-sm font-bold text-[#173F7A] hover:underline">View All</Link>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {stats.recent_students.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    <span className="material-symbols-outlined text-4xl block mb-2">group</span>
                    No students registered yet.
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Student</th>
                        <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Email</th>
                        <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {stats.recent_students.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-[#173F7A]/10 flex items-center justify-center text-[#173F7A] font-bold text-xs">
                                {s.full_name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
                              </div>
                              <span className="font-medium text-slate-800">{s.full_name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-slate-500">{s.email}</td>
                          <td className="px-5 py-3 text-slate-500">
                            {new Date(s.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-6">
              <h2 className="text-xl font-bold text-[#173F7A] flex items-center gap-2">
                <span className="material-symbols-outlined">bolt</span> Quick Actions
              </h2>
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col gap-3">
                <Link
                  to="/admin/courses"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="h-10 w-10 rounded-lg bg-[#173F7A]/10 flex items-center justify-center text-[#173F7A] group-hover:bg-[#173F7A] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">menu_book</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Manage Courses</p>
                    <p className="text-xs text-slate-400">Create, assign & enroll</p>
                  </div>
                </Link>
                <Link
                  to="/admin/students"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">person_add</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Manage Students</p>
                    <p className="text-xs text-slate-400">Add & view students</p>
                  </div>
                </Link>
                <Link
                  to="/admin/analytics"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">analytics</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">View Analytics</p>
                    <p className="text-xs text-slate-400">Attendance & performance</p>
                  </div>
                </Link>
              </div>

              {/* Info card */}
              <div className="bg-[#173F7A] p-6 rounded-xl shadow-sm text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="font-bold text-lg mb-2">System Overview</h4>
                  <p className="text-sm text-white/80 leading-relaxed mb-4">
                    Monitor attendance, manage courses and students from one central dashboard.
                  </p>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10">
                  <span className="material-symbols-outlined text-8xl">admin_panel_settings</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
