import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceApi } from '../../api/attendance';
import type { AttendanceRecord } from '../../types';

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
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status] ?? 'bg-slate-600'}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function AttendanceHistoryPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    if (!user) return;
    attendanceApi
      .studentHistory(user.id, page * PAGE_SIZE, PAGE_SIZE)
      .then(setRecords)
      .finally(() => setLoading(false));
  }, [user, page]);

  const totalPresent = records.filter((r) => r.status === 'present').length;
  const totalLate = records.filter((r) => r.status === 'late').length;
  const totalAbsent = records.filter((r) => r.status === 'absent').length;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#173F7A]">My Attendance History</h1>
        <p className="text-slate-500 mt-1">Track your attendance across all your enrolled courses.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Present</p>
          <div className="flex items-end justify-between mt-1">
            <p className="text-2xl font-black text-slate-900">{totalPresent}</p>
            <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
              {records.length > 0 ? Math.round((totalPresent / records.length) * 100) : 0}%
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Late</p>
          <div className="flex items-end justify-between mt-1">
            <p className="text-2xl font-black text-slate-900">{totalLate}</p>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              {records.length > 0 ? Math.round((totalLate / records.length) * 100) : 0}%
            </span>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Absent</p>
          <div className="flex items-end justify-between mt-1">
            <p className="text-2xl font-black text-slate-900">{totalAbsent}</p>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
              {records.length > 0 ? Math.round((totalAbsent / records.length) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 rounded-full border-4 border-[#113e79] border-t-transparent animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl block mb-3">history</span>
            No attendance records found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date &amp; Time</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-800">{r.course_code ?? 'N/A'}</div>
                        <div className="text-xs text-slate-400">{r.course_name ?? ''}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(r.timestamp).toLocaleString([], {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={r.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-500">Showing {records.length} records</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 rounded border border-slate-200 text-slate-600 disabled:opacity-40 text-sm"
                >
                  <span className="material-symbols-outlined text-sm leading-none">chevron_left</span>
                </button>
                <button className="px-3 py-1 rounded bg-[#113e79] text-white font-bold text-sm">{page + 1}</button>
                <button
                  onClick={() => records.length === PAGE_SIZE && setPage((p) => p + 1)}
                  disabled={records.length < PAGE_SIZE}
                  className="px-3 py-1 rounded border border-slate-200 text-slate-600 disabled:opacity-40 text-sm"
                >
                  <span className="material-symbols-outlined text-sm leading-none">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
