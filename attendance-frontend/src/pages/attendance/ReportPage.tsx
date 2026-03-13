import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { attendanceApi } from '../../api/attendance';
import { sessionsApi } from '../../api/sessions';
import type { AttendanceRecord, SessionReportSummary } from '../../types';

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    present: 'bg-green-100 text-green-700',
    late: 'bg-amber-100 text-amber-700',
    absent: 'bg-red-100 text-red-700',
  };
  const dot: Record<string, string> = {
    present: 'bg-green-600',
    late: 'bg-amber-600',
    absent: 'bg-red-600',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      <span className={`size-1.5 rounded-full ${dot[status] ?? 'bg-slate-600'}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

const AVATAR_COLORS = [
  'bg-[#113e79]/10 text-[#113e79]',
  'bg-amber-100 text-amber-700',
  'bg-red-100 text-red-700',
  'bg-green-100 text-green-700',
  'bg-purple-100 text-purple-700',
];

const PAGE_SIZE = 10;

export default function AttendanceReportPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const preSessionId = searchParams.get('session_id') ?? (location.state as { sessionId?: string } | null)?.sessionId ?? '';

  const [sessions, setSessions] = useState<SessionReportSummary[]>([]);
  const [selectedSession, setSelectedSession] = useState(preSessionId);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);

  useEffect(() => {
    sessionsApi.listReportSessions(true, true).then(setSessions);
  }, []);

  useEffect(() => {
    if (!selectedSession) return;
    setLoading(true);
    attendanceApi
      .report(selectedSession, 0, 200)
      .then(setRecords)
      .finally(() => setLoading(false));
  }, [selectedSession]);

  const session = sessions.find((s) => s.id === selectedSession);

  const filtered = records.filter((r) => {
    const matchSearch =
      !search ||
      (r.student_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.student_number ?? '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;
  const total = records.length;

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Attendance Report</h1>
            <p className="text-slate-500 font-medium">
              {session ? `${session.course_code} — ${session.course_name}` : 'Select a session to view the report'}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              <span className="hidden sm:inline">Export PDF</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-[#113e79] text-white rounded-lg text-sm font-bold hover:bg-[#173F7A] transition-colors shadow-sm">
              <span className="material-symbols-outlined text-sm">table_view</span>
              <span className="hidden sm:inline">Export Excel</span>
            </button>
          </div>
        </div>

        {/* Session selector */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Select Session</label>
          <select
            value={selectedSession}
            onChange={(e) => { setSelectedSession(e.target.value); setPage(0); }}
            className="w-full max-w-sm border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#113e79]/20 focus:border-[#113e79] transition-colors"
          >
            <option value="">-- Select a session --</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.course_code ? `${s.course_code} — ` : ''}
                {new Date(s.started_at).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                {s.is_active ? ' (Active)' : ' (Ended)'}
              </option>
            ))}
          </select>
        </div>

        {selectedSession && session && (
          <>
            {/* Session Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
              <div className="flex flex-col md:flex-row items-stretch">
                <div className="w-full md:w-1/3 min-h-[200px] relative bg-[#113e79]/5 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[120px] text-[#113e79]/20">school</span>
                </div>
                <div className="w-full md:w-2/3 p-6 flex flex-col justify-center gap-4">
                  <div>
                    <span className="inline-flex items-center rounded-full bg-[#113e79]/10 px-2.5 py-0.5 text-xs font-bold text-[#113e79] mb-2 uppercase tracking-wider">
                      Session Overview
                    </span>
                    <h3 className="text-xl font-bold text-slate-900">
                      {session.course_name ? `${session.course_name} — Session` : 'Attendance Session'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 text-slate-600">
                      <span className="material-symbols-outlined text-[#113e79]">event</span>
                      <span className="text-sm">{new Date(session.started_at).toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <span className="material-symbols-outlined text-[#113e79]">schedule</span>
                      <span className="text-sm">
                        {new Date(session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} —{' '}
                        {new Date(session.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <span className="material-symbols-outlined text-[#113e79]">groups</span>
                      <span className="text-sm">{total} Students Recorded</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <span className={`material-symbols-outlined ${session.is_active ? 'text-green-500' : 'text-slate-400'}`}>
                        {session.is_active ? 'sensors' : 'sensor_off'}
                      </span>
                      <span className="text-sm">{session.is_active ? 'Active' : 'Ended'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
              {[
                { label: 'Total Enrolled', value: total, badge: '100%', badgeColor: 'text-slate-400' },
                { label: 'Present Today', value: presentCount, badge: `${total > 0 ? Math.round((presentCount / total) * 100) : 0}%`, badgeColor: 'text-green-600 bg-green-50' },
                { label: 'Late Arrivals', value: lateCount, badge: `${total > 0 ? Math.round((lateCount / total) * 100) : 0}%`, badgeColor: 'text-amber-600 bg-amber-50' },
                { label: 'Absent', value: absentCount, badge: `${total > 0 ? Math.round((absentCount / total) * 100) : 0}%`, badgeColor: 'text-red-600 bg-red-50' },
              ].map((s) => (
                <div key={s.label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">{s.label}</p>
                  <div className="flex items-end justify-between mt-1">
                    <p className="text-2xl font-black text-slate-900">{s.value}</p>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${s.badgeColor}`}>{s.badge}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between gap-4">
                <div className="relative w-full md:w-80">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                    placeholder="Search by student name or ID..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-[#f6f7f8] text-sm focus:outline-none focus:ring-2 focus:ring-[#113e79]/50 transition-all"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                  className="text-sm border border-slate-200 bg-[#f6f7f8] rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#113e79]/50"
                >
                  <option value="all">All Status</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="absent">Absent</option>
                </select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="h-8 w-8 rounded-full border-4 border-[#113e79] border-t-transparent animate-spin" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50">
                        {['Student Details', 'Student ID', 'Check-in Time', 'Status', 'Actions'].map((h) => (
                          <th key={h} className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paged.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                            No records found.
                          </td>
                        </tr>
                      ) : (
                        paged.map((r, idx) => (
                          <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`size-9 rounded-full flex items-center justify-center font-bold text-xs ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                                  {r.student_name ? getInitials(r.student_name) : 'S'}
                                </div>
                                <span className="text-sm font-semibold">{r.student_name ?? r.student_id}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{r.student_number ?? r.student_id}</td>
                            <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                              {r.status === 'absent' ? '—' : new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-6 py-4">
                              <StatusBadge status={r.status} />
                            </td>
                            <td className="px-6 py-4">
                              <button className="text-slate-400 hover:text-[#113e79] transition-colors">
                                <span className="material-symbols-outlined">more_vert</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Showing {Math.min(page * PAGE_SIZE + 1, filtered.length)}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} students
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="px-3 py-1 rounded border border-slate-300 text-slate-600 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-sm leading-none">chevron_left</span>
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`px-3 py-1 rounded text-sm font-bold ${page === i ? 'bg-[#113e79] text-white' : 'border border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => page < totalPages - 1 && setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                    className="px-3 py-1 rounded border border-slate-300 text-slate-600 disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-sm leading-none">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {!selectedSession && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm py-20 text-center text-slate-400">
            <span className="material-symbols-outlined text-6xl block mb-4">bar_chart</span>
            <p className="text-lg font-medium">Select a session above to view attendance data</p>
          </div>
        )}
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 px-10 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">© 2026 Cavendish University Uganda — Faculty of Science &amp; Technology</p>
          <div className="flex gap-6">
            {['Help Center', 'Policy', 'Support'].map((l) => (
              <a key={l} href="#" className="text-sm text-slate-500 hover:text-[#113e79]">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
