import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { attendanceApi } from '../../api/attendance';

type Status = 'loading' | 'success' | 'error' | 'login-required';

export default function AutoAttendPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const submitted = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      setStatus('error');
      setMessage('No attendance token found in the link.');
      return;
    }

    if (!user) {
      // Save token so we can resume after login
      sessionStorage.setItem('pending_attend_token', token);
      setStatus('login-required');
      return;
    }

    if (user.role !== 'student') {
      setStatus('error');
      setMessage('Only students can mark attendance via QR scan.');
      return;
    }

    if (submitted.current) return;
    submitted.current = true;

    const studentNumber = user.student_id ?? '';
    if (!studentNumber) {
      setStatus('error');
      setMessage('Your account does not have a student ID. Contact your administrator.');
      return;
    }

    attendanceApi
      .scan({
        session_token: token,
        student_number: studentNumber,
        device_id: navigator.userAgent.slice(0, 50),
      })
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((e: unknown) => {
        const detail =
          (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
          'Failed to record attendance. The QR code may be expired or invalid.';
        setStatus('error');
        setMessage(detail);
      });
  }, [authLoading, user, token]);

  // If user just logged in and there's a pending token, redirect back here
  useEffect(() => {
    if (!authLoading && user && !token) {
      const pending = sessionStorage.getItem('pending_attend_token');
      if (pending) {
        sessionStorage.removeItem('pending_attend_token');
        navigate(`/attend?token=${encodeURIComponent(pending)}`, { replace: true });
      }
    }
  }, [authLoading, user, token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 max-w-md w-full text-center">
        {/* Loading / submitting */}
        {status === 'loading' && (
          <>
            <div className="h-16 w-16 mx-auto mb-6 rounded-full border-4 border-[#173F7A] border-t-transparent animate-spin" />
            <h2 className="text-xl font-bold text-[#173F7A] mb-2">Recording Attendance…</h2>
            <p className="text-slate-500 text-sm">Please wait while we verify your scan.</p>
          </>
        )}

        {/* Success */}
        {status === 'success' && (
          <>
            <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-green-600 text-5xl">check_circle</span>
            </div>
            <h2 className="text-xl font-bold text-green-800 mb-2">Attendance Recorded!</h2>
            <p className="text-green-600 text-sm mb-6">{message}</p>
            <Link
              to="/student"
              className="inline-block px-6 py-3 bg-[#173F7A] text-white rounded-xl font-semibold hover:bg-[#113e79] transition-colors"
            >
              Go to Dashboard
            </Link>
          </>
        )}

        {/* Error */}
        {status === 'error' && (
          <>
            <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-red-600 text-5xl">error</span>
            </div>
            <h2 className="text-xl font-bold text-red-800 mb-2">Could Not Mark Attendance</h2>
            <p className="text-red-600 text-sm mb-6">{message}</p>
            <div className="flex gap-3 justify-center">
              <Link
                to="/scan"
                className="px-5 py-2.5 bg-[#173F7A] text-white rounded-xl font-semibold hover:bg-[#113e79] transition-colors text-sm"
              >
                Try Manual Scan
              </Link>
              <Link
                to="/student"
                className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-colors text-sm"
              >
                Dashboard
              </Link>
            </div>
          </>
        )}

        {/* Not logged in */}
        {status === 'login-required' && (
          <>
            <div className="h-20 w-20 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-600 text-5xl">login</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Login Required</h2>
            <p className="text-slate-500 text-sm mb-6">
              Please log in with your student account to mark your attendance. Your scan will be submitted automatically after login.
            </p>
            <Link
              to="/login"
              className="inline-block px-6 py-3 bg-[#173F7A] text-white rounded-xl font-semibold hover:bg-[#113e79] transition-colors"
            >
              Log In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
