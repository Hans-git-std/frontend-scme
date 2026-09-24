import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  GraduationCap,
  Building2,
  Mail,
  KeyRound,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  HelpCircle,
  UserPlus,
  ChevronDown,
  ChevronUp,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { ApiResponse, AuthResponse, UserRole } from '../../types';
import { APP_CONFIG } from '../../config/env';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryRole = searchParams.get('role');
  const queryEmail = searchParams.get('email');

  const initialRole: UserRole =
    queryRole === 'company'
      ? 'ROLE_COMPANY'
      : queryRole === 'teacher'
      ? 'ROLE_TEACHER'
      : queryRole === 'student'
      ? 'ROLE_STUDENT'
      : 'ROLE_STUDENT';

  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState(queryEmail || '');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'OTP' | 'TEACHER_PENDING'>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  const { isAuthenticated, userEmail: currentEmail, role: currentRole, login, logout } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  // Load last remembered email if not provided in URL
  useEffect(() => {
    if (!queryEmail) {
      try {
        const savedEmail = localStorage.getItem('scme_last_email');
        const savedRole = localStorage.getItem('scme_last_role') as UserRole;
        if (savedEmail) setEmail(savedEmail);
        if (savedRole && !queryRole && ['ROLE_STUDENT', 'ROLE_TEACHER', 'ROLE_COMPANY'].includes(savedRole)) {
          setRole(savedRole);
        }
      } catch {
        // Storage unavailable
      }
    }
  }, [queryEmail, queryRole]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      toast.error('Missing Email', 'Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      try {
        localStorage.setItem('scme_last_email', email.trim());
        localStorage.setItem('scme_last_role', role);
      } catch {}

      await apiClient.post<ApiResponse<string>>('/auth/otp/send', {
        email: email.trim(),
        role,
      });

      toast.success('OTP Dispatched', `A 6-digit verification code was sent to ${email.trim()}`);
      setStep('OTP');
      setCooldown(APP_CONFIG.otpCooldownSeconds);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send OTP';

      if (
        err.response?.status === 403 &&
        (errorMsg.includes('verification is in waiting') || errorMsg.includes('No further action'))
      ) {
        setStep('TEACHER_PENDING');
        return;
      }

      toast.error('Authentication Notice', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) {
      toast.error('Invalid OTP', 'Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/otp/verify', {
        email: email.trim(),
        otp: otp.trim(),
      });

      const authData = res.data.data;
      login(authData);
      toast.success('Welcome!', 'Logged in successfully');

      // Navigate directly to role-specific workspace
      if (authData.role === 'ROLE_STUDENT') {
        navigate('/student/dashboard');
      } else if (authData.role === 'ROLE_TEACHER') {
        navigate('/teacher/dashboard');
      } else if (authData.role === 'ROLE_COMPANY') {
        navigate('/company/dashboard');
      } else if (authData.role === 'ROLE_ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Invalid or expired OTP code';
      toast.error('Login Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    if (currentRole === 'ROLE_STUDENT') navigate('/student/dashboard');
    else if (currentRole === 'ROLE_TEACHER') navigate('/teacher/dashboard');
    else if (currentRole === 'ROLE_COMPANY') navigate('/company/dashboard');
    else if (currentRole === 'ROLE_ADMIN') navigate('/admin/dashboard');
    else navigate('/');
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Sign In to Your Workspace
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Passwordless Email OTP authentication for Students, Faculty, and Employers
        </p>
      </div>

      {/* Active Session Notification Card (No Forceful Loop) */}
      {isAuthenticated && currentRole && (
        <div className="p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400">
                Active Session
              </span>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {currentEmail} ({currentRole.replace('ROLE_', '')})
              </p>
            </div>
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
          <button
            onClick={handleGoToDashboard}
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Continue to Active Dashboard</span>
          </button>
        </div>
      )}

      {step === 'TEACHER_PENDING' ? (
        /* Faculty Waiting State View */
        <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/30 text-center space-y-4 animate-in fade-in">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
              ⏳ Verification Pending
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed max-w-sm mx-auto">
              Your faculty registration is currently under review by the University Administrator. Once approved, you will be able to verify student semester marks.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                setStep('EMAIL');
                setOtp('');
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Return to Login
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Role Tabs */}
          {step === 'EMAIL' && (
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
              <button
                type="button"
                onClick={() => setRole('ROLE_STUDENT')}
                className={`py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  role === 'ROLE_STUDENT'
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('ROLE_TEACHER')}
                className={`py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  role === 'ROLE_TEACHER'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Faculty
              </button>
              <button
                type="button"
                onClick={() => setRole('ROLE_COMPANY')}
                className={`py-2 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  role === 'ROLE_COMPANY'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Company
              </button>
            </div>
          )}

          {step === 'EMAIL' ? (
            /* Step 1: Email Form */
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {role === 'ROLE_STUDENT'
                    ? 'Student Email Address'
                    : role === 'ROLE_TEACHER'
                    ? 'Faculty Email Address'
                    : 'Corporate Recruiter Email'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={
                      role === 'ROLE_STUDENT'
                        ? 'student@university.edu'
                        : role === 'ROLE_TEACHER'
                        ? 'faculty@university.edu'
                        : 'recruiting@company.com'
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Request Login Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Quick Evaluator Pre-fill Shortcuts */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold">Evaluator Quick Fill:</span>
                  <Link to="/admin/login" className="text-amber-600 dark:text-amber-400 font-semibold hover:underline">
                    Master Admin Console →
                  </Link>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setRole('ROLE_STUDENT');
                      setEmail('student@university.edu');
                    }}
                    className="py-1 px-1.5 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800/70 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-950/40 text-slate-600 dark:text-slate-400 transition-colors text-center truncate"
                  >
                    🎓 Student
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRole('ROLE_TEACHER');
                      setEmail('faculty@university.edu');
                    }}
                    className="py-1 px-1.5 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800/70 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/40 text-slate-600 dark:text-slate-400 transition-colors text-center truncate"
                  >
                    👨‍🏫 Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRole('ROLE_COMPANY');
                      setEmail('recruiting@company.com');
                    }}
                    className="py-1 px-1.5 text-[11px] font-medium rounded-lg bg-slate-100 dark:bg-slate-800/70 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-950/40 text-slate-600 dark:text-slate-400 transition-colors text-center truncate"
                  >
                    🏢 Company
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* Step 2: OTP Verification Form */
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 rounded-xl bg-brand-50/60 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900/50 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                  Sent to: <strong className="font-mono">{email}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStep('EMAIL');
                    setShowTroubleshoot(false);
                  }}
                  className="text-brand-600 dark:text-brand-400 font-semibold hover:underline shrink-0"
                >
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Enter 6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-center tracking-widest text-lg font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-brand-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Code & Sign In</span>
                  </>
                )}
              </button>

              {/* Resend & Troubleshoot Row */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <button
                    type="button"
                    onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 font-medium"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-brand-500" />
                    <span>Didn't receive code?</span>
                    {showTroubleshoot ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  <button
                    type="button"
                    disabled={cooldown > 0 || loading}
                    onClick={() => handleSendOtp()}
                    className="font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-40"
                  >
                    {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend Code'}
                  </button>
                </div>

                {/* Troubleshoot Accordion */}
                {showTroubleshoot && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-2 animate-in fade-in">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                      Troubleshooting Checklist:
                    </div>
                    <ul className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 list-disc list-inside">
                      <li>
                        Check your <strong>Spam, Junk, or Promotions</strong> folder.
                      </li>
                      <li>
                        Verify your email address is correct: <strong className="font-mono text-slate-800 dark:text-slate-200">{email}</strong>.
                      </li>
                      <li>
                        Delivery usually takes 5 to 20 seconds. Code is valid for <strong>5 minutes</strong>.
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      )}

      {/* Partner Registration Links */}
      <div className="text-center text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p>
          New university student?{' '}
          <Link to="/register/student" className="font-semibold text-brand-600 dark:text-brand-400 hover:underline">
            Register Student Profile
          </Link>
        </p>
        <p>
          New faculty member?{' '}
          <Link to="/register/teacher" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            Register Faculty Account
          </Link>
        </p>
        <p>
          New corporate partner?{' '}
          <Link to="/register/company" className="font-semibold text-sky-600 dark:text-sky-400 hover:underline">
            Register Employer Account
          </Link>
        </p>
      </div>
    </div>
  );
};
