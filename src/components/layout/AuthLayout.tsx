import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Left Branding Hero Sidebar (Desktop) */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-brand-900 via-slate-900 to-slate-950 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Abstract Background Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 group text-white">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight">Student-Corporate Matcher</span>
              <p className="text-xs text-brand-300">Intelligent Career Placement</p>
            </div>
          </Link>

          <div className="mt-20 space-y-6 max-w-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold border border-brand-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              AI Match Engine v1.0
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
              Bridging University Talent with Corporate Excellence
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Real-time mark verification, skill proficiency matching, and actionable academic deficit insights powered by Spring Boot & TiDB Cloud.
            </p>

            <div className="pt-4 space-y-3">
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Passwordless OTP login for instant security</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Teacher-verified official academic scores</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Strict & weighted relaxed matchmaking algorithm</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 pt-8 border-t border-white/10 text-xs text-slate-400 flex items-center justify-between">
          <span>Protected by 28-Day Refresh Rotation</span>
          <span className="flex items-center gap-1 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            Zero-Trust JWT
          </span>
        </div>
      </div>

      {/* Right Form Container */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-10 relative">
        <div className="absolute top-6 left-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
