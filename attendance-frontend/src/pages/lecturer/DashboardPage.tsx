import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { coursesApi } from '../../api/courses';
import { sessionsApi } from '../../api/sessions';
import type { Course, SessionPublicResponse, ScheduledSessionResponse } from '../../types';

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

export default function LecturerDashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeSessions, setActiveSessions] = useState<SessionPublicResponse[]>([]);
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSessionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([coursesApi.list(), sessionsApi.listActive(), sessionsApi.listScheduled()])
      .then(([c, s, sch]) => {
        setCourses(c);
        setActiveSessions(s);
        setScheduledSessions(sch);
      })
      .finally(() => setLoading(false));
  }, []);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todaysClasses = scheduledSessions.filter((s) => s.scheduled_date === todayStr).length;

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
          <p className="text-slate-500 text-sm md:text-base mt-1">Here is what is happening with your classes today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="h-10 w-10 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </div>
      </header>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
          <StatCard icon="book" label="My Courses" value={courses.length} color="bg-[#173F7A]/10 text-[#173F7A]" />
          <StatCard icon="sensors" label="Active Sessions" value={activeSessions.length} color="bg-green-100 text-green-600" />
          <StatCard icon="calendar_today" label="Today's Classes" value={todaysClasses} color="bg-[#C8B27A]/20 text-[#173F7A]" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Courses */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#173F7A] flex items-center gap-2">
              <span className="material-symbols-outlined">book</span> My Courses
            </h2>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-100 h-24 animate-pulse" />
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2 block">book</span>
              No courses assigned yet.
            </div>
          ) : (
            courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden group hover:border-[#173F7A]/30 transition-all"
              >
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-[#C8B27A] text-[#173F7A] px-3 py-1 rounded text-xs font-bold whitespace-nowrap">
                      {course.code}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 group-hover:text-[#173F7A] transition-colors">
                        {course.name}
                      </h4>
                    </div>
                  </div>
                  <Link
                    to={`/reports?course_id=${course.id}`}
                    className="bg-[#173F7A] text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:bg-[#113e79] transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">assessment</span> View Reports
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Sessions Panel */}
        <div className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-[#173F7A] flex items-center gap-2">
            <span className="material-symbols-outlined">history</span> Active Sessions
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            {activeSessions.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-4">No active sessions right now.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {activeSessions.slice(0, 5).map((s) => (
                  <div key={s.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-400">Session</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">Active</span>
                    </div>
                    <h5 className="text-sm font-bold text-slate-800">
                      Started {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </h5>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-slate-500">
                        Expires {new Date(s.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <Link
                        to={`/reports?session_id=${s.id}`}
                        className="text-xs font-bold text-[#173F7A] hover:text-[#C8B27A] transition-colors"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link
              to="/reports"
              className="w-full mt-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center"
            >
              View All Reports
            </Link>
          </div>

          {/* Info card */}
          <div className="bg-[#173F7A] p-6 rounded-xl shadow-sm text-white relative overflow-hidden">
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-2">Quick Tip</h4>
              <p className="text-sm text-white/80 leading-relaxed mb-4">
                Schedule your classes and activate attendance recording when ready. Students scan the QR code to mark their attendance automatically.
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
