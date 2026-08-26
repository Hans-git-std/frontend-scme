import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  GraduationCap,
  Building2,
  Activity,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Cpu,
  Mail,
} from 'lucide-react';
import { useAuthStore } from '../../lib/authStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { ApiResponse, SystemDiagnostics } from '../../types';

export const AdminLayout: React.FC = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userEmail, logout } = useAuthStore();

  const { data: diagnostics } = useQuery({
    queryKey: ['systemDiagnostics'],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<SystemDiagnostics>>('/admin/system/diagnostics');
      return res.data.data;
    },
    refetchInterval: 15000, // Real-time poll every 15s
  });

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const pendingTeachersCount = diagnostics?.databaseStats?.pendingTeacherApprovals || 0;
  const memoryUsagePercent = diagnostics?.memoryUsage
    ? Math.round((diagnostics.memoryUsage.usedMemoryMb / diagnostics.memoryUsage.totalAllocatedMemoryMb) * 100)
    : 0;
  const dailyMailQuotaLimit = 300;
  const dailyDispatches = diagnostics?.mailQuotaStats?.dailyDispatchesCount || 0;

  const navItems = [
    { label: 'Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    {
      label: 'Teacher Approvals',
      path: '/admin/teachers',
      icon: UserCheck,
      badge: pendingTeachersCount > 0 ? `${pendingTeachersCount} Pending` : undefined,
      badgeColor: 'bg-amber-500 text-white',
    },
    { label: 'Student Directory', path: '/admin/students', icon: GraduationCap },
    { label: 'Corporate Directory', path: '/admin/companies', icon: Building2 },
    { label: 'Live Diagnostics', path: '/admin/diagnostics', icon: Activity },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 flex-col bg-slate-900 text-white border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 font-extrabold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                Master Admin
              </h2>
              <span className="text-[10px] font-semibold text-amber-400">
                SCM Root Console
              </span>
            </div>
          </Link>
        </div>

        {/* Live Mini Telemetry */}
        <div className="p-3.5 mx-3 my-3 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2.5 text-xs">
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-brand-400" />
                JVM RAM ({diagnostics?.memoryUsage?.usedMemoryMb || '--'} MB)
              </span>
              <span className="font-mono text-slate-300">{memoryUsagePercent}%</span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  memoryUsagePercent > 80 ? 'bg-rose-500' : 'bg-brand-500'
                }`}
                style={{ width: `${Math.min(100, memoryUsagePercent)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-sky-400" />
                SMTP Mail Quota
              </span>
              <span className="font-mono text-slate-300">
                {dailyDispatches}/{dailyMailQuotaLimit}
              </span>
            </div>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-400 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    (dailyDispatches / dailyMailQuotaLimit) * 100
                  )}%`,
                }}
              />
            </div>
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
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      item.badgeColor || 'bg-slate-800 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Admin Identity Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="truncate mr-2">
            <p className="text-xs font-semibold text-white truncate">
              {userEmail || diagnostics?.adminEmail || 'Master Admin'}
            </p>
            <p className="text-[10px] text-amber-400 font-mono truncate">
              Security: SpEL Guarded
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
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
                Master Administration Console
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Server: {diagnostics?.serverStatus || 'HEALTHY'} • JVM: {diagnostics?.jvmVersion || '21.0.7'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry (15s)
            </span>
          </div>
        </header>

        {/* Mobile Nav */}
        {isMobileOpen && (
          <div className="md:hidden border-b border-slate-800 bg-slate-900 px-4 py-4 space-y-1.5 text-white">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                    isActive
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-slate-950">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <button
              onClick={() => {
                setIsMobileOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-xs font-semibold text-rose-400 hover:bg-slate-800 rounded-xl"
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
