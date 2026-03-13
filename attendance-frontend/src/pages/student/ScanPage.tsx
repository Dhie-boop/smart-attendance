import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { attendanceApi } from '../../api/attendance';
import { sessionsApi } from '../../api/sessions';
import { useAuth } from '../../context/AuthContext';
import type { SessionPublicResponse } from '../../types';

type ScanState = 'idle' | 'scanning' | 'success' | 'error';

function SessionCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState(() => Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)));

  useEffect(() => {
    const calc = () => Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
    setRemaining(calc());
    const id = setInterval(() => setRemaining(calc()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const expired = remaining <= 0;

  return (
    <div className={`flex items-center gap-1.5 text-xs font-bold ${expired ? 'text-red-600' : remaining <= 60 ? 'text-amber-600' : 'text-[#173F7A]'}`}>
      <span className="material-symbols-outlined text-sm">timer</span>
      {expired ? 'Expired' : display}
    </div>
  );
}

export default function ScanPage() {
  const { user } = useAuth();
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [message, setMessage] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [studentNumber, setStudentNumber] = useState(user?.student_id ?? '');
  const [activeSessions, setActiveSessions] = useState<SessionPublicResponse[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [mode, setMode] = useState<'camera' | 'manual'>('camera');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-reader';

  const stopScannerSafely = (scanner: Html5Qrcode | null) => {
    if (!scanner) return;
    try {
      const scannerWithState = scanner as unknown as {
        getState?: () => number;
        stop: () => Promise<unknown>;
      };
      const state = scannerWithState.getState?.();
      // html5-qrcode states: 2=scanning, 3=paused.
      if (state === 2 || state === 3) {
        void scannerWithState.stop().catch(() => {});
      }
    } catch {
      // Ignore scanner shutdown errors.
    }
  };

  useEffect(() => {
    setStudentNumber(user?.student_id ?? '');
  }, [user?.student_id]);

  useEffect(() => {
    let mounted = true;

    const fetchSessions = () => {
      setLoadingSessions(true);
      sessionsApi
        .listActive()
        .then((items) => {
          if (!mounted) return;
          // Only keep sessions whose QR code hasn't expired yet
          const now = Date.now();
          setActiveSessions(items.filter((s) => new Date(s.expires_at).getTime() > now));
        })
        .catch(() => {
          if (!mounted) return;
          setActiveSessions([]);
        })
        .finally(() => {
          if (!mounted) return;
          setLoadingSessions(false);
        });
    };

    fetchSessions();
    const intervalId = setInterval(fetchSessions, 15000);

    // Auto-remove expired sessions every second
    const cleanupId = setInterval(() => {
      setActiveSessions((prev) => {
        const now = Date.now();
        const filtered = prev.filter((s) => new Date(s.expires_at).getTime() > now);
        return filtered.length !== prev.length ? filtered : prev;
      });
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
      clearInterval(cleanupId);
    };
  }, []);

  /** Extract the JWT token from a QR payload that may be a URL or a raw token. */
  const extractToken = (qrPayload: string): string => {
    try {
      const url = new URL(qrPayload);
      return url.searchParams.get('token') ?? qrPayload;
    } catch {
      // Not a URL — treat as raw JWT token
      return qrPayload;
    }
  };

  const handleToken = async (rawPayload: string) => {
    if (scanState === 'success') return;

    const token = extractToken(rawPayload);

    if (!studentNumber.trim()) {
      setMessage('Enter your student ID before scanning or submitting a token.');
      setScanState('error');
      return;
    }

    setScanState('scanning');
    try {
      const res = await attendanceApi.scan({
        session_token: token,
        student_number: studentNumber.trim(),
        device_id: navigator.userAgent.slice(0, 50),
      });
      setMessage(res.message);
      setScanState('success');
      // Remove the attended session from the active list so it disappears immediately
      setActiveSessions((prev) => prev.filter((s) => s.session_token !== token));
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        'Failed to record attendance. Check the QR code and try again.';
      setMessage(msg);
      setScanState('error');
    }
  };

  useEffect(() => {
    if (mode !== 'camera' || scanState === 'success') return;

    let cancelled = false;
    let html5QrCode: Html5Qrcode;

    try {
      html5QrCode = new Html5Qrcode(scannerDivId);
      scannerRef.current = html5QrCode;
    } catch {
      setMessage('Unable to initialize camera scanner. Use manual token entry.');
      setScanState('error');
      setMode('manual');
      return;
    }

    html5QrCode
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          stopScannerSafely(html5QrCode);
          if (!cancelled) {
            void handleToken(decodedText);
          }
        },
        () => {}
      )
      .catch(() => {
        setMessage('Camera not accessible. Use manual token entry instead.');
        setScanState('error');
        setMode('manual');
      });

    return () => {
      cancelled = true;
      stopScannerSafely(html5QrCode);
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, scanState]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleToken(manualToken.trim());
  };

  const reset = () => {
    setScanState('idle');
    setMessage('');
    setManualToken('');
    // Restart by toggling mode momentarily
    if (mode === 'camera') {
      setMode('manual');
      setTimeout(() => setMode('camera'), 100);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-lg mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#173F7A]">Mark Attendance</h1>
        <p className="text-slate-500 mt-1">Scan the session QR code to confirm your attendance.</p>
      </div>

      {/* Student info banner */}
      <div className="bg-[#173F7A]/5 border border-[#173F7A]/10 rounded-xl p-4 flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-full bg-[#173F7A] text-white flex items-center justify-center font-bold text-sm">
          {(user?.full_name ?? 'Student User')
            .split(' ')
            .slice(0, 2)
            .map((n) => n[0])
            .join('')
            .toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-slate-800">{user?.full_name ?? 'Student'}</p>
          <p className="text-xs text-slate-500">{user?.student_id ?? 'No student ID on profile'}</p>
        </div>
      </div>

      {/* Student ID verification input */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Student ID Number</label>
        <input
          type="text"
          value={studentNumber}
          onChange={(e) => setStudentNumber(e.target.value)}
          placeholder="Enter your registered student ID"
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#113e79]/20 focus:border-[#113e79] transition-colors"
        />
        <p className="text-xs text-slate-400 mt-2">
          Your entered ID must match the ID registered in the database before attendance is marked.
        </p>
      </div>

      {/* Active sessions sent to this student */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800">Active Class Sessions</h3>
          {loadingSessions && <span className="text-xs text-slate-400">Refreshing...</span>}
        </div>

        {activeSessions.length === 0 ? (
          <p className="text-sm text-slate-500">No active sessions for your enrolled classes right now.</p>
        ) : (
          <div className="space-y-3">
            {activeSessions.map((session) => (
                <div key={session.id} className="border rounded-xl p-3 border-slate-100">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-slate-800 text-sm">
                      {session.course_code ? `${session.course_code} - ${session.course_name}` : session.course_name ?? 'Class Session'}
                    </p>
                    <SessionCountdown expiresAt={session.expires_at} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Lecturer: {session.lecturer_name ?? 'N/A'}
                  </p>

                      {session.qr_image_base64 && (
                        <img
                          src={`data:image/png;base64,${session.qr_image_base64}`}
                          alt="Session QR"
                          className="w-28 h-28 object-contain border border-slate-200 rounded-lg mt-3"
                        />
                      )}

                      <button
                        onClick={() => session.session_token && handleToken(session.session_token)}
                        disabled={!session.session_token || scanState === 'scanning' || !studentNumber.trim()}
                        className="mt-3 px-3 py-2 bg-[#173F7A] hover:bg-[#113e79] disabled:opacity-60 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        Mark Attendance For This Session
                      </button>
                </div>
            ))}
          </div>
        )}
      </div>

      {/* Mode selector */}
      <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
        <button
          onClick={() => setMode('camera')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'camera' ? 'bg-white text-[#113e79] shadow-sm' : 'text-slate-500'}`}
        >
          <span className="material-symbols-outlined text-sm align-middle mr-1">qr_code_scanner</span>
          Scan QR Code
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === 'manual' ? 'bg-white text-[#113e79] shadow-sm' : 'text-slate-500'}`}
        >
          <span className="material-symbols-outlined text-sm align-middle mr-1">keyboard</span>
          Enter Token
        </button>
      </div>

      {/* Result states */}
      {scanState === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center mb-6">
          <span className="material-symbols-outlined text-green-500 text-5xl block mb-3">check_circle</span>
          <h3 className="font-bold text-green-800 text-lg mb-1">Attendance Recorded!</h3>
          <p className="text-green-600 text-sm">{message}</p>
          <button onClick={reset} className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors">
            Scan Another
          </button>
        </div>
      )}

      {scanState === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center mb-6">
          <span className="material-symbols-outlined text-red-500 text-3xl block mb-2">error</span>
          <p className="text-red-700 text-sm font-medium">{message}</p>
          <button onClick={reset} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors">
            Try Again
          </button>
        </div>
      )}

      {/* Camera QR Scanner */}
      {mode === 'camera' && scanState !== 'success' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 text-sm text-slate-500 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#173F7A] text-sm">info</span>
            Point your camera at the QR code displayed by your lecturer.
          </div>
          <div id={scannerDivId} className="w-full" />
          {scanState === 'scanning' && (
            <div className="p-4 flex items-center justify-center gap-2 text-slate-500 text-sm">
              <div className="h-4 w-4 rounded-full border-2 border-[#173F7A] border-t-transparent animate-spin" />
              Processing…
            </div>
          )}
        </div>
      )}

      {/* Manual Token Entry */}
      {mode === 'manual' && scanState !== 'success' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Session Token</label>
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Enter the token from your lecturer"
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#113e79]/20 focus:border-[#113e79] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={!manualToken.trim() || scanState === 'scanning'}
              className="w-full py-3.5 bg-[#173F7A] hover:bg-[#113e79] disabled:opacity-60 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {scanState === 'scanning' ? (
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined">how_to_reg</span>
                  Mark Attendance
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
