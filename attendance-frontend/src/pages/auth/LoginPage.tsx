import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import type { UserRole } from '../../types';
import { getHomeRouteByRole } from '../../utils/roleRouting';

type Tab = UserRole;

export default function LoginPage() {
  const { user, login } = useAuth();

  const [tab, setTab] = useState<Tab>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    return <Navigate to={getHomeRouteByRole(user.role)} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        'Invalid email or password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const tabs: { value: Tab; label: string }[] = [
    { value: 'student', label: 'Student' },
    { value: 'lecturer', label: 'Lecturer' },
    { value: 'admin', label: 'Admin' },
  ];

  return (
    <div className="flex min-h-screen font-[Manrope,sans-serif]">
      {/* Left Hero Panel — visible only on large screens */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-[#0D2A56] overflow-hidden">
        {/* Decorative background */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, #1a3a6b 0%, #0d1f3c 100%)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D2A56] via-[#0D2A56]/90 to-transparent" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img
              src="/Cavendish_University.jpg"
              alt="Cavendish University Uganda"
              className="h-14 w-14 rounded-xl object-cover border-2 border-white/30 shadow-lg"
            />
            <span className="text-white font-bold text-xl tracking-tight">Cavendish University Uganda</span>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 max-w-lg">
          <h1 className="text-white font-black text-5xl leading-tight mb-6">
            Digital Excellence in{' '}
            <span className="text-blue-400">Education.</span>
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed mb-8">
            The CUU Attendance Portal streamlines academic tracking, empowering students and staff
            with real-time digital accountability and performance insights.
          </p>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              <span className="material-symbols-outlined text-white text-sm">verified_user</span>
              <span className="text-white text-xs font-medium uppercase tracking-wider">Secure Access</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
              <span className="material-symbols-outlined text-white text-sm">schedule</span>
              <span className="text-white text-xs font-medium uppercase tracking-wider">Real-time Sync</span>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-blue-200/60 text-sm">© 2026 Cavendish University Uganda. Success begins at Cavendish.</p>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-white min-h-screen">
        <div className="w-full max-w-[440px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <div className="flex items-center gap-3">
              <img
                src="/Cavendish_University.jpg"
                alt="Cavendish University Uganda"
                className="h-12 w-12 rounded-xl object-cover border border-slate-200 shadow-sm"
              />
              <div className="flex flex-col">
                <h2 className="text-[#113e79] font-bold text-lg leading-tight">Cavendish University</h2>
                <span className="text-slate-500 text-xs">Uganda — Attendance Portal</span>
              </div>
            </div>
          </div>

          <div className="mb-7 md:mb-10">
            <h2 className="text-slate-900 font-bold text-2xl md:text-3xl mb-2 md:mb-3">Welcome Back</h2>
            <p className="text-slate-500">Please sign in to access your dashboard.</p>
          </div>

          {/* Role Tabs */}
          <div className="mb-6 md:mb-8">
            <div className="flex p-1 bg-slate-100 rounded-xl">
              {tabs.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    tab === value
                      ? 'bg-white text-[#113e79] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2" htmlFor="email">
                University Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">mail</span>
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. j.doe@cavendish.ac.ug"
                  required
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#113e79]/20 focus:border-[#113e79] transition-colors outline-none text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700" htmlFor="password">
                  Password
                </label>
                <button type="button" className="text-xs font-bold text-[#113e79] hover:text-[#173F7A] transition-colors">
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">lock</span>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#113e79]/20 focus:border-[#113e79] transition-colors outline-none text-slate-900 placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  <span className="material-symbols-outlined text-slate-400 text-[20px] hover:text-slate-600 transition-colors">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 text-[#113e79] border-slate-300 rounded focus:ring-[#113e79] transition-colors"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-slate-600">
                Keep me signed in for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#173F7A] hover:bg-[#113e79] disabled:opacity-70 text-white font-bold rounded-xl transition-all shadow-lg shadow-[#113e79]/20 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-7 md:mt-10 pt-6 md:pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              New to the university portal?{' '}
              <a href="/register" className="text-[#113e79] font-bold hover:underline">
                Register your account
              </a>
            </p>
          </div>

          <div className="mt-8 flex justify-center gap-6">
            {['Help Center', 'Privacy Policy', 'Technical Support'].map((link) => (
              <a key={link} href="#" className="text-slate-400 hover:text-slate-600 text-xs transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
