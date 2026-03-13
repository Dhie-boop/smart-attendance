import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { studentApi } from '../../api/courses';
import { sessionsApi } from '../../api/sessions';
import type { StudentCourse, ScheduledSessionResponse } from '../../types';

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

function AttendanceMeter({ present, late, absent }: { present: number; late: number; absent: number }) {
  const total = present + late + absent;
  if (total === 0) return <span className="text-xs text-slate-400">No sessions yet</span>;
  const pct = Math.round((present / total) * 100);
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold text-slate-700">{pct}% attendance</span>
        <span className="text-xs text-slate-400">{present}/{total} sessions</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626',
          }}
        />
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledSessionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([studentApi.myCourses(), sessionsApi.listScheduled()])
      .then(([c, s]) => {
        setCourses(c);
        setScheduled(s);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalPresent = courses.reduce((s, c) => s + c.present_count, 0);
  const totalLate = courses.reduce((s, c) => s + c.late_count, 0);
  const totalAbsent = courses.reduce((s, c) => s + c.absent_count, 0);
  const totalRecords = totalPresent + totalLate + totalAbsent;
  const totalSessions = courses.reduce((s, c) => s + c.total_sessions, 0);
  const overallRate = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

  // Filter to only upcoming scheduled sessions (today and future)
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingScheduled = scheduled.filter((s) => s.scheduled_date >= todayStr);

  const greet = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="mb-6 md:mb-10">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#173F7A]">
          {greet()}, {user?.full_name.split(' ')[0]}
        </h1>
        <p className="text-slate-500 text-sm md:text-base mt-1">
          Welcome to your student dashboard. Here is an overview of your courses and attendance.
        </p>
      </header>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-10">
          <StatCard icon="book" label="My Courses" value={courses.length} color="bg-[#173F7A]/10 text-[#173F7A]" />
          <StatCard icon="check_circle" label="Overall Attendance" value={`${overallRate}%`} color="bg-green-100 text-green-600" />
          <StatCard icon="schedule" label="Total Sessions" value={totalSessions} color="bg-[#C8B27A]/20 text-[#173F7A]" />
          <StatCard icon="event" label="Upcoming Classes" value={upcomingScheduled.length} color="bg-blue-100 text-blue-600" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Course Cards */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#173F7A] flex items-center gap-2">
              <span className="material-symbols-outlined">book</span> My Course Units
            </h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 h-32 animate-pulse" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 block">school</span>
              No courses assigned yet. Your admin will enroll you in course units.
            </div>
          ) : (
            courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:border-[#173F7A]/30 transition-all"
              >
                <div className="p-5 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-[#C8B27A] text-[#173F7A] px-3 py-1 rounded text-xs font-bold whitespace-nowrap">
                        {course.code}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-slate-900">{course.name}</h4>
                        {course.lecturer_name && (
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">person</span>
                            {course.lecturer_name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Attendance stats row */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-green-50 rounded-lg px-3 py-2 text-center">
                      <p className="text-lg font-black text-green-700">{course.present_count}</p>
                      <p className="text-[10px] font-medium text-green-600 uppercase">Present</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg px-3 py-2 text-center">
                      <p className="text-lg font-black text-amber-700">{course.late_count}</p>
                      <p className="text-[10px] font-medium text-amber-600 uppercase">Late</p>
                    </div>
                    <div className="bg-red-50 rounded-lg px-3 py-2 text-center">
                      <p className="text-lg font-black text-red-700">{course.absent_count}</p>
                      <p className="text-[10px] font-medium text-red-600 uppercase">Absent</p>
                    </div>
                  </div>

                  <AttendanceMeter
                    present={course.present_count}
                    late={course.late_count}
                    absent={course.absent_count}
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Upcoming Sessions & Quick Actions */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-[#173F7A] flex items-center gap-2">
            <span className="material-symbols-outlined">event</span> Upcoming Classes
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            {upcomingScheduled.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No upcoming scheduled classes.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {upcomingScheduled.slice(0, 5).map((s) => (
                  <div key={s.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-[#173F7A] bg-[#173F7A]/10 px-2 py-0.5 rounded">
                        {s.course_code}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(s.scheduled_date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <h5 className="text-sm font-bold text-slate-800 mt-1">{s.title}</h5>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {s.start_time.slice(0, 5)} — {s.end_time.slice(0, 5)}
                      </span>
                      {s.location && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">location_on</span>
                          {s.location}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-3">
            <Link
              to="/scan"
              className="bg-[#173F7A] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#113e79] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">qr_code_scanner</span> Scan QR Code
            </Link>
            <Link
              to="/history"
              className="bg-white text-[#173F7A] py-3 rounded-xl font-bold text-sm border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">history</span> View Full History
            </Link>
          </div>

          {/* Info card */}
          <div className="bg-[#173F7A] p-6 rounded-xl shadow-sm text-white relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-2">Attendance Tip</h4>
              <p className="text-sm text-white/80 leading-relaxed">
                When your lecturer starts a live session, scan the QR code displayed on the projector to mark your attendance automatically.
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <span className="material-symbols-outlined text-8xl">qr_code</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
