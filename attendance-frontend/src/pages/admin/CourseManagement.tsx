import { useEffect, useState } from 'react';
import { adminApi, coursesApi } from '../../api/courses';
import type { Course, CourseCreate, User } from '../../types';

const ITEMS_PER_PAGE = 10;

function CreateCourseModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (c: Course) => void;
}) {
  const [form, setForm] = useState<CourseCreate>({ code: '', name: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const course = await coursesApi.create(form);
      onCreated(course);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Failed to create course.';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Create New Course</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Course Code</label>
            <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="e.g. BIT311" required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#113e79]/20 focus:border-[#113e79]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Course Name</label>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Advanced Web Development" required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#113e79]/20 focus:border-[#113e79]" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-[#113e79] hover:bg-[#173F7A] disabled:opacity-60 text-white font-bold rounded-xl flex items-center justify-center gap-2">
              {saving ? <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AssignLecturerModal({ course, onClose, onAssigned }: { course: Course; onClose: () => void; onAssigned: (c: Course) => void }) {
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [selected, setSelected] = useState(course.lecturer_id ?? '');
  const [saving, setSaving] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.listUsers(0, 200).then((users) => setLecturers(users.filter((u) => u.role === 'lecturer')));
  }, []);

  const handleAssign = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      const updated = await coursesApi.assignLecturer(course.id, selected);
      onAssigned(updated);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to assign lecturer.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    setUnassigning(true);
    setError('');
    try {
      const updated = await coursesApi.unassignLecturer(course.id);
      onAssigned(updated);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to unassign lecturer.');
    } finally {
      setUnassigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Assign Lecturer</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">Assign a lecturer to <strong>{course.code} — {course.name}</strong></p>
        {course.lecturer_name && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm flex items-start gap-2">
            <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5 shrink-0">warning</span>
            <span>This course is currently assigned to <strong>{course.lecturer_name}</strong>. You must unassign the current lecturer before assigning a new one.</span>
          </div>
        )}
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#113e79]/20 focus:border-[#113e79]">
          <option value="">-- Select a lecturer --</option>
          {lecturers.map((l) => <option key={l.id} value={l.id}>{l.full_name} ({l.email})</option>)}
        </select>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
          {course.lecturer_id ? (
            <button onClick={handleUnassign} disabled={unassigning} className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-xl flex items-center justify-center gap-2">
              {unassigning ? <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : 'Unassign Current'}
            </button>
          ) : (
            <button onClick={handleAssign} disabled={!selected || saving} className="flex-1 py-3 bg-[#113e79] hover:bg-[#173F7A] disabled:opacity-60 text-white font-bold rounded-xl flex items-center justify-center gap-2">
              {saving ? <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : 'Assign'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function EnrollStudentsModal({ course, onClose, onEnrolled }: { course: Course; onClose: () => void; onEnrolled: () => void }) {
  const [allStudents, setAllStudents] = useState<User[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([adminApi.listUsers(0, 200), coursesApi.listStudents(course.id)]).then(([users, enrolled]) => {
      setAllStudents(users.filter((u) => u.role === 'student'));
      setEnrolledIds(new Set(enrolled.map((s) => s.id)));
    });
  }, [course.id]);

  const filtered = allStudents.filter((s) => {
    const q = search.toLowerCase();
    return s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.student_id ?? '').toLowerCase().includes(q);
  });

  const handleEnroll = async (studentId: string) => {
    setEnrolling(studentId);
    setError('');
    try {
      await coursesApi.enroll(course.id, studentId);
      setEnrolledIds((prev) => new Set(prev).add(studentId));
      onEnrolled();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Failed to enroll student.');
    } finally {
      setEnrolling(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900">Enroll Students</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><span className="material-symbols-outlined">close</span></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">Add students to <strong>{course.code} — {course.name}</strong></p>
        {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <div className="relative mb-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#113e79]/20" />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {filtered.length === 0 ? (
            <p className="text-center text-slate-400 py-8 text-sm">No students found</p>
          ) : (
            filtered.map((s) => {
              const isEnrolled = enrolledIds.has(s.id);
              return (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#113e79]/10 text-[#113e79] flex items-center justify-center text-xs font-bold">
                      {s.full_name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{s.full_name}</p>
                      <p className="text-xs text-slate-400">{s.student_id ?? s.email}</p>
                    </div>
                  </div>
                  {isEnrolled ? (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Enrolled</span>
                  ) : (
                    <button onClick={() => handleEnroll(s.id)} disabled={enrolling === s.id} className="text-xs font-bold text-[#113e79] bg-[#113e79]/10 hover:bg-[#113e79]/20 px-3 py-1.5 rounded transition-colors disabled:opacity-60">
                      {enrolling === s.id ? '...' : 'Enroll'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">Done</button>
      </div>
    </div>
  );
}

export default function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [assignLecturerCourse, setAssignLecturerCourse] = useState<Course | null>(null);
  const [enrollStudentsCourse, setEnrollStudentsCourse] = useState<Course | null>(null);

  const refreshCourses = () => coursesApi.list(0, 200).then(setCourses);

  useEffect(() => {
    refreshCourses().finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  const paged = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  return (
    <div className="p-4 md:p-6 lg:px-10 py-4 md:py-8 max-w-7xl mx-auto w-full">
      {showCreate && (
        <CreateCourseModal
          onClose={() => setShowCreate(false)}
          onCreated={(c) => {
            setCourses((prev) => [c, ...prev]);
            setShowCreate(false);
          }}
        />
      )}
      {assignLecturerCourse && (
        <AssignLecturerModal
          course={assignLecturerCourse}
          onClose={() => setAssignLecturerCourse(null)}
          onAssigned={(updated) => {
            setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
            setAssignLecturerCourse(null);
          }}
        />
      )}
      {enrollStudentsCourse && (
        <EnrollStudentsModal
          course={enrollStudentsCourse}
          onClose={() => setEnrollStudentsCourse(null)}
          onEnrolled={refreshCourses}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 md:gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Course Management</h1>
          <p className="text-slate-500 text-base mt-1">Overview of all academic modules for the current semester.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg h-11 px-6 bg-[#113e79] text-white text-sm font-bold shadow-lg shadow-[#113e79]/20 hover:bg-[#173F7A] transition-all"
        >
          <span className="material-symbols-outlined text-xl">add_circle</span>
          Create New Course
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {[
          { label: 'Total Courses', value: courses.length, icon: 'book', color: 'text-[#113e79]' },
          { label: 'With Lecturer', value: courses.filter((c) => c.lecturer_id).length, icon: 'person', color: 'text-[#EAB308]' },
          { label: 'Unassigned', value: courses.filter((c) => !c.lecturer_id).length, icon: 'person_off', color: 'text-red-500' },
          { label: 'Total Enrollments', value: courses.reduce((sum, c) => sum + (c.enrolled_count ?? 0), 0), icon: 'group', color: 'text-green-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">{s.label}</span>
              <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
            </div>
            <p className="text-2xl font-black text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search & filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="w-full lg:flex-1 relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              placeholder="Search by course code or title…"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-[#113e79]/20 text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 h-11 px-4 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-semibold">
              <span className="material-symbols-outlined text-xl">filter_list</span>
              Department
            </button>
            <button className="flex items-center gap-2 h-11 px-4 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-semibold">
              <span className="material-symbols-outlined text-xl">download</span>
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-4 border-[#113e79] border-t-transparent animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Course Code', 'Title', 'Lecturer', 'Students', 'Created', 'Actions'].map((h) => (
                      <th key={h} className={`px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                        No courses found.
                      </td>
                    </tr>
                  ) : (
                    paged.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-[#113e79] px-2.5 py-1 bg-[#113e79]/5 rounded border border-[#113e79]/10 text-sm">
                            {c.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-900">{c.name}</p>
                        </td>
                        <td className="px-6 py-4">
                          {c.lecturer_name ? (
                            <span className="text-sm text-slate-700">{c.lecturer_name}</span>
                          ) : (
                            <button onClick={() => setAssignLecturerCourse(c)} className="text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded transition-colors">
                              Assign Lecturer
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">{c.enrolled_count ?? 0}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => setAssignLecturerCourse(c)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-[#113e79] transition-colors" title="Assign Lecturer">
                              <span className="material-symbols-outlined text-lg">person_add</span>
                            </button>
                            <button onClick={() => setEnrollStudentsCourse(c)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-[#113e79] transition-colors" title="Enroll Students">
                              <span className="material-symbols-outlined text-lg">group_add</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200">
              <span className="text-sm text-slate-500">
                Showing {Math.min(page * ITEMS_PER_PAGE + 1, filtered.length)}–
                {Math.min((page + 1) * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} courses
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`h-9 w-9 flex items-center justify-center rounded-lg text-sm font-bold ${page === i ? 'bg-[#113e79] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-slate-200 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#113e79]">verified</span>
          <p className="text-sm text-slate-500">© 2026 Cavendish University Uganda. Academic Management System.</p>
        </div>
        <div className="flex gap-6 text-sm text-slate-400">
          <a href="#" className="hover:text-[#113e79]">Help Center</a>
          <a href="#" className="hover:text-[#113e79]">Policy</a>
          <a href="#" className="hover:text-[#113e79]">Support</a>
        </div>
      </footer>
    </div>
  );
}
