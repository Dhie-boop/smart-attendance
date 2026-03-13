import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { coursesApi } from '../../api/courses';
import { sessionsApi } from '../../api/sessions';
import { attendanceApi } from '../../api/attendance';
import type { Course, SessionResponse, AttendanceRecord } from '../../types';

function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    setRemaining(calc());
    const id = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  return { remaining, display: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}` };
}

export default function StartSessionPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as { courseId?: string; courseName?: string; courseCode?: string } | null;

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>(state?.courseId ?? '');
  const [activeSession, setActiveSession] = useState<SessionResponse | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState('');
  const [recovering, setRecovering] = useState(true);

  useEffect(() => {
    coursesApi.list().then(setCourses);
  }, []);

  // On mount, recover active session from sessionStorage
  useEffect(() => {
    const savedId = sessionStorage.getItem('active_session_id');
    if (savedId) {
      sessionsApi
        .get(savedId)
        .then((session) => {
          if (session.is_active) {
            setActiveSession(session);
            setSelectedCourse(session.course_id);
          } else {
            sessionStorage.removeItem('active_session_id');
          }
        })
        .catch(() => {
          sessionStorage.removeItem('active_session_id');
        })
        .finally(() => setRecovering(false));
    } else {
      setRecovering(false);
    }
  }, []);

  // Poll attendance records while session is active
  useEffect(() => {
    if (!activeSession) return;
    const fetch = () =>
      attendanceApi.report(activeSession.id).then(setRecords).catch(() => {});
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [activeSession]);

  const startSession = async () => {
    if (!selectedCourse) return;
    setError('');
    setStarting(true);
    try {
      const session = await sessionsApi.start({ course_id: selectedCourse });
      setActiveSession(session);
      sessionStorage.setItem('active_session_id', session.id);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to start session.';
      setError(msg);
    } finally {
      setStarting(false);
    }
  };

  const endSession = async () => {
    if (!activeSession) return;
    setEnding(true);
    try {
      await sessionsApi.end(activeSession.id);
      sessionStorage.removeItem('active_session_id');
      navigate('/reports', { state: { sessionId: activeSession.id } });
    } catch {
      setEnding(false);
    }
  };

  const course = courses.find((c) => c.id === selectedCourse);

  const { remaining: qrRemaining, display: qrCountdown } = useCountdown(activeSession?.expires_at ?? null);

  const presentCount = records.filter((r) => r.status === 'present').length;
  const lateCount = records.filter((r) => r.status === 'late').length;
  const absentCount = records.filter((r) => r.status === 'absent').length;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#173F7A]">Start Session</h1>
        <p className="text-slate-500 mt-1">Generate a QR code and monitor live attendance.</p>
      </div>

      {recovering ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 rounded-full border-4 border-[#113e79] border-t-transparent animate-spin" />
          <span className="ml-3 text-slate-500 text-sm">Checking for active session…</span>
        </div>
      ) : !activeSession ? (
        /* ── Course Selection ── */
        <div className="max-w-lg">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="course-select">
                Select Course
              </label>
              <select
                id="course-select"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#113e79]/20 focus:border-[#113e79] transition-colors"
              >
                <option value="">-- Choose a course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
            )}

            <button
              onClick={startSession}
              disabled={!selectedCourse || starting}
              className="w-full py-3.5 bg-[#173F7A] hover:bg-[#113e79] disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#113e79]/20"
            >
              {starting ? (
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined">play_arrow</span>
                  Start Session &amp; Generate QR
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* ── Active Session Monitor ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          {/* QR Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 md:p-8 flex flex-col items-center gap-5 md:gap-6">
            <div className="text-center">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold mb-3 ${qrRemaining > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <span className={`h-2 w-2 rounded-full mr-2 ${qrRemaining > 0 ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                {qrRemaining > 0 ? 'Session Active' : 'QR Expired'}
              </span>
              <h3 className="text-xl font-bold text-slate-900">
                {course?.code} — {course?.name}
              </h3>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[#173F7A] text-lg">timer</span>
                <span className={`text-2xl font-mono font-black ${qrRemaining <= 60 ? 'text-red-600' : qrRemaining <= 120 ? 'text-amber-600' : 'text-[#173F7A]'}`}>
                  {qrCountdown}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                {qrRemaining > 0 ? 'Time remaining for QR code' : 'QR code has expired — end session or start a new one'}
              </p>
            </div>

            {/* QR Code */}
            <div className="p-4 bg-white border-2 border-[#173F7A]/20 rounded-2xl shadow-inner">
              {activeSession.qr_image_base64 ? (
                <img
                  src={`data:image/png;base64,${activeSession.qr_image_base64}`}
                  alt="QR Code"
                  className="w-56 h-56 object-contain"
                />
              ) : (
                <QRCodeSVG value={activeSession.id} size={224} level="H" />
              )}
            </div>

            <p className="text-xs text-slate-400 text-center">
              Students scan this QR code with the attendance portal to mark their attendance.
            </p>

            <button
              onClick={endSession}
              disabled={ending}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {ending ? (
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined">stop_circle</span>
                  End Session
                </>
              )}
            </button>
          </div>

          {/* Attendance Monitor */}
          <div className="flex flex-col gap-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-100 p-4 text-center shadow-sm">
                <p className="text-2xl font-black text-green-600">{presentCount}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Present</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 p-4 text-center shadow-sm">
                <p className="text-2xl font-black text-amber-600">{lateCount}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Late</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-100 p-4 text-center shadow-sm">
                <p className="text-2xl font-black text-red-600">{absentCount}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">Absent</p>
              </div>
            </div>

            {/* Live table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex-1">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h4 className="font-bold text-slate-800">Live Attendance</h4>
                <span className="text-xs text-slate-400">Auto-refreshes every 5s</span>
              </div>
              <div className="overflow-auto max-h-80">
                {records.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    <span className="material-symbols-outlined text-4xl block mb-2">qr_code_scanner</span>
                    Waiting for students to scan…
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Student</th>
                        <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Check-in</th>
                        <th className="px-5 py-3 text-xs font-bold text-slate-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {records.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-[#173F7A]/10 flex items-center justify-center text-[#173F7A] font-bold text-xs">
                                {(r.student_name ?? 'S')[0] ?? 'S'}
                              </div>
                              <span className="font-medium text-slate-800">{r.student_name ?? r.student_id}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-slate-500">
                            {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-5 py-3">
                            <StatusBadge status={r.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    present: 'bg-green-100 text-green-700',
    late: 'bg-amber-100 text-amber-700',
    absent: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'present' ? 'bg-green-600' : status === 'late' ? 'bg-amber-600' : 'bg-red-600'}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
