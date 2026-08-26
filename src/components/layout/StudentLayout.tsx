import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  BookOpen,
  Code,
  User,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { ApiResponse, StudentProfileResponse } from '../../types';
import { formatPercentage } from '../../lib/utils';

export const StudentLayout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userEmail, logout } = useAuthStore();

  const { data: profileData } = useQuery({
    queryKey: ['studentProfile'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<StudentProfileResponse>>('/students/profile');
      return res.data.data;
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', path: '/student/dashboard', icon: LayoutDashboard },
    { label: 'Company Matches', path: '/student/matches', icon: Briefcase, badge: 'AI' },
    { label: 'Academic Marks', path: '/student/academics', icon: BookOpen },
    { label: 'Skill Profile', path: '/student/skills', icon: Code },
    { label: 'Student Profile', path: '/student/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Student Portal
              </h2>
              <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400">
                SCM Platform
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Academic Snapshot */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-gradient-to-br from-brand-50 to-sky-50/50 dark:from-brand-950/40 dark:to-slate-900 border border-brand-100 dark:border-brand-900/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Aggregate Score</span>
            <span className="font-extrabold text-brand-700 dark:text-brand-300">
              {formatPercentage(profileData?.aggregatePercentage)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            {profileData?.allMarksVerified ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                All Marks Verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Pending Verification
              </span>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Session Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="truncate mr-2">
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
              {profileData?.fullName || userEmail}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {profileData?.rollNumber || 'Student'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="glass-header px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {profileData?.fullName ? `Welcome back, ${profileData.fullName}` : 'Student Workspace'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Roll No: {profileData?.rollNumber || 'Not configured'} • Academic Profile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/student/matches"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              View Matches
            </Link>
          </div>
        </header>

        {/* Global Pending Verification Banner */}
        {profileData && !profileData.allMarksVerified && profileData.academicMarks?.length > 0 && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Verification Note:</strong> Some reported marks are awaiting teacher review. Unverified marks show a provisional estimate.
              </span>
            </div>
            <Link
              to="/student/academics"
              className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-100"
            >
              Check Records
            </Link>
          </div>
        )}

        {/* Mobile Nav Overlay */}
        {isMobileOpen && (
          <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive
                      ? 'bg-brand-600 text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setIsMobileOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
