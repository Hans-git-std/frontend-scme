import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Building2,
  LogIn,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  UserPlus,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, role, userEmail, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (role === 'ROLE_STUDENT') return '/student/dashboard';
    if (role === 'ROLE_TEACHER') return '/teacher/dashboard';
    if (role === 'ROLE_COMPANY') return '/company/dashboard';
    if (role === 'ROLE_ADMIN') return '/admin/dashboard';
    return '/';
  };

  return (
    <nav className="glass-header border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                SCM Platform
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  AI Match
                </span>
              </span>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium -mt-0.5">
                Student-Corporate Matcher
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link
              to="/companies"
              className="text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1.5 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Companies
            </Link>

            <Link
              to="/register/teacher"
              className="text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1.5 transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              Faculty Portal
            </Link>

            <Link
              to="/register/company"
              className="text-xs lg:text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1.5 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              For Employers
            </Link>

            {/* 3D Learning Hub Link */}
            <a
              href="https://hanslearn.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-500/10 via-sky-500/10 to-indigo-500/10 border border-brand-500/20 text-xs font-bold text-brand-700 dark:text-brand-300 hover:bg-brand-500/20 transition-all shadow-xs"
              title="Interactive 3D simulators & subject visualizers by Hans Raj"
            >
              <Sparkles className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>3D Learning Hub</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={getDashboardPath()}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300 text-xs font-semibold border border-brand-200 dark:border-brand-800 hover:bg-brand-100 transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/register/student"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/50 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  New Student?
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Controls: Direct Sign In + Hamburger */}
          <div className="flex md:hidden items-center gap-2">
            {!isAuthenticated ? (
              <Link
                to="/login"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-600 text-white text-xs font-bold shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
            ) : (
              <Link
                to={getDashboardPath()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 text-xs font-semibold border border-brand-200"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-200">
          <Link
            to="/register/student"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-900"
          >
            <UserPlus className="w-4 h-4" />
            Register as New Student
          </Link>
          <a
            href="https://hanslearn.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold text-brand-700 dark:text-brand-300 bg-gradient-to-r from-brand-50 to-sky-50 dark:from-brand-950/40 dark:to-sky-950/40 border border-brand-200 dark:border-brand-800"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-500" />
              <span>HansLearn 3D Learning Hub</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
          <Link
            to="/companies"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Building2 className="w-4 h-4" />
            Company Directory
          </Link>
          <Link
            to="/register/teacher"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <GraduationCap className="w-4 h-4" />
            Faculty Portal
          </Link>
          <Link
            to="/register/company"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Building2 className="w-4 h-4" />
            For Employers
          </Link>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardPath()}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-brand-600 text-white text-sm font-semibold shadow-sm"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Go to Dashboard
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="pt-1">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold shadow-md shadow-brand-500/20"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In to Account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
