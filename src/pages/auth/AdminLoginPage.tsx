import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { apiClient } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import { ApiResponse, AuthResponse } from '../../types';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sendToRecoveryEmail, setSendToRecoveryEmail] = useState(true);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'CREDENTIALS' | 'OTP'>('CREDENTIALS');
  const [loading, setLoading] = useState(false);

  const { isAuthenticated, userEmail: currentEmail, role: currentRole, login, logout } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Missing Credentials', 'Please enter admin email and master password');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post<ApiResponse<string>>('/auth/admin/otp/send', {
        email: email.trim(),
        password,
        sendToRecoveryEmail,
      });

      toast.success(
        'Credentials Validated',
        '6-digit OTP verification code has been dispatched.'
      );
      setStep('OTP');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Master Admin authentication failed';
      toast.error('Authentication Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
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
      if (authData.role !== 'ROLE_ADMIN') {
        toast.error('Access Denied', 'Authenticated account does not possess ROLE_ADMIN');
        return;
      }

      login(authData);
      toast.success('Admin Session Activated', 'Master Admin access verified');
      navigate('/admin/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Invalid or expired OTP code';
      toast.error('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20 mb-2">
          <ShieldCheck className="w-4 h-4" />
          Restricted Security Zone
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Master Admin 2-Step Login
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Password validation followed by mandatory 2FA OTP verification
        </p>
      </div>

      {/* Active Admin Session Card */}
      {isAuthenticated && currentRole === 'ROLE_ADMIN' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-400">
                Active Admin Session
              </span>
              <p className="text-xs font-semibold text-slate-900 dark:text-white font-mono">
                {currentEmail}
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
            onClick={() => navigate('/admin/dashboard')}
            className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Open Admin Dashboard</span>
          </button>
        </div>
      )}

      <div className="glass-card rounded-2xl p-6 sm:p-8 space-y-6 border-amber-200/50 dark:border-amber-900/40">
        {step === 'CREDENTIALS' ? (
          /* Step 1 Form */
          <form onSubmit={handleStep1} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Master Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@university.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="recoveryCheck"
                checked={sendToRecoveryEmail}
                onChange={(e) => setSendToRecoveryEmail(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
              />
              <label htmlFor="recoveryCheck" className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                Mirror OTP to registered backup recovery inbox
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 text-white dark:text-slate-950 text-xs sm:text-sm font-bold shadow-md disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Request 2-Step OTP Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Step 2 Form */
          <form onSubmit={handleStep2} className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 dark:text-slate-300">
                  Code sent to: <strong className="font-mono">{email}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setStep('CREDENTIALS')}
                  className="text-amber-700 dark:text-amber-400 font-semibold hover:underline"
                >
                  Change Email
                </button>
              </div>
              {sendToRecoveryEmail && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Mirrored to registered backup recovery inbox
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Enter 6-Digit Admin 2FA Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-center tracking-widest text-lg font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  autoFocus
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-bold shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify OTP & Unlock Console</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <div className="text-center text-xs text-slate-500">
        <Link to="/login" className="hover:text-brand-600 dark:hover:text-brand-400 underline">
          Switch to Standard Student / Faculty / Company Login
        </Link>
      </div>
    </div>
  );
};
