import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesApi } from '../../api/courses';
import { sessionsApi } from '../../api/sessions';
import type { Course, ScheduledSessionCreate, ScheduledSessionResponse } from '../../types';

export default function ScheduleSessionPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledSessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [now, setNow] = useState(() => new Date());

  // Tick every 30 s so cards auto-update between "upcoming" and "ended"
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  /** True when the scheduled date + end_time is in the past. */
  const isSessionEnded = (s: ScheduledSessionResponse) => {
    // s.scheduled_date = "YYYY-MM-DD", s.end_time = "HH:MM:SS" or "HH:MM"
    const end = new Date(`${s.scheduled_date}T${s.end_time}`);
    return end.getTime() <= now.getTime();
  };

  // Form state
  const [form, setForm] = useState<ScheduledSessionCreate>({
    course_id: '',
    title: '',
    scheduled_date: '',
    start_time: '',
    end_time: '',
    location: '',
  });

  const fetchData = () => {
    Promise.all([
      coursesApi.list().catch(() => [] as Course[]),
      sessionsApi.listScheduled().catch(() => [] as ScheduledSessionResponse[]),
    ])
      .then(([c, s]) => {
        setCourses(c);
        setScheduled(s);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.course_id || !form.title || !form.scheduled_date || !form.start_time || !form.end_time) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      await sessionsApi.schedule({
        ...form,
        start_time: form.start_time + ':00',
        end_time: form.end_time + ':00',
      });
      setSuccess('Session scheduled successfully! Students will see it on their dashboard.');
      setForm({ course_id: '', title: '', scheduled_date: '', start_time: '', end_time: '', location: '' });
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to schedule session.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this scheduled session?')) return;
    try {
      await sessionsApi.cancelScheduled(id);
      setScheduled((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError('Failed to cancel session.');
    }
  };

  const handleActivate = async (s: ScheduledSessionResponse) => {
    setActivatingId(s.id);
    setError('');
    try {
      const session = await sessionsApi.activateScheduled(s.id);
      // Store the active session so StartSessionPage can recover it
      sessionStorage.setItem('active_session_id', session.id);
      navigate('/session/start', {
        state: { courseId: s.course_id, courseName: s.course_name, courseCode: s.course_code },
      });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to start recording.';
      setError(msg);
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#173F7A]">Schedule Classes</h1>
          <p className="text-slate-500 text-sm md:text-base mt-1">
            Plan upcoming sessions. Enrolled students will be notified on their dashboard.
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(''); setSuccess(''); }}
          className="bg-[#173F7A] text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-[#113e79] transition-all flex items-center gap-2 shrink-0"
        >
          <span className="material-symbols-outlined text-sm">add</span> Schedule New
        </button>
      </header>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span> {success}
        </div>
      )}

      {error && !showModal && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span> {error}
        </div>
      )}

      {/* Scheduled sessions list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 rounded-full border-4 border-[#113e79] border-t-transparent animate-spin" />
        </div>
      ) : scheduled.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-16 text-center text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3 block">event</span>
          No scheduled sessions yet. Click "Schedule New" to plan a class.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {scheduled.map((s) => (
            <div key={s.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:border-[#173F7A]/30 transition-all">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <span className="bg-[#C8B27A] text-[#173F7A] px-2.5 py-0.5 rounded text-xs font-bold">
                    {s.course_code}
                  </span>
                  <button
                    onClick={() => handleCancel(s.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    title="Cancel session"
                  >
                    <span className="material-symbols-outlined text-lg">close</span>
                  </button>
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-1">{s.title}</h4>
                <p className="text-sm text-slate-500 mb-3">{s.course_name}</p>
                <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">calendar_today</span>
                    {new Date(s.scheduled_date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
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

                {/* Session action — auto-switches between active & ended */}
                {isSessionEnded(s) ? (
                  <div className="mt-4 w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-500 text-sm font-bold py-2.5 rounded-lg">
                    <span className="material-symbols-outlined text-sm">event_busy</span>
                    Session Ended
                  </div>
                ) : (
                  <button
                    onClick={() => handleActivate(s)}
                    disabled={activatingId === s.id}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold py-2.5 rounded-lg transition-colors"
                  >
                    {activatingId === s.id ? (
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">radio_button_checked</span>
                        Start Recording Attendance
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-100 p-6 flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#173F7A] flex items-center gap-2">
                <span className="material-symbols-outlined">event</span> Schedule a Class Session
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Course *</label>
                <select
                  value={form.course_id}
                  onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#173F7A]/30 focus:border-[#173F7A] outline-none"
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Session Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Lecture 5 — Arrays & Pointers"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#173F7A]/30 focus:border-[#173F7A] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#173F7A]/30 focus:border-[#173F7A] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#173F7A]/30 focus:border-[#173F7A] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#173F7A]/30 focus:border-[#173F7A] outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Location (optional)</label>
                <input
                  type="text"
                  value={form.location ?? ''}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g., Room B204, Block 3"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#173F7A]/30 focus:border-[#173F7A] outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-[#173F7A] text-white font-bold text-sm hover:bg-[#113e79] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">event</span> Schedule
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
