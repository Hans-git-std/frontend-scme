import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  UserCheck,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { ApiResponse, TeacherProfileResponse } from '../../types';

export const TeacherLayout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userEmail, logout } = useAuthStore();

  const { data: teacherProfile } = useQuery({
    queryKey: ['teacherProfile'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<TeacherProfileResponse>>('/teachers/profile');
      return res.data.data;
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Overview', path: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'Verify Student Marks', path: '/teacher/verify', icon: CheckSquare, badge: 'Audit' },
    { label: 'Faculty Profile', path: '/teacher/profile', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-brand-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Faculty Portal
              </h2>
              <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">
                Official Marks Auditor
              </span>
            </div>
          </Link>
        </div>

        {/* Assigned Subjects Summary */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>Assigned Subjects ({teacherProfile?.assignedSubjects?.length || 0})</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {teacherProfile?.assignedSubjects && teacherProfile.assignedSubjects.length > 0 ? (
              teacherProfile.assignedSubjects.map((sub, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-indigo-800 dark:text-indigo-300 font-medium border border-indigo-200/60 dark:border-indigo-800/60 truncate max-w-full"
                >
                  {sub}
                </span>
              ))
            ) : (
              <span className="text-[11px] text-slate-400">No subjects assigned</span>
            )}
          </div>
        </div>

        {/* Nav Links */}
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
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
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
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300'
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
              {teacherProfile?.fullName || userEmail}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {teacherProfile?.designation || 'Faculty Member'}
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
                {teacherProfile?.fullName || 'Faculty Workspace'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Dept: {teacherProfile?.department || 'CSE'} • ID: {teacherProfile?.employeeId || 'FAC-100'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Verified Faculty Access
            </span>
          </div>
        </header>

        {/* Mobile Nav */}
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
                      ? 'bg-indigo-600 text-white'
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
