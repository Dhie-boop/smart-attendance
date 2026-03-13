import { useEffect, useState } from 'react';
import { adminApi } from '../../api/courses';
import type { DashboardStats, CourseAnalytics } from '../../api/courses';

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

export default function AdminAnalyticsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [courseAnalytics, setCourseAnalytics] = useState<CourseAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.dashboardStats(), adminApi.analytics()])
      .then(([dashStats, analyticsData]) => {
        setStats(dashStats);
        setCourseAnalytics(analyticsData.courses);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Derive the highest-attendance course
  const topCourse = courseAnalytics.length > 0
    ? courseAnalytics.reduce((best, c) => (c.total_attendance_records > best.total_attendance_records ? c : best), courseAnalytics[0])
    : null;
  const totalAttRecords = courseAnalytics.reduce((s, c) => s + c.total_attendance_records, 0);
  const totalCourseSessions = courseAnalytics.reduce((s, c) => s + c.total_sessions, 0);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-6 md:mb-10">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#173F7A]">
            Analytics Overview
          </h1>
          <p className="text-slate-500 text-sm md:text-base mt-1">
            Real-time performance metrics for Cavendish University Uganda.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 w-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-24 animate-pulse" />
          ))}
        </div>
      ) : !stats ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm mb-10">
          Failed to load analytics data. Please try again.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-10">
            <StatCard icon="groups" label="Total Students" value={stats.total_students} color="bg-[#173F7A]/10 text-[#173F7A]" />
            <StatCard icon="menu_book" label="Active Courses" value={stats.total_courses} color="bg-[#C8B27A]/20 text-[#173F7A]" />
            <StatCard icon="how_to_reg" label="Attendance Rate" value={`${stats.attendance_rate}%`} color="bg-emerald-100 text-emerald-600" />
            <StatCard icon="sensors" label="Active Sessions" value={stats.active_sessions} color="bg-amber-100 text-amber-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-8">
            {/* Course Attendance Chart */}
            <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-[#173F7A] flex items-center gap-2">
                  <span className="material-symbols-outlined">bar_chart</span> Course Attendance
                </h3>
                <span className="text-xs text-slate-400">{courseAnalytics.length} courses</span>
              </div>
              {courseAnalytics.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  <span className="material-symbols-outlined text-4xl block mb-2">analytics</span>
                  No course data available yet.
                </div>
              ) : (
                <>
                  <div className="relative w-full bg-slate-50 rounded-lg flex items-end justify-around p-4 px-8 overflow-hidden mb-4" style={{ height: `${Math.max(200, Math.min(320, courseAnalytics.length * 50))}px` }}>
                    {courseAnalytics.map((course) => {
                      const maxRecords = Math.max(...courseAnalytics.map((c) => c.total_attendance_records), 1);
                      const pct = Math.round((course.total_attendance_records / maxRecords) * 100);
                      return (
                        <div key={course.course_id} className="flex flex-col items-center gap-2 flex-1">
                          <div className="w-8 relative flex flex-col justify-end" style={{ height: '180px' }}>
                            <div className="w-full bg-[#113e79]/15 rounded-t-sm absolute bottom-0" style={{ height: '100%' }} />
                            <div
                              className="w-full bg-[#113e79] rounded-t-sm absolute bottom-0 transition-all"
                              style={{ height: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold text-center leading-tight max-w-[60px] truncate" title={course.course_code}>
                            {course.course_code}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex justify-between">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Total Records</p>
                      <p className="text-sm font-bold text-slate-900">{totalAttRecords}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-medium">Total Sessions</p>
                      <p className="text-sm font-bold text-[#173F7A]">{totalCourseSessions}</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Course Performance */}
            <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-100 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-[#173F7A] flex items-center gap-2">
                  <span className="material-symbols-outlined">leaderboard</span> Top Courses
                </h3>
              </div>
              {courseAnalytics.length === 0 ? (
                <p className="text-center text-slate-400 py-8 text-sm">No data yet.</p>
              ) : (
                <div className="space-y-5 flex-1">
                  {[...courseAnalytics]
                    .sort((a, b) => b.total_attendance_records - a.total_attendance_records)
                    .slice(0, 5)
                    .map((c) => {
                      const maxRecords = Math.max(...courseAnalytics.map((x) => x.total_attendance_records), 1);
                      const pct = Math.round((c.total_attendance_records / maxRecords) * 100);
                      return (
                        <div key={c.course_id} className="flex flex-col gap-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold text-slate-700">{c.course_name}</span>
                            <span className="font-bold text-[#113e79]">{c.total_attendance_records}</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-[#113e79] h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
              {topCourse && (
                <div className="mt-6 pt-4">
                  <div className="bg-[#113e79]/5 border border-[#113e79]/10 rounded-lg p-3 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#113e79]">emoji_events</span>
                    <p className="text-xs text-slate-600">
                      <strong>{topCourse.course_code}</strong> leads with {topCourse.total_attendance_records} attendance records.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Course Details Table */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-[#173F7A] flex items-center gap-2">
                <span className="material-symbols-outlined">table_chart</span> Course Breakdown
              </h3>
              <span className="text-xs text-slate-400">{courseAnalytics.length} courses</span>
            </div>
            {courseAnalytics.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">No course analytics data available.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Course Code', 'Course Name', 'Sessions', 'Attendance Records', 'Avg per Session'].map((h) => (
                        <th key={h} className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {courseAnalytics.map((c) => (
                      <tr key={c.course_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-bold text-[#113e79] px-2.5 py-1 bg-[#113e79]/5 rounded border border-[#113e79]/10 text-sm">
                            {c.course_code}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{c.course_name}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">{c.total_sessions}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">{c.total_attendance_records}</td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {c.total_sessions > 0 ? (c.total_attendance_records / c.total_sessions).toFixed(1) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
