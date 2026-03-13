import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { coursesApi } from '../../api/courses';
import type { Course } from '../../types';

export default function LecturerCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    coursesApi
      .list()
      .then(setCourses)
      .catch(() => setError('Failed to load courses.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 bg-[#f6f7f8] min-h-screen">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-500 mt-1">View and manage your assigned courses</p>
      </div>

      {/* Search */}
      <div className="mb-6 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
            search
          </span>
          <input
            type="text"
            placeholder="Search by course name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#113e79]/30 bg-white"
          />
        </div>
        <span className="text-sm text-gray-500">{filtered.length} course{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#113e79] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <span className="material-symbols-outlined text-5xl mb-4 block">book</span>
          <p className="text-lg font-medium">No courses found</p>
          <p className="text-sm mt-1">
            {search ? 'Try a different search term' : 'No courses have been assigned to you yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow"
            >
              {/* Course code badge */}
              <div className="flex items-center justify-between">
                <span className="inline-block bg-[#113e79]/10 text-[#113e79] text-xs font-bold px-3 py-1 rounded-full">
                  {course.code}
                </span>
                <span className="material-symbols-outlined text-[#C8B27A] text-2xl">school</span>
              </div>

              {/* Name */}
              <h3 className="text-base font-semibold text-gray-900 leading-snug">{course.name}</h3>

              {/* Meta */}
              <p className="text-xs text-gray-400">
                Added {new Date(course.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>

              {/* Actions */}
              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50">
                <Link
                  to={`/reports?course_id=${course.id}`}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#113e79] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#0D2A56] transition-colors"
                >
                  <span className="material-symbols-outlined text-base">assessment</span>
                  View Reports
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
