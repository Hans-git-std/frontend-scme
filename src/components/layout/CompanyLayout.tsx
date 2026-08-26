import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sliders,
  Building2,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  AlertCircle,
  PlusCircle,
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { ApiResponse, CompanyProfileResponse } from '../../types';
import { getVerificationStatusBadge } from '../../lib/utils';

export const CompanyLayout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userEmail, logout } = useAuthStore();

  const { data: companyProfile } = useQuery({
    queryKey: ['companyProfile'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<CompanyProfileResponse>>('/companies/profile');
      return res.data.data;
    },
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const statusBadge = getVerificationStatusBadge(
    companyProfile?.verificationStatus || 'NOT_VERIFIED'
  );

  const navItems = [
    { label: 'Overview', path: '/company/dashboard', icon: LayoutDashboard },
    { label: 'Hiring Criteria', path: '/company/criteria', icon: Sliders, badge: `${companyProfile?.activeCriteriaCount || 0}` },
    { label: 'Corporate Profile', path: '/company/profile', icon: Building2 },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate max-w-[140px]">
                {companyProfile?.companyName || 'Employer'}
              </h2>
              <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                Corporate Workspace
              </span>
            </div>
          </Link>
        </div>

        {/* Verification Status Card */}
        <div className="p-4 mx-3 my-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5">
            Verification Status
          </div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusBadge.className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            {statusBadge.label}
          </span>
          {companyProfile?.verificationStatus === 'NOT_VERIFIED' && (
            <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 leading-normal">
              Pending review by Master Admin. Public directory listing will activate once verified.
            </p>
          )}
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
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/30'
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
                        : 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
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
              {companyProfile?.companyName || userEmail}
            </p>
            <p className="text-[11px] text-slate-400 truncate">
              {companyProfile?.industry || 'Tech / Engineering'}
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
                {companyProfile?.companyName || 'Corporate Workspace'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Location: {companyProfile?.location || 'Global'} • Matching Criteria & Recruitment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/company/criteria"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Add Hiring Criteria
            </Link>
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
                      ? 'bg-sky-600 text-white'
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
